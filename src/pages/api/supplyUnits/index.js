import {
  getSupplyUnits,
  createSupplyUnit,
} from "../../../../controllers/supplyUnitsController";

export default async function handler(req, res) {
  try {
    // GET: Retrieve supply units
    if (req.method === "GET") {
      const includeInactive = req.query.includeInactive === "true";

      const units = await getSupplyUnits(includeInactive);

      return res.status(200).json({ units });
    }

    // POST: Create a supply unit
    if (req.method === "POST") {
      const unit = await createSupplyUnit(req.body || {});

      return res.status(201).json({
        message: "Supply unit created successfully.",
        unit,
      });
    }

    // Unsupported method
    res.setHeader("Allow", ["GET", "POST"]);

    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
    });
  } catch (error) {
    console.error("SupplyUnits API error:", error);

    if (
      error.message?.includes("already exists") ||
      error.number === 50001
    ) {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({
      message: error.message || "Internal server error.",
    });
  }
}