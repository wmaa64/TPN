import {
  consumeOfferSubscription,
} from "../../../../../controllers/offerSubscriptionControllerOld";


// =====================================================
// API
// /api/offerSubscriptions/[id]/usage
// =====================================================

export default async function handler(req, res) {

  const {
    id,
  } = req.query;


  // ===================================================
  // POST
  // ===================================================

  if (req.method === "POST") {

    try {

      const parsedSubscriptionID =
        Number(id);


      // -------------------------------------------------
      // VALIDATE SUBSCRIPTION ID
      // -------------------------------------------------

      if (
        !Number.isInteger(parsedSubscriptionID) ||
        parsedSubscriptionID <= 0
      ) {

        return res.status(400).json({
          message:
            "Invalid OfferSubscriptionID",
        });

      }


      // -------------------------------------------------
      // REQUEST BODY
      // -------------------------------------------------

      const {
        SessionID,
        PatientID,
        PulsesNo,
        Notes,
      } = req.body;


      // -------------------------------------------------
      // REQUIRED SESSION
      // -------------------------------------------------

      if (
        SessionID === undefined ||
        SessionID === null ||
        SessionID === ""
      ) {

        return res.status(400).json({
          message:
            "SessionID is required",
        });

      }


      // -------------------------------------------------
      // REQUIRED PATIENT
      // -------------------------------------------------

      if (
        PatientID === undefined ||
        PatientID === null ||
        PatientID === ""
      ) {

        return res.status(400).json({
          message:
            "PatientID is required",
        });

      }


      const parsedSessionID =
        Number(SessionID);

      const parsedPatientID =
        Number(PatientID);


      // -------------------------------------------------
      // VALIDATE SESSION
      // -------------------------------------------------

      if (
        !Number.isInteger(parsedSessionID) ||
        parsedSessionID <= 0
      ) {

        return res.status(400).json({
          message:
            "Invalid SessionID",
        });

      }


      // -------------------------------------------------
      // VALIDATE PATIENT
      // -------------------------------------------------

      if (
        !Number.isInteger(parsedPatientID) ||
        parsedPatientID <= 0
      ) {

        return res.status(400).json({
          message:
            "Invalid PatientID",
        });

      }


      // -------------------------------------------------
      // USE OFFER
      // -------------------------------------------------

      const result =
        await consumeOfferSubscription(
          parsedSubscriptionID,
          parsedSessionID,
          parsedPatientID,
          PulsesNo,
          Notes
        );


      return res.status(201).json(
        result
      );

    } catch (error) {

      console.error(
        "POST offer subscription usage error:",
        error
      );

      const message = error.message || "";
      const status = /not found/i.test(message)
        ? 404
        : /already used in this session|insufficient offer balance|offer subscription is/i.test(message)
          ? 409
          : /invalid|greater than zero/i.test(message)
            ? 400
            : 500;

      return res.status(status).json({
        message:
          message ||
          "Failed to use offer subscription",
      });

    }

  }


  // ===================================================
  // METHOD NOT ALLOWED
  // ===================================================

  res.setHeader(
    "Allow",
    ["POST"]
  );


  return res.status(405).json({
    message:
      `Method ${req.method} not allowed`,
  });

}
