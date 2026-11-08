import {
  createPrescribeOrder,
  getSearchedPrescribeOrders,
} from "../../../../controllers/prescribeOrderController";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const orders = await getSearchedPrescribeOrders(req.query.search);
      return res.status(200).json({ orders });
    } catch (error) {
      console.error("GET /api/prescribeOrders error:", error);
      return res.status(error.statusCode || 500).json({
        message: error.message || "Failed to search prescribe orders.",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const order = await createPrescribeOrder(req.body || {});
      return res.status(201).json({
        message: "Prescribe order saved successfully.",
        order,
      });
    } catch (error) {
      console.error("POST /api/prescribeOrders error:", error);
      return res.status(error.statusCode || 500).json({
        message: error.message || "Failed to save prescribe order.",
      });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
