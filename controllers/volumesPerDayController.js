import connectDB, { sql } from "../lib/db";

const invalidDate = () => {
  const error = new Error("A valid report date is required (YYYY-MM-DD).");
  error.statusCode = 400;
  return error;
};

const sum = (orders, field, predicate = () => true) => orders.reduce(
  (total, order) => total + (predicate(order) ? Number(order[field]) || 0 : 0),
  0
);

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const ampoules = (volume, packSize) => round2(volume / packSize);

export const getVolumesPerDay = async (date) => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw invalidDate();
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) throw invalidDate();

  const pool = await connectDB();
  const result = await pool.request()
    .input("ReportDate", sql.Date, parsedDate)
    .query(`
      SELECT
        o.PRESCRIBE_ORDER_ID,
        o.REQUEST_NO,
        o.OPTION_N,
        o.OPTION_R,
        o.OPTION_H,
        o.OPTION_10,
        o.OPTION_20,
        o.OPTION_27,
        o.OPTION_09,
        ps.C_SG25,
        ps.C_SG10,
        ps.C_DESC_STERIL_H2O,
        ps.C_AMINOSTERIL10,
        ps.C_NACL,
        ps.C_MGSO4,
        ps.C_CAGLUCOSE,
        ps.C_KCL15,
        ps.C_TRACES,
        ps.C_INTRALIPID,
        ps.C_VITAMENS,
        ps.C_GLUCOPHOS,
        ps.C_HEPARIN,
        COALESCE(NULLIF(ps.C_FINAL_TOTAL, 0), o.D_TOTAL_VOLUME * o.PES_WEIGHT, 0) AS C_FINAL_TOTAL,
        ls.L_GLUC_GMDAY,
        ls.L_PROTEINS,
        ls.L_LIPIDS,
        ls.L_NA,
        ls.L_K,
        ls.L_CA,
        ls.L_MG
      FROM dbo.PRESCRIBE_ORDER o
      LEFT JOIN dbo.PERFUSION_SHEET ps ON ps.REQUEST_NO = o.REQUEST_NO
      LEFT JOIN dbo.LABEL_SHEET ls ON ls.REQUEST_NO = o.REQUEST_NO
      WHERE o.REQUEST_DATE >= @ReportDate
        AND o.REQUEST_DATE < DATEADD(day, 1, @ReportDate)
      ORDER BY o.PRESCRIBE_ORDER_ID ASC;
    `);
  const orders = result.recordset;
  const hasOption = (field) => (order) => Number(order[field]) === 1;
  const item = (name, field, packSize, gramsField = null, predicate = () => true) => {
    const volume = sum(orders, field, predicate);
    return {
      name,
      totalVolume: round2(volume),
      grams: gramsField ? round2(sum(orders, gramsField, predicate)) : null,
      ampoules: ampoules(volume, packSize),
    };
  };

  const proteinGroups = [
    { name: "N - Aminoven 10% inf.", field: "OPTION_N" },
    { name: "R - Aminosteril NHEPA 8%", field: "OPTION_R" },
    { name: "H - Nephrosteril 7%", field: "OPTION_H" },
  ].map(({ name, field }) => {
    const predicate = hasOption(field);
    const volume = sum(orders, "C_AMINOSTERIL10", predicate);
    return { name, totalVolume: round2(volume), ampoules: ampoules(volume, 100) };
  });

  const naclGroups = [
    { name: "NACL 27", field: "OPTION_27" },
    { name: "NACL 09", field: "OPTION_09" },
  ].map(({ name, field }) => {
    const predicate = hasOption(field);
    const volume = sum(orders, "C_NACL", predicate);
    return { name, totalVolume: round2(volume), ampoules: ampoules(volume, 500) };
  });

  // Ampoule counts use the package-volume divisors reflected in the supplied legacy report.
  const zeroItem = (name) => ({ name, totalVolume: null, grams: null, ampoules: null });
  const nutrients = [
    zeroItem("S.G. 50%"),
    item("S.G. 25%", "C_SG25", 500, "L_GLUC_GMDAY"),
    item("S.G. 10%", "C_SG10", 500),
    zeroItem("S.G. 5%"),
    item("Dist. steril H2O", "C_DESC_STERIL_H2O", 2000),
    item("Aminoven 10% Adult", "C_AMINOSTERIL10", 100, "L_PROTEINS", hasOption("OPTION_N")),
    item("Aminosteril NHEPA 8%", "C_AMINOSTERIL10", 100, "L_PROTEINS", hasOption("OPTION_R")),
    item("Nephrosteril 7%", "C_AMINOSTERIL10", 100, "L_PROTEINS", hasOption("OPTION_H")),
    item("NaCl", "C_NACL", 500),
    item("K cl 15%", "C_KCL15", 5, "L_K"),
    item("Glycophos", "C_GLUCOPHOS", 500),
    item("Ca Gluconate", "C_CAGLUCOSE", 10, "L_CA"),
    item("MgSo4", "C_MGSO4", 5, "L_MG"),
    item("Traces Elements", "C_TRACES", 20),
    item("Vitamins", "C_VITAMENS", 10),
    item("Heparine (IU)", "C_HEPARIN", 5000),
    item("Intralipid 10%", "C_INTRALIPID", 500, "L_LIPIDS", hasOption("OPTION_10")),
    item("Intralipid 20%", "C_INTRALIPID", 500, "L_LIPIDS", hasOption("OPTION_20")),
    { name: "Vitalipid", totalVolume: 0, grams: null, ampoules: 0 },
    { name: "Dipeptiven", totalVolume: 0, grams: null, ampoules: 0 },
    { name: "Others", totalVolume: 0, grams: null, ampoules: 0 },
  ];

  return {
    date,
    orderCount: orders.length,
    totalVolume: round2(sum(orders, "C_FINAL_TOTAL")),
    proteinGroups,
    naclGroups,
    nutrients,
  };
};
