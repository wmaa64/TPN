import {
  getSupplyUnitById,
  updateSupplyUnit,
  deactivateSupplyUnit,
} from "../../../../controllers/supplyUnitsController";

// Handle operations for one supply unit identified by its route ID.
export default async function handler(req, res) {
  const unitID = Number(req.query.id);

  if (!Number.isInteger(unitID) || unitID <= 0) {
    return res.status(400).json({ message: "A valid supply unit ID is required." });
  }

  try {
    if (req.method === "GET") {
      const unit = await getSupplyUnitById(unitID);
      if (!unit) return res.status(404).json({ message: "Supply unit not found." });
      return res.status(200).json({ unit });
    }

    if (req.method === "PUT") {
      const unit = await updateSupplyUnit(unitID, req.body || {});
      return res.status(200).json({ message: "Supply unit updated successfully.", unit });
    }

    if (req.method === "DELETE") {
      const result = await deactivateSupplyUnit(unitID);
      return res.status(200).json(result);
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error(`Supply unit API error (${req.method}):`, error);

    if (error.message?.includes("already exists") || error.number === 50001) {
      return res.status(409).json({ message: error.message });
    }

    if (error.message?.includes("not found") || error.message?.includes("already inactive") || error.number === 50002) {
      return res.status(404).json({ message: error.message });
    }

    if (error.message?.includes("required") || error.message?.includes("cannot exceed") || error.message?.includes("valid")) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: error.message || "Failed to process supply unit." });
  }
}
