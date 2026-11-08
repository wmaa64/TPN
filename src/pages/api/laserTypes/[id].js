import {
  getLaserTypeById,
  updateLaserType,
  deleteLaserType,
} from "../../../../controllers/laserTypeController";


// =====================================================
// LASER TYPE BY ID API
// =====================================================

export default async function handler(req, res) {

  const { id } = req.query;


  // =====================================================
  // GET ONE LASER TYPE
  // =====================================================

  if (req.method === "GET") {

    try {

      const laserType =
        await getLaserTypeById(id);

      if (!laserType) {

        return res.status(404).json({
          message: "Laser type not found",
        });

      }

      return res.status(200).json(
        laserType
      );

    } catch (error) {

      console.error(
        "GET /api/laserTypes/[id] error:",
        error
      );

      return res.status(500).json({
        message: "Failed to get laser type",
        error: error.message,
      });

    }

  }


  // =====================================================
  // UPDATE LASER TYPE
  // =====================================================

  if (req.method === "PUT") {

    try {

      const laserType =
        await updateLaserType(
          id,
          req.body
        );

      if (!laserType) {

        return res.status(404).json({
          message: "Laser type not found",
        });

      }

      return res.status(200).json(
        laserType
      );

    } catch (error) {

      console.error(
        "PUT /api/laserTypes/[id] error:",
        error
      );

      return res.status(500).json({
        message: "Failed to update laser type",
        error: error.message,
      });

    }

  }


  // =====================================================
  // DELETE LASER TYPE
  // =====================================================

  if (req.method === "DELETE") {

    try {

      const laserType =
        await deleteLaserType(id);

      if (!laserType) {

        return res.status(404).json({
          message: "Laser type not found",
        });

      }

      return res.status(200).json({
        message: "Laser type deleted successfully",
        LaserTypeID: laserType.LaserTypeID,
      });

    } catch (error) {

      console.error(
        "DELETE /api/laserTypes/[id] error:",
        error
      );

      return res.status(500).json({
        message: "Failed to delete laser type",
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