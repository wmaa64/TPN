import { getDoctorPulses } from "../../../controllers/doctorPulsesController";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { doctorID, fromDate, toDate } = req.query;

      if (!doctorID) {
        return res.status(400).json({
          message: "DoctorID is required",
        });
      }

      if (!fromDate) {
        return res.status(400).json({
          message: "FromDate is required",
        });
      }

      if (!toDate) {
        return res.status(400).json({
          message: "ToDate is required",
        });
      }

      const doctorPulses = await getDoctorPulses(doctorID, fromDate, toDate );

      return res.status(200).json(doctorPulses);
    }

    res.setHeader("Allow", ["GET"]);

    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
    });
  } catch (error) {
    console.error("Doctor Pulses API error:", error);

    return res.status(500).json({
      message: error.message || "Server error",
    });
  }
}