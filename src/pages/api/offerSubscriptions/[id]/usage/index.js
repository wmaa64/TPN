import {
  getOfferSubscriptionUsage,
} from "../../../../../../controllers/offerSubscriptionControllerOld";


// =====================================================
// GET OFFER SUBSCRIPTION USAGE
// =====================================================
//
// /api/offerSubscriptions/[id]/usage
//
// Returns every session in which this offer subscription
// was consumed.
//
// =====================================================

export default async function handler(req, res) {

  const {
    id,
  } = req.query;


  // ===================================================
  // GET
  // ===================================================

  if (req.method === "GET") {

    try {

      const parsedID =
        Number(id);


      // -------------------------------------------------
      // VALIDATE ID
      // -------------------------------------------------

      if (
        !Number.isInteger(parsedID) ||
        parsedID <= 0
      ) {

        return res.status(400).json({
          message:
            "Invalid OfferSubscriptionID",
        });

      }


      // -------------------------------------------------
      // DATABASE
      // -------------------------------------------------

      const result = await getOfferSubscriptionUsage( parsedID );

      return res.status(200).json(
        result.recordset
      );

    } catch (error) {

      console.error(
        "GET offer subscription usage error:",
        error
      );


      return res.status(500).json({
        message:
          error.message ||
          "Failed to load offer subscription usage",
      });

    }

  }


  // ===================================================
  // METHOD NOT ALLOWED
  // ===================================================

  res.setHeader(
    "Allow",
    ["GET"]
  );


  return res.status(405).json({
    message:
      `Method ${req.method} not allowed`,
  });

}