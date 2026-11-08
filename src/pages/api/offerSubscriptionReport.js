import { getOfferSubscriptionReport } from "../../../controllers/offerSubscriptionReportController";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);

    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
    });
  }

  try {
    const { patientID, fromDate, toDate } = req.query;

    if (!patientID) {
      return res.status(400).json({
        message: "PatientID is required",
      });
    }

    if (!fromDate) {
      return res.status(400).json({
        message: "FromDate is required",
      });
    }

    if (!toDate) {
      return res.status(400).json({
        message: "ToDate is required",
      });
    }

    const subscriptions = await getOfferSubscriptionReport(    patientID,    fromDate,    toDate    );

    return res.status(200).json({ subscriptions, });
  } catch (error) {
    console.error(
      "GET /api/offerSubscriptionReport error:",
      error
    );

    return res.status(500).json({
      message: error.message || "Failed to load offer subscription report",
    });
  }
}