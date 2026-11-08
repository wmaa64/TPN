import {
  getMoneySafeTransactions,
} from "../../../../controllers/moneySafeController";


// =====================================================
// MONEY SAFE TRANSACTIONS API
// =====================================================

export default async function handler(req, res) {

  // ===================================================
  // ONLY GET
  // ===================================================

  if (req.method !== "GET") {

    res.setHeader(
      "Allow",
      ["GET"]
    );

    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
    });

  }


  try {

    const {
      accountID,
      fromDate,
      toDate,
      transactionType,
    } = req.query;


    // =================================================
    // GET TRANSACTIONS
    // =================================================

    const transactions =
      await getMoneySafeTransactions({

        accountID:
          accountID
            ? Number(accountID)
            : null,

        fromDate:
          fromDate || null,

        toDate:
          toDate || null,

        transactionType:
          transactionType || null,

      });


    return res.status(200).json(
      transactions
    );

  } catch (error) {

    console.error(
      "GET /api/moneySafe/transactions error:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Failed to load money safe transactions.",
    });

  }

}