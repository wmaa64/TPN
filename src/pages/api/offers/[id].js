import {
  getOfferById,
  updateOffer,
} from "../../../../controllers/offerController";


// =====================================================
// API
// /api/offers/[id]
// =====================================================

export default async function handler(req, res) {

  const {
    id,
  } = req.query;


  const parsedID =
    Number(id);


  // ===================================================
  // VALIDATE ID
  // ===================================================

  if (
    !Number.isInteger(parsedID) ||
    parsedID <= 0
  ) {

    return res.status(400).json({
      message: "Invalid OfferID",
    });

  }


  // ===================================================
  // GET
  // ===================================================

  if (req.method === "GET") {

    try {

      const offer =
        await getOfferById( parsedID  );


      if (!offer) {

        return res.status(404).json({
          message:
            "Offer not found",
        });

      }


      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }

      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }

      return res.status(200).json(offer);

    } catch (error) {

      console.error(
        "GET offer error:",
        error
      );


      return res.status(500).json({
        message:
          error.message ||
          "Failed to load offer",
      });

    }

  }


  // ===================================================
  // PUT
  // ===================================================

  if (req.method === "PUT") {

    try {

      const {
        OfferName,
        GivenQuantity,
        ForPrice,
        CategoryID,
        IsActive,
        Notes,
      } = req.body;


      const offer =  await updateOffer( parsedID,
          {
            OfferName,
            GivenQuantity,
            ForPrice,
            CategoryID,
            IsActive,
            Notes,
          }
        );


      return res.status(200).json(
        offer
      );

    } catch (error) {

      console.error(
        "PUT offer error:",
        error
      );


      const isValidationError = /required|greater than zero|Invalid|not found|inactive/i.test(error.message || "");
      return res.status(isValidationError ? 400 : 500).json({
        message:
          error.message ||
          "Failed to update offer",
      });

    }

  }


  // ===================================================
  // METHOD NOT ALLOWED
  // ===================================================

  res.setHeader(
    "Allow",
    ["GET", "PUT"]
  );


  return res.status(405).json({
    message:
      `Method ${req.method} not allowed`,
  });

}