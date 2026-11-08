import { getSessionOfferUsages } from "../../../../controllers/offerSubscriptionControllerOld";

// Return usage rows for the requested session.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const sessionID = Number(req.query.sessionID);
  if (!Number.isInteger(sessionID) || sessionID <= 0) {
    return res.status(400).json({ message: "Invalid SessionID" });
  }

  try {
    const usages = await getSessionOfferUsages(sessionID);
    return res.status(200).json(usages);
  } catch (error) {
    console.error("GET session offer usage error:", error);
    return res.status(500).json({
      message: error.message || "Failed to load session offer usage",
    });
  }
}
