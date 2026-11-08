import {
  getDeviceById,
  updateDevice,
  deleteDevice,
} from "../../../../controllers/deviceController";


// =====================================================
// device BY ID API
// =====================================================

export default async function handler(req, res) {

  const { id } = req.query;


  // =====================================================
  // GET ONE device
  // =====================================================

  if (req.method === "GET") {

    try {

      const device = await getDeviceById(id);

      if (!device) {

        return res.status(404).json({
          message: "Device not found",
        });

      }

      return res.status(200).json(device);

    } catch (error) {

      console.error(
        "GET /api/devices/[id] error:",
        error
      );

      return res.status(500).json({
        message: "Failed to get Device",
        error: error.message,
      });

    }

  }


  // =====================================================
  // UPDATE device
  // =====================================================

  if (req.method === "PUT") {

    try {

      const device = await updateDevice(
        id,
        req.body
      );

      if (!device) {

        return res.status(404).json({
          message: "device not found",
        });

      }

      return res.status(200).json(device);

    } catch (error) {

      console.error(
        "PUT /api/devices/[id] error:",
        error
      );

      return res.status(500).json({
        message: "Failed to update Device",
        error: error.message,
      });

    }

  }


  // =====================================================
  // DELETE device
  // =====================================================

  if (req.method === "DELETE") {

    try {

      const device = await deleteDevice(id);

      if (!device) {

        return res.status(404).json({
          message: "device not found",
        });

      }

      return res.status(200).json({
        message: "Device deleted successfully",
        deviceID: device.deviceID,
      });

    } catch (error) {

      console.error(
        "DELETE /api/devices/[id] error:",
        error
      );

      return res.status(500).json({
        message: "Failed to delete device",
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