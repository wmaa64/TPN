import {
  getSupplyById,
  updateSupply,
  deactivateSupply,
} from "../../../../controllers/suppliesController";

// Handle operations for a single supply identified by its route ID.
export default async function handler(req, res) {
  const supplyID = Number(req.query.id);

  if (!Number.isInteger(supplyID) || supplyID <= 0) {
    return res.status(400).json({ message: "A valid supply ID is required." });
  }

  try {
    if (req.method === "GET") {
      const supply = await getSupplyById(supplyID);
      return res.status(200).json({ supply });
    }

    if (req.method === "PUT") {
      const supply = await updateSupply(supplyID, req.body || {});
      return res.status(200).json({
        message: "Supply updated successfully.",
        supply,
      });
    }

    if (req.method === "DELETE") {
      const result = await deactivateSupply(supplyID);
      return res.status(200).json(result);
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error(`Supplies API error (${req.method}):`, error);

    if (error.message?.includes("not found") || error.message?.includes("already inactive") || error.number === 50002) {
      return res.status(404).json({ message: error.message });
    }

    if (error.message?.includes("required") || error.message?.includes("valid") || error.number === 50003) {
      return res.status(400).json({ message: error.message });
    }

    if (error.number === 50001) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: error.message || "Failed to process supply.",
    });
  }
}
