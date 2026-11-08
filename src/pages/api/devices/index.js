import {
  getDevices,
  getSearchedDevices,
  createDevice,
} from "../../../../controllers/deviceController";


// =====================================================
// Devices API
// =====================================================

export default async function handler(req, res) {

  // ===================================================
  // GET Devices
  // ===================================================

  if (req.method === "GET") {

    try {

      const { search } = req.query;

      let devices;


      // -------------------------------------------------
      // NO SEARCH
      // -------------------------------------------------

      if (!search) {

        devices = await getDevices();

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

        devices = await getSearchedDevices(search);

      }


      return res.status(200).json(devices);

    }

    catch (error) {

      console.error(
        "GET /api/devices error:",
        error
      );

      return res.status(500).json({
        message: "Failed to get devices",
        error: error.message,
      });

    }

  }


  // ===================================================
  // POST - CREATE DEVICE
  // ===================================================

  if (req.method === "POST") {

    try {

      const device = await createDevice(req.body);

      return res.status(201).json(device);

    }

    catch (error) {

      console.error(
        "POST /api/devices error:",
        error
      );

      return res.status(500).json({
        message: "Failed to create device",
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