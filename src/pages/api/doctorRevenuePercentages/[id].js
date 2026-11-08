import {
  getDoctorRevenuePercentageById,
  updateDoctorRevenuePercentage,
  deleteDoctorRevenuePercentage,
} from "../../../../controllers/doctorRevenuePercentageController";

export default async function handler(req, res) {
  const { id } = req.query;

  // ============================================================
  // GET ONE
  // ============================================================
  if (req.method === "GET") {
    try {
      const data =
        await getDoctorRevenuePercentageById(id);

      if (!data) {
        return res.status(404).json({
          message:
            "Doctor revenue percentage not found",
        });
      }

      return res.status(200).json(data);

    } catch (error) {

      console.error(
        "GET doctor revenue percentage error:",
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          "Failed to get doctor revenue percentage",
      });
    }
  }


  // ============================================================
  // PUT
  // ============================================================
  if (req.method === "PUT") {
    try {
      const {
        UserID,
        Percentage,
        IsActive,
      } = req.body;

      const data =
        await updateDoctorRevenuePercentage(
          id,
          {
            UserID,
            Percentage,
            IsActive,
          }
        );

      if (!data) {
        return res.status(404).json({
          message:
            "Doctor revenue percentage not found",
        });
      }

      return res.status(200).json(data);

    } catch (error) {

      console.error(
        "PUT doctor revenue percentage error:",
        error
      );

      return res.status(400).json({
        message:
          error.message ||
          "Failed to update doctor revenue percentage",
      });
    }
  }


  // ============================================================
  // DELETE
  // ============================================================
  if (req.method === "DELETE") {
    try {
      const data =
        await deleteDoctorRevenuePercentage(id);

      if (!data) {
        return res.status(404).json({
          message:
            "Doctor revenue percentage not found",
        });
      }

      return res.status(200).json(data);

    } catch (error) {

      console.error(
        "DELETE doctor revenue percentage error:",
        error
      );

      return res.status(400).json({
        message:
          error.message ||
          "Failed to delete doctor revenue percentage",
      });
    }
  }


  // ============================================================
  // METHOD NOT ALLOWED
  // ============================================================
  res.setHeader(
    "Allow",
    ["GET", "PUT", "DELETE"]
  );

  return res.status(405).json({
    message: `Method ${req.method} not allowed`,
  });
}