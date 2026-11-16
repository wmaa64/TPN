import {
  loginUser,
  recordUserLogin,
} from "../../../controllers/userController";


// =====================================================
// LOGIN API
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
      UserName,
      Password,
    } = req.body;


    // =================================================
    // VALIDATION
    // =================================================

    if (
      !UserName ||
      !UserName.trim()
    ) {

      return res.status(400).json({
        message: "Username is required",
      });

    }


    if (
      !Password ||
      !Password.trim()
    ) {

      return res.status(400).json({
        message: "Password is required",
      });

    }


    // =================================================
    // LOGIN
    // =================================================

    const user = await loginUser( UserName.trim(),  Password    );

    // =================================================
    // USER INACTIVE
    // =================================================

    if (
      user &&
      user.inactive
    ) {

      return res.status(403).json({
        message: "User account is inactive",
      });

    }


    // =================================================
    // INVALID LOGIN
    // =================================================

    if (!user) {

      return res.status(401).json({
        message: "Invalid username or password",
      });

    }


    // =================================================
    // RECORD SUCCESSFUL LOGIN
    // =================================================

    const IPAddress =  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress ||  null;

    const UserAgent = req.headers["user-agent"] || null;

    // Login is admitted only if the license has an available active-session slot.
    const loginHistory = await recordUserLogin(user.UserID, IPAddress, UserAgent);


    // =================================================
    // SUCCESS
    // =================================================

    return res.status(200).json({
      ...user,
      LoginHistoryID: loginHistory.LoginHistoryID,
      SessionExpiresAt: loginHistory.SessionExpiresAt,
    });

  }

  catch (error) {

    console.error(
      "POST /api/login error:",
      error
    );

    return res.status(error.statusCode || 500).json({
      message: error.message || "Login failed",
      code: error.code,
    });

  }

}

/*
import {  loginUser,} from "../../../controllers/userController";


// =====================================================
// LOGIN API
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
      UserName,
      Password,
    } = req.body;


    // =================================================
    // VALIDATION
    // =================================================

    if (
      !UserName ||
      !UserName.trim()
    ) {

      return res.status(400).json({
        message: "Username is required",
      });

    }


    if (
      !Password ||
      !Password.trim()
    ) {

      return res.status(400).json({
        message: "Password is required",
      });

    }


    // =================================================
    // LOGIN
    // =================================================

    const user = await loginUser(UserName.trim(), Password );


    // =================================================
    // USER INACTIVE
    // =================================================

    if (
      user &&
      user.inactive
    ) {

      return res.status(403).json({
        message: "User account is inactive",
      });

    }


    // =================================================
    // INVALID LOGIN
    // =================================================

    if (!user) {

      return res.status(401).json({
        message: "Invalid username or password",
      });

    }


    // =================================================
    // SUCCESS
    // =================================================

    return res.status(200).json(user);

  }

  catch (error) {

    console.error(
      "POST /api/login error:",
      error
    );

    return res.status(500).json({
      message: "Login failed",
      error: error.message,
    });

  }

}
  */
