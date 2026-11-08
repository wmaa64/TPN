import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useStateContext } from "../../context/StateContext";

const emptyForm = { COMP_CODE: "", COMP_NAME: "" };

const Companies = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { userInfo } = useStateContext();

  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const searchCompanies = async () => {
    const searchValue = search.trim();
    if (!searchValue) {
      setCompanies([]);
      setHasSearched(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/companies?search=${encodeURIComponent(searchValue)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to search companies.");
      setCompanies(Array.isArray(data.companies) ? data.companies : []);
      setHasSearched(true);
    } catch (searchError) {
      setCompanies([]);
      setHasSearched(true);
      setError(searchError.message || "Failed to search companies.");
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingCompany(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (company) => {
    setEditingCompany(company);
    setFormData({ COMP_CODE: String(company.COMP_CODE), COMP_NAME: company.COMP_NAME || "" });
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditingCompany(null);
    setFormData(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = formData.COMP_NAME.trim();
    const code = Number(formData.COMP_CODE);
    if (!editingCompany && (!Number.isInteger(code) || code < 0 || code > 999)) {
      window.alert(isRTL ? "أدخل كوداً صحيحاً من 0 إلى 999." : "Enter a whole number code from 0 to 999.");
      return;
    }
    if (!name) {
      window.alert(isRTL ? "أدخل اسم الشركة." : "Enter the company name.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(editingCompany ? `/api/companies/${editingCompany.COMP_CODE}` : "/api/companies", {
        method: editingCompany ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ COMP_CODE: code, COMP_NAME: name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save company.");

      setCompanies((current) => editingCompany
        ? current.map((item) => String(item.COMP_CODE) === String(data.COMP_CODE) ? data : item)
        : [...current, data].sort((a, b) => String(a.COMP_NAME).localeCompare(String(b.COMP_NAME))));
      setShowForm(false);
      setEditingCompany(null);
      setFormData(emptyForm);
    } catch (saveError) {
      window.alert(saveError.message || "Unable to save company.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCompany = async (company) => {
    const confirmed = window.confirm(isRTL
      ? `هل تريد حذف ${company.COMP_NAME}؟`
      : `Are you sure you want to delete ${company.COMP_NAME}?`);
    if (!confirmed) return;

    try {
      setError("");
      const response = await fetch(`/api/companies/${company.COMP_CODE}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete company.");
      setCompanies((current) => current.filter((item) => String(item.COMP_CODE) !== String(company.COMP_CODE)));
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete company.");
    }
  };

  return (
    <div className="subject-page" dir={isRTL ? "rtl" : "ltr"}>
      <div className="subject-header">
        <h1 className="subject-title">{isRTL ? "الشركات" : "Companies"}</h1>
        <button type="button" className="subject-add-button" onClick={openAddForm} disabled={userInfo?.RoleID === 11}>
          <span className="subject-add-icon">+</span>{isRTL ? "إضافة شركة" : "Add Company"}
        </button>
      </div>

      <div className="subject-toolbar">
        <div className="subject-search">
          <span className="subject-search-icon">🔍</span>
          <input
            type="text"
            value={search}
            placeholder={isRTL ? "ابحث باسم الشركة أو الكود..." : "Search by company name or code..."}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") searchCompanies(); }}
          />
          <button type="button" onClick={searchCompanies} disabled={loading}>
            {loading ? (isRTL ? "جارٍ البحث..." : "Searching...") : (isRTL ? "بحث" : "Search")}
          </button>
        </div>
        <div className="subject-count">
          {!hasSearched ? "" : loading ? (isRTL ? "جارٍ البحث..." : "Searching...")
            : (isRTL ? `${companies.length} شركة` : `${companies.length} compan${companies.length === 1 ? "y" : "ies"}`)}
        </div>
      </div>

      {error && <div className="subject-error" role="alert">{error}</div>}

      {loading ? (
        <div className="subject-loading">{isRTL ? "جارٍ البحث عن الشركات..." : "Searching companies..."}</div>
      ) : !hasSearched ? (
        <div className="subject-search-message">{isRTL ? "ابحث عن شركة لعرض النتائج." : "Search for a company to display results."}</div>
      ) : companies.length === 0 ? (
        <div className="subject-search-message">{isRTL ? "لم يتم العثور على شركات." : "No companies found."}</div>
      ) : (
        <div className="subject-table-wrapper">
          <table className="subject-table">
            <thead><tr>
              <th>{isRTL ? "الكود" : "Code"}</th>
              <th>{isRTL ? "اسم الشركة" : "Company Name"}</th>
              <th>{isRTL ? "الإجراءات" : "Actions"}</th>
            </tr></thead>
            <tbody>{companies.map((company) => (
              <tr key={company.COMP_CODE}>
                <td>{company.COMP_CODE}</td>
                <td><div className="subject-name">{company.COMP_NAME || "-"}</div></td>
                <td><div className="subject-actions">
                  <button type="button" className="subject-edit-button" onClick={() => openEditForm(company)}>{isRTL ? "تعديل" : "Edit"}</button>
                  <button type="button" className="subject-delete-button" onClick={() => deleteCompany(company)}>{isRTL ? "حذف" : "Delete"}</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {showForm && <div className="subject-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
        <div className="subject-modal">
          <div className="subject-modal-header">
            <div>
              <h2>{editingCompany ? (isRTL ? "تعديل الشركة" : "Edit Company") : (isRTL ? "إضافة شركة جديدة" : "Add New Company")}</h2>
              <p>{editingCompany ? (isRTL ? "تحديث اسم الشركة" : "Update the company name") : (isRTL ? "أدخل كود واسم الشركة" : "Enter the company code and name")}</p>
            </div>
            <button type="button" className="subject-close-button" onClick={closeForm} disabled={saving}>×</button>
          </div>
          <form className="subject-form" onSubmit={handleSubmit}>
            <div className="subject-form-grid">
              <div className="subject-form-group">
                <label htmlFor="COMP_CODE">{isRTL ? "كود الشركة *" : "Company Code *"}</label>
                <input id="COMP_CODE" name="COMP_CODE" type="number" min="0" max="999" step="1" value={formData.COMP_CODE} onChange={handleChange} disabled={Boolean(editingCompany) || saving} required />
              </div>
              <div className="subject-form-group">
                <label htmlFor="COMP_NAME">{isRTL ? "اسم الشركة *" : "Company Name *"}</label>
                <input id="COMP_NAME" name="COMP_NAME" type="text" maxLength="120" value={formData.COMP_NAME} onChange={handleChange} disabled={saving} required autoFocus />
              </div>
            </div>
            <div className="subject-form-actions">
              <button type="button" className="subject-cancel-button" onClick={closeForm} disabled={saving}>{isRTL ? "إلغاء" : "Cancel"}</button>
              <button type="submit" className="subject-save-button" disabled={saving}>
                {saving ? (isRTL ? "جارٍ الحفظ..." : "Saving...") : editingCompany ? (isRTL ? "تحديث الشركة" : "Update Company") : (isRTL ? "حفظ الشركة" : "Save Company")}
              </button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
};

export default Companies;
