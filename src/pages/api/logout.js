import { recordUserLogout } from "../../../controllers/userController";

// Best-effort endpoint: clients can always finish clearing local login state.
export default async function handler(req, res) {
  
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { LoginHistoryID, UserID } = req.body || {};

  if (!LoginHistoryID || !UserID) {
    return res.status(400).json({ message: "LoginHistoryID and UserID are required" });
  }

  try {
    const logoutHistory = await recordUserLogout(LoginHistoryID, UserID);

    return res.status(200).json({ success: Boolean(logoutHistory) });
    
  } catch (error) {
    console.error("POST /api/logout error:", error);
    return res.status(500).json({ message: "Failed to record logout" });
  }
}
