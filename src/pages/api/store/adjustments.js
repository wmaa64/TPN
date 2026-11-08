import { adjustStoreStock } from "../../../../controllers/storeController";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
    });
  }

  try {
    const {
      SupplyID,
      ActualQuantity,
      Notes,
      UserID,
    } = req.body;

    const result = await adjustStoreStock({
      SupplyID,
      ActualQuantity,
      Notes,
      UserID: UserID ?? null,
    });

    return res.status(200).json({
      message: result.AdjustmentRecorded
        ? "Stock adjusted successfully"
        : "Stock already matches the physical count",
      adjustment: result,
    });
  } catch (error) {
    console.error("POST /api/store/adjustments error:", error);

    return res.status(400).json({
      message: error.message || "Failed to adjust stock",
    });
  }
}
