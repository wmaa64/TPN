import {
  getMoneySafeAccounts,
  getMoneySafeSummary,
  createMoneySafeTransaction,
} from "../../../../controllers/moneySafeController";


// =====================================================
// MONEY SAFE API
// =====================================================

export default async function handler(req, res) {

  // ===================================================
  // GET
  // ===================================================

  if (req.method === "GET") {

    try {

      const includeInactive =
        req.query.includeInactive === "true";

      const [ accounts, summary,  ] = await Promise.all([
        getMoneySafeAccounts(includeInactive),
        getMoneySafeSummary(),
      ]);

      return res.status(200).json({ accounts, summary,});

    } catch (error) {

      console.error(
        "GET /api/moneySafe error:",
        error
      );

      return res.status(500).json({
        message: "Failed to load money safe.",
        error: error.message,
      });

    }

  }


  // ===================================================
  // POST
  // ===================================================

  if (req.method === "POST") {

    try {

      const {
        accountID,
        transactionType,
        amount,
        referenceType,
        referenceID,
        description,
        userID,
      } = req.body;


      // ===============================================
      // VALIDATION
      // ===============================================

      if (!accountID) {

        return res.status(400).json({
          message: "Money safe account is required.",
        });

      }


      if (!transactionType) {

        return res.status(400).json({
          message: "Transaction type is required.",
        });

      }


      if (
        amount === undefined ||
        amount === null ||
        Number(amount) <= 0
      ) {

        return res.status(400).json({
          message: "Amount must be greater than zero.",
        });

      }


      // ===============================================
      // CREATE TRANSACTION
      // ===============================================

      const result =
        await createMoneySafeTransaction({

          accountID: Number(accountID),

          transactionType,

          amount: Number(amount),

          referenceType:
            referenceType || null,

          referenceID:
            referenceID
              ? Number(referenceID)
              : null,

          description:
            description
              ? description.trim()
              : null,

          userID:
            userID
              ? Number(userID)
              : null,
        });


      return res.status(201).json(result);

    } catch (error) {

      console.error(
        "POST /api/moneySafe error:",
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          "Failed to create money safe transaction.",
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
    message: `Method ${req.method} not allowed`,
  });

}