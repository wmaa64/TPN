import {
  getRoles,
  getSearchedRoles,
  createRole,
} from "../../../../controllers/roleController";


export default async function handler(req, res) {

  try {

    // ============================================
    // GET /api/roles
    // ============================================

    if (req.method === "GET") {

      const { search } = req.query;

      let roles;

      if (!search) {
        roles = await getRoles();
      }
      else if (!search.trim()) {
        return res.status(400).json({ message: "Search term is required",  });
      }
      else { 
        roles = await getSearchedRoles(search);
      }

      return res.status(200).json(roles);
    }


    // ============================================
    // POST /api/roles
    // ============================================

    if (req.method === "POST") {

      const role = await createRole(req.body);

      return res.status(201).json(role);
    }


    // ============================================
    // METHOD NOT ALLOWED
    // ============================================

    res.setHeader("Allow", ["GET", "POST"]);

    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
    });

  } catch (error) {

    console.error("Roles API error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}