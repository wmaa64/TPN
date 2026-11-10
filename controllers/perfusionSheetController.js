import connectDB, { sql } from "../lib/db";

export const getSearchedPerfusionSheets = async (search) => {
  const patientName = String(search || "").trim();
  if (!patientName) {
    const error = new Error("Patient name search is required.");
    error.statusCode = 400;
    throw error;
  }
  if (patientName.length > 120) {
    const error = new Error("Patient name search cannot exceed 120 characters.");
    error.statusCode = 400;
    throw error;
  }

  const pool = await connectDB();
  const result = await pool.request()
    .input("PatientName", sql.NVarChar(122), `%${patientName}%`)
    .query(`
      SELECT
        po.PRESCRIBE_ORDER_ID,
        po.REQUEST_NO,
        po.REQUEST_DATE,
        po.COMP_CODE,
        co.COMP_NAME,
        po.PES_NAME,
        po.PES_BIRTH_DATE,
        po.PES_WEIGHT,
        po.CHECK_4LINE,
        po.OPTION_N,
        po.OPTION_R,
        po.OPTION_H,
        po.OPTION_10,
        po.OPTION_20,
        po.D_MILK,
        po.D_DRUGS,
        po.D_GLUC_MGKGMIN,
        po.D_GLUC_GMKGDAY,
        po.D_PROTEINS,
        po.D_LIPIDS,
        po.D_NA,
        po.D_K,
        po.D_CA,
        po.D_MG,
        po.D_VITAMENS,
        po.D_TRACES_ELEMENT,
        po.D_GLUCOPHOS,
        po.D_HEPARIN,
        po.D_TOTAL_VOLUME,
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
        ps.C_TOTAL_REQUIRED,
        ps.C_SUBTOTAL,
        ps.C_REMAIN,
        ps.C_EXCESS,
        ps.C_FINAL_TOTAL,
        ps.C_OSMOLARITY,
        ls.L_GLUC_GMDAY,
        ls.L_PROTEINS,
        ls.L_LIPIDS,
        ls.L_NA,
        ls.L_K,
        ls.L_CA,
        ls.L_MG,
        ls.L_TOTAL_VOLUME,
        ls.L_EXCESS,
        ls.L_VITAMENS,
        ls.L_TRACES_ELEMET,
        ls.L_HEPARIN,
        ls.L_GLUCOPHOS
      FROM dbo.PRESCRIBE_ORDER po
      LEFT JOIN dbo.Company co ON co.COMP_CODE = po.COMP_CODE
      LEFT JOIN dbo.PERFUSION_SHEET ps ON ps.REQUEST_NO = po.REQUEST_NO
      LEFT JOIN dbo.LABEL_SHEET ls ON ls.REQUEST_NO = po.REQUEST_NO
      WHERE po.PES_NAME LIKE @PatientName
      ORDER BY po.REQUEST_DATE DESC, po.PRESCRIBE_ORDER_ID DESC;
    `);

  return result.recordset.map((row) => ({
    ...row,
    PRESCRIBE_ORDER_ID: String(row.PRESCRIBE_ORDER_ID),
    REQUEST_NO: row.REQUEST_NO == null ? "" : String(row.REQUEST_NO),
  }));
};
