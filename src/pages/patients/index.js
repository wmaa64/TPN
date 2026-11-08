import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStateContext } from "../../../context/StateContext";

// INITIAL FORMS
const emptyForm = {
  FullName: "",
  Phone: "",
  Age: "",
  Address: "",
  Notes: "",
  NationalID: "",
};

const frmCouponEmpty = {
  CouponID: null,
  CouponNo: "",
  PatientID: null,
  Amount: "",
  FromDate: "",
  ToDate: "",
  Status: "Valid",
  Notes: "",
};

// PATIENTS PAGE
const  Patients = ()=> {

    const {i18n} = useTranslation();
    
    const isRTL = i18n.language === "ar"; // true if Arabic

    const { userInfo } = useStateContext();

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    
    // FORM / MODAL
    const [showForm, setShowForm] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    // COUPON / MODAL
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [couponPatient, setCouponPatient] = useState(null);
    const [frmCoupon, setFrmCoupon] = useState(frmCouponEmpty);
    const [couponSaving, setCouponSaving] = useState(false);

    const searchPatients = async () => {
        const searchValue = search.trim();

        if (!searchValue) { 
            setPatients([]);
            setHasSearched(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/patients?search=${encodeURIComponent(searchValue)}` );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to search patients"
                );
            }

            setPatients(data);
            setHasSearched(true);

        } catch (error) {

            console.error("Search patients error:", error);
            alert(error.message || "Failed to search patients");

        } finally {

            setLoading(false);
        }
    };

    // OPEN ADD PATIENT FORM
    const handleAddPatient = () => {
        setEditingPatient(null);
        setFormData({ ...emptyForm, });
        setShowForm(true);
    };

    
    // OPEN COUPON FORM
    const handlePatientCoupon = (patient) => {
    setCouponPatient(patient);

    setFrmCoupon({...frmCouponEmpty,  PatientID: patient.PatientID,  Status: "Valid", });

    setShowCouponForm(true);
    };

    // CLOSE COUPON FORM
    const handleCloseCouponForm = () => {
        if (couponSaving) { return; }

        setShowCouponForm(false);
        setCouponPatient(null);
        setFrmCoupon({...frmCouponEmpty, });
    };

    // COUPON FORM INPUT
    const handleCouponChange = (event) => {
        const { name, value } = event.target;

        setFrmCoupon((current) => ({...current, [name]: value, }));
    };

    // SAVE COUPON
    const handleCouponSubmit = async (event) => {
        event.preventDefault();

        if (!frmCoupon.PatientID) {alert("Patient information is missing.");
            return;
        }

        if (![100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].includes(Number(frmCoupon.Amount))) {
            alert("Please select a coupon amount.");
            return;
        }

        if (!frmCoupon.FromDate) {alert("Please select the From Date.");
            return;
        }

        if (!frmCoupon.ToDate) {alert("Please select the To Date.");
            return;
        }

        if (frmCoupon.FromDate > frmCoupon.ToDate) {alert("To Date cannot be earlier than From Date.");
            return;
        }

        try {
            setCouponSaving(true);

            const response = await fetch("/api/coupons", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                    patientID: Number(frmCoupon.PatientID),
                    amount: Number(frmCoupon.Amount),
                    fromDate: frmCoupon.FromDate,
                    toDate: frmCoupon.ToDate,
                    notes: frmCoupon.Notes || "",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create coupon." );
            }

            alert(`Coupon ${data.CouponNo} created successfully.`    );

            handleCloseCouponForm();

        } catch (error) {
            console.error("Create coupon error:", error);

            alert(error.message || "Unable to create coupon.");

        } finally {
            setCouponSaving(false);
        }
    };


    // OPEN EDIT PATIENT FORM
    const handleEditPatient = (patient) => {

        setEditingPatient(patient);
        setFormData({
            FullName:  patient.FullName || "",
            Phone:  patient.Phone || "",
            Age:  patient.Age ?? "",
            Address:   patient.Address || "",
            Notes:   patient.Notes || "",
            NationalID:  patient.NationalID || "",
        });
        setShowForm(true);

    };

    // CLOSE FORM
    const handleCloseForm = () => {

        if (saving) {return;}
        setShowForm(false);
        setEditingPatient(null);
        setFormData({...emptyForm,});

    };

    // HANDLE FORM INPUT
    const handleChange = (event) => {
        const { name,  value,  } = event.target;
        setFormData((current) => ({...current, [name]: value,}));
    };

    // SAVE / UPDATE PATIENT
    const handleSubmit = async (event) => {
        event.preventDefault();

        // BASIC VALIDATION
        if (!formData.FullName || !formData.FullName.trim() ) {
            alert( "Please enter the patient name."  );
            return;
        }

        try {
            setSaving(true);

            // UPDATE EXISTING PATIENT
            if (editingPatient) {
                const response = await fetch(`/api/patients/${editingPatient.PatientID}`,
                {
                    method: "PUT",
                    headers: {
                    "Content-Type":
                        "application/json",
                    },

                    body: JSON.stringify(
                        {...formData, Age: formData.Age === ""  ? 0 : Number(formData.Age),}),

                });

                const data =  await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to update patient");
                }

                // UPDATE PATIENT IN CURRENT LIST
                setPatients( (currentPatients) =>
                    currentPatients.map((patient) => patient.PatientID === data.PatientID ? 
                        data : patient )
                );

                // CLOSE FORM
                handleCloseForm();
            }

            // CREATE NEW PATIENT
            else {

                const response = await fetch("/api/patients",
                {
                    method: "POST",
                    headers: {
                    "Content-Type":
                        "application/json",
                    },

                    body: JSON.stringify({...formData, Age: formData.Age === ""  ? 
                        0 : Number(formData.Age),
                    }),

                });

                const data =  await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to create patient");
                }

                // ADD NEW PATIENT TO TOP OF LIST
                setPatients( (currentPatients) => [ data,  ...currentPatients,  ] );

                // CLOSE FORM
                handleCloseForm();

            }

        } catch (error) {

            console.error("Error saving patient:",error);
            alert(  error.message ||  "Unable to save patient."  );

        } finally {

            setSaving(false);

        }

    };

    // DELETE PATIENT
    const handleDeletePatient = async (patient) => {
        const confirmed =  window.confirm(`Are you sure you want to delete ${patient.FullName}?` );

        if (!confirmed) {return; }

        try {
            const response = await fetch(`/api/patients/${patient.PatientID}`,
                {
                    method: "DELETE",
                }
            );

            const data =   await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete patient");
            }

            // REMOVE FROM CURRENT LIST ------------------------------------------------------
            setPatients( (currentPatients) =>
                currentPatients.filter( (item) =>  item.PatientID !==   patient.PatientID )
            );

        } catch (error) {

            console.error("Error deleting patient:",error);
            alert( error.message ||  "Unable to delete patient." );
        }

    };

    // SEARCH PATIENTS
    const filteredPatients =  patients.filter( (patient) => {
        const searchText =  search.toLowerCase().trim();

        // Show everything if search is empty
        if (!searchText) { return true;}

        return (String(patient.PatientID).toLowerCase().includes(searchText)
          || ( patient.FullName ||  ""  ).toLowerCase().includes(searchText)
          || ( patient.Phone ||  "" ).toLowerCase().includes(searchText)
          || ( patient.FileNo ||  ""  ).toLowerCase().includes(searchText)
          || ( patient.NationalID ||  ""  ).toLowerCase().includes(searchText)
        );

      }
    );

  return (

      <div className="subject-page">

        {/* PAGE HEADER ================================================== */}
        <div className="subject-header">

            <h1 className="subject-title">
              {isRTL ? "المرضى" : "Patients"}
            </h1>

            <button
                type="button"
                className="subject-add-button"
                onClick={handleAddPatient}
                disabled={userInfo?.RoleID === 11}
            >
                <span className="subject-add-icon">+</span>

                {isRTL ? "إضافة مريض" : "Add Patient"}

            </button>

        </div>


        {/* SEARCH BAR ================================================== */}
        <div className="subject-toolbar">

          <div className="subject-search">

            <span className="subject-search-icon">🔍</span>

            <input
              type="text"
              value={search}
              placeholder={isRTL ? "بحث بالاسم، الهاتف، رقم الملف أو الهوية الوطنية..." : 
                            "Search by name, phone, file number or national ID..."}
              onChange={(event) => setSearch(event.target.value ) }
              onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        searchPatients();
                    }
                    }}
            />

            <button
                type="button"
                onClick={searchPatients}
                disabled={loading}
            >
                {loading ? (isRTL ? "جاري البحث..." : "Searching...") : (isRTL ? "بحث" : "Search")}
            </button>
            
          </div>

          <div className="subject-count">

            {!hasSearched ? ""  : loading ? (isRTL ? "جاري البحث..." : "Searching...") : 
                (isRTL ? `${patients.length} مريض` : `${patients.length} patient${patients.length === 1 ? "" : "s"}`)
            }

          </div>


        </div>


        {/* ERROR ================================================== */}
        {error && (
          <div className="subject-error">{error}</div>
        )}


        {/* PATIENTS RESULTS ================================================== */}
        {loading ? (
            <div className="subject-loading">
                {isRTL ? "جاري البحث..." : "Searching patients..."}
            </div>

            ) : !hasSearched ? (

                <div className="subject-search-message">
                    {isRTL ? "ابحث عن مريض لعرض النتائج." : "Search for a patient to display results."}
                </div>

                ) : patients.length === 0 ? (

                <div className="subject-search-message">
                    {isRTL ? "لم يتم العثور على مرضى." : "No patients found."}
                </div>

                ) : (

                <div className="subject-table-wrapper">

                    <table className="subject-table">
                        <thead>
                            <tr>
                                <th>{isRTL ? "المعرف" : "ID"}</th>
                                <th>{isRTL ? "رقم الملف" : "File No."}</th>
                                <th>{isRTL ? "اسم المريض" : "Patient Name"}</th>
                                <th>{isRTL ? "الهاتف" : "Phone"}</th>
                                <th>{isRTL ? "العمر" : "Age"}</th>
                                <th>{isRTL ? "الهوية الوطنية" : "National ID"}</th>
                                <th>{isRTL ? "تم الإنشاء" : "Created"}</th>
                                <th>{isRTL ? "الإجراءات" : "Actions"}</th>
                            </tr>

                        </thead>

                        <tbody>
                            {patients.map( (patient) => (
                                <tr  key={patient.PatientID} >
                                    <td>{patient.PatientID}</td>
                                    <td>{patient.FileNo || "-"}</td>
                                    <td>
                                        <div className="subject-name">
                                            {patient.FullName || "-"}
                                        </div>
                                    </td>
                                    <td>{patient.Phone || "-"}</td>
                                    <td>{patient.Age ?? "-"}</td>
                                    <td>{patient.NationalID || "-"}</td>
                                    <td>{patient.CreatedAt  ? new Date(patient.CreatedAt).toLocaleDateString() : "-"}</td>
                                    <td>
                                        <div className="subject-actions">
                                            <button
                                                type="button"
                                                className="subject-coupon-button"
                                                onClick={() => handlePatientCoupon(patient)}
                                            >
                                                {isRTL ? "كوبون" : "Coupon"}
                                            </button>

                                            <button
                                                type="button"
                                                className="subject-edit-button"
                                                onClick={() => handleEditPatient(patient)}
                                            >
                                                {isRTL ? "تعديل" : "Edit"}
                                            </button>

                                            <button
                                                type="button"
                                                className="subject-delete-button"
                                                onClick={() => handleDeletePatient(patient)}
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
          <div  className="subject-modal-overlay"
            onMouseDown={(event) => {if (event.target ===  event.currentTarget) {handleCloseForm();} }}
          >
            <div className="subject-modal">

                {/* MODAL HEADER */}
                <div className="subject-modal-header">
                    <div>
                        <h2>{editingPatient ? (isRTL ? "تعديل المريض" : "Edit Patient") : 
                                              (isRTL ? "إضافة مريض جديد" : "Add New Patient")}</h2>
                        <p>{editingPatient  ? (isRTL ? "تحديث معلومات المريض" : "Update patient information")  : 
                                              (isRTL ? "إدخال معلومات المريض" : "Enter patient information")}</p>
                    </div>

                    <button  type="button"  className="subject-close-button" 
                        onClick={handleCloseForm} disabled={saving}>×</button>
                </div>

                {/* FORM ========================================== */}
                <form  className="subject-form"   onSubmit={handleSubmit}  >

                    <div className="subject-form-grid">

                        {/* FULL NAME  -------------------------------------- */}
                        <div className="subject-form-group subject-full-width">

                            <label>{isRTL ? "الاسم الكامل" : "Full Name *"}</label>
                            <input  type="text"  name="FullName"  value={formData.FullName}
                                onChange={handleChange}
                                placeholder="Enter patient full name"  required
                            />

                        </div>

                        {/* PHONE -------------------------------------- */}
                        <div className="subject-form-group">

                            <label>{isRTL ? "الهاتف" : "Phone"}</label>
                            <input  type="text"  name="Phone"   value={formData.Phone}
                                onChange={handleChange}
                                placeholder="Phone number"
                            />

                        </div>

                        {/* AGE -------------------------------------- */}
                        <div className="subject-form-group">

                            <label>{isRTL ? "العمر" : "Age"}</label>
                            <input  type="number"   name="Age"   value={formData.Age}
                                onChange={handleChange}
                                placeholder="Age"   min="0"
                            />

                        </div>

                        {/* NATIONAL ID  -------------------------------------- */}
                        <div className="subject-form-group">

                            <label>{isRTL ? "الهوية الوطنية" : "National ID"}</label>
                            <input type="text"  name="NationalID"   value={formData.NationalID }
                                onChange={handleChange }
                                placeholder="National ID"
                            />

                        </div>

                        {/* ADDRESS  -------------------------------------- */}
                        <div className="subject-form-group subject-full-width">

                            <label>{isRTL ? "العنوان" : "Address"}</label>
                            <input  type="text" name="Address" value={formData.Address}
                                onChange={handleChange}
                                placeholder="Patient address"
                            />

                        </div>

                        {/* NOTES  -------------------------------------- */}
                        <div className="subject-form-group subject-full-width">

                            <label>{isRTL ? "الملاحظات" : "Notes"}</label>
                            <textarea name="Notes" value={formData.Notes}
                                onChange={handleChange}
                                placeholder="Additional notes" rows="4"
                            />

                        </div>

                    </div>

                    {/* ========================================
                        FORM BUTTONS
                    ======================================== */}

                    <div className="subject-form-actions">

                        <button type="button" className="subject-cancel-button"
                            onClick={handleCloseForm} disabled={saving}
                        >
                            {isRTL ? "إلغاء" : "Cancel"}
                        </button>

                        <button type="submit" className="subject-save-button" disabled={saving}>
                            {saving ? (isRTL ? "جارٍ الحفظ..." : "Saving...") : 
                                        editingPatient ? (isRTL ? "تحديث المريض" : "Update Patient") : 
                                            (isRTL ? "حفظ المريض" : "Save Patient")}
                        </button>

                    </div>

                </form>

            </div>

          </div>

        )}

        {/* ==================================================
            COUPON MODAL
        ================================================== */}

        {showCouponForm && (
        <div
            className="subject-modal-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    handleCloseCouponForm();
                }
            }}
        >
            <div className="subject-modal">

            {/* ==========================================
                MODAL HEADER
            ========================================== */}

            <div className="subject-modal-header">

                <div>
                    <h2>{isRTL ? "إضافة قسيمة" : "Add Coupon"}</h2>
                    <p>{isRTL ? "إنشاء قسيمة للمريض المحدد" : "Create a coupon for the selected patient"}</p>
                </div>

                <button   type="button"    className="patients-close-button"
                    onClick={handleCloseCouponForm}
                    disabled={couponSaving}
                >
                ×
                </button>
            </div>

            {/* ==========================================
                PATIENT INFORMATION
            ========================================== */}

            {couponPatient && (
                <div className="coupon-patient-info">
                    <div>
                        <span>{isRTL ? "المريض" : "Patient"}</span>
                        <strong>{couponPatient.FullName || "-"}</strong>
                    </div>

                    <div>
                        <span>{isRTL ? "رقم الملف" : "File No."}</span>
                        <strong>{couponPatient.FileNo || "-"}</strong>
                    </div>

                    <div>
                        <span>{isRTL ? "رقم المريض" : "Patient ID"}</span>
                        <strong>{couponPatient.PatientID}</strong>
                    </div>
                </div>
            )}


            {/* ==========================================
                COUPON FORM
            ========================================== */}

            <form   className="subject-form"    onSubmit={handleCouponSubmit} >

                <div className="subject-form-grid">

                {/* --------------------------------------
                    AMOUNT
                -------------------------------------- */}

                <div className="subject-form-group">

                    <label>{isRTL ? "مبلغ القسيمة" : "Coupon Amount *"}</label>

                    <select   name="Amount"   value={frmCoupon.Amount}
                        onChange={handleCouponChange}   required    disabled={couponSaving}
                    >

                        <option value="">{isRTL ? "اختر المبلغ" : "Select Amount"}</option>

                        {Array.from({ length: 10 }, (_, index) => {
                            const amount = (index + 1) * 100;

                            return (
                                <option key={amount} value={amount}>
                                    {amount}
                                </option>
                            );
                        })}

                    </select>

                </div>


                {/* --------------------------------------
                    STATUS
                -------------------------------------- */}

                <div className="subject-form-group">
                    <label>{isRTL ? "الحالة" : "Status"}</label>
                    <input   type="text"    value="Valid"      disabled     />
                </div>

                {/* --------------------------------------
                    FROM DATE
                -------------------------------------- */}

                <div className="subject-form-group">

                    <label>{isRTL ? "من التاريخ" : "From Date *"}</label>
                    <input  type="date" name="FromDate"  value={frmCoupon.FromDate}
                        onChange={handleCouponChange}
                        required  disabled={couponSaving}
                    />

                </div>


                {/* --------------------------------------
                    TO DATE
                -------------------------------------- */}

                <div className="subject-form-group">

                    <label>{isRTL ? "إلى التاريخ" : "To Date *"}</label>
                    <input   type="date"   name="ToDate"    value={frmCoupon.ToDate}
                        onChange={handleCouponChange}
                        required    disabled={couponSaving}
                    />

                </div>


                {/* --------------------------------------
                    NOTES
                -------------------------------------- */}

                <div className="subject-form-group patients-full-width">

                    <label>{isRTL ? "الملاحظات" : "Notes"}</label>
                    <textarea   name="Notes"   value={frmCoupon.Notes}
                        onChange={handleCouponChange}     placeholder="Optional notes"
                        rows="4"     maxLength="500"   disabled={couponSaving}
                    />

                </div>

                </div>


                {/* ========================================
                    FORM BUTTONS
                ======================================== */}

                <div className="subject-form-actions">

                    <button   type="button"     className="subject-cancel-button"
                        onClick={handleCloseCouponForm}    disabled={couponSaving}
                    >
                        {isRTL ? "إلغاء" : "Cancel"}
                    </button>

                    <button   type="submit"    className="subject-save-button"
                        disabled={couponSaving}
                    >
                        {couponSaving  ? ( isRTL ? "جارٍ الحفظ..." : "Saving..." ) : 
                                         ( isRTL ? "حفظ القسيمة" : "Save Coupon" )}
                    </button>

                </div>

            </form>

            </div>

        </div>
        )}

      </div>

  );

}

export default Patients;