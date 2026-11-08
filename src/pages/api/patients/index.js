import {
  getPatients,
  getSearchedPatients,
  createPatient,
} from "../../../../controllers/patientController";


// =====================================================
// Patients API
// =====================================================

export default async function handler(req, res) {

  // ===================================================
  // GET ALL PATIENTS / SEARCH PATIENTS
  // ===================================================

  if (req.method === "GET") {

    try {

      const { search } = req.query;

      let patients;


      // -------------------------------------------------
      // GET ALL PATIENTS
      // -------------------------------------------------

      if (!search) {

        patients = await getPatients();

      }


      // -------------------------------------------------
      // EMPTY SEARCH
      // -------------------------------------------------

      else if (!search.trim()) {

        return res.status(400).json({
          message: "Search term is required",
        });

      }


      // -------------------------------------------------
      // SEARCH PATIENTS
      // -------------------------------------------------

      else {

        patients =
          await getSearchedPatients(search);

      }


      return res.status(200).json(patients);

    }

    catch (error) {

      console.error(
        "GET /api/patients error:",
        error
      );

      return res.status(500).json({
        message: "Failed to get patients",
        error: error.message,
      });

    }

  }


  // ===================================================
  // POST - CREATE PATIENT
  // ===================================================

  if (req.method === "POST") {

    try {

      const patient =
        await createPatient(req.body);


      return res.status(201).json(patient);

    }

    catch (error) {

      console.error(
        "POST /api/patients error:",
        error
      );

      return res.status(500).json({
        message: "Failed to create patient",
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