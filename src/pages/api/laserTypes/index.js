import {
  getLaserTypes,
  getSearchedLaserTypes,
  createLaserType,
} from "../../../../controllers/laserTypeController";


// =====================================================
// Laser Types API
// =====================================================

export default async function handler(req, res) {

  // ===================================================
  // GET LASER TYPES
  // ===================================================

  if (req.method === "GET") {

    try {

      const { search } = req.query;

      let laserTypes;


      // -------------------------------------------------
      // NO SEARCH
      // -------------------------------------------------

      if (!search) {

        laserTypes = await getLaserTypes();

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

        laserTypes =
          await getSearchedLaserTypes(search);

      }


      return res.status(200).json(
        laserTypes
      );

    }

    catch (error) {

      console.error(
        "GET /api/laserTypes error:",
        error
      );

      return res.status(500).json({
        message: "Failed to get laser types",
        error: error.message,
      });

    }

  }


  // ===================================================
  // POST - CREATE LASER TYPE
  // ===================================================

  if (req.method === "POST") {

    try {

      const laserType =
        await createLaserType(req.body);

      return res.status(201).json(
        laserType
      );

    }

    catch (error) {

      console.error(
        "POST /api/laserTypes error:",
        error
      );

      return res.status(500).json({
        message: "Failed to create laser type",
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