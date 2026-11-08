import {
  getDashboardSummary,
  getTodayPrescribeOrders,
  getHospitalDemandToday,
} from "../../../controllers/dashboardController";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    const [summary, todayOrders, hospitalDemand] = await Promise.all([
      getDashboardSummary(),
      getTodayPrescribeOrders(),
      getHospitalDemandToday(),
    ]);

    return res.status(200).json({ summary, todayOrders, hospitalDemand });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return res.status(500).json({
      message: error.message || "Failed to load parenteral center dashboard.",
    });
  }
}
