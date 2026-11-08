import connectDB, { sql } from "../lib/db";

class PrescribeOrderValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PrescribeOrderValidationError";
    this.statusCode = 400;
  }
}

const decimalValue = (value, name, { required = false, precision = 8, scale = 2, allowNegative = false } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) throw new PrescribeOrderValidationError(`${name} is required.`);
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || (!allowNegative && parsed < 0)) {
    throw new PrescribeOrderValidationError(`${name} must be a valid ${allowNegative ? "number" : "non-negative number"}.`);
  }

  const factor = 10 ** scale;
  const max = (10 ** (precision - scale)) - (1 / factor);
  if (parsed > max || (allowNegative && parsed < -max) || (scale === 0 && !Number.isInteger(parsed))) {
    throw new PrescribeOrderValidationError(`${name} is outside the allowed range.`);
  }
  return Math.round(parsed * factor) / factor;
};

const textValue = (value, name, maxLength) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = String(value);
  if (parsed.length > maxLength) {
    throw new PrescribeOrderValidationError(`${name} cannot exceed ${maxLength} characters.`);
  }
  return parsed;
};

const flagValue = (value, name) => {
  if (value === undefined || value === null || value === "") return 0;
  if ([true, 1, "1", "true", "on"].includes(value)) return 1;
  if ([false, 0, "0", "false", "off"].includes(value)) return 0;
  throw new PrescribeOrderValidationError(`${name} must be true or false.`);
};

const dateValue = (value, name, { required = false } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) throw new PrescribeOrderValidationError(`${name} is required.`);
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new PrescribeOrderValidationError(`${name} must be a valid date.`);
  return parsed;
};

const orderColumns = [
  ["COMP_FLAG", "COMP_FLAG", sql.Decimal(1, 0), (data) => flagValue(data.COMP_FLAG, "COMP_FLAG")],
  ["COMP_CODE", "COMP_CODE", sql.Decimal(3, 0), (data) => decimalValue(data.COMP_CODE, "COMP_CODE", { precision: 3, scale: 0 })],
  ["PES_NAME", "PES_NAME", sql.NVarChar(120), (data) => String(data.PES_NAME || "").trim()],
  ["PES_BIRTH_DATE", "PES_BIRTH_DATE", sql.DateTime2(0), (data) => dateValue(data.PES_BIRTH_DATE, "PES_BIRTH_DATE")],
  ["BIRTH_YEAR", "BIRTH_YEAR", sql.Decimal(4, 0), (data) => decimalValue(data.BIRTH_YEAR, "BIRTH_YEAR", { precision: 4, scale: 0 })],
  ["BIRTH_MONTH", "BIRTH_MONTH", sql.Decimal(2, 0), (data) => decimalValue(data.BIRTH_MONTH, "BIRTH_MONTH", { precision: 2, scale: 0 })],
  ["BIRTH_DAY", "BIRTH_DAY", sql.Decimal(2, 0), (data) => decimalValue(data.BIRTH_DAY, "BIRTH_DAY", { precision: 2, scale: 0 })],
  ["PES_WEIGHT", "PES_WEIGHT", sql.Decimal(5, 2), (data) => decimalValue(data.PES_WEIGHT, "PES_WEIGHT", { required: true, precision: 5 })],
  ["CHECK_4LINE", "CHECK_4LINE", sql.Decimal(1, 0), (data) => flagValue(data.CHECK_4LINE, "CHECK_4LINE")],
  ["OPTION_C", "OPTION_C", sql.Decimal(1, 0), (data) => flagValue(data.OPTION_C, "OPTION_C")],
  ["OPTION_P", "OPTION_P", sql.Decimal(1, 0), (data) => flagValue(data.OPTION_P, "OPTION_P")],
  ["OPTION_N", "OPTION_N", sql.Decimal(1, 0), (data) => flagValue(data.OPTION_N, "OPTION_N")],
  ["OPTION_R", "OPTION_R", sql.Decimal(1, 0), (data) => flagValue(data.OPTION_R, "OPTION_R")],
  ["OPTION_H", "OPTION_H", sql.Decimal(1, 0), (data) => flagValue(data.OPTION_H, "OPTION_H")],
  ["D_MILK", "D_MILK", sql.Decimal(8, 2), (data) => decimalValue(data.D_MILK, "D_MILK")],
  ["D_DRUGS", "D_DRUGS", sql.Decimal(8, 2), (data) => decimalValue(data.D_DRUGS, "D_DRUGS")],
  ["D_GLUC_MGKGMIN", "D_GLUC_MGKGMIN", sql.Decimal(8, 2), (data) => decimalValue(data.D_GLUC_MGKGMIN, "D_GLUC_MGKGMIN")],
  ["D_GLUC_PERCENT", "D_GLUC_PERCENT", sql.Decimal(8, 2), (data) => decimalValue(data.D_GLUC_PERCENT, "D_GLUC_PERCENT")],
  ["D_TVOL", "D_TVOL", sql.Decimal(8, 2), (data) => decimalValue(data.D_TVOL, "D_TVOL")],
  ["D_GLUC_GMKGDAY", "D_GLUC_GMKGDAY", sql.Decimal(8, 2), (data) => decimalValue(data.D_GLUC_GMKGDAY, "D_GLUC_GMKGDAY")],
  ["D_PROTEINS", "D_PROTEINS", sql.Decimal(8, 2), (data) => decimalValue(data.D_PROTEINS, "D_PROTEINS")],
  ["SP", "SP", sql.Decimal(8, 2), (data) => flagValue(data.SP, "SP")],
  ["OPTION_10", "OPTION_10", sql.Decimal(8, 2), (data) => flagValue(data.OPTION_10, "OPTION_10")],
  ["OPTION_20", "OPTION_20", sql.Decimal(8, 2), (data) => flagValue(data.OPTION_20, "OPTION_20")],
  ["D_LIPIDS", "D_LIPIDS", sql.Decimal(8, 2), (data) => decimalValue(data.D_LIPIDS, "D_LIPIDS")],
  ["OPTION_27", "OPTION_27", sql.Decimal(1, 0), (data) => flagValue(data.OPTION_27, "OPTION_27")],
  ["OPTION_09", "OPTION_09", sql.Decimal(1, 0), (data) => flagValue(data.OPTION_09, "OPTION_09")],
  ["D_NA", "D_NA", sql.Decimal(8, 2), (data) => decimalValue(data.D_NA, "D_NA")],
  ["D_K", "D_K", sql.Decimal(8, 2), (data) => decimalValue(data.D_K, "D_K")],
  ["D_CA", "D_CA", sql.Decimal(8, 2), (data) => decimalValue(data.D_CA, "D_CA")],
  ["D_MG", "D_MG", sql.Decimal(8, 2), (data) => decimalValue(data.D_MG, "D_MG")],
  ["D_VITAMENS", "D_VITAMENS", sql.Decimal(8, 2), (data) => decimalValue(data.D_VITAMENS, "D_VITAMENS")],
  ["D_TRACES_ELEMENT", "D_TRACES_ELEMENT", sql.Decimal(8, 2), (data) => decimalValue(data.D_TRACES_ELEMENT, "D_TRACES_ELEMENT")],
  ["D_GLUCOPHOS", "D_GLUCOPHOS", sql.Decimal(8, 2), (data) => decimalValue(data.D_GLUCOPHOS, "D_GLUCOPHOS")],
  ["D_HEPARIN", "D_HEPARIN", sql.Decimal(8, 2), (data) => decimalValue(data.D_HEPARIN, "D_HEPARIN")],
  ["D_TOTAL_VOLUME", "D_TOTAL_VOLUME", sql.Decimal(8, 2), (data) => decimalValue(data.D_TOTAL_VOLUME, "D_TOTAL_VOLUME")],
];

const perfusionColumns = [
  ["C_SG25", "C_SG25", false],
  ["C_SG10", "C_SG10", false],
  ["C_DESC_STERIL_H2O", "C_DESC_STERIL_H2O", false],
  ["C_AMINOSTERIL10", "C_AMINOSTERIL10", false],
  ["C_NACL", "C_NACL", false],
  ["C_MGSO4", "C_MGSO4", false],
  ["C_CAGLUCOSE", "C_CAGLUCOSE", false],
  ["C_KCL15", "C_KCL15", false],
  ["C_TRACES", "C_TRACES", false],
  ["C_INTRALIPID", "C_INTRALIPID", false],
  ["C_VITAMENS", "C_VITAMENS", false],
  ["C_GLUCOPHOS", "C_GLUCOPHOS", false],
  ["C_HEPARIN", "C_HEPARIN", false],
  ["C_TOTAL_REQUIRED", "C_TOTAL_REQUIRED", false],
  ["C_SUBTOTAL", "C_SUBTOTAL", false],
  ["C_REMAIN", "C_REMAIN", true],
  ["C_EXCESS", "C_EXCESS", false],
  ["C_FINAL_TOTAL", "C_FINAL_TOTAL", false],
  ["C_OSMOLARITY", "C_OSMOLARITY", false],
];

const labelDecimalColumns = [
  ["L_GLUC_GMDAY", "L_GLUC_GMDAY"],
  ["L_PROTEINS", "L_PROTEINS"],
  ["L_LIPIDS", "L_LIPIDS"],
  ["L_NA", "L_NA"],
  ["L_K", "L_K"],
  ["L_CA", "L_CA"],
  ["L_MG", "L_MG"],
  ["L_TOTAL_VOLUME", "L_TOTAL_VOLUME"],
  ["L_EXCESS", "L_EXCESS"],
];

const labelTextColumns = [
  ["L_VITAMENS", "L_VITAMENS"],
  ["L_TRACES_ELEMET", "L_TRACES_ELEMET"],
  ["L_HEPARIN", "L_HEPARIN"],
  ["L_GLUCOPHOS", "L_GLUCOPHOS"],
];

const generatePrescribeRequestNo = async (transaction) => {
  const now = new Date();
  const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const dateStart = Number(`${datePrefix}000`);
  const dateEnd = Number(`${datePrefix}1000`);
  const result = await new sql.Request(transaction)
    .input("DateStart", sql.Decimal(13, 0), dateStart)
    .input("DateEnd", sql.Decimal(13, 0), dateEnd)
    .query(`
      SELECT ISNULL(MAX(TRY_CONVERT(int, RIGHT(CONVERT(varchar(20), REQUEST_NO), 3))), 0) AS LastNo
      FROM dbo.PRESCRIBE_ORDER WITH (TABLOCKX, HOLDLOCK)
      WHERE REQUEST_NO >= @DateStart AND REQUEST_NO < @DateEnd;
    `);

  const nextNumber = Number(result.recordset[0]?.LastNo || 0) + 1;
  if (nextNumber > 999) {
    throw new Error(`Request number sequence for ${datePrefix} has reached its 999-order daily limit.`);
  }
  return `${datePrefix}${String(nextNumber).padStart(3, "0")}`;
};

export const createPrescribeOrder = async (data = {}) => {
  const patientName = String(data.PES_NAME || "").trim();
  if (!patientName) throw new PrescribeOrderValidationError("Patient name is required.");
  if (patientName.length > 120) throw new PrescribeOrderValidationError("Patient name cannot exceed 120 characters.");

  const requestDate = dateValue(data.REQUEST_DATE, "REQUEST_DATE", { required: true });
  const weight = decimalValue(data.PES_WEIGHT, "PES_WEIGHT", { required: true, precision: 5 });
  if (weight <= 0) throw new PrescribeOrderValidationError("PES_WEIGHT must be greater than zero.");
  if (!data.PERFUSION || typeof data.PERFUSION !== "object") {
    throw new PrescribeOrderValidationError("PERFUSION calculation data is required.");
  }
  if (!data.LABEL || typeof data.LABEL !== "object") {
    throw new PrescribeOrderValidationError("LABEL data is required.");
  }

  const values = orderColumns.map(([, , , getValue]) => getValue({ ...data, PES_NAME: patientName, PES_WEIGHT: weight }));
  const perfusionValues = perfusionColumns.map(([column, field, allowNegative]) => decimalValue(
    data.PERFUSION[field],
    `PERFUSION.${field}`,
    { allowNegative }
  ));
  const labelDecimalValues = labelDecimalColumns.map(([, field]) => decimalValue(data.LABEL[field], `LABEL.${field}`));
  const labelTextValues = labelTextColumns.map(([column, field]) => textValue(data.LABEL[field], `LABEL.${field}`, 20));
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);

  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const requestNo = await generatePrescribeRequestNo(transaction);
    const request = new sql.Request(transaction);
    request.input("REQUEST_NO", sql.Decimal(13, 0), requestNo);
    request.input("REQUEST_DATE", sql.DateTime2(0), requestDate);
    orderColumns.forEach(([parameter, , type], index) => {
      request.input(parameter, type, values[index]);
    });

    const columnNames = ["REQUEST_NO", "REQUEST_DATE", ...orderColumns.map(([column]) => column)];
    const parameterNames = ["@REQUEST_NO", "@REQUEST_DATE", ...orderColumns.map(([parameter]) => `@${parameter}`)];
    const insert = await request.query(`
      INSERT INTO dbo.PRESCRIBE_ORDER (${columnNames.join(", ")})
      OUTPUT INSERTED.PRESCRIBE_ORDER_ID, INSERTED.REQUEST_NO, INSERTED.REQUEST_DATE, INSERTED.PES_NAME, INSERTED.PES_WEIGHT
      VALUES (${parameterNames.join(", ")});
    `);

    const perfusionRequest = new sql.Request(transaction)
      .input("REQUEST_NO", sql.Decimal(13, 0), requestNo);
    perfusionColumns.forEach(([column], index) => {
      perfusionRequest.input(column, sql.Decimal(8, 2), perfusionValues[index]);
    });
    await perfusionRequest.query(`
      INSERT INTO dbo.PERFUSION_SHEET (REQUEST_NO, ${perfusionColumns.map(([column]) => column).join(", ")})
      VALUES (@REQUEST_NO, ${perfusionColumns.map(([column]) => `@${column}`).join(", ")});
    `);

    const labelRequest = new sql.Request(transaction)
      .input("REQUEST_NO", sql.Decimal(13, 0), requestNo);
    labelDecimalColumns.forEach(([column], index) => {
      labelRequest.input(column, sql.Decimal(8, 2), labelDecimalValues[index]);
    });
    labelTextColumns.forEach(([column], index) => {
      labelRequest.input(column, sql.NVarChar(20), labelTextValues[index]);
    });
    await labelRequest.query(`
      INSERT INTO dbo.LABEL_SHEET (REQUEST_NO, ${[...labelDecimalColumns, ...labelTextColumns].map(([column]) => column).join(", ")})
      VALUES (@REQUEST_NO, ${[...labelDecimalColumns, ...labelTextColumns].map(([column]) => `@${column}`).join(", ")});
    `);

    await transaction.commit();
    const row = insert.recordset[0];
    return {
      ...row,
      PRESCRIBE_ORDER_ID: String(row.PRESCRIBE_ORDER_ID),
      REQUEST_NO: String(row.REQUEST_NO),
    };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Prescribe order rollback error:", rollbackError);
    }
    throw error;
  }
};

export const getSearchedPrescribeOrders = async (search) => {
  const patientName = String(search || "").trim();
  if (!patientName) throw new PrescribeOrderValidationError("Patient name search is required.");
  if (patientName.length > 120) {
    throw new PrescribeOrderValidationError("Patient name search cannot exceed 120 characters.");
  }

  const pool = await connectDB();
  const result = await pool.request()
    .input("PatientName", sql.NVarChar(122), `%${patientName}%`)
    .query(`
      SELECT
        PRESCRIBE_ORDER_ID, REQUEST_NO, REQUEST_DATE, COMP_FLAG, COMP_CODE, PES_NAME, PES_BIRTH_DATE,
        BIRTH_YEAR, BIRTH_MONTH, BIRTH_DAY, PES_WEIGHT, CHECK_4LINE, OPTION_C, OPTION_P,
        OPTION_N, OPTION_R, OPTION_H, D_MILK, D_DRUGS, D_GLUC_MGKGMIN, D_GLUC_PERCENT,
        D_TVOL, D_GLUC_GMKGDAY, D_PROTEINS, SP, OPTION_10, OPTION_20, D_LIPIDS,
        OPTION_27, OPTION_09, D_NA, D_K, D_CA, D_MG, D_VITAMENS, D_TRACES_ELEMENT,
        D_GLUCOPHOS, D_HEPARIN, D_TOTAL_VOLUME
      FROM dbo.PRESCRIBE_ORDER
      WHERE PES_NAME LIKE @PatientName
      ORDER BY REQUEST_DATE DESC, PRESCRIBE_ORDER_ID DESC;
    `);

  return result.recordset.map((row) => ({
    ...row,
    PRESCRIBE_ORDER_ID: String(row.PRESCRIBE_ORDER_ID),
  }));
};

export const getPrescribeOrderCompanies = async () => {
  const pool = await connectDB();
  const result = await pool.request().query(`
    SELECT COMP_CODE, COMP_NAME
    FROM dbo.Company
    ORDER BY COMP_NAME ASC;
  `);

  return result.recordset;
};
