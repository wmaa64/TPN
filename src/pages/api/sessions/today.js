import {
  getTodayAppointments,
} from "../../../../controllers/sessionController";


// =====================================================
// TODAY'S APPOINTMENTS API
// =====================================================

export default async function handler(req, res) {

  // ===================================================
  // GET TODAY'S APPOINTMENTS
  // ===================================================

  if (req.method === "GET") {

    try {

      const { date } = req.query;


      // -------------------------------------------------
      // DATE REQUIRED
      // -------------------------------------------------

      if (!date) {

        return res.status(400).json({
          message: "Date is required",
        });

      }


      // -------------------------------------------------
      // GET APPOINTMENTS
      // -------------------------------------------------

      const appointments = await getTodayAppointments(date);

      return res.status(200).json(appointments);

    }
    catch (error) {
      console.error("GET /api/sessions/today error:", error);

      return res.status(500).json({
        message: "Failed to get today's appointments",
        error: error.message,
      });

    }

  }


  // ===================================================
  // METHOD NOT ALLOWED
  // ===================================================

  res.setHeader(
    "Allow",
    ["GET"]
  );

  return res.status(405).json({
    message:
      `Method ${req.method} not allowed`,
  });

}