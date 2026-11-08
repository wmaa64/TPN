import {
  getSessionsDueByDate,
  getSessionDueServices,
} from "../../../../controllers/sessionDueController";


// SESSION DUE API// ============================================================
export default async function handler(req, res) {

  // ONLY GET IS ALLOWED
  if (req.method !== "GET") {

    res.setHeader("Allow", ["GET"]);

    return res.status(405).json({message: `Method ${req.method} not allowed`,});
  }


  try {

    // ========================================================
    // GET SERVICES FOR ONE SESSION
    // ========================================================

    if (req.query.sessionId) {

      const sessionID = Number(req.query.sessionId);

      if (!Number.isInteger(sessionID) || sessionID <= 0 ) {
        return res.status(400).json({message: "Valid Session ID is required.",});
      }

      const services =  await getSessionDueServices(sessionID);

      return res.status(200).json(services);
    }

    // GET ALL SESSIONS FOR SELECTED DATE
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({message: "Date is required.",});
    }

    // BASIC DATE VALIDATION
    const datePattern =  /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
      return res.status(400).json({message: "Invalid date format. Expected YYYY-MM-DD.",});
    }

    const sessions =  await getSessionsDueByDate(date);

    return res.status(200).json(sessions);

  }
  catch (error) {
    console.error("Session Due API error:", error);
    return res.status(500).json({message: error.message || "Failed to load session due data.",});
  }

}