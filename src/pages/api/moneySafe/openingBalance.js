import {
  setOpeningBalance,
} from "../../../../controllers/moneySafeController";


// =====================================================
// OPENING BALANCE API
// =====================================================

export default async function handler(req, res) {

  // ===================================================
  // ONLY POST
  // ===================================================

  if (req.method !== "POST") {

    res.setHeader(
      "Allow",
      ["POST"]
    );

    return res.status(405).json({
      message: `Method ${req.method} not allowed`,
    });

  }


  try {

    const {
      accountID,
      openingBalance,
      userID,
      notes,
    } = req.body;


    // =================================================
    // VALIDATION
    // =================================================

    if (!accountID) {

      return res.status(400).json({
        message: "Money safe account is required.",
      });

    }


    if (
      openingBalance === undefined ||
      openingBalance === null ||
      Number(openingBalance) < 0
    ) {

      return res.status(400).json({
        message: "Opening balance must be zero or greater.",
      });

    }


    // =================================================
    // SET OPENING BALANCE
    // =================================================

    const account =
      await setOpeningBalance(
        Number(accountID),
        Number(openingBalance),
        userID
          ? Number(userID)
          : null,
        notes
          ? notes.trim()
          : null
      );


    return res.status(200).json(account);

  } catch (error) {

    console.error(
      "POST /api/moneySafe/openingBalance error:",
      error
    );

    return res.status(400).json({
      message:
        error.message ||
        "Failed to set opening balance.",
    });

  }

}