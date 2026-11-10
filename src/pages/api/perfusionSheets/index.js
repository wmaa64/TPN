import { getSearchedPerfusionSheets } from "../../../../controllers/perfusionSheetController";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    const orders = await getSearchedPerfusionSheets(req.query.search);
    return res.status(200).json({ orders });
  } catch (error) {
    console.error("GET /api/perfusionSheets error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to search perfusion sheets.",
    });
  }
}
