import connectDB, { sql } from "../lib/db";

const parseCompanyCode = (value) => {
  const code = Number(value);
  if (!Number.isInteger(code) || code < 0 || code > 999) {
    const error = new Error("Company code must be a whole number from 0 to 999.");
    error.statusCode = 400;
    throw error;
  }
  return code;
};

const parseCompanyName = (value) => {
  const name = String(value || "").trim();
  if (!name) {
    const error = new Error("Company name is required.");
    error.statusCode = 400;
    throw error;
  }
  return name;
};

export const getCompanies = async () => {
  const pool = await connectDB();
  const result = await pool.request().query(`
    SELECT COMP_CODE, COMP_NAME
    FROM dbo.Company
    ORDER BY COMP_NAME ASC;
  `);
  return result.recordset;
};

export const getSearchedCompanies = async (search) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("Search", sql.NVarChar, `%${String(search).trim()}%`)
    .query(`
      SELECT COMP_CODE, COMP_NAME
      FROM dbo.Company
      WHERE COMP_NAME LIKE @Search
         OR CONVERT(nvarchar(10), COMP_CODE) LIKE @Search
      ORDER BY COMP_NAME ASC;
    `);
  return result.recordset;
};

export const getCompanyByCode = async (code) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("COMP_CODE", sql.Decimal(3, 0), parseCompanyCode(code))
    .query(`
      SELECT COMP_CODE, COMP_NAME
      FROM dbo.Company
      WHERE COMP_CODE = @COMP_CODE;
    `);
  return result.recordset[0] || null;
};

export const createCompany = async (data = {}) => {
  const pool = await connectDB();
  const code = parseCompanyCode(data.COMP_CODE);
  const name = parseCompanyName(data.COMP_NAME);
  const result = await pool.request()
    .input("COMP_CODE", sql.Decimal(3, 0), code)
    .input("COMP_NAME", sql.NVarChar, name)
    .query(`
      INSERT INTO dbo.Company (COMP_CODE, COMP_NAME)
      OUTPUT INSERTED.COMP_CODE, INSERTED.COMP_NAME
      VALUES (@COMP_CODE, @COMP_NAME);
    `);
  return result.recordset[0];
};

export const updateCompany = async (code, data = {}) => {
  const pool = await connectDB();
  const companyCode = parseCompanyCode(code);
  const name = parseCompanyName(data.COMP_NAME);
  const result = await pool.request()
    .input("COMP_CODE", sql.Decimal(3, 0), companyCode)
    .input("COMP_NAME", sql.NVarChar, name)
    .query(`
      UPDATE dbo.Company
      SET COMP_NAME = @COMP_NAME
      OUTPUT INSERTED.COMP_CODE, INSERTED.COMP_NAME
      WHERE COMP_CODE = @COMP_CODE;
    `);
  return result.recordset[0] || null;
};

export const deleteCompany = async (code) => {
  const pool = await connectDB();
  const companyCode = parseCompanyCode(code);
  const result = await pool.request()
    .input("COMP_CODE", sql.Decimal(3, 0), companyCode)
    .query(`
      IF EXISTS (
        SELECT 1 FROM dbo.PRESCRIBE_ORDER WHERE COMP_CODE = @COMP_CODE
      )
      BEGIN
        THROW 50001, 'This company is referenced by prescribe orders and cannot be deleted.', 1;
      END;

      DELETE FROM dbo.Company
      OUTPUT DELETED.COMP_CODE
      WHERE COMP_CODE = @COMP_CODE;
    `);
  return result.recordset[0] || null;
};
