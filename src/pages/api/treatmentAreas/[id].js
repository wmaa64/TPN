import {
  getTreatmentAreaById,
  updateTreatmentArea,
  deleteTreatmentArea,
} from "../../../../controllers/treatmentAreaController";


// =====================================================
// TREATMENT AREA BY ID API
// =====================================================

export default async function handler(req, res) {

  const { id } = req.query;


  // =====================================================
  // GET ONE TREATMENT AREA
  // =====================================================

  if (req.method === "GET") {

    try {

      const treatmentArea =
        await getTreatmentAreaById(id);

      if (!treatmentArea) {

        return res.status(404).json({
          message: "Treatment area not found",
        });

      }

      return res.status(200).json(
        treatmentArea
      );

    } catch (error) {

      console.error(
        "GET /api/treatmentAreas/[id] error:",
        error
      );

      return res.status(500).json({
        message: "Failed to get treatment area",
        error: error.message,
      });

    }

  }


  // =====================================================
  // UPDATE TREATMENT AREA
  // =====================================================

  if (req.method === "PUT") {

    try {

      const treatmentArea =
        await updateTreatmentArea(
          id,
          req.body
        );

      if (!treatmentArea) {

        return res.status(404).json({
          message: "Treatment area not found",
        });

      }

      return res.status(200).json(
        treatmentArea
      );

    } catch (error) {

      console.error(
        "PUT /api/treatmentAreas/[id] error:",
        error
      );

      return res.status(500).json({
        message: "Failed to update treatment area",
        error: error.message,
      });

    }

  }


  // =====================================================
  // DELETE TREATMENT AREA
  // =====================================================

  if (req.method === "DELETE") {

    try {

      const treatmentArea =
        await deleteTreatmentArea(id);

      if (!treatmentArea) {

        return res.status(404).json({
          message: "Treatment area not found",
        });

      }

      return res.status(200).json({
        message: "Treatment area deleted successfully",
        AreaID: treatmentArea.AreaID,
      });

    } catch (error) {

      console.error(
        "DELETE /api/treatmentAreas/[id] error:",
        error
      );

      return res.status(500).json({
        message: "Failed to delete treatment area",
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