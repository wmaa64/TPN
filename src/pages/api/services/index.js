import {
  getServices,
  getSearchedServices,
  createService,
} from "../../../../controllers/serviceController";


// =====================================================
// SERVICES API
// =====================================================

export default async function handler(req, res) {

  // ===================================================
  // GET SERVICES
  // ===================================================

  if (req.method === "GET") {

    try {

      const { search } = req.query;

      let services;


      // -------------------------------------------------
      // NO SEARCH
      // -------------------------------------------------

      if (!search) {

        services = await getServices();

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

        services = await getSearchedServices(search);

      }


      return res.status(200).json(services);

    }

    catch (error) {

      console.error(
        "GET /api/services error:",
        error
      );

      return res.status(500).json({
        message: "Failed to get services",
        error: error.message,
      });

    }

  }


  // ===================================================
  // POST - CREATE SERVICE
  // ===================================================

  if (req.method === "POST") {

    try {

      const service = await createService(req.body);

      return res.status(201).json(service);

    }

    catch (error) {

      console.error(
        "POST /api/services error:",
        error
      );

      return res.status(500).json({
        message: "Failed to create service",
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