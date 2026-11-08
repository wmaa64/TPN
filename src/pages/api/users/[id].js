import {
  getUserById,
  updateUser,
  deleteUser,
} from "../../../../controllers/userController";


export default async function handler(req, res) {

  const {
    id,
  } = req.query;


  // =====================================================
  // VALIDATE ID
  // =====================================================

  const userID =
    Number(id);


  if (
    !Number.isInteger(userID) ||
    userID <= 0
  ) {

    return res.status(400).json({
      message: "Invalid user ID",
    });

  }


  // =====================================================
  // GET USER BY ID
  // =====================================================

  if (req.method === "GET") {

    try {

      const user =
        await getUserById(
          userID
        );


      if (!user) {

        return res.status(404).json({
          message: "User not found",
        });

      }


      return res.status(200).json(user);

    } catch (error) {

      console.error(
        "GET /api/users/[id] error:",
        error
      );

      return res.status(500).json({
        message: "Failed to get user",
      });

    }

  }


  // =====================================================
  // UPDATE USER
  // =====================================================

  if (req.method === "PUT") {

    try {

      const {
        UserName,
        FullName,
        Password,
        RoleID,
        IsActive,
      } = req.body;


      // ---------------------------------------------------
      // VALIDATION
      // ---------------------------------------------------

      if (
        !UserName ||
        !UserName.trim()
      ) {

        return res.status(400).json({
          message: "Username is required",
        });

      }


      if (
        !FullName ||
        !FullName.trim()
      ) {

        return res.status(400).json({
          message: "Full name is required",
        });

      }


      if (
        RoleID === undefined ||
        RoleID === null ||
        RoleID === ""
      ) {

        return res.status(400).json({
          message: "Role is required",
        });

      }


      const user =
        await updateUser(
          userID,
          {
            UserName:
              UserName.trim(),

            FullName:
              FullName.trim(),

            Password:
              Password || "",

            RoleID:
              Number(RoleID),

            IsActive:
              IsActive === undefined
                ? true
                : Boolean(IsActive),
          }
        );


      if (!user) {

        return res.status(404).json({
          message: "User not found",
        });

      }


      return res.status(200).json(user);

    } catch (error) {

      console.error(
        "PUT /api/users/[id] error:",
        error
      );


      // ---------------------------------------------------
      // DUPLICATE USERNAME
      // ---------------------------------------------------

      if (
        error.number === 2627 ||
        error.number === 2601
      ) {

        return res.status(409).json({
          message:
            "Username already exists",
        });

      }


      // ---------------------------------------------------
      // FOREIGN KEY ERROR
      // ---------------------------------------------------

      if (
        error.number === 547
      ) {

        return res.status(400).json({
          message:
            "The selected role does not exist",
        });

      }


      return res.status(500).json({
        message: "Failed to update user",
      });

    }

  }


  // =====================================================
  // DELETE USER
  // =====================================================

  if (req.method === "DELETE") {

    try {

      const deletedUser =
        await deleteUser(
          userID
        );


      if (!deletedUser) {

        return res.status(404).json({
          message: "User not found",
        });

      }


      return res.status(200).json({
        message:
          "User deleted successfully",

        UserID:
          deletedUser.UserID,
      });

    } catch (error) {

      console.error(
        "DELETE /api/users/[id] error:",
        error
      );


      // ---------------------------------------------------
      // FOREIGN KEY CONSTRAINT
      // ---------------------------------------------------

      if (
        error.number === 547
      ) {

        return res.status(400).json({
          message:
            "This user cannot be deleted because it is referenced by other records",
        });

      }


      return res.status(500).json({
        message: "Failed to delete user",
      });

    }

  }


  // =====================================================
  // METHOD NOT ALLOWED
  // =====================================================

  return res.status(405).json({
    message: "Method not allowed",
  });

}