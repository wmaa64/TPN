import {
  getSessionServices,
  saveSessionServices,
} from "../../../../../controllers/sessionController";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({
      message: "Invalid SessionID",
    });
  }

  // =====================================================
  // GET SESSION SERVICES
  // =====================================================

  if (req.method === "GET") {
    try {
      const services = await getSessionServices(id);

      return res.status(200).json(services);
    } catch (error) {
      console.error(
        "GET session services error:",
        error
      );

      return res.status(500).json({
        message: "Failed to load session services",
      });
    }
  }

  // =====================================================
  // POST / SAVE SESSION SERVICES
  // =====================================================

  if (req.method === "POST") {
    
    try {
      const {
        PatientID,
        services,
      } = req.body;

      if (!PatientID) {
        return res.status(400).json({
          message: "PatientID is required",
        });
      }

      if (!Array.isArray(services)) {
        return res.status(400).json({
          message: "Services must be an array",
        });
      }

      const savedServices =
        await saveSessionServices(
          id,
          PatientID,
          services
        );

      return res.status(200).json(savedServices);

    } catch (error) {
      console.error(
        "POST session services error:",
        error
      );

      return res.status(500).json({
        message: "Failed to save session services",
      });
    }
  }

  // =====================================================
  // METHOD NOT ALLOWED
  // =====================================================

  res.setHeader(
    "Allow",
    ["GET", "POST"]
  );

  return res.status(405).json({
    message: `Method ${req.method} not allowed`,
  });
}