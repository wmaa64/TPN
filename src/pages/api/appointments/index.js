import {
  getAppointments,
  getSearchedAppointments,
  createAppointment,
} from "../../../../controllers/appointmentController";


// =====================================================
// APPOINTMENTS API
// =====================================================

export default async function handler(req, res) {


  // ===================================================
  // GET APPOINTMENTS
  // ===================================================

  if (req.method === "GET") {

    try {

      const {
        search,
        date,
      } = req.query;

      let appointments;


      // -------------------------------------------------
      // SEARCH
      // -------------------------------------------------

      if (search) {

        if (!search.trim()) {

          return res.status(400).json({
            message: "Search term is required",
          });

        }

        appointments =
          await getSearchedAppointments(
            search
          );

      }


      // -------------------------------------------------
      // GET APPOINTMENTS BY DATE
      // -------------------------------------------------

      else if (date) {

        appointments =
          await getAppointmentsByDate(
            date
          );

      }


      // -------------------------------------------------
      // GET ALL APPOINTMENTS
      // -------------------------------------------------

      else {

        appointments =
          await getAppointments();

      }


      return res.status(200).json(
        appointments
      );

    }

    catch (error) {

      console.error(
        "GET /api/appointments error:",
        error
      );

      return res.status(500).json({
        message: "Failed to get appointments",
        error: error.message,
      });

    }

  }


  // ===================================================
  // POST - CREATE APPOINTMENT
  // ===================================================

  if (req.method === "POST") {

    try {

      const appointment =
        await createAppointment(
          req.body
        );


      return res.status(201).json(
        appointment
      );

    }

    catch (error) {

      console.error(
        "POST /api/appointments error:",
        error
      );

      return res.status(500).json({
        message: "Failed to create appointment",
        error: error.message,
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
    message: `Method ${req.method} not allowed`,
  });

}