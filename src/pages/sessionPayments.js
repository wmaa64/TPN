import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

const PAYMENT_METHODS = [
  "Cash",
  "Visa",
  "Bank Transfer",
  "Instapay",
  "Vodafone Cash",
  "Coupon",
];

const formatMoney = (value) => {
  const number = Number(value || 0);

  return number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// SessionPayments Page Component
const  SessionPayments = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const router = useRouter();

  // --------------------------------------------------
  // Session information passed from sessionDue.js
  // --------------------------------------------------

  const [sessionID, setSessionID] = useState("");
  const [patientID, setPatientID] = useState("");

  const [servicesTotal, setServicesTotal] = useState(0);
  const [servicesDiscount, setServicesDiscount] = useState(0);
  const [servicesNet, setServicesNet] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [remaining, setRemaining] = useState(0);

  // --------------------------------------------------
  // Payments
  // --------------------------------------------------

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // --------------------------------------------------
  // Form
  // --------------------------------------------------

  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");

  const [editingPaymentID, setEditingPaymentID] = useState(null);

  // --------------------------------------------------
  // UI state
  // --------------------------------------------------

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

    // --------------------------------------------------
  // Patient coupon
  // --------------------------------------------------

  const [patientCoupon, setPatientCoupon] = useState(null);
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const [usingCoupon, setUsingCoupon] = useState(false);

  // --------------------------------------------------
  // Read query parameters
  // --------------------------------------------------

  useEffect(() => {
    if (!router.isReady) return;

    const {
      sessionID: querySessionID,
      patientID: queryPatientID,
      servicesTotal: queryServicesTotal,
      servicesDiscount: queryServicesDiscount,
      servicesNet: queryServicesNet,
      totalPaid: queryTotalPaid,
      remaining: queryRemaining,
    } = router.query;

    if (!querySessionID || !queryPatientID) {
      setError("Session information is missing.");
      setLoading(false);
      return;
    }

    setSessionID(Number(querySessionID));
    setPatientID(Number(queryPatientID));

    setServicesTotal(Number(queryServicesTotal || 0));
    setServicesDiscount(Number(queryServicesDiscount || 0));
    setServicesNet(Number(queryServicesNet || 0));
    setTotalPaid(Number(queryTotalPaid || 0));
    setRemaining(Number(queryRemaining || 0));

    loadPayments(Number(querySessionID));
    loadPatientCoupon(Number(queryPatientID));

    setLoading(false);
  }, [router.isReady, router.query]);

    // --------------------------------------------------
  // Load patient's top valid coupon
  // --------------------------------------------------

  const loadPatientCoupon = async (currentPatientID = patientID) => {
    if (!currentPatientID) return;

    try {
      setLoadingCoupon(true);
      setPatientCoupon(null);

      const response = await fetch(`/api/coupons?patientID=${encodeURIComponent(currentPatientID)}&status=Valid` );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load patient coupon."
        );
      }

      setPatientCoupon(data || null);
    } catch (err) {
      console.error("Load patient coupon error:", err);
      setPatientCoupon(null);
    } finally {
      setLoadingCoupon(false);
    }
  };

  
  // --------------------------------------------------
  // Load payments
  // --------------------------------------------------

  const loadPayments = async (currentSessionID = sessionID) => {
    if (!currentSessionID) return;

    try {
      setLoadingPayments(true);
      setError("");

      const response = await fetch(
        `/api/sessionPayments?sessionId=${encodeURIComponent(
          currentSessionID
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load payments."
        );
      }

      setPayments(Array.isArray(data) ? data : []);

      calculatePaymentTotal(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load payments.");
    } finally {
      setLoadingPayments(false);
    }
  };

  // --------------------------------------------------
  // Calculate total paid from payment records
  // --------------------------------------------------

  const calculatePaymentTotal = (paymentList) => {
    const total = (paymentList || []).reduce(
      (sum, payment) =>
        sum + Number(payment.AmountPaid || 0),
      0
    );

    setTotalPaid(total);

    setRemaining(
      Math.max(0, Number(servicesNet || 0) - total)
    );
  };

  // --------------------------------------------------
  // Reset form
  // --------------------------------------------------

  const resetForm = () => {
    setAmountPaid("");
    setPaymentMethod("Cash");
    setNotes("");
    setEditingPaymentID(null);
  };

  // --------------------------------------------------
  // Use patient coupon as payment
  // --------------------------------------------------

  const handleUseCoupon = async () => {
    if (!patientCoupon) {
      setError("No valid coupon is available for this patient.");
      return;
    }

    if (!sessionID || !patientID) {
      setError("Session information is missing.");
      return;
    }

    const couponAmount = Number(patientCoupon.Amount);

    if (!Number.isFinite(couponAmount) || couponAmount <= 0) {
      setError("The coupon amount is invalid.");
      return;
    }

    const confirmed = window.confirm(`Use coupon ${patientCoupon.CouponNo} for ${formatMoney(couponAmount)} 
        as payment for this session?`  );

    if (!confirmed) return;

    try {
      setUsingCoupon(true);
      setError("");
      setSuccess("");

      const storedUserInfo = localStorage.getItem("userInfo");

      if (!storedUserInfo) {
        throw new Error("User information is not available.");
      }

      const userInfo = JSON.parse(storedUserInfo);
      const userID = Number(userInfo?.UserID);

      if (!Number.isInteger(userID) || userID <= 0) {
        throw new Error("Valid UserID is not available.");
      }

      const response = await fetch("/api/sessionPayments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionID: Number(sessionID),
          patientID: Number(patientID),
          amountPaid: couponAmount,
          paymentMethod: "Coupon",
          notes: `Coupon ${patientCoupon.CouponNo}`,
          userID,
          couponID: patientCoupon.CouponID,
          couponNo: patientCoupon.CouponNo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to use coupon."
        );
      }

      setSuccess(
        `Coupon ${patientCoupon.CouponNo} used successfully.`
      );

      setPatientCoupon(null);

      await loadPayments(sessionID);
      await loadPatientCoupon(patientID);
    } catch (err) {
      console.error("Use coupon error:", err);
      setError(err.message || "Failed to use coupon.");
    } finally {
      setUsingCoupon(false);
    }
  };



  // --------------------------------------------------
  // Register / Update payment
  // --------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!sessionID || !patientID) {
      setError("Session information is missing.");
      return;
    }

    const amount = Number(amountPaid);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      setError("Please select a valid payment method.");
      return;
    }

    if (paymentMethod === "Coupon") {
      setError("Please use the Use Coupon button to register a coupon payment.");
      return;
    }

    // ------------------------------------------------
    // UPDATE
    // ------------------------------------------------

    if (editingPaymentID) {
      try {
        setSaving(true);

        const response = await fetch(
          `/api/sessionPayments/${editingPaymentID}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amountPaid: amount,
              paymentMethod,
              notes,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to update payment."
          );
        }

        setSuccess("Payment updated successfully.");

        resetForm();

        await loadPayments(sessionID);
      } catch (err) {
        console.error(err);
        setError(
          err.message || "Failed to update payment."
        );
      } finally {
        setSaving(false);
      }

      return;
    }

    // ------------------------------------------------
    // CREATE
    // ------------------------------------------------

    try {
      setSaving(true);

      /*
       * UserID comes from userInfo.UserID.
       *
       * This assumes userInfo is available in the
       * application context/local storage as it is
       * elsewhere in ClinicPro.
       */

      const storedUserInfo = localStorage.getItem("userInfo");

      if (!storedUserInfo) {
        throw new Error("User information is not available.");
      }

      const userInfo = JSON.parse(storedUserInfo);

      const userID = Number(userInfo?.UserID);

      if (!Number.isInteger(userID) || userID <= 0) {
        throw new Error("Valid UserID is not available.");
      }

      const response = await fetch(
        "/api/sessionPayments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionID: Number(sessionID),
            patientID: Number(patientID),
            amountPaid: amount,
            paymentMethod,
            notes,
            userID,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to register payment."
        );
      }

      setSuccess("Payment registered successfully.");

      resetForm();

      await loadPayments(sessionID);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Failed to register payment."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Edit payment
  // --------------------------------------------------

  const handleEdit = (payment) => {
    setError("");
    setSuccess("");

    setEditingPaymentID(payment.SessionPaymentID);
    setAmountPaid(payment.AmountPaid ?? "");
    setPaymentMethod(
      PAYMENT_METHODS.includes(payment.PaymentMethod)
        ? payment.PaymentMethod
        : "Cash"
    );
    setNotes(payment.Notes || "");

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  // --------------------------------------------------
  // Cancel edit
  // --------------------------------------------------

  const handleCancelEdit = () => {
    resetForm();
    setError("");
    setSuccess("");
  };

  // --------------------------------------------------
  // Delete payment
  // --------------------------------------------------

  const handleDelete = async (paymentID) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payment?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      setSaving(true);

      const response = await fetch(
        `/api/sessionPayments/${paymentID}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete payment."
        );
      }

      setSuccess("Payment deleted successfully.");

      if (editingPaymentID === paymentID) {
        resetForm();
      }

      await loadPayments(sessionID);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Failed to delete payment."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Back to Session Due
  // --------------------------------------------------

  const handleBack = () => {
    router.push("/sessionDue");
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="session-payments-page">
        <div className="session-payments-loading">
          {isRTL ? "جارٍ تحميل معلومات الدفع..." : "Loading session payments..."}
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="session-payments-page">

      {/* ============================================
          HEADER
      ============================================ */}

      <div className="session-payments-header">
        <div>
          <h1>{isRTL ? "مدفوعات الجلسة" : "Session Payments"}</h1>
          <p>{isRTL ? "سجلات الدفع للجلسة المحددة." : "Payment records for the selected session."}</p>
        </div>

        <button
          type="button"
          className="session-payments-back-button"
          onClick={handleBack}
        >
          {isRTL ? "العودة إلى مستحقات الجلسة" : "Back to Session Due"}
        </button>
      </div>

      {/* ============================================
          ERROR / SUCCESS
      ============================================ */}

      {error && (
        <div className="session-payments-error">
          {error}
        </div>
      )}

      {success && (
        <div className="session-payments-success">
          {success}
        </div>
      )}

      {/* ============================================
          SELECTED SESSION
      ============================================ */}

      <section className="session-payments-section">

        <div className="session-payments-section-title">
          {isRTL ? "الجلسة المحددة" : "Selected Session"}
        </div>

        <div className="session-payments-session-info">

          <div className="session-payments-info-item">
            <span>{isRTL ? "معرف الجلسة" : "Session ID"}</span>
            <strong>{sessionID}</strong>
          </div>

          <div className="session-payments-info-item">
            <span>{isRTL ? "معرف المريض" : "Patient ID"}</span>
            <strong>{patientID}</strong>
          </div>

        </div>

        <div className="session-payments-summary">

          <div className="session-payments-summary-item">
            <span>{isRTL ? "إجمالي الخدمات" : "Services Total"}</span>
            <strong>
              {formatMoney(servicesTotal)}
            </strong>
          </div>

          <div className="session-payments-summary-item">
            <span>{isRTL ? "خصم الخدمات" : "Services Discount"}</span>
            <strong>
              {formatMoney(servicesDiscount)}
            </strong>
          </div>

          <div className="session-payments-summary-item">
            <span>{isRTL ? "صافى الخدمات" : "Services Net"}</span>
            <strong>
              {formatMoney(servicesNet)}
            </strong>
          </div>

          <div className="session-payments-summary-item">
            <span>{isRTL ? "إجمالي المدفوع" : "Total Paid"}</span>
            <strong>
              {formatMoney(totalPaid)}
            </strong>
          </div>

          <div className="session-payments-summary-item">
            <span>{isRTL ? "المتبقي" : "Remaining"}</span>
            <strong>
              {formatMoney(remaining)}
            </strong>
          </div>

        </div>

        {/* ============================================
            PATIENT COUPON
        ============================================ */}

        {loadingCoupon ? (
          <div className="session-payment-coupon-loading">
            {isRTL ? "جارٍ التحقق من قسائم المرضى..." : "Checking patient coupons..."}
          </div>
        ) : patientCoupon ? (
          <div className="session-payment-coupon-alert">
            <div className="session-payment-coupon-information">
              <strong>{isRTL ? "المريض لديه قسيمة صالحة" : "Patient has a valid coupon"}</strong>

              <span>
                {isRTL ? "رقم القسيمة:" : "Coupon No.:"} {" "}
                <b>{patientCoupon.CouponNo}</b>
              </span>

              <span>
                {isRTL ? "قيمة القسيمة:" : "Coupon Value:"} {" "}
                <b>{formatMoney(patientCoupon.Amount)}</b>
              </span>
            </div>

            <button
              type="button"
              className="session-payment-use-coupon-button"
              onClick={handleUseCoupon}
              disabled={saving || usingCoupon || loadingPayments}
            >
              {usingCoupon ? (isRTL ? "جارٍ استخدام القسيمة..." : "Using Coupon...") : 
                             (isRTL ? "استخدام القسيمة" : "Use Coupon")}
            </button>
          </div>
        ) : (
          <div className="session-payment-no-coupon">
            {isRTL ? "لا توجد قسيمة صالحة متاحة لهذا المريض." : "No valid coupon is available for this patient."}
          </div>
        )}

      </section>

      {/* ============================================
          PAYMENT HISTORY
      ============================================ */}

      <section className="session-payments-section">

        <div className="session-payments-section-title">
          {isRTL ? "سجل الدفع" : "Payment History"}
        </div>

        {loadingPayments ? (
          <div className="session-payments-loading">
            {isRTL ? "جارٍ تحميل المدفوعات..." : "Loading payments..."}
          </div>
        ) : payments.length === 0 ? (
          <div className="session-payments-empty">
            {isRTL ? "لا توجد مدفوعات مسجلة لهذه الجلسة." : "No payments have been registered for this session."}
          </div>
        ) : (
          <div className="session-payments-table-wrapper">

            <table className="session-payments-table">

              <thead>
                <tr>
                  <th>{isRTL ? "المعرف" : "ID"}</th>
                  <th>{isRTL ? "تاريخ الدفع" : "Payment Date"}</th>
                  <th>{isRTL ? "المبلغ المدفوع" : "Amount Paid"}</th>
                  <th>{isRTL ? "طريقة الدفع" : "Payment Method"}</th>
                  <th>{isRTL ? "رقم القسيمة" : "Coupon No."}</th>
                  <th>{isRTL ? "ملاحظات" : "Notes"}</th>
                  <th>{isRTL ? "المستخدم" : "User"}</th>
                  <th>{isRTL ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>

              <tbody>

                {payments.map((payment) => (
                  <tr key={payment.SessionPaymentID}>

                    <td>
                      {payment.SessionPaymentID}
                    </td>

                    <td>
                      {formatDateTime(
                        payment.PaymentDate
                      )}
                    </td>

                    <td className="payment-amount">
                      {formatMoney(
                        payment.AmountPaid
                      )}
                    </td>

                    <td>
                      {payment.PaymentMethod || "-"}
                    </td>
                    
                    <td>
                      {payment.CouponNo || "-"}
                    </td>

                    <td>
                      {payment.Notes || "-"}
                    </td>

                    <td>
                      {payment.UserName || "-"}
                    </td>

                    <td>
                      <div className="session-payment-actions">

                        <button
                          type="button"
                          className="payment-edit-button"
                          onClick={() =>
                            handleEdit(payment)
                          }
                          disabled={saving}
                        >
                          {isRTL ? "تعديل" : "Edit"}
                        </button>

                        <button
                          type="button"
                          className="payment-delete-button"
                          onClick={() =>
                            handleDelete(
                              payment.SessionPaymentID
                            )
                          }
                          disabled={saving}
                        >
                          {isRTL ? "حذف" : "Delete"}
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* ============================================
          PAYMENT FORM
      ============================================ */}

      <section className="session-payments-section">

        <div className="session-payments-section-title">

          {editingPaymentID ? (isRTL ? "تحديث الدفع" : "Update Payment") : 
                              (isRTL ? "تسجيل دفع جديد" : "Register New Payment")}

        </div>

        <form
          className="session-payment-form"
          onSubmit={handleSubmit}
        >

          <div className="session-payment-form-row">

            {/* Amount */}

            <div className="session-payment-form-group">

              <label htmlFor="amountPaid">
                {isRTL ? "المبلغ المدفوع" : "Amount Paid"}
              </label>

              <input
                id="amountPaid"
                type="number"
                min="0.01"
                step="0.01"
                value={amountPaid}
                onChange={(event) =>
                  setAmountPaid(event.target.value)
                }
                placeholder="Enter amount"
                disabled={saving}
                required
              />

            </div>

            {/* Payment Method */}

            <div className="session-payment-form-group">

              <label htmlFor="paymentMethod">
                {isRTL ? "طريقة الدفع" : "Payment Method"}
              </label>

              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value)
                }
                disabled={saving}
                required
              >

                {PAYMENT_METHODS.map((method) => (
                  <option
                    key={method}
                    value={method}
                  >
                    {method}
                  </option>
                ))}

              </select>

            </div>

          </div>

          {/* Notes */}

          <div className="session-payment-form-group">

            <label htmlFor="paymentNotes">
              {isRTL ? "ملاحظات" : "Notes"}
            </label>

            <textarea
              id="paymentNotes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder={isRTL ? "ملاحظات اختيارية" : "Optional notes"}
              maxLength={500}
              rows={4}
              disabled={saving}
            />

          </div>

          {/* Buttons */}

          <div className="session-payment-form-actions">

            <button
              type="submit"
              className="session-payment-save-button"
              disabled={saving}
            >
              {saving  ? isRTL ? "جارٍ الحفظ..." : "Saving..."  : editingPaymentID  ? 
                        (isRTL ? "تحديث الدفع" : "Update Payment")  : 
                        (isRTL ? "تسجيل دفع جديد" : "Register Payment")}
            </button>

            {editingPaymentID && (
              <button
                type="button"
                className="session-payment-cancel-button"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
            )}

          </div>

        </form>

      </section>

    </div>
  );
}

export default SessionPayments;