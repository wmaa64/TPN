import {
  getServiceById,
  updateService,
  deleteService,
} from "../../../../controllers/serviceController";


// =====================================================
// SERVICE BY ID API
// =====================================================

export default async function handler(req, res) {

  const { id } = req.query;


  // =====================================================
  // GET ONE SERVICE
  // =====================================================

  if (req.method === "GET") {

    try {

      const service = await getServiceById(id);

      if (!service) {

        return res.status(404).json({
          message: "Service not found",
        });

      }

      return res.status(200).json(service);

    } catch (error) {

      console.error(
        "GET /api/services/[id] error:",
        error
      );

      return res.status(500).json({
        message: "Failed to get service",
        error: error.message,
      });

    }

  }


  // =====================================================
  // UPDATE SERVICE
  // =====================================================

  if (req.method === "PUT") {

    try {

      const service = await updateService(
        id,
        req.body
      );

      if (!service) {

        return res.status(404).json({
          message: "Service not found",
        });

      }

      return res.status(200).json(service);

    } catch (error) {

      console.error(
        "PUT /api/services/[id] error:",
        error
      );

      return res.status(500).json({
        message: "Failed to update service",
        error: error.message,
      });

    }

  }


  // =====================================================
  // DELETE SERVICE
  // =====================================================

  if (req.method === "DELETE") {

    try {

      const service = await deleteService(id);

      if (!service) {

        return res.status(404).json({
          message: "Service not found",
        });

      }

      return res.status(200).json({
        message: "Service deleted successfully",
        ServiceID: service.ServiceID,
      });

    } catch (error) {

      console.error(
        "DELETE /api/services/[id] error:",
        error
      );

      return res.status(500).json({
        message: "Failed to delete service",
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