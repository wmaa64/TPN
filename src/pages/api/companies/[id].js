import {
  deleteCompany,
  getCompanyByCode,
  updateCompany,
} from "../../../../controllers/companyController";

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === "GET") {
      const company = await getCompanyByCode(id);
      if (!company) return res.status(404).json({ message: "Company not found." });
      return res.status(200).json(company);
    }

    if (req.method === "PUT") {
      const company = await updateCompany(id, req.body || {});
      if (!company) return res.status(404).json({ message: "Company not found." });
      return res.status(200).json(company);
    }

    if (req.method === "DELETE") {
      const deleted = await deleteCompany(id);
      if (!deleted) return res.status(404).json({ message: "Company not found." });
      return res.status(200).json({ message: "Company deleted successfully.", COMP_CODE: deleted.COMP_CODE });
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error("Company API error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to process company request.",
    });
  }
}
