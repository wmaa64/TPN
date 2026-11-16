import { getActiveUserLoginSession } from "../../../controllers/userController";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    const { UserID, LoginHistoryID } = req.body || {};
    const session = await getActiveUserLoginSession(LoginHistoryID, UserID);
    if (!session) return res.status(401).json({ active: false, message: "Session has expired or is no longer active." });
    return res.status(200).json({ active: true, SessionExpiresAt: session.SessionExpiresAt });
  } catch (error) {
    console.error("POST /api/session error:", error);
    return res.status(500).json({ active: false, message: "Unable to validate the login session." });
  }
}
