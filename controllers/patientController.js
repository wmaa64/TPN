import connectDB, { sql } from "../lib/db";


// =====================================================
// GET ALL PATIENTS
// =====================================================

const getPatients = async () => {

  const pool = await connectDB();

  const result = await pool
    .request()
    .query(`
      SELECT
        PatientID,
        FullName,
        Phone,
        Age,
        Address,
        Notes,
        CreatedAt,
        FileNo,
        NationalID

      FROM dbo.Patients

      ORDER BY PatientID DESC
    `);

  return result.recordset;
};


// =====================================================
// GET PATIENTS WITH SEARCH CRITERIA
// =====================================================

const getSearchedPatients = async (search) => {

  const pool = await connectDB();

  const request = pool.request();

  request.input(
    "Search",
    sql.NVarChar,
    `%${search}%`
  );


  const result = await request.query(`
    SELECT
      PatientID,
      FullName,
      Phone,
      Age,
      Address,
      Notes,
      CreatedAt,
      FileNo,
      NationalID

    FROM dbo.Patients

    WHERE
      FullName LIKE @Search
      OR Phone LIKE @Search
      OR FileNo LIKE @Search
      OR NationalID LIKE @Search

    ORDER BY PatientID DESC
  `);


  return result.recordset;
};


// =====================================================
// GET PATIENT BY ID
// =====================================================

const getPatientById = async (id) => {

  const pool = await connectDB();

  const result = await pool
    .request()

    .input(
      "PatientID",
      sql.Int,
      Number(id)
    )

    .query(`
      SELECT
        PatientID,
        FullName,
        Phone,
        Age,
        Address,
        Notes,
        CreatedAt,
        FileNo,
        NationalID

      FROM dbo.Patients

      WHERE
        PatientID = @PatientID
    `);


  return result.recordset[0] || null;
};


// =====================================================
// GENERATE PATIENT FILE NUMBER
// =====================================================

const generatePatientFileNo = async () => {

  const pool = await connectDB();

  const year =
    new Date().getFullYear();


  const prefix =
    `F${year}-%`;


  const result = await pool
    .request()

    .input(
      "Prefix",
      sql.NVarChar,
      prefix
    )

    .query(`
      SELECT
        ISNULL(
          MAX(
            CAST(
              RIGHT(FileNo, 6)
              AS INT
            )
          ),
          0
        ) AS LastNo

      FROM dbo.Patients

      WHERE
        FileNo LIKE @Prefix
    `);


  const lastNo =
    Number(
      result.recordset[0].LastNo
    );


  const nextNo =
    lastNo + 1;


  return (
    `F${year}-` +
    `${String(nextNo).padStart(6, "0")}`
  );
};


// =====================================================
// CREATE PATIENT
// =====================================================

const createPatient = async (data) => {

  const pool = await connectDB();


  const {
    FullName,
    Phone,
    Age,
    Address,
    Notes,
    NationalID,
  } = data;


  const fileNo =
    await generatePatientFileNo();


  const result = await pool
    .request()

    .input(
      "FullName",
      sql.NVarChar,
      FullName
    )

    .input(
      "Phone",
      sql.NVarChar,
      Phone || null
    )

    .input(
      "Age",
      sql.Int,
      Age || 0
    )

    .input(
      "Address",
      sql.NVarChar,
      Address || null
    )

    .input(
      "Notes",
      sql.NVarChar,
      Notes || null
    )

    .input(
      "FileNo",
      sql.NVarChar,
      fileNo
    )

    .input(
      "NationalID",
      sql.NVarChar,
      NationalID || null
    )

    .query(`
      INSERT INTO dbo.Patients
      (
        FullName,
        Phone,
        Age,
        Address,
        Notes,
        CreatedAt,
        FileNo,
        NationalID
      )

      OUTPUT
        INSERTED.PatientID,
        INSERTED.FullName,
        INSERTED.Phone,
        INSERTED.Age,
        INSERTED.Address,
        INSERTED.Notes,
        INSERTED.CreatedAt,
        INSERTED.FileNo,
        INSERTED.NationalID

      VALUES
      (
        @FullName,
        @Phone,
        @Age,
        @Address,
        @Notes,
        GETDATE(),
        @FileNo,
        @NationalID
      )
    `);


  return result.recordset[0];
};


// =====================================================
// UPDATE PATIENT
// =====================================================

const updatePatient = async (
  id,
  data
) => {

  const pool = await connectDB();


  const {
    FullName,
    Phone,
    Age,
    Address,
    Notes,
    NationalID,
  } = data;


  const result = await pool
    .request()

    .input(
      "PatientID",
      sql.Int,
      Number(id)
    )

    .input(
      "FullName",
      sql.NVarChar,
      FullName
    )

    .input(
      "Phone",
      sql.NVarChar,
      Phone || null
    )

    .input(
      "Age",
      sql.Int,
      Age || 0
    )

    .input(
      "Address",
      sql.NVarChar,
      Address || null
    )

    .input(
      "Notes",
      sql.NVarChar,
      Notes || null
    )

    .input(
      "NationalID",
      sql.NVarChar,
      NationalID || null
    )

    .query(`
      UPDATE dbo.Patients

      SET
        FullName = @FullName,
        Phone = @Phone,
        Age = @Age,
        Address = @Address,
        Notes = @Notes,
        NationalID = @NationalID

      OUTPUT
        INSERTED.PatientID,
        INSERTED.FullName,
        INSERTED.Phone,
        INSERTED.Age,
        INSERTED.Address,
        INSERTED.Notes,
        INSERTED.CreatedAt,
        INSERTED.FileNo,
        INSERTED.NationalID

      WHERE
        PatientID = @PatientID
    `);


  return result.recordset[0] || null;
};


// =====================================================
// DELETE PATIENT
// =====================================================

const deletePatient = async (id) => {

  const pool = await connectDB();


  const result = await pool
    .request()

    .input(
      "PatientID",
      sql.Int,
      Number(id)
    )

    .query(`
      DELETE FROM dbo.Patients

      OUTPUT
        DELETED.PatientID

      WHERE
        PatientID = @PatientID
    `);


  return result.recordset[0] || null;
};


// =====================================================
// EXPORT
// =====================================================

export {
  getPatients,
  getSearchedPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};