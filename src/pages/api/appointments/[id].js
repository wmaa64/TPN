import {
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
} from "../../../../controllers/appointmentController";


// =====================================================
// APPOINTMENT BY ID API
// =====================================================

export default async function handler(req, res) {

  const { id } = req.query;


  // =====================================================
  // GET ONE APPOINTMENT
  // =====================================================

  if (req.method === "GET") {

    try {

      const appointment =
        await getAppointmentById(id);


      if (!appointment) {

        return res.status(404).json({
          message: "Appointment not found",
        });

      }


      return res.status(200).json(
        appointment
      );

    }

    catch (error) {

      console.error(
        "GET /api/appointments/[id] error:",
        error
      );


      return res.status(500).json({
        message: "Failed to get appointment",
        error: error.message,
      });

    }

  }


  // =====================================================
  // UPDATE APPOINTMENT
  // =====================================================

  if (req.method === "PUT") {

    try {

      const appointment =
        await updateAppointment(
          id,
          req.body
        );


      if (!appointment) {

        return res.status(404).json({
          message: "Appointment not found",
        });

      }


      return res.status(200).json(
        appointment
      );

    }

    catch (error) {

      console.error(
        "PUT /api/appointments/[id] error:",
        error
      );


      return res.status(500).json({
        message: "Failed to update appointment",
        error: error.message,
      });

    }

  }


  // =====================================================
  // DELETE APPOINTMENT
  // =====================================================

  if (req.method === "DELETE") {

    try {

      const appointment =
        await deleteAppointment(id);


      if (!appointment) {

        return res.status(404).json({
          message: "Appointment not found",
        });

      }


      return res.status(200).json({

        message:
          "Appointment deleted successfully",

        AppointmentID:
          appointment.AppointmentID,

      });

    }

    catch (error) {

      console.error(
        "DELETE /api/appointments/[id] error:",
        error
      );


      return res.status(500).json({
        message: "Failed to delete appointment",
        error: error.message,
      });

    }

  }


  // =====================================================
  // METHOD NOT ALLOWED
  // =====================================================

  res.setHeader(
    "Allow",
    ["GET", "PUT", "DELETE"]
  );


  return res.status(405).json({
    message: `Method ${req.method} not allowed`,
  });

}