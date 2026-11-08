import { recordStorePurchase } from "../../../../controllers/storeController";

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
      Qty,
      UnitCost,
      PaymentMethod,
      Notes,
    } = req.body;

    const result = await recordStorePurchase({
      SupplyID,
      Qty,
      UnitCost,
      PaymentMethod,
      UserID: req.body.UserID ?? null,
      Notes,
    });

    return res.status(201).json({
      message: "Purchase recorded successfully",
      movement: result,
    });
  } catch (error) {
    console.error("POST /api/store/purchases error:", error);

    return res.status(400).json({
      message: error.message || "Failed to record purchase",
    });
  }
}
