import {
  getUsers,
  getSearchedUsers,
  createUser,
  getDoctors,
} from "../../../../controllers/userController";


// =====================================================
// USERS API
// =====================================================

export default async function handler(req, res) {


  // =====================================================
  // GET USERS / SEARCH USERS / GET DOCTORS
  // =====================================================

  if (req.method === "GET") {

    try {

      const {
        search,
        roleId,
      } = req.query;


      let users;


      // =================================================
      // GET DOCTORS
      // =================================================

      if (
        roleId !== undefined &&
        Number(roleId) === 2
      ) {

        users =
          await getDoctors();

      }


      // =================================================
      // GET ALL USERS
      // =================================================

      else if (!search) {

        users =
          await getUsers();

      }


      // =================================================
      // EMPTY SEARCH
      // =================================================

      else if (!search.trim()) {

        return res.status(400).json({
          message:
            "Search term is required",
        });

      }


      // =================================================
      // SEARCH USERS
      // =================================================

      else {

        users =
          await getSearchedUsers(search);

      }


      return res.status(200).json(users);

    }

    catch (error) {

      console.error(
        "GET /api/users error:",
        error
      );


      return res.status(500).json({
        message:
          "Failed to get users",

        error:
          error.message,
      });

    }

  }


  // =====================================================
  // CREATE USER
  // =====================================================

  if (req.method === "POST") {

    try {

      const {
        UserName,
        FullName,
        Password,
        RoleID,
        IsActive,
      } = req.body;


      // -------------------------------------------------
      // VALIDATION
      // -------------------------------------------------

      if (
        !UserName ||
        !UserName.trim()
      ) {

        return res.status(400).json({
          message:
            "Username is required",
        });

      }


      if (
        !FullName ||
        !FullName.trim()
      ) {

        return res.status(400).json({
          message:
            "Full name is required",
        });

      }


      if (
        !Password ||
        !Password.trim()
      ) {

        return res.status(400).json({
          message:
            "Password is required",
        });

      }


      if (
        RoleID === undefined ||
        RoleID === null ||
        RoleID === ""
      ) {

        return res.status(400).json({
          message:
            "Role is required",
        });

      }


      const user =
        await createUser({

          UserName:
            UserName.trim(),

          FullName:
            FullName.trim(),

          Password:
            Password,

          RoleID:
            Number(RoleID),

          IsActive:
            IsActive === undefined
              ? true
              : Boolean(IsActive),

        });


      return res.status(201).json(user);

    }

    catch (error) {

      console.error(
        "POST /api/users error:",
        error
      );


      // -------------------------------------------------
      // DUPLICATE USERNAME
      // -------------------------------------------------

      if (
        error.number === 2627 ||
        error.number === 2601
      ) {

        return res.status(409).json({
          message:
            "Username already exists",
        });

      }


      // -------------------------------------------------
      // FOREIGN KEY ERROR
      // -------------------------------------------------

      if (
        error.number === 547
      ) {

        return res.status(400).json({
          message:
            "The selected role does not exist",
        });

      }


      return res.status(500).json({
        message:
          "Failed to create user",
      });

    }

  }


  // =====================================================
  // METHOD NOT ALLOWED
  // =====================================================

  res.setHeader(
    "Allow",
    ["GET", "POST"]
  );


  return res.status(405).json({
    message:
      `Method ${req.method} not allowed`,
  });

}