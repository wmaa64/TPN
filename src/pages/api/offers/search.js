import { getSearchedOffers } from "../../../../controllers/offerController";

// GET /api/offers/search?search=...
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { search } = req.query;

  //const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

  if (!search) {
    return res.status(400).json({ message: "Search term is required" });
  }

  try {
    const offers = await getSearchedOffers(search);
    
    return res.status(200).json(offers);
  
  } catch (error) {
  
    console.error("GET /api/offers/search error:", error);
    return res.status(500).json({
      message: error.message || "Failed to search offers",
    });
  }
}
