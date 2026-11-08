import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const firstDayOfMonth = () => `${today().slice(0, 7)}-01`;

const DoctorRevenue = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [doctors, setDoctors] = useState([]);
  const [doctorID, setDoctorID] = useState("");
  const [doctorRevenuePercentage, setDoctorRevenuePercentage] = useState(null);
  
  const [fromDate, setFromDate] = useState(firstDayOfMonth());
  const [toDate, setToDate] = useState(today());
  
  const [sessionServices, setSessionServices] = useState([]);
  const [offerUsage, setOfferUsage] = useState([]);
  
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load active doctors for the report filter.
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoadingDoctors(true);
        
        const response = await fetch("/api/users?roleId=2");

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load doctors");

        setDoctors(Array.isArray(data) ? data : []);

      } catch (error) {
        toast.error(error.message || "Failed to load doctors");
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, []);

  // Fetch both detail lists for the selected doctor and date range.
  const searchReport = async (event) => {
    event.preventDefault();
    if (!doctorID) return toast.error(isRTL ? "اختر طبيباً" : "Select a doctor");
    if (!fromDate || !toDate) return toast.error(isRTL ? "اختر الفترة" : "Select a date range");
    if (fromDate > toDate) return toast.error(isRTL ? "تاريخ البداية بعد تاريخ النهاية" : "From date cannot be after To date");

    try {
      setLoadingReport(true);
      
      const query = new URLSearchParams({ doctorID, fromDate, toDate });

      const response = await fetch(`/api/doctorRevenue?${query.toString()}`);

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || "Failed to load report");

      setSessionServices(Array.isArray(data.sessionServices) ? data.sessionServices : []);

      setOfferUsage(Array.isArray(data.offerUsage) ? data.offerUsage : []);
      
      setDoctorRevenuePercentage(data.doctorRevenuePercentage || null);

      setHasSearched(true);

    } catch (error) {
      toast.error(error.message || "Failed to load report");
      setSessionServices([]);
      setOfferUsage([]);
      setHasSearched(false);
    } finally {
      setLoadingReport(false);
    }
  };

  // Derive the totals from the exact detail rows shown below.
  const summary = useMemo(() => {
    const sessionTotal = sessionServices.reduce((sum, row) => sum + Number(row.LineTotal || 0), 0);
    const offerTotal = offerUsage.reduce((sum, row) => sum + Number(row.AttributedRevenue || 0), 0);

    return  { sessionTotal, offerTotal, combinedTotal: sessionTotal + offerTotal, 
              doctorRevenue: doctorRevenuePercentage ? 
              (sessionTotal + offerTotal) * (Number(doctorRevenuePercentage.Percentage || 0) / 100) : null 
            };

  }, [sessionServices, offerUsage, doctorRevenuePercentage]);

  const money = (value) => Number(value || 0).toLocaleString(isRTL ? "ar-EG" : "en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const date = (value) => value ? String(value).slice(0, 10) : "—";
  const text = (en, ar) => isRTL ? ar : en;

  return (
    <main className="doctor-revenue-page" dir={isRTL ? "rtl" : "ltr"}>
      <header className="doctor-revenue-header">
        <div>
          <h1>{text("Doctor Revenue", "إيرادات الطبيب")}</h1>
          <p>{text("Revenue from session services and offer usage during a selected period.", "إيرادات خدمات الجلسات واستخدام العروض خلال فترة محددة.")}</p>
        </div>
      </header>

      <form className="doctor-revenue-filters" onSubmit={searchReport}>
        
        <label className="doctor-revenue-field">
          <span>{text("Doctor", "الطبيب")}</span>

          <select value={doctorID} onChange={(event) => setDoctorID(event.target.value)} disabled={loadingDoctors}>
            <option value="">
              {loadingDoctors ? text("Loading doctors…", "جارٍ تحميل الأطباء…") : text("Select doctor", "اختر الطبيب")}
            </option>
            
            {doctors.map((doctor) => 
              <option key={doctor.UserID} value={doctor.UserID}>
                {doctor.UserName}
              </option>
            )}
          </select>

        </label>

        <label className="doctor-revenue-field">
          <span>{text("From date", "من تاريخ")}</span>
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        </label>
        <label className="doctor-revenue-field">
          <span>{text("To date", "إلى تاريخ")}</span>
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </label>
        <button className="doctor-revenue-search" type="submit" disabled={loadingReport}>
          {loadingReport ? text("Loading…", "جارٍ التحميل…") : text("View report", "عرض التقرير")}
        </button>
      </form>

      {hasSearched && (
        <section className="doctor-revenue-summary" aria-label={text("Revenue summary", "ملخص الإيرادات")}>

          <article className="doctor-revenue-card">
            <span>{text("Session services", "خدمات الجلسات")}</span>
            <strong>{money(summary.sessionTotal)} EGP</strong>
          </article>

          <article className="doctor-revenue-card">
            <span>{text("Offer usage", "استخدام العروض")}</span>
            <strong>{money(summary.offerTotal)} EGP</strong>
          </article>

          <article className="doctor-revenue-card doctor-revenue-grand-total">
            <span>{text("Total doctor revenue", "إجمالي إيرادات الطبيب")}</span>
            <strong>{money(summary.combinedTotal)} EGP</strong>
          </article>

          <article className="doctor-revenue-card doctor-revenue-total-percentage">
            <span>{text("doctor revenue percentage", "نسبة إيرادات الطبيب")}</span>
            <strong>{summary.doctorRevenue ? money(summary.doctorRevenue) : "—"} EGP</strong>
          </article>

        </section>
      )}

      {!hasSearched ? (
        <div className="doctor-revenue-empty">{text("Choose a doctor and period, then view the report.", "اختر الطبيب والفترة ثم اعرض التقرير.")}</div>
      ) : loadingReport ? (
        <div className="doctor-revenue-empty">{text("Loading report…", "جارٍ تحميل التقرير…")}</div>
      ) : (
        <>
          <section className="doctor-revenue-section">
            <div className="doctor-revenue-section-heading">
              <h2>{text("Session service details", "تفاصيل خدمات الجلسات")}</h2>
              <strong>{money(summary.sessionTotal)} EGP</strong>
            </div>
            
            {sessionServices.length === 0 ? 
            <div className="doctor-revenue-empty">
              {text("No session services in this period.", "لا توجد خدمات جلسات خلال هذه الفترة.")}
            </div> : (
              <div className="doctor-revenue-table-wrap"><table className="doctor-revenue-table">
                <thead>
                  <tr>
                    <th>{text("Date", "التاريخ")}</th>
                    <th>{text("Session", "الجلسة")}</th>
                    <th>{text("File No.", "رقم الملف")}</th>
                    <th>{text("Patient", "المريض")}</th>
                    <th>{text("Category", "الفئة")}</th>
                    <th>{text("Service", "الخدمة")}</th>
                    <th>{text("Qty", "الكمية")}</th>
                    <th>{text("Unit price", "سعر الوحدة")}</th>
                    <th>{text("Line total", "الإجمالي")}</th>
                </tr>
                </thead>
                <tbody>
                  {sessionServices.map((row) => 
                    <tr key={row.SessionServiceID}>
                      <td>{date(row.SessionDate)}</td>
                      <td>{row.SessionID}</td>
                      <td>{row.FileNo || "—"}</td>
                      <td>{row.PatientName}</td>
                      <td>{row.CategoryName || "—"}</td>
                      <td>{row.ServiceName}</td>
                      <td>{money(row.Qty)}</td>
                      <td>{money(row.UnitPrice)}</td>
                      <td>{money(row.LineTotal)} EGP</td>
                  </tr>)}
                </tbody>
              </table></div>
            )}
          </section>

          <section className="doctor-revenue-section">
            <div className="doctor-revenue-section-heading">
              <h2>{text("Offer usage details", "تفاصيل استخدام العروض")}</h2>
              <strong>{money(summary.offerTotal)} EGP</strong>
            </div>
            <p className="doctor-revenue-note">{text("Offer revenue is allocated using the subscription price saved at purchase, divided by its granted quantity.", "يتم احتساب إيراد العرض بالتناسب من سعر الاشتراك المسجل وقت الشراء مقسوماً على الكمية الممنوحة.")}</p>
            {offerUsage.length === 0 ? <div className="doctor-revenue-empty">{text("No offer usage in this period.", "لا يوجد استخدام للعروض خلال هذه الفترة.")}</div> : (
              <div className="doctor-revenue-table-wrap"><table className="doctor-revenue-table">
                <thead>
                  <tr>
                    <th>{text("Date", "التاريخ")}</th>
                    <th>{text("Session", "الجلسة")}</th>
                    <th>{text("File No.", "رقم الملف")}</th>
                    <th>{text("Patient", "المريض")}</th>
                    <th>{text("Offer category", "نوع العرض")}</th>
                    <th>{text("Offer", "العرض")}</th>
                    <th>{text("Consumed quantity", "الكمية المستخدمة")}</th>
                    <th>{text("Pulses", "النبضات")}</th>
                    <th>{text("Attributed revenue", "الإيراد المحتسب")}</th>
                  </tr>
                </thead>
                <tbody>
                  {offerUsage.map((row) => (
                    <tr key={row.OfferSubscriptionUsageID}>
                      <td>{date(row.SessionDate)}</td>
                      <td>{row.SessionID}</td>
                      <td>{row.FileNo || "—"}</td>
                      <td>{row.PatientName}</td>
                      <td>{row.CategoryName || "—"}</td>
                      <td>{row.OfferName}</td>
                      <td>{money(row.ConsumedQuantity)}</td>
                      <td>{money(row.PulsesNo)}</td>
                      <td>{money(row.AttributedRevenue)} EGP</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </section>
        </>
      )}
    </main>
  );
};

export default DoctorRevenue;
