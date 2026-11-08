import {
  createCoupon,
  getPatientValidCoupon,
} from "../../../../controllers/couponController";

export default async function handler(req, res) {
  res.setHeader("Allow", ["GET", "POST"]);

  // ==================================================
  // GET - Get patient's top valid and currently usable coupon
  // ==================================================

  if (req.method === "GET") {
    try {
      const { patientID, status } = req.query;

      if (!patientID) {
        return res.status(400).json({
          message: "PatientID is required.",
        });
      }

      if (status && status !== "Valid") {
        return res.status(400).json({
          message: "Only Valid coupon status is supported.",
        });
      }

      const coupon = await getPatientValidCoupon(patientID);

      return res.status(200).json(coupon);
    } catch (error) {
      console.error("Get patient coupon error:", error);

      return res.status(500).json({
        message:
          error.message || "Failed to load patient coupon.",
      });
    }
  }

  // ==================================================
  // POST - Create coupon
  // ==================================================

  if (req.method === "POST") {
    try {
      const {
        patientID,
        amount,
        fromDate,
        toDate,
        notes,
      } = req.body;

      const coupon = await createCoupon({
        patientID,
        amount,
        fromDate,
        toDate,
        notes,
      });

      return res.status(201).json(coupon);
    } catch (error) {
      console.error("Create coupon error:", error);

      return res.status(400).json({
        message:
          error.message || "Failed to create coupon.",
      });
    }
  }

  return res.status(405).json({
    message: `Method ${req.method} not allowed`,
  });
}