import { getDoctorRevenue } from "../../../controllers/doctorRevenueController";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    const { doctorID, fromDate, toDate } = req.query;

    const report = await getDoctorRevenue(doctorID, fromDate, toDate);

    return res.status(200).json(report);

  } catch (error) {
    
    const isValidationError = /required|valid|cannot be after/i.test(error.message || "");
    
    return res.status(isValidationError ? 400 : 500).json({message: error.message || "Failed to load doctor revenue",});
  }
}
