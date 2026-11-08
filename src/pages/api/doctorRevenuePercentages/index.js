import {
  getDoctorRevenuePercentages,
  createDoctorRevenuePercentage,
} from "../../../../controllers/doctorRevenuePercentageController";

export default async function handler(req, res) {
  // ============================================================
  // GET
  // ============================================================
  if (req.method === "GET") {
    try {
      const { search } = req.query;

      const data = await getDoctorRevenuePercentages(search);

      return res.status(200).json(data);

    } catch (error) {

      console.error(
        "GET doctor revenue percentages error:",
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          "Failed to get doctor revenue percentages",
      });
    }
  }


  // ============================================================
  // POST
  // ============================================================
  if (req.method === "POST") {
    try {
      const {
        UserID,
        Percentage,
        IsActive,
      } = req.body;

      const data =
        await createDoctorRevenuePercentage({
          UserID,
          Percentage,
          IsActive,
        });

      return res.status(201).json(data);

    } catch (error) {

      console.error(
        "POST doctor revenue percentage error:",
        error
      );

      return res.status(400).json({
        message:
          error.message ||
          "Failed to create doctor revenue percentage",
      });
    }
  }


  // ============================================================
  // METHOD NOT ALLOWED
  // ============================================================
  res.setHeader(
    "Allow",
    ["GET", "POST"]
  );

  return res.status(405).json({
    message: `Method ${req.method} not allowed`,
  });
}