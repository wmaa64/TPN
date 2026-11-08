// pages/api/test-db.js
import connectDB from "../../../lib/db";

export default async function handler(req, res) {
  try {
    const conn = await connectDB();
    res.status(200).json({ status: "connected", host: conn.connection.host });
  } catch (error) {
    console.error("DB connection error:", error);
    res.status(500).json({ status: "failed", error: error.message });
  }
}
