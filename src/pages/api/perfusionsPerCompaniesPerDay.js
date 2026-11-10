import { getPerfusionsPerCompaniesPerDay } from "../../../controllers/perfusionsPerCompaniesPerDayController";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    const report = await getPerfusionsPerCompaniesPerDay(req.query.date);
    return res.status(200).json(report);
  } catch (error) {
    console.error("GET /api/perfusionsPerCompaniesPerDay error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to create company perfusion totals report.",
    });
  }
}
