import connectDB, { sql } from "../lib/db";

/**
 * Create an audit log entry.
 */
export const createAuditLog = async ({
  userID = null,
  action,
  module,
  recordID = null,
  description = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null, }) => {
    
  if (!action) {
    throw new Error("Action is required");
  }

  if (!module) {
    throw new Error("Module is required");
  }

  const pool = await connectDB();

  const result = await pool
    .request()
    .input("UserID", sql.Int, userID)
    .input("Action", sql.NVarChar(50), action)
    .input("Module", sql.NVarChar(100), module)
    .input("RecordID", sql.Int, recordID)
    .input("Description", sql.NVarChar(500), description)
    .input(
      "OldValues",
      sql.NVarChar(sql.MAX),
      oldValues
        ? typeof oldValues === "string"
          ? oldValues
          : JSON.stringify(oldValues)
        : null
    )
    .input(
      "NewValues",
      sql.NVarChar(sql.MAX),
      newValues
        ? typeof newValues === "string"
          ? newValues
          : JSON.stringify(newValues)
        : null
    )
    .input("IPAddress", sql.NVarChar(50), ipAddress)
    .input("UserAgent", sql.NVarChar(500), userAgent)
    .query(`
      INSERT INTO dbo.AuditLogs
      (
        UserID,
        Action,
        Module,
        RecordID,
        Description,
        OldValues,
        NewValues,
        IPAddress,
        UserAgent
      )
      OUTPUT
        INSERTED.AuditLogID,
        INSERTED.UserID,
        INSERTED.Action,
        INSERTED.Module,
        INSERTED.RecordID,
        INSERTED.Description,
        INSERTED.OldValues,
        INSERTED.NewValues,
        INSERTED.CreatedAt,
        INSERTED.IPAddress,
        INSERTED.UserAgent
      VALUES
      (
        @UserID,
        @Action,
        @Module,
        @RecordID,
        @Description,
        @OldValues,
        @NewValues,
        @IPAddress,
        @UserAgent
      )
    `);

  return result.recordset[0];
};


/**
 * Get audit logs.
 */
export const getAuditLogs = async ({
  fromDate = null,
  toDate = null,
  userID = null,
  module = null,
  action = null,
  search = null,
} = {}) => {
  const pool = await connectDB();

  const request = pool.request();

  let whereConditions = [];

  if (fromDate) {
    request.input("FromDate", sql.Date, fromDate);

    whereConditions.push(`
      CAST(AL.CreatedAt AS DATE) >= @FromDate
    `);
  }

  if (toDate) {
    request.input("ToDate", sql.Date, toDate);

    whereConditions.push(`
      CAST(AL.CreatedAt AS DATE) <= @ToDate
    `);
  }

  if (userID) {
    request.input("UserID", sql.Int, Number(userID));

    whereConditions.push(`
      AL.UserID = @UserID
    `);
  }

  if (module) {
    request.input("Module", sql.NVarChar(100), module);

    whereConditions.push(`
      AL.Module = @Module
    `);
  }

  if (action) {
    request.input("Action", sql.NVarChar(50), action);

    whereConditions.push(`
      AL.Action = @Action
    `);
  }

  if (search && search.trim()) {
    request.input("Search", sql.NVarChar(200), `%${search.trim()}%`);

    whereConditions.push(`
      (
        U.UserName LIKE @Search
        OR U.FullName LIKE @Search
        OR AL.Description LIKE @Search
        OR AL.Module LIKE @Search
        OR AL.Action LIKE @Search
      )
    `);
  }

  const whereClause =
    whereConditions.length > 0
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

  const result = await request.query(`
    SELECT
      AL.AuditLogID,
      AL.UserID,

      U.UserName,
      U.FullName AS UserFullName,

      AL.Action,
      AL.Module,
      AL.RecordID,
      AL.Description,
      AL.OldValues,
      AL.NewValues,
      AL.CreatedAt,
      AL.IPAddress,
      AL.UserAgent

    FROM dbo.AuditLogs AL

    LEFT JOIN dbo.Users U
      ON AL.UserID = U.UserID

    ${whereClause}

    ORDER BY
      AL.CreatedAt DESC,
      AL.AuditLogID DESC
  `);

  return result.recordset;
};


/**
 * Get one audit log by ID.
 */
export const getAuditLogById = async (auditLogID) => {
  const id = Number(auditLogID);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid AuditLogID");
  }

  const pool = await connectDB();

  const result = await pool
    .request()
    .input("AuditLogID", sql.BigInt, id)
    .query(`
      SELECT
        AL.AuditLogID,
        AL.UserID,

        U.UserName,
        U.FullName AS UserFullName,

        AL.Action,
        AL.Module,
        AL.RecordID,
        AL.Description,
        AL.OldValues,
        AL.NewValues,
        AL.CreatedAt,
        AL.IPAddress,
        AL.UserAgent

      FROM dbo.AuditLogs AL

      LEFT JOIN dbo.Users U
        ON AL.UserID = U.UserID

      WHERE AL.AuditLogID = @AuditLogID
    `);

  if (result.recordset.length === 0) {
    throw new Error("Audit log not found");
  }

  return result.recordset[0];
};