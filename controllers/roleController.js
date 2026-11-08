import connectDB, { sql } from "../lib/db";


// =====================================================
// GET ALL Roles
// =====================================================
const getRoles = async () => {

  const pool = await connectDB();

  const request = pool.request();

  const result = await request.query(`
    SELECT
      RoleID,
      RoleName
    FROM dbo.Roles
    ORDER BY RoleID DESC
  `);

  return result.recordset;
};

// =====================================================
// GET ALL Roles WITH SEARCH CRITERIA
// =====================================================
const getSearchedRoles = async (search) => {

  const pool = await connectDB();

  const request = pool.request();

  request.input("Search", sql.NVarChar, `%${search}%` );

  const result = await request.query(`
    SELECT
      RoleID,
      RoleName
    FROM dbo.Roles
    WHERE
      RoleName LIKE @Search
    ORDER BY RoleID DESC
  `);

  return result.recordset;
};


/*
const getRoles = async () => {

  const pool = await connectDB();

  const result = await pool.request().query(`
    SELECT
      RoleID,
      RoleName,
      Phone,
      Age,
      Address,
      Notes,
      CreatedAt,
      FileNo,
      NationalID
    FROM dbo.Roles
    ORDER BY PatientID DESC
  `);

  return result.recordset;
};
*/


// =====================================================
// GET PATIENT BY ID
// =====================================================

const getRoleById = async (id) => {

  const pool = await connectDB();

  const result = await pool
    .request()
    .input("RoleID", sql.Int, Number(id))
    .query(`
      SELECT
        RoleID,
        RoleName
      FROM dbo.Roles
      WHERE RoleID = @RoleID
    `);

  return result.recordset[0] || null;
};

// =====================================================
// CREATE ROLE
// =====================================================

const createRole = async (data) => {

  const pool = await connectDB();

  const {
    RoleName,
  } = data;

  const result = await pool
    .request()
    .input("RoleName", sql.NVarChar, RoleName)
    .query(`
      INSERT INTO dbo.Roles
      (
        RoleName
      )
      OUTPUT
        INSERTED.RoleID,
        INSERTED.RoleName
      VALUES
      (
        @RoleName
      )
  `);

  return result.recordset[0];
};


// =====================================================
// UPDATE PATIENT
// =====================================================

const updateRole = async (id, data) => {

  const pool = await connectDB();

  const {
    RoleName,
  } = data;

  const result = await pool
    .request()
    .input("RoleID", sql.Int, Number(id))
    .input("RoleName", sql.NVarChar, RoleName)
    .query(`
      UPDATE dbo.Roles
      SET
        RoleName = @RoleName
      OUTPUT
        INSERTED.RoleID,
        INSERTED.RoleName
      WHERE RoleID = @RoleID
    `);

  return result.recordset[0] || null;
};


// =====================================================
// DELETE ROLE
// =====================================================

const deleteRole = async (id) => {

  const pool = await connectDB();

  const result = await pool
    .request()
    .input("RoleID", sql.Int, Number(id))
    .query(`
      DELETE FROM dbo.Roles
      OUTPUT DELETED.RoleID
      WHERE RoleID = @RoleID
    `);

  return result.recordset[0] || null;
};


export {
  getRoles,
  getSearchedRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};