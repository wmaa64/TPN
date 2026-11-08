import {
  getSessionPayments,
  createSessionPayment,
} from "../../../../controllers/sessionPaymentController";

export default async function handler(req, res) {
  try {
    // GET - retrieve all payments for a session
    if (req.method === "GET") {
      const { sessionId } = req.query;

      const sessionID = Number(sessionId);

      if (!Number.isInteger(sessionID) || sessionID <= 0) {
        return res.status(400).json({
          message: "Valid Session ID is required.",
        });
      }

      const payments = await getSessionPayments(sessionID);

      return res.status(200).json(payments);
    }

    // POST - create a new payment
    if (req.method === "POST") {
      const {
        sessionID,
        patientID,
        amountPaid,
        paymentMethod,
        notes,
        userID,
        couponID,
        couponNo
      } = req.body;

      const parsedSessionID = Number(sessionID);
      const parsedPatientID = Number(patientID);
      const parsedUserID = Number(userID);

      if (
        !Number.isInteger(parsedSessionID) ||
        parsedSessionID <= 0
      ) {
        return res.status(400).json({
          message: "Valid Session ID is required.",
        });
      }

      if (
        !Number.isInteger(parsedPatientID) ||
        parsedPatientID <= 0
      ) {
        return res.status(400).json({
          message: "Valid Patient ID is required.",
        });
      }

      if (
        !Number.isInteger(parsedUserID) ||
        parsedUserID <= 0
      ) {
        return res.status(400).json({
          message: "Valid User ID is required.",
        });
      }

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

      const PAYMENT_METHODS = [
        "Cash",
        "Visa",
        "Bank Transfer",
        "Instapay",
        "Vodafone Cash",
        "Coupon",
      ];

      if (!PAYMENT_METHODS.includes(paymentMethod)) {
        return res.status(400).json({
          message: "Invalid payment method.",
        });
      }

      const payment = await createSessionPayment({
        sessionID: parsedSessionID,
        patientID: parsedPatientID,
        amountPaid: amount,
        paymentMethod,
        notes,
        userID: parsedUserID,
        couponID,
        couponNo
      });

      return res.status(201).json(payment);
    }

    // Unsupported method
    res.setHeader("Allow", ["GET", "POST"]);

    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
    });
  } catch (error) {
    console.error("Session Payments API error:", error);

    return res.status(500).json({
      message: error.message || "Failed to process session payment.",
    });
  }
}