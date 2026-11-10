import { useState } from "react";
import { useTranslation } from "react-i18next";

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const localToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatReportDate = (date) => {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

const reportHtml = (report) => {
  const companyGroups = (report.companies || []).map((company) => {
    const patients = company.patients || [];
    const patientRows = patients.map((patient, index) => `
      <tr>
        ${index === 0 ? `<td class="company-name" rowspan="${patients.length}" dir="auto">${escapeHtml(company.companyName)}</td>` : ""}
        <td class="patient-name" dir="auto"><span>${escapeHtml(patient.patientName)}</span>${patient.hasPerfusionSheet ? '<b class="tick">✓</b>' : ""}</td>
        ${index === 0 ? `<td class="case-count" rowspan="${patients.length}">${Number(company.caseCount) || 0}</td>` : ""}
      </tr>`).join("");

    return `<table class="company-table">
      <thead><tr><th>Company Name</th><th>Patient Name</th><th>Total Number of Cases / Company</th></tr></thead>
      <tbody>${patientRows}</tbody>
    </table>`;
  }).join("");

  return `<!doctype html>
  <html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Perfusion Sheet Totals - ${escapeHtml(formatReportDate(report.date))}</title>
  <style>
    *{box-sizing:border-box}@page{size:A4 portrait;margin:8mm}
    body{margin:0;background:#e5e7eb;color:#171717;font:12px "Times New Roman",serif}
    .page{width:194mm;min-height:281mm;margin:12px auto;padding:4mm;background:#fff}
    .masthead{display:grid;grid-template-columns:.75fr 1.2fr 1.15fr .32fr;align-items:center;gap:6px;min-height:25mm;padding:3mm 4mm;background:#dedede;border:1px solid #bbb}
    .page-stamp{font-size:10px;line-height:1.5}.report-title{text-align:center;font-size:19px;font-weight:bold;text-decoration:underline;white-space:nowrap}
    .hospital{text-align:center;direction:rtl;font-weight:bold;font-size:10px;line-height:1.6}.logo{width:17mm;height:17mm;border:1px solid #555;border-radius:50%;display:grid;place-content:center;text-align:center;font-size:8px;font-weight:bold}
    .report-date{margin:3mm 0 2mm 15%;font-size:13px}
    .company-table{width:100%;table-layout:fixed;border-collapse:collapse;margin-bottom:4mm;break-inside:avoid-page}
    .company-table th,.company-table td{border:1px solid #999;padding:5px 8px}
    .company-table th{height:11mm;text-align:center;font-size:12px;font-weight:normal}
    .company-table th:first-child{width:38%}.company-table th:nth-child(2){width:35%}.company-table th:nth-child(3){width:27%}
    .company-table td{height:13mm;font-size:13px}
    .company-name{font-family:Arial,sans-serif;font-weight:bold;text-align:left;vertical-align:top;padding-top:8px!important}
    .patient-name{text-align:center;font-weight:bold}
    .patient-name span{display:inline-block;width:calc(100% - 20px);text-align:center}
    .tick{display:inline-block;width:18px;color:#1f3f8b;font-size:17px;vertical-align:middle}
    .case-count{text-align:center;vertical-align:top;padding-top:8px!important;font-size:15px!important;font-weight:bold}
    .empty{padding:15px;border:1px solid #aaa;text-align:center;font-size:14px}
    @media print{body{background:#fff}.page{width:auto;min-height:0;margin:0;padding:0}.company-table{break-inside:avoid-page}}
  </style></head><body><main class="page">
    <header class="masthead">
      <div class="page-stamp">${escapeHtml(formatReportDate(report.date))} &nbsp; Date<br/>1 &nbsp; Page No.</div>
      <div class="report-title">Perfusion Sheet Totals</div>
      <div class="hospital">مستشفى القصر العيني التعليمي الجديد<br/>كلية الطب - جامعة القاهرة<br/>وحدة التغذية الوريدية</div>
      <div class="logo">TPN<br/>UNIT</div>
    </header>
    <div class="report-date">${escapeHtml(formatReportDate(report.date))}</div>
    ${companyGroups || '<div class="empty">No company orders were recorded for this date.</div>'}
  </main><script>window.addEventListener('load',function(){window.focus();setTimeout(function(){window.print();},250);});</script></body></html>`;
};

const PerfusionsPerCompaniesPerDay = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [date, setDate] = useState(localToday);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const printReport = async () => {
    if (!date) {
      setError(isRTL ? "اختر التاريخ أولاً." : "Choose a date first.");
      return;
    }
    const printWindow = window.open("", "_blank", "width=1100,height=850");
    if (!printWindow) {
      setError(isRTL ? "يرجى السماح بالنوافذ المنبثقة لفتح التقرير." : "Allow pop-ups to open the report for printing.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/perfusionsPerCompaniesPerDay?date=${encodeURIComponent(date)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load perfusion totals.");
      printWindow.document.open();
      printWindow.document.write(reportHtml(data));
      printWindow.document.close();
    } catch (reportError) {
      printWindow.close();
      setError(reportError.message || "Unable to print the company totals report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subject-page perfusions-per-companies-page" dir={isRTL ? "rtl" : "ltr"}>
      <div className="subject-header">
        <div>
          <h1 className="subject-title">{isRTL ? "إجمالي أوراق التحضير حسب الشركة" : "Perfusion Totals by Company"}</h1>
          <p className="subject-subtitle">{isRTL ? "اختر يوماً لطباعة حالات كل شركة." : "Choose a day to print each company's patient cases."}</p>
        </div>
      </div>

      <section className="volumes-per-day-panel">
        <div className="subject-form-group">
          <label htmlFor="companyPerfusionDate">{isRTL ? "التاريخ" : "Report date"}</label>
          <input id="companyPerfusionDate" type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={loading} />
        </div>
        <button type="button" className="volumes-per-day-print-button" onClick={printReport} disabled={loading}>
          {loading ? (isRTL ? "جارٍ تجهيز التقرير..." : "Preparing report...") : (isRTL ? "طباعة تقرير PDF" : "Print PDF Report")}
        </button>
      </section>

      {error && <div className="subject-error" role="alert">{error}</div>}
    </div>
  );
};

export default PerfusionsPerCompaniesPerDay;
