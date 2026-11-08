import {
  getSessionServices,
  saveSessionServices,
  getSessionPayableTotal,
} from "../../../../controllers/sessionServiceController";


// =====================================================
// SESSION SERVICES API
// =====================================================

export default async function handler(req, res) {

  // ===================================================
  // GET
  // ===================================================
  //
  // GET /api/sessionServices?sessionId=123&patientId=25
  //
  // Returns services belonging to:
  //   - this session
  //   - this patient
  //   - TODAY
  //
  // ===================================================

  if (req.method === "GET") {

    try {

      const {
        sessionId,
        patientId,
        total,
      } = req.query;


      // -------------------------------------------------
      // VALIDATE SESSION ID
      // -------------------------------------------------

      if (!sessionId) {
        return res.status(400).json({
          message: "SessionID is required",
        });
      }


      // -------------------------------------------------
      // VALIDATE PATIENT ID
      // -------------------------------------------------

      if (!patientId) {
        return res.status(400).json({
          message: "PatientID is required",
        });
      }


      // -------------------------------------------------
      // GET PAYABLE TOTAL ONLY
      // -------------------------------------------------

      if (total === "true") {

        const payableTotal =  await getSessionPayableTotal(sessionId, patientId);

        return res.status(200).json({
          payableTotal,
        });
      }


      // -------------------------------------------------
      // GET SESSION SERVICES
      // -------------------------------------------------

      const services =  await getSessionServices(sessionId, patientId);

      return res.status(200).json(
        services
      );

    } catch (error) {

      console.error(
        "GET /api/sessionServices error:",
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          "Failed to load session services",
      });
    }
  }


  // ===================================================
  // POST
  // ===================================================
  //
  // POST /api/sessionServices
  //
  // Replaces ALL services for today's session.
  //
  // Body:
  //
  // {
  //   sessionId: 123,
  //   patientId: 25,
  //   services: [...]
  // }
  //
  // ===================================================

  if (req.method === "POST") {

    try {

      const {sessionId, patientId, services, } = req.body;

      // -------------------------------------------------
      // VALIDATE SESSION ID
      // -------------------------------------------------

      if (!sessionId) {
        return res.status(400).json({
          message: "SessionID is required",
        });
      }


      // -------------------------------------------------
      // VALIDATE PATIENT ID
      // -------------------------------------------------

      if (!patientId) {
        return res.status(400).json({
          message: "PatientID is required",
        });
      }


      // -------------------------------------------------
      // VALIDATE SERVICES ARRAY
      // -------------------------------------------------

      if (!Array.isArray(services)) {
        return res.status(400).json({
          message:
            "Services must be an array",
        });
      }


      // -------------------------------------------------
      // SAVE / REPLACE ALL SERVICES
      // -------------------------------------------------

      const savedServices =  await saveSessionServices(sessionId,  patientId, services);

      // -------------------------------------------------
      // GET PAYABLE TOTAL
      // -------------------------------------------------

      const payableTotal =  await getSessionPayableTotal(sessionId, patientId);

      return res.status(200).json({
        message:  "Session services saved successfully",

        services: savedServices,

        payableTotal,
      });

    } catch (error) {

      console.error(
        "POST /api/sessionServices error:",
        error
      );

      // -----------------------------------------------
      // BUSINESS VALIDATION ERRORS
      // -----------------------------------------------

      if (
        error.message?.includes(
          "not found"
        ) ||
        error.message?.includes(
          "Invalid"
        ) ||
        error.message?.includes(
          "must be"
        ) ||
        error.message?.includes(
          "cannot be"
        )
      ) {

        return res.status(400).json({
          message: error.message,
        });
      }


      // -----------------------------------------------
      // SERVER ERROR
      // -----------------------------------------------

      return res.status(500).json({
        message:
          error.message ||
          "Failed to save session services",
      });
    }
  }


  // ===================================================
  // METHOD NOT ALLOWED
  // ===================================================

  res.setHeader(
    "Allow",
    ["GET", "POST"]
  );

  return res.status(405).json({
    message:
      `Method ${req.method} not allowed`,
  });
}