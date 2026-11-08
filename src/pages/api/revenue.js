import { getRevenue } from "../../../controllers/revenueController";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { fromDate, toDate } = req.query;

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

      const revenue = await getRevenue(fromDate, toDate  );

      return res.status(200).json(revenue);
    }

    res.setHeader("Allow", ["GET"]);

    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
    });

  } catch (error) {
    console.error("Revenue API error:", error);

    return res.status(500).json({
      message: error.message || "Server error",
    });
  }
}