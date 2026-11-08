import {
  getPatientById,
  updatePatient,
  deletePatient,
} from "../../../../controllers/patientController";


export default async function handler(req, res) {

  const { id } = req.query;

  try {

    // ============================================
    // GET /api/patients/:id
    // ============================================

    if (req.method === "GET") {

      const patient = await getPatientById(id);

      if (!patient) {
        return res.status(404).json({
          message: "Patient not found",
        });
      }

      return res.status(200).json(patient);
    }


    // ============================================
    // PUT /api/patients/:id
    // ============================================

    if (req.method === "PUT") {

      const patient = await updatePatient(id, req.body );

      if (!patient) {
        return res.status(404).json({
          message: "Patient not found",
        });
      }

      return res.status(200).json(patient);
    }


    // ============================================
    // DELETE /api/patients/:id
    // ============================================

    if (req.method === "DELETE") {

      const deletedPatient = await deletePatient(id);

      if (!deletedPatient) {
        return res.status(404).json({
          message: "Patient not found",
        });
      }

      return res.status(200).json({
        message: "Patient deleted successfully",
        PatientID: deletedPatient.PatientID,
      });
    }


    // ============================================
    // METHOD NOT ALLOWED
    // ============================================

    res.setHeader(
      "Allow",
      ["GET", "PUT", "DELETE"]
    );

    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
    });

  } catch (error) {

    console.error("Patient API error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}