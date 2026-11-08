import {
  getDailyPulseReading,
  createDailyPulseReading,
  updateDailyPulseReading,
  getDailyConsumedPulses,
  getDailyPulseDetails,
} from "../../../controllers/dailyPulseController";

export default async function handler(req, res) {

  try {

    // =====================================================
    // GET
    // =====================================================

    if (req.method === "GET") {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({
        message: "Date is required",
        });
    }

    const reading = await getDailyPulseReading(date);

    const consumedPulses = await getDailyConsumedPulses(date);

    const pulseDetails = await getDailyPulseDetails(date);

    const startingPulses =
        reading?.StartingPulses ?? null;

    const endingPulses =
        reading?.EndingPulses ?? null;

    const expectedEnding =
        startingPulses !== null
        ? startingPulses + consumedPulses
        : null;

    const difference =
        endingPulses !== null &&
        expectedEnding !== null
        ? endingPulses - expectedEnding
        : null;

    return res.status(200).json({
        PulseDate: date,

        StartingPulses: startingPulses,

        EndingPulses: endingPulses,

        ConsumedPulses: consumedPulses,

        ExpectedEnding: expectedEnding,

        Difference: difference,

        PulseDetails: pulseDetails,
    });
    }

    // =====================================================
    // POST
    // =====================================================

    if (req.method === "POST") {

      const {
        PulseDate,
        StartingPulses,
      } = req.body;

      if (!PulseDate) {
        return res.status(400).json({
          message: "PulseDate is required",
        });
      }

      const reading = await createDailyPulseReading(
        PulseDate,
        StartingPulses
      );

      return res.status(201).json(reading);
    }


    // =====================================================
    // PUT
    // =====================================================

    if (req.method === "PUT") {

      const {
        PulseDate,
        StartingPulses,
        EndingPulses,
      } = req.body;

      if (!PulseDate) {
        return res.status(400).json({
          message: "PulseDate is required",
        });
      }

      const reading = await updateDailyPulseReading(
        PulseDate,
        StartingPulses,
        EndingPulses
      );

      return res.status(200).json(reading);
    }


    // =====================================================
    // METHOD NOT ALLOWED
    // =====================================================

    res.setHeader(
      "Allow",
      ["GET", "POST", "PUT"]
    );

    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
    });

  }
  catch (error) {

    console.error(
      "Daily pulse API error:",
      error
    );

    return res.status(500).json({
      message: error.message || "Server error",
    });
  }
}