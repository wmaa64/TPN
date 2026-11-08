import { useState } from "react";
import { useTranslation } from "react-i18next";

// INITIAL FORM
const emptyForm = {
  UserID: "",
  Percentage: "",
  IsActive: true,
};

const DoctorRevenuePercentages = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [doctorRevenuePercentages, setDoctorRevenuePercentages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // DOCTORS
  const [doctors, setDoctors] = useState([]);

  // FORM / MODAL
  const [showForm, setShowForm] = useState(false);
  const [editingPercentage, setEditingPercentage] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // LOAD DOCTORS
  const loadDoctors = async () => {
    try {
      const response = await fetch("/api/users?roleID=2");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load doctors"
        );
      }

      setDoctors(data);

    } catch (error) {

      console.error("Load doctors error:", error);
      setError(error.message || "Failed to load doctors");

    }
  };

  // SEARCH DOCTOR REVENUE PERCENTAGES
  const searchDoctorRevenuePercentages = async () => {
    const searchValue = search.trim();

    if (!searchValue) {
      setDoctorRevenuePercentages([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/doctorRevenuePercentages?search=${encodeURIComponent(
          searchValue
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to search doctor revenue percentages"
        );
      }

      setDoctorRevenuePercentages(data);
      setHasSearched(true);

    } catch (error) {

      console.error(
        "Search doctor revenue percentages error:",
        error
      );

      setError(
        error.message ||
          "Failed to search doctor revenue percentages"
      );

    } finally {

      setLoading(false);

    }
  };

  // OPEN ADD FORM
  const handleAddPercentage = async () => {
    setEditingPercentage(null);
    setFormData({ ...emptyForm });

    setError("");

    await loadDoctors();

    setShowForm(true);
  };

  // OPEN EDIT FORM
  const handleEditPercentage = async (item) => {
    setEditingPercentage(item);

    setFormData({
      UserID: item.UserID || "",
      Percentage:
        item.Percentage !== null &&
        item.Percentage !== undefined
          ? item.Percentage
          : "",
      IsActive: item.IsActive ?? true,
    });

    setError("");

    await loadDoctors();

    setShowForm(true);
  };

  // CLOSE FORM
  const handleCloseForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingPercentage(null);
    setFormData({ ...emptyForm });
  };

  // HANDLE FORM INPUT
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // SAVE / UPDATE PERCENTAGE
  const handleSubmit = async (event) => {
    event.preventDefault();

    // BASIC VALIDATION
    if (!formData.UserID) {
      alert("Please select a doctor.");
      return;
    }

    if (
      formData.Percentage === "" ||
      formData.Percentage === null ||
      formData.Percentage === undefined
    ) {
      alert("Please enter the percentage.");
      return;
    }

    const percentage = Number(formData.Percentage);

    if (!Number.isFinite(percentage)) {
      alert("Please enter a valid percentage.");
      return;
    }

    if (percentage < 0 || percentage > 100) {
      alert("Percentage must be between 0 and 100.");
      return;
    }

    try {
      setSaving(true);

      const percentageData = {
        UserID: Number(formData.UserID),
        Percentage: percentage,
        IsActive: Boolean(formData.IsActive),
      };

      // UPDATE EXISTING PERCENTAGE
      if (editingPercentage) {
        const response = await fetch(
          `/api/doctorRevenuePercentages/${editingPercentage.DoctorRevenuePercentageID}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(percentageData),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to update doctor revenue percentage"
          );
        }

        // UPDATE CURRENT LIST
        setDoctorRevenuePercentages(
          (currentItems) =>
            currentItems.map((item) =>
              item.DoctorRevenuePercentageID ===
              data.DoctorRevenuePercentageID
                ? data
                : item
            )
        );

        // CLOSE FORM
        handleCloseForm();
      }

      // CREATE NEW PERCENTAGE
      else {
        const response = await fetch(
          "/api/doctorRevenuePercentages",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(percentageData),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to create doctor revenue percentage"
          );
        }

        // ADD NEW ITEM TO TOP OF LIST
        setDoctorRevenuePercentages(
          (currentItems) => [
            data,
            ...currentItems,
          ]
        );

        // CLOSE FORM
        handleCloseForm();
      }

    } catch (error) {

      console.error(
        "Error saving doctor revenue percentage:",
        error
      );

      alert(
        error.message ||
          "Unable to save doctor revenue percentage."
      );

    } finally {

      setSaving(false);

    }
  };

  // DELETE PERCENTAGE
  const handleDeletePercentage = async (item) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the revenue percentage for ${item.DoctorName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/doctorRevenuePercentages/${item.DoctorRevenuePercentageID}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete doctor revenue percentage"
        );
      }

      // REMOVE FROM CURRENT LIST
      setDoctorRevenuePercentages(
        (currentItems) =>
          currentItems.filter(
            (currentItem) =>
              currentItem.DoctorRevenuePercentageID !==
              item.DoctorRevenuePercentageID
          )
      );

    } catch (error) {

      console.error(
        "Error deleting doctor revenue percentage:",
        error
      );

      alert(
        error.message ||
          "Unable to delete doctor revenue percentage."
      );

    }
  };

  // FILTER RESULTS
  const filteredDoctorRevenuePercentages =
    doctorRevenuePercentages.filter((item) => {
      const searchText = search.toLowerCase().trim();

      // Show everything if search is empty
      if (!searchText) {
        return true;
      }

      return (
        String(
          item.DoctorRevenuePercentageID
        )
          .toLowerCase()
          .includes(searchText) ||

        String(item.UserID)
          .toLowerCase()
          .includes(searchText) ||

        (item.DoctorName || "")
          .toLowerCase()
          .includes(searchText)
      );
    });

  return (
    <div className="subject-page">

      {/* PAGE HEADER ================================================== */}
      <div className="subject-header">

        <h1 className="subject-title">
          {isRTL ? "نسبة إيرادات الأطباء" : "Doctor Revenue Percentages"}
        </h1>

        <button
          type="button"
          className="subject-add-button"
          onClick={handleAddPercentage}
        >
          <span className="subject-add-icon">
            +
          </span>

          {isRTL ? "إضافة نسبة إيرادات طبيب" : "Add Doctor Percentage"}

        </button>

      </div>


      {/* SEARCH BAR ================================================== */}
      <div className="subject-toolbar">

        <div className="subject-search">

          <span className="subject-search-icon">
            🔍
          </span>

          <input
            type="text"
            value={search}
            placeholder={isRTL ? "بحث عن طبيب..." : "Search by doctor name..."}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                searchDoctorRevenuePercentages();
              }
            }}
          />

          <button
            type="button"
            onClick={
              searchDoctorRevenuePercentages
            }
            disabled={loading}
          >
            {loading
              ? isRTL ? "جاري البحث..." : "Searching..."
              : isRTL ? "بحث" : "Search"}
          </button>

        </div>

        <div className="subject-count">

          {!hasSearched
            ? ""
            : loading
            ? "Searching..."
            : `${filteredDoctorRevenuePercentages.length} doctor${
                filteredDoctorRevenuePercentages.length === 1
                  ? ""
                  : "s"
              }`
          }

        </div>

      </div>


      {/* ERROR ================================================== */}
      {error && (
        <div className="subject-error">
          {error}
        </div>
      )}


      {/* RESULTS ================================================== */}
      {loading ? (

        <div className="subject-loading">
          {isRTL ? "جاري البحث..." : "Searching doctor revenue percentages..."}
        </div>

      ) : !hasSearched ? (

        <div className="subject-search-message">
          {isRTL ? "ابحث عن طبيب لعرض النتائج." : "Search for a doctor to display results."}
        </div>

      ) : filteredDoctorRevenuePercentages.length === 0 ? (

        <div className="subject-search-message">
          {isRTL ? "لم يتم العثور على نسب إيرادات أطباء." : "No doctor revenue percentages found."}
        </div>

      ) : (

        <div className="subject-table-wrapper">

          <table className="subject-table">

            <thead>

              <tr>
                <th>{isRTL ? "المعرف" : "ID"}</th>
                <th>{isRTL ? "الدكتور" : "Doctor"}</th>
                <th>{isRTL ? "النسبة" : "Percentage"}</th>
                <th>{isRTL ? "الحالة" : "Status"}</th>
                <th>{isRTL ? "الإجراءات" : "Actions"}</th>
              </tr>

            </thead>

            <tbody>

              {filteredDoctorRevenuePercentages.map(
                (item) => (

                  <tr
                    key={
                      item.DoctorRevenuePercentageID
                    }
                  >

                    <td>
                      {
                        item.DoctorRevenuePercentageID
                      }
                    </td>

                    <td>

                      <div className="subject-name">
                        {item.DoctorName || "-"}
                      </div>

                    </td>

                    <td>
                      {Number(
                        item.Percentage
                      ).toFixed(2)}
                      %
                    </td>

                    <td>
                      {item.IsActive
                        ? isRTL ? "نشطة" : "Active"
                        : isRTL ? "غير نشطة" : "Inactive"
                      }
                    </td>

                    <td>

                      <div className="subject-actions">

                        <button
                          type="button"
                          className="subject-edit-button"
                          onClick={() =>
                            handleEditPercentage(
                              item
                            )
                          }
                        >
                          {isRTL ? "تعديل" : "Edit"}
                        </button>

                        <button
                          type="button"
                          className="subject-delete-button"
                          onClick={() =>
                            handleDeletePercentage(
                              item
                            )
                          }
                        >
                          {isRTL ? "حذف" : "Delete"}
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}


      {/* ==================================================
          ADD / EDIT MODAL
      ================================================== */}
      {showForm && (

        <div
          className="subject-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseForm();
            }
          }}
        >

          <div className="subject-modal">

            {/* MODAL HEADER */}
            <div className="subject-modal-header">

              <div>

                <h2>
                  {editingPercentage
                    ? isRTL ? "تعديل نسبة إيرادات طبيب" : "Edit Doctor Revenue Percentage"
                    : isRTL ? "إضافة نسبة إيرادات طبيب" : "Add Doctor Revenue Percentage"
                  }
                </h2>

                <p>
                  {editingPercentage
                    ? isRTL ? "تحديث نسبة إيرادات الطبيب" : "Update doctor revenue percentage"
                    : isRTL ? "إدخال نسبة إيرادات الطبيب" : "Enter doctor revenue percentage"
                  }
                </p>

              </div>

              <button
                type="button"
                className="subject-close-button"
                onClick={handleCloseForm}
                disabled={saving}
              >
                ×
              </button>

            </div>


            {/* FORM ========================================== */}
            <form
              className="subject-form"
              onSubmit={handleSubmit}
            >

              <div className="subject-form-grid">

                {/* DOCTOR -------------------------------------- */}
                <div className="subject-form-group subject-full-width">

                  <label>
                    {isRTL ? "الدكتور *" : "Doctor *"}
                  </label>

                  <select
                    name="UserID"
                    value={formData.UserID}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      {isRTL ? "اختر الدكتور" : "Select doctor"}
                    </option>

                    {doctors.map((doctor) => (

                      <option
                        key={doctor.UserID}
                        value={doctor.UserID}
                      >
                        {doctor.FullName ||
                          doctor.UserName}
                      </option>

                    ))}

                  </select>

                </div>


                {/* PERCENTAGE -------------------------------------- */}
                <div className="subject-form-group">

                  <label>
                    {isRTL ? "النسبة %" : "Percentage *"}
                  </label>

                  <input
                    type="number"
                    name="Percentage"
                    value={formData.Percentage}
                    onChange={handleChange}
                    placeholder={isRTL ? "أدخل النسبة" : "Enter percentage"}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />

                </div>


                {/* ACTIVE STATUS -------------------------------------- */}
                <div className="subject-form-group">

                  <label>
                    {isRTL ? "الحالة" : "Status"}
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >

                    <input
                      type="checkbox"
                      name="IsActive"
                      checked={
                        formData.IsActive
                      }
                      onChange={handleChange}
                    />

                    {isRTL ? "نشطة" : "Active"}

                  </label>

                </div>

              </div>


              {/* FORM BUTTONS */}
              <div className="subject-form-actions">

                <button
                  type="button"
                  className="subject-cancel-button"
                  onClick={handleCloseForm}
                  disabled={saving}
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>

                <button
                  type="submit"
                  className="subject-save-button"
                  disabled={saving}
                >
                  {saving
                    ? isRTL ? "جاري الحفظ..." : "Saving..."
                    : editingPercentage
                    ? isRTL ? "تحديث النسبة" : "Update Percentage"
                    : isRTL ? "حفظ النسبة" : "Save Percentage"
                  }
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default DoctorRevenuePercentages;