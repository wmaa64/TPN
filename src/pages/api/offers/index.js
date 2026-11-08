import {
  getOffers,
  getOfferCategories,
  createOffer,
} from "../../../../controllers/offerController";


// =====================================================
// API
// /api/offers
// =====================================================

export default async function handler(req, res) {

  // ===================================================
  // GET
  // ===================================================

  if (req.method === "GET") {

    try {

      const { activeOnly, categories } = req.query;

      if (categories === "true") {
        return res.status(200).json(await getOfferCategories());
      }

      const onlyActive =
        activeOnly === "true";

      const offers = await getOffers(onlyActive);
      return res.status(200).json(offers);

    } catch (error) {

      console.error(
        "GET offers error:",
        error
      );


      return res.status(500).json({
        message:
          error.message ||
          "Failed to load offers",
      });

    }

  }


  // ===================================================
  // POST
  // ===================================================

  if (req.method === "POST") {

    try {

      const {
        OfferName,
        GivenQuantity,
        ForPrice,
        CategoryID,
        IsActive,
        Notes,
      } = req.body;


      const offer =   await createOffer({
          OfferName,
          GivenQuantity,
          ForPrice,
          CategoryID,
          IsActive,
          Notes,
        });


      return res.status(201).json( offer );

    } catch (error) {

      console.error(
        "POST offer error:",
        error
      );


      const isValidationError = /required|greater than zero|Invalid|not found|inactive/i.test(error.message || "");
      return res.status(isValidationError ? 400 : 500).json({
        message:
          error.message ||
          "Failed to create offer",
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