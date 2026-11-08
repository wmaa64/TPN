import {
  getTreatmentAreas,
  getSearchedTreatmentAreas,
  createTreatmentArea,
} from "../../../../controllers/treatmentAreaController";


// =====================================================
// Treatment Areas API
// =====================================================

export default async function handler(req, res) {

  // ===================================================
  // GET Treatment Areas
  // ===================================================

  if (req.method === "GET") {

    try {

      const { search } = req.query;

      let treatmentAreas;


      // -------------------------------------------------
      // NO SEARCH
      // -------------------------------------------------

      if (!search) {

        treatmentAreas = await getTreatmentAreas();

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
      // SEARCH
      // -------------------------------------------------

      else {

        treatmentAreas =
          await getSearchedTreatmentAreas(search);

      }


      return res.status(200).json(treatmentAreas);

    }

    catch (error) {

      console.error(
        "GET /api/treatmentAreas error:",
        error
      );

      return res.status(500).json({
        message: "Failed to get treatment areas",
        error: error.message,
      });

    }

  }


  // ===================================================
  // POST - CREATE TREATMENT AREA
  // ===================================================

  if (req.method === "POST") {

    try {

      const treatmentArea =
        await createTreatmentArea(req.body);

      return res.status(201).json(treatmentArea);

    }

    catch (error) {

      console.error(
        "POST /api/treatmentAreas error:",
        error
      );

      return res.status(500).json({
        message: "Failed to create treatment area",
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