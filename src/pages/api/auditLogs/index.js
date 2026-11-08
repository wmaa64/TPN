import {
  getAuditLogs,
  getAuditLogById,
} from "../../../../controllers/auditController";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const {
        id,
        fromDate,
        toDate,
        userID,
        module,
        action,
        search,
      } = req.query;

      // Get one audit log
      if (id) {
        const auditLog = await getAuditLogById(id);

        return res.status(200).json({
          auditLog,
        });
      }

      // Get audit logs
      const auditLogs = await getAuditLogs({
        fromDate: fromDate || null,
        toDate: toDate || null,
        userID: userID || null,
        module: module || null,
        action: action || null,
        search: search || null,
      });

      return res.status(200).json({
        auditLogs,
      });
    } catch (error) {
      console.error("GET /api/auditLogs error:", error);

      return res.status(500).json({
        message: error.message || "Failed to get audit logs",
      });
    }
  }

  res.setHeader("Allow", ["GET"]);

  return res.status(405).json({
    message: `Method ${req.method} not allowed`,
  });
}