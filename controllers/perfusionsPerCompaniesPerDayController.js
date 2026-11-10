import connectDB, { sql } from "../lib/db";

const invalidDate = () => {
  const error = new Error("A valid report date is required (YYYY-MM-DD).");
  error.statusCode = 400;
  return error;
};

export const getPerfusionsPerCompaniesPerDay = async (date) => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw invalidDate();
  const reportDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(reportDate.getTime()) || reportDate.toISOString().slice(0, 10) !== date) throw invalidDate();

  const pool = await connectDB();
  const result = await pool.request()
    .input("ReportDate", sql.Date, reportDate)
    .query(`
      SELECT
        o.PRESCRIBE_ORDER_ID,
        o.REQUEST_NO,
        o.COMP_CODE,
        o.PES_NAME,
        c.COMP_NAME,
        ps.PERFUSION_SHEET_ID
      FROM dbo.PRESCRIBE_ORDER o
      LEFT JOIN dbo.Company c ON c.COMP_CODE = o.COMP_CODE
      LEFT JOIN dbo.PERFUSION_SHEET ps ON ps.REQUEST_NO = o.REQUEST_NO
      WHERE o.REQUEST_DATE >= @ReportDate
        AND o.REQUEST_DATE < DATEADD(day, 1, @ReportDate)
        AND (o.COMP_CODE IS NOT NULL OR COALESCE(o.COMP_FLAG, 0) = 1)
      ORDER BY
        CASE WHEN o.COMP_CODE IS NULL THEN 1 ELSE 0 END,
        c.COMP_NAME ASC,
        o.PES_NAME ASC,
        o.PRESCRIBE_ORDER_ID ASC;
    `);

  const companyMap = new Map();
  for (const order of result.recordset) {
    const companyCode = order.COMP_CODE == null ? "external" : String(order.COMP_CODE);
    if (!companyMap.has(companyCode)) {
      companyMap.set(companyCode, {
        companyCode: order.COMP_CODE == null ? null : String(order.COMP_CODE),
        companyName: order.COMP_NAME || "External hospital",
        patients: [],
      });
    }
    companyMap.get(companyCode).patients.push({
      orderId: String(order.PRESCRIBE_ORDER_ID),
      requestNo: order.REQUEST_NO == null ? "" : String(order.REQUEST_NO),
      patientName: order.PES_NAME || "—",
      hasPerfusionSheet: order.PERFUSION_SHEET_ID != null,
    });
  }

  const companies = Array.from(companyMap.values()).map((company) => ({
    ...company,
    caseCount: company.patients.length,
  }));

  return {
    date,
    totalCases: companies.reduce((total, company) => total + company.caseCount, 0),
    companies,
  };
};
