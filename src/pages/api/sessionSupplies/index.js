import {
  addSessionSupplies,
  getSessionSupplies,
} from "../../../../controllers/sessionSupplyController";

// GET lists saved supplies; POST replaces the session's complete supply list and reconciles stock.
export default async function handler(req, res) {
  if (req.method === "GET") {
    const sessionID = Number(req.query.sessionID);
    if (!Number.isInteger(sessionID) || sessionID <= 0) {
      return res.status(400).json({ message: "A valid SessionID is required" });
    }

    try {
      const supplies = await getSessionSupplies(sessionID);
      return res.status(200).json({ supplies });
    } catch (error) {
      console.error("GET /api/sessionSupplies error:", error);
      return res.status(500).json({ message: error.message || "Failed to load session supplies" });
    }
  }

  if (req.method === "POST") {
    try {
      const result = await addSessionSupplies(req.body || {});
      return res.status(201).json({
        message: "Session supplies saved and store stock updated",
        supplies: result,
      });
    } catch (error) {
      console.error("POST /api/sessionSupplies error:", error);
      const status = error.number === 50101 || error.number === 50102
        ? 409
        : error.message?.includes("required") || error.message?.includes("greater than zero") || error.message?.includes("only be included") || error.message?.includes("Invalid")
          ? 400
          : error.message?.includes("not found")
            ? 404
            : 500;
      return res.status(status).json({ message: error.message || "Failed to save session supplies" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
