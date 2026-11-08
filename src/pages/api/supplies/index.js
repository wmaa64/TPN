import {
  getSupplies,
  createSupply,
} from "../../../../controllers/suppliesController";

export default async function handler(req, res) {
  
  if (req.method === "GET") {
    try {
      const { search = "", includeInactive = "false" } = req.query;

      const supplies = await getSupplies( search, includeInactive === "true" );

      return res.status(200).json({ supplies });
      
    } catch (error) {
      console.error("GET /api/supplies error:", error);

      return res.status(500).json({
        message: error.message || "Failed to get supplies",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const supply = await createSupply(req.body);

      return res.status(201).json({
        message: "Supply created successfully",
        supply,
      });
    } catch (error) {
      console.error("POST /api/supplies error:", error);

      return res.status(400).json({
        message: error.message || "Failed to create supply",
      });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);

  return res.status(405).json({
    message: `Method ${req.method} not allowed`,
  });
}
