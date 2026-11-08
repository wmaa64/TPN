import {
  createOfferSubscription,
  getPatientOfferSubscriptions,
} from "../../../../controllers/offerSubscriptionControllerOld";


// =====================================================
// API
// /api/offerSubscriptions
// =====================================================

export default async function handler(req, res) {

  // ===================================================
  // GET
  // ===================================================

  if (req.method === "GET") {

    try {

      const {
        patientID,
        activeOnly,
      } = req.query;


      // -------------------------------------------------
      // VALIDATE PATIENT
      // -------------------------------------------------

      if (!patientID) {

        return res.status(400).json({
          message: "PatientID is required",
        });

      }


      const parsedPatientID =
        Number(patientID);


      if (
        !Number.isInteger(parsedPatientID) ||
        parsedPatientID <= 0
      ) {

        return res.status(400).json({
          message: "Invalid PatientID",
        });

      }


      // -------------------------------------------------
      // ACTIVE ONLY
      // -------------------------------------------------

      const onlyActive =
        activeOnly === "true";


      // -------------------------------------------------
      // GET SUBSCRIPTIONS
      // -------------------------------------------------

      const subscriptions =  await getPatientOfferSubscriptions( parsedPatientID, onlyActive );


      return res.status(200).json( subscriptions );

    } catch (error) {

      console.error(
        "GET offer subscriptions error:",
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          "Failed to load offer subscriptions",
      });

    }

  }


  // ===================================================
  // POST
  // ===================================================

  if (req.method === "POST") {

    try {

      const {
        PatientID,
        OfferID,
        SubscriptionDate,
        Notes,
      } = req.body;


      // -------------------------------------------------
      // VALIDATE PATIENT
      // -------------------------------------------------

      if (!PatientID) {

        return res.status(400).json({
          message: "PatientID is required",
        });

      }


      // -------------------------------------------------
      // VALIDATE OFFER
      // -------------------------------------------------

      if (!OfferID) {

        return res.status(400).json({
          message: "OfferID is required",
        });

      }


      const parsedPatientID =
        Number(PatientID);

      const parsedOfferID =
        Number(OfferID);


      if (
        !Number.isInteger(parsedPatientID) ||
        parsedPatientID <= 0
      ) {

        return res.status(400).json({
          message: "Invalid PatientID",
        });

      }


      if (
        !Number.isInteger(parsedOfferID) ||
        parsedOfferID <= 0
      ) {

        return res.status(400).json({
          message: "Invalid OfferID",
        });

      }


      // -------------------------------------------------
      // CREATE SUBSCRIPTION
      // -------------------------------------------------

      const subscription =  await createOfferSubscription({ 
            PatientID: parsedPatientID,

            OfferID: parsedOfferID,

            SubscriptionDate,

            Notes,
        });


      return res.status(201).json(
        subscription
      );

    } catch (error) {

      console.error(
        "POST offer subscription error:",
        error
      );

      const isDuplicateSubscription = /already has an active subscription/i.test(error.message || "");
      return res.status(isDuplicateSubscription ? 409 : 500).json({
        message:
          error.message ||
          "Failed to create offer subscription",
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
    message:
      `Method ${req.method} not allowed`,
  });

}