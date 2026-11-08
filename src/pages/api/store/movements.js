import { getStoreMovements } from "../../../../controllers/storeController";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
    });
  }

  try {
    const { supplyID, fromDate,  toDate,  movementType,  } = req.query;

    const movements = await getStoreMovements({
      SupplyID: supplyID || null,
      FromDate: fromDate || null,
      ToDate: toDate || null,
      MovementType: movementType || null,
    });

    return res.status(200).json({ movements });
  } catch (error) {
    console.error("GET /api/store/movements error:", error);

    return res.status(400).json({
      message: error.message || "Failed to get stock movements",
    });
  }
}
