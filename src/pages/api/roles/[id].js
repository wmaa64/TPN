import {
  getRoleById,
  updateRole,
  deleteRole,
} from "../../../../controllers/roleController";


export default async function handler(req, res) {

  const { id } = req.query;

  try {

    // ============================================
    // GET /api/roles/:id
    // ============================================

    if (req.method === "GET") {

      const role = await getRoleById(id);

      if (!role) {
        return res.status(404).json({
          message: "role not found",
        });
      }

      return res.status(200).json(role);
    }


    // ============================================
    // PUT /api/roles/:id
    // ============================================

    if (req.method === "PUT") {

      const role = await updateRole(id, req.body );

      if (!role) {
        return res.status(404).json({
          message: "role not found",
        });
      }

      return res.status(200).json(role);
    }


    // ============================================
    // DELETE /api/roles/:id
    // ============================================

    if (req.method === "DELETE") {

      const deletedRole = await deleteRole(id);

      if (!deletedRole) {
        return res.status(404).json({
          message: "Role not found",
        });
      }

      return res.status(200).json({
        message: "Role deleted successfully",
        RoleID: deletedRole.RoleID,
      });
    }


    // ============================================
    // METHOD NOT ALLOWED
    // ============================================

    res.setHeader(
      "Allow",
      ["GET", "PUT", "DELETE"]
    );

    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
    });

  } catch (error) {

    console.error("Role API error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}