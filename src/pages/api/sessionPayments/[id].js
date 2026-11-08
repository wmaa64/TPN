import {
  updateSessionPayment,
  deleteSessionPayment,
} from "../../../../controllers/sessionPaymentController";

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    const paymentID = Number(id);

    if (!Number.isInteger(paymentID) || paymentID <= 0) {
      return res.status(400).json({
        message: "Valid Payment ID is required.",
      });
    }

    // --------------------------------------------------
    // PUT - Update payment
    // --------------------------------------------------
    if (req.method === "PUT") {
      const {
        amountPaid,
        paymentMethod,
        notes,
      } = req.body;

      if (
        amountPaid === undefined ||
        amountPaid === null ||
        amountPaid === ""
      ) {
        return res.status(400).json({
          message: "Payment amount is required.",
        });
      }

      const amount = Number(amountPaid);

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          message: "Payment amount must be greater than zero.",
        });
      }

      const payment = await updateSessionPayment({
        paymentID,
        amountPaid: amount,
        paymentMethod,
        notes,
      });

      return res.status(200).json(payment);
    }

    // --------------------------------------------------
    // DELETE - Delete payment
    // --------------------------------------------------
    if (req.method === "DELETE") {
      const payment = await deleteSessionPayment(paymentID);

      return res.status(200).json({
        message: "Payment deleted successfully.",
        payment,
      });
    }

    // --------------------------------------------------
    // Unsupported method
    // --------------------------------------------------
    res.setHeader("Allow", ["PUT", "DELETE"]);

    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
    });
  } catch (error) {
    console.error("Session Payment API error:", error);

    return res.status(500).json({
      message: error.message || "Failed to process session payment.",
    });
  }
}