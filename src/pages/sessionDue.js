import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

// GET TODAY'S DATE// ============================================================
const getTodayDate = () => {

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// FORMAT MONEY// ============================================================
const formatMoney = (value) => {
  const number = Number(value || 0);
  return number.toFixed(2);
};

// SESSION DUE PAGE// ============================================================
const SessionDue = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  
  const router = useRouter();
  
  const [selectedDate, setSelectedDate] =  useState(getTodayDate());
  const [sessions, setSessions] =   useState([]);
  const [loadingSessions, setLoadingSessions] =   useState(false);

  const [selectedSessionID, setSelectedSessionID] =    useState("");
  const [selectedSession, setSelectedSession] =   useState(null);

  const [sessionServices, setSessionServices] =    useState([]);
  const [loadingServices, setLoadingServices] =    useState(false);

  const [error, setError] =    useState("");


  // INITIAL LOAD
  useEffect(() => {
    loadSessions(getTodayDate());
  }, []);

  // LOAD SESSIONS FOR SELECTED DATE
  const loadSessions = async (date) => {

    try {
      setLoadingSessions(true);
      setError("");

      // Clear previous selection
      setSelectedSessionID("");
      setSelectedSession(null);
      setSessionServices([]);

      const response = await fetch(`/api/sessionDue?date=${date}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load sessions.");
      }

      setSessions(Array.isArray(data) ? data : [] );
    }
    catch (error) {
        console.error("Load sessions error:", error);

        setSessions([]);

        setError(error.message || "Failed to load sessions.");
    }
    finally {
        setLoadingSessions(false);
    }

  };

  // DATE CHANGE
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (date) {
      loadSessions(date);
    }

  };

  // SELECT SESSION
  const handleSelectSession = async (sessionID) => {

    const session = sessions.find(item => String(item.SessionID) === String(sessionID));

    setSelectedSessionID(String(sessionID));
    setSelectedSession(session || null);
    setSessionServices([]);
    setError("");

    if (!session) {
      return;
    }

    try {
      setLoadingServices(true)

      const response = await fetch(`/api/sessionDue?sessionId=${sessionID}`);
      const data =  await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load session services.");
      }

      setSessionServices(Array.isArray(data) ? data : []);
    }
    catch (error) {
      console.error("Load session services error:", error);

      setSessionServices([]);

      setError(error.message || "Failed to load session services.");
    }
    finally {
      setLoadingServices(false);
    }

  };

// OPEN SESSION PAYMENTS// ==========================================================
const handleOpenPayments = () => {

  // MAKE SURE A SESSION IS SELECTED
  if (!selectedSession) {
    setError("Please select a session first.");
    return;
  }

  // GET SELECTED SESSION VALUES
  const sessionID =    Number(selectedSession.SessionID);
  const patientID =    Number(selectedSession.PatientID);
  const servicesTotal =    Number(selectedSession.ServicesTotal || 0);
  const servicesDiscount =    Number(selectedSession.ServicesDiscount || 0);
  const servicesNet =    Number(selectedSession.ServicesNet || 0);
  const totalPaid =    Number(selectedSession.TotalPaid || 0);
  const remaining =    Number(selectedSession.Remaining || 0);

  // GO DIRECTLY TO SESSION PAYMENTS PAGE
  router.push(
    `/sessionPayments` +
    `?sessionID=${encodeURIComponent(sessionID)}` +
    `&patientID=${encodeURIComponent(patientID)}` +
    `&servicesTotal=${encodeURIComponent(servicesTotal)}` +
    `&servicesDiscount=${encodeURIComponent(servicesDiscount)}` +
    `&servicesNet=${encodeURIComponent(servicesNet)}` +
    `&totalPaid=${encodeURIComponent(totalPaid)}` +
    `&remaining=${encodeURIComponent(remaining)}`
  );

};


  // SERVICES SUMMARY  //
  // CategoryID = 10   // Consumables are excluded from:
  // - Total Before Discount
  // - Total Discount
  // - Net Due
  // Consumables are shown separately.
  // ==========================================================

  const getServicesSummary = () => {
    let totalBeforeDiscount = 0;
    let totalDiscount = 0;
    let servicesNet = 0;
    let consumablesTotal = 0;

    sessionServices.forEach(service => {

      const qty =  Number(service.Qty || 0);
      const unitPrice =   Number(service.UnitPrice || 0);
      const discount =   Number(service.Discount || 0);
      const lineTotal =  Number(service.LineTotal || 0);

      // CONSUMABLE
      if (Number(service.CategoryID) === 10) {
        consumablesTotal += lineTotal;
        return;
      }

      // NORMAL SERVICE
      totalBeforeDiscount +=  qty * unitPrice;
      totalDiscount += discount;
      servicesNet +=  lineTotal;
    });

    return {totalBeforeDiscount, totalDiscount, servicesNet, consumablesTotal,};
  };

  const {totalBeforeDiscount, totalDiscount, servicesNet, consumablesTotal,} = getServicesSummary();

  // RENDER
  return (
    <div className="session-due-page">

      {/* HEADER */}
      <div className="session-due-header">
        <div>
          <h1>{isRTL ? "مستحقات الجلسة" : "Session Due"}</h1>
          <p>{isRTL ? "عرض الجلسات والدفعات المعلقة" : "View sessions and outstanding payments"}</p>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="session-due-error">
          {error}
        </div>
      )}

      {/* DATE SELECTION */}
      <div className="session-due-section">
        <div className="session-due-section-header">
          <h2>{isRTL ? "تاريخ الجلسة" : "Session Date"}</h2>
        </div>

        <div className="session-due-date-container">
          <div className="session-due-form-group">
            <label>{isRTL ? "التاريخ" : "Date"}</label>
            <input   type="date"   value={selectedDate}   onChange={handleDateChange}/>
          </div>
        </div>

      </div>

      {/* SESSIONS TABLE */}
      <div className="session-due-section">
        <div className="session-due-section-header">
          <h2>{isRTL ? "الجلسات" : "Sessions"}</h2>
          <span>{selectedDate}</span>
        </div>

        {loadingSessions ? (
          <div className="session-due-loading">
            {isRTL ? "جارٍ تحميل الجلسات..." : "Loading sessions..."}
          </div>
        ) : sessions.length === 0 ? (
          <div className="session-due-empty">
            {isRTL ? "لا توجد جلسات لهذه التاريخ." : "No sessions found for this date."}
          </div>

        ) : (
          <div className="session-due-table-wrapper">
            <table className="session-due-table">
              <thead>
                <tr>
                  <th>{isRTL ? "تحديد" : "Select"}</th>
                  <th>{isRTL ? "معرف الجلسة" : "Session ID"}</th>
                  <th>{isRTL ? "معرف المريض" : "Patient ID"}</th>
                  <th>{isRTL ? "المريض" : "Patient"}</th>
                  <th>{isRTL ? "الطبيب" : "Doctor"}</th>
                  <th>{isRTL ? "الوقت" : "Time"}</th>
                  <th>{isRTL ? "إجمالي الخدمات" : "Services Total"}</th>
                  <th>{isRTL ? "خصم الخدمات" : "Services Discount"}</th>
                  <th>{isRTL ? "صافى الخدمات" : "Services Net"}</th>
                  <th>{isRTL ? "إجمالي المدفوع" : "Total Paid"}</th>
                  <th>{isRTL ? "المتبقي" : "Remaining"}</th>
                </tr>
              </thead>

              <tbody>
                {sessions.map(session => (
                  <tr   key={session.SessionID}   
                        className={ String(selectedSessionID) === 
                                    String(session.SessionID) ? "selected-session-row" : ""}
                  >
                    {/* RADIO */}
                    <td className="session-due-radio-cell">

                      <input   type="radio"  name="selectedSession"  value={session.SessionID}
                        checked={String(selectedSessionID) === String(session.SessionID)}
                        onChange={() => handleSelectSession(session.SessionID)}
                      />

                    </td>

                    <td>{session.SessionID}</td>
                    <td>{session.PatientID}</td>
                    <td><strong>{session.PatientName}</strong></td>
                    <td>{session.DoctorName}</td>
                    <td>{session.SessionTime}</td>
                    <td className="session-due-money">{formatMoney(session.ServicesTotal)}</td>
                    <td className="session-due-money">{formatMoney(session.ServicesDiscount)}</td>
                    <td className="session-due-money"><strong>{formatMoney(session.ServicesNet)}</strong></td>
                    <td className="session-due-money">{formatMoney(session.TotalPaid)}</td>
                    <td className="session-due-money"><strong>{formatMoney(session.Remaining)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SESSION PAYMENTS BUTTON */}
        <div className="session-due-actions">
          <button  type="button"  className="session-due-payments-button"
                onClick={handleOpenPayments}
                disabled={!selectedSessionID}
          >
            {isRTL ? "مدفوعات الجلسة" : "Session Payments"}
          </button>
        </div>
      </div>

      {/* SELECTED SESSION SERVICES */}
      {selectedSession && (
        <div className="session-due-section">
          <div className="session-due-section-header">
            <h2>{isRTL ? "خدمات الجلسة" : "Session Services"}</h2>
            <span>{isRTL ? "جلسة #" : "Session #"}{selectedSession.SessionID}</span>
          </div>

          {/* PATIENT INFORMATION */}
          <div className="session-due-session-info">
            <div>
              <span>{isRTL ? "المريض" : "Patient"}</span>
              <strong>{selectedSession.PatientName}</strong>
            </div>

            <div>
              <span>{isRTL ? "الطبيب" : "Doctor"}</span>
              <strong>{selectedSession.DoctorName}</strong>
            </div>

            <div>
              <span>{isRTL ? "الوقت" : "Time"}</span>
              <strong>{selectedSession.SessionTime}</strong>
            </div>
          </div>


          {/* SERVICES */}
          {loadingServices ? (
            <div className="session-due-loading">
              {isRTL ? "جارٍ تحميل خدمات الجلسة..." : "Loading session services..."}
            </div>
          ) : sessionServices.length === 0 ? (
            <div className="session-due-empty">
              {isRTL ? "لا توجد خدمات مسجلة لهذه الجلسة." : "No services registered for this session."}
            </div>
          ) : (
            <div className="session-due-table-wrapper">
              <table className="session-due-services-table">
                <thead>
                  <tr>
                    <th>{isRTL ? "الخدمة" : "Service"}</th>
                    <th>{isRTL ? "الفئة" : "Category"}</th>
                    <th>{isRTL ? "الكمية" : "Qty"}</th>
                    <th>{isRTL ? "سعر الوحدة" : "Unit Price"}</th>
                    <th>{isRTL ? "الخصم" : "Discount"}</th>
                    <th>{isRTL ? "المجموع" : "Line Total"}</th>
                  </tr>
                </thead>

                <tbody>
                  {sessionServices.map(service => (
                    <tr key={service.SessionServiceID}>

                      {/* SERVICE */}
                      <td>
                        <strong>{service.ServiceName}</strong>
                        {Number(service.CategoryID) === 10 && (
                          <span className="session-due-consumable-label">Consumable</span>
                        )}
                      </td>

                      <td>{service.CategoryName || "-"}</td>
                      <td>{Number(service.Qty || 0)}</td>
                      <td className="session-due-money">{formatMoney(service.UnitPrice)}</td>
                      <td className="session-due-money">{formatMoney(service.Discount)}</td>
                      <td className="session-due-money"><strong>{formatMoney(service.LineTotal)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SUMMARY */}
          <div className="session-due-summary">

            {/* TOTAL BEFORE DISCOUNT */}
            <div className="session-due-summary-item">
              <span>{isRTL ? "إجمالي قبل الخصم" : "Total Before Discount"}</span>
              <strong>{formatMoney(totalBeforeDiscount)}</strong>
            </div>

            {/* TOTAL DISCOUNT */}
            <div className="session-due-summary-item">
              <span>{isRTL ? "إجمالي الخصم" : "Total Discount"}</span>
              <strong>{formatMoney(totalDiscount)}</strong>
            </div>

            {/* SERVICES NET */}
            <div className="session-due-summary-item">
              <span>{isRTL ? "صافى الخدمات" : "Services Net"}</span>
              <strong>{formatMoney(servicesNet)}</strong>
            </div>

            {/* CONSUMABLES */}
            <div className="session-due-summary-item">
              <span>{isRTL ? "المواد الاستهلاكية" : "Consumables"}</span>
              <strong>{formatMoney(consumablesTotal)}</strong>
            </div>

            {/* TOTAL PAID */}
            <div className="session-due-summary-item">
              <span>{isRTL ? "إجمالي المدفوع" : "Total Paid"}</span>
              <strong>{formatMoney(selectedSession.TotalPaid)}</strong>
            </div>

            {/* REMAINING */}
            <div className="session-due-summary-item session-due-summary-remaining">
              <span>{isRTL ? "المتبقي" : "Remaining"}</span>
              <strong>{formatMoney(selectedSession.Remaining)}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};


export default SessionDue;