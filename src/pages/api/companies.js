import {
  createCompany,
  getCompanies,
  getSearchedCompanies,
} from "../../../controllers/companyController";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { search } = req.query;
      if (search !== undefined && !String(search).trim()) {
        return res.status(400).json({ message: "Search term is required." });
      }
      const companies = search
        ? await getSearchedCompanies(search)
        : await getCompanies();
      return res.status(200).json({ companies });
    } catch (error) {
      console.error("GET /api/companies error:", error);
      return res.status(error.statusCode || 500).json({
        message: error.message || "Failed to load companies.",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const company = await createCompany(req.body || {});
      return res.status(201).json(company);
    } catch (error) {
      console.error("POST /api/companies error:", error);
      return res.status(error.statusCode || 500).json({
        message: error.message || "Failed to create company.",
      });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
