import connectDB, { sql } from "../lib/db";
import crypto from "crypto";
//import bcrypt from "bcryptjs";

// =====================================================
// HASH PASSWORD USING SHA-256
// Compatible with the desktop application
// =====================================================

const hashPassword = (password) => {

  return crypto
    .createHash("sha256")
    .update(password, "utf8")
    .digest("hex");

};

// =====================================================
// GET ALL Users
// =====================================================

const getUsers = async () => {

  const pool = await connectDB();

  const request = pool.request();

  const result = await request.query(`
    SELECT
      u.UserID,
      u.UserName,
      u.FullName,
      u.RoleID,
      r.RoleName,
      u.IsActive,
      u.CreatedDate
    FROM dbo.Users AS u
    LEFT JOIN dbo.Roles AS r
      ON u.RoleID = r.RoleID
    ORDER BY u.UserID DESC
  `);

  return result.recordset;
};


// =====================================================
// GET ALL Users WITH SEARCH CRITERIA
// =====================================================

const getSearchedUsers = async (search) => {

  const pool = await connectDB();

  const request = pool.request();

  request.input(
    "Search",
    sql.NVarChar,
    `%${search}%`
  );

  const result = await request.query(`
    SELECT
      u.UserID,
      u.UserName,
      u.FullName,
      u.RoleID,
      r.RoleName,
      u.IsActive,
      u.CreatedDate
    FROM dbo.Users AS u
    LEFT JOIN dbo.Roles AS r
      ON u.RoleID = r.RoleID
    WHERE
      u.UserName LIKE @Search
      OR u.FullName LIKE @Search
      OR r.RoleName LIKE @Search
    ORDER BY u.UserID DESC
  `);

  return result.recordset;
};


// =====================================================
// GET User BY ID
// =====================================================

const getUserById = async (id) => {

  const pool = await connectDB();

  const request = pool.request();

  request.input(
    "UserID",
    sql.Int,
    Number(id)
  );

  const result = await request.query(`
    SELECT
      u.UserID,
      u.UserName,
      u.FullName,
      u.RoleID,
      r.RoleName,
      u.IsActive,
      u.CreatedDate
    FROM dbo.Users AS u
    LEFT JOIN dbo.Roles AS r
      ON u.RoleID = r.RoleID
    WHERE
      u.UserID = @UserID
  `);

  return result.recordset[0] || null;
};

// =====================================================
// GET ACTIVE DOCTORS
// =====================================================

const getDoctors = async () => {

  const pool = await connectDB();


  const result = await pool
    .request()
    .query(`
      SELECT
        UserID,
        UserName

      FROM dbo.Users

      WHERE
        RoleID = 2
        AND IsActive = 1

      ORDER BY
        UserName ASC
    `);


  return result.recordset;
};

// LOGIN USER // =====================================================
const loginUser = async (UserName, Password) => {

  const pool = await connectDB();

  const request = pool.request();

  request.input("UserName", sql.NVarChar(50), UserName);

  // GET USER BY USERNAME  // ---------------------------------------------------
  const result = await request.query(`
    SELECT
      UserID,
      UserName,
      FullName,
      PasswordHash,
      RoleID,
      IsActive

    FROM dbo.Users

    WHERE
      UserName = @UserName
  `);

  const user = result.recordset[0];

  if (!user) {
    return null;
  }


  // ---------------------------------------------------
  // CHECK IF USER IS ACTIVE
  // ---------------------------------------------------

  if (!user.IsActive) {
    return {
      inactive: true,
    };
  }

  // COMPARE PASSWORD  // ---------------------------------------------------
  const hashedPassword = hashPassword(Password);

  const passwordIsValid =  hashedPassword === user.PasswordHash;

  if (!passwordIsValid) {
    return null;
  }

  // COMPARE PASSWORD  // ---------------------------------------------------
  /*
  const passwordIsValid =  await bcrypt.compare(Password, user.PasswordHash);
  
  if (!passwordIsValid) {
    return null;
  }
  */

  // RETURN USER INFORMATION
  // DO NOT RETURN PASSWORD HASH  // ---------------------------------------------------

  return {
    UserID: user.UserID,
    UserName: user.UserName,
    FullName: user.FullName,
    RoleID: user.RoleID,
  };

};

// =====================================================
// CREATE User
// =====================================================

const createUser = async (data) => {

  const pool = await connectDB();

  const request = pool.request();

  const {
    UserName,
    FullName,
    Password,
    RoleID,
    IsActive,
  } = data;


  // HASH PASSWORD  // -----------------------------------------------------
  const PasswordHash =  hashPassword(Password);

  /*
  const PasswordHash =
    await bcrypt.hash(
      Password,
      10
    );
  */

  request.input(
    "UserName",
    sql.NVarChar(50),
    UserName
  );

  request.input(
    "FullName",
    sql.NVarChar(150),
    FullName
  );

  request.input(
    "PasswordHash",
    sql.NVarChar(255),
    PasswordHash
  );

  request.input(
    "RoleID",
    sql.Int,
    Number(RoleID)
  );

  request.input(
    "IsActive",
    sql.Bit,
    IsActive === undefined
      ? true
      : Boolean(IsActive)
  );


  const result = await request.query(`
    INSERT INTO dbo.Users
    (
      UserName,
      FullName,
      PasswordHash,
      RoleID,
      IsActive,
      CreatedDate
    )
    OUTPUT
      INSERTED.UserID
    VALUES
    (
      @UserName,
      @FullName,
      @PasswordHash,
      @RoleID,
      @IsActive,
      GETDATE()
    )
  `);


  const newUserID =
    result.recordset[0].UserID;


  // -----------------------------------------------------
  // RETURN THE NEW USER WITH ROLE NAME
  // -----------------------------------------------------

  return await getUserById(
    newUserID
  );
};


// =====================================================
// UPDATE User
// =====================================================

const updateUser = async (id, data) => {

  const pool = await connectDB();

  const request = pool.request();

  const {
    UserName,
    FullName,
    Password,
    RoleID,
    IsActive,
  } = data;


  request.input(
    "UserID",
    sql.Int,
    Number(id)
  );

  request.input(
    "UserName",
    sql.NVarChar(50),
    UserName
  );

  request.input(
    "FullName",
    sql.NVarChar(150),
    FullName
  );

  request.input(
    "RoleID",
    sql.Int,
    Number(RoleID)
  );

  request.input(
    "IsActive",
    sql.Bit,
    Boolean(IsActive)
  );


  // =====================================================
  // UPDATE WITH NEW PASSWORD
  // =====================================================

  if (
    Password &&
    Password.trim() !== ""
  ) {

    const PasswordHash =  hashPassword(Password);

    /*
    const PasswordHash =
      await bcrypt.hash(
        Password,
        10
      );
    */

    request.input(
      "PasswordHash",
      sql.NVarChar(255),
      PasswordHash
    );


    await request.query(`
      UPDATE dbo.Users
      SET
        UserName = @UserName,
        FullName = @FullName,
        PasswordHash = @PasswordHash,
        RoleID = @RoleID,
        IsActive = @IsActive
      WHERE
        UserID = @UserID
    `);

  }


  // =====================================================
  // UPDATE WITHOUT CHANGING PASSWORD
  // =====================================================

  else {

    await request.query(`
      UPDATE dbo.Users
      SET
        UserName = @UserName,
        FullName = @FullName,
        RoleID = @RoleID,
        IsActive = @IsActive
      WHERE
        UserID = @UserID
    `);

  }


  // -----------------------------------------------------
  // RETURN UPDATED USER WITH ROLE NAME
  // -----------------------------------------------------

  return await getUserById(
    id
  );
};


// =====================================================
// DELETE User
// =====================================================

const deleteUser = async (id) => {

  const pool = await connectDB();

  const request = pool.request();

  request.input(
    "UserID",
    sql.Int,
    Number(id)
  );


  const result = await request.query(`
    DELETE FROM dbo.Users
    OUTPUT
      DELETED.UserID
    WHERE
      UserID = @UserID
  `);


  return result.recordset[0] || null;
};

// =====================================================
// RECORD USER LOGIN
// =====================================================

const recordUserLogin = async (UserID, IPAddress, UserAgent) => {

  if (!UserID) {
    throw new Error("UserID is required");
  }

  const pool = await connectDB();

  const result = await pool
    .request()
    .input("UserID", sql.Int, Number(UserID))
    .input("IPAddress", sql.NVarChar(50), IPAddress || null)
    .input("UserAgent", sql.NVarChar(500), UserAgent || null)
    .query(`
      INSERT INTO dbo.UserLoginHistory
      (
        UserID,
        LoginDate,
        IPAddress,
        UserAgent
      )
      OUTPUT
        INSERTED.LoginHistoryID,
        INSERTED.UserID,
        INSERTED.LoginDate,
        INSERTED.LogoutDate,
        INSERTED.IPAddress,
        INSERTED.UserAgent
      VALUES
      (
        @UserID,
        GETDATE(),
        @IPAddress,
        @UserAgent
      )
    `);

  return result.recordset[0];
};

// =====================================================
// RECORD USER LOGOUT
// =====================================================

const recordUserLogout = async (LoginHistoryID, UserID) => {

  const parsedLoginHistoryID = Number(LoginHistoryID);
  const parsedUserID = Number(UserID);

  if (!Number.isInteger(parsedLoginHistoryID) || parsedLoginHistoryID <= 0) {
    throw new Error("Valid LoginHistoryID is required");
  }
  if (!Number.isInteger(parsedUserID) || parsedUserID <= 0) {
    throw new Error("Valid UserID is required");
  }

  const pool = await connectDB();
  const result = await pool.request()
    .input("LoginHistoryID", sql.Int, parsedLoginHistoryID)
    .input("UserID", sql.Int, parsedUserID)
    .query(`
      UPDATE dbo.UserLoginHistory
      SET LogoutDate = GETDATE()
      OUTPUT
        INSERTED.LoginHistoryID,
        INSERTED.UserID,
        INSERTED.LoginDate,
        INSERTED.LogoutDate
      WHERE LoginHistoryID = @LoginHistoryID
        AND UserID = @UserID
        AND LogoutDate IS NULL
    `);

  return result.recordset[0] || null;
};

// =====================================================
// EXPORT
// =====================================================

export {
  getUsers,
  getSearchedUsers,
  getUserById,
  getDoctors,
  loginUser,
  createUser,
  updateUser,
  deleteUser,
  recordUserLogin,
  recordUserLogout,
};
