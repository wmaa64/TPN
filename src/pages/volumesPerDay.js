import { useState } from "react";
import { useTranslation } from "react-i18next";

const amount = (value) => (Number(value) || 0).toFixed(2);
const metric = (value) => value == null ? "" : amount(value);
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

const reportDateText = (date) => {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

const dailyReportHtml = (report) => {
  const proteins = report.proteinGroups || [];
  const nacl = report.naclGroups || [];
  const nutrients = report.nutrients || [];
  const proteinRows = proteins.map((item) => `
    <tr><td>${escapeHtml(item.name)}</td><td>${amount(item.totalVolume)}</td><td>${amount(item.ampoules)}</td></tr>`).join("");
  const naclRows = nacl.map((item) => `
    <tr><td>${escapeHtml(item.name)}</td><td>${amount(item.totalVolume)}</td><td>${amount(item.ampoules)}</td></tr>`).join("");
  const nutrientRows = nutrients.map((item) => `
    <tr><th>${escapeHtml(item.name)}</th><td>${metric(item.totalVolume)}</td><td>${metric(item.grams)}</td><td>${metric(item.ampoules)}</td></tr>`).join("");

  return `<!doctype html>
  <html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Daily Volumes - ${escapeHtml(reportDateText(report.date))}</title>
  <style>
    *{box-sizing:border-box}@page{size:A4 portrait;margin:10mm}
    body{margin:0;background:#e5e7eb;color:#171717;font:12px "Times New Roman",serif}
    .page{width:190mm;min-height:277mm;margin:12px auto;padding:4mm;background:#fff}
    .date-title{display:flex;align-items:center;gap:18px;margin:3mm 0 5mm;font-size:18px;font-weight:bold}
    .date-title strong{background:#d1d1d1;padding:3px 8px;text-transform:uppercase}
    .summary{display:grid;grid-template-columns:1.1fr .9fr;margin-bottom:10mm}
    table{width:100%;border-collapse:collapse;table-layout:fixed}
    th,td{border:1px solid #777;padding:5px 6px;vertical-align:middle}
    .summary th,.nutrient-table thead th{background:#d3d3d3;font-weight:bold;text-align:center}
    .summary td{text-align:center;font-weight:bold;height:27px}
    .summary tbody td:first-child{text-align:left}
    .summary table:first-child{border-right:2px solid #777}
    .summary-title{font-size:15px;white-space:nowrap}
    .nutrient-table{width:78%;min-width:145mm}
    .nutrient-table thead th{height:31px;font-size:14px}
    .nutrient-table th:first-child{text-align:left;width:39%}
    .nutrient-table td{text-align:center;font-weight:bold;height:24px;font-size:13px}
    .nutrient-table tbody th{background:#e2e2e2;font-size:12px}
    .nutrient-table .section th{background:#bfc1c2;text-align:left;font-size:13px}
    .total{width:46%;margin-top:8mm;font-size:16px}
    .total th{background:#d3d3d3;text-align:left}.total td{text-align:center;font-weight:bold}
    .report-meta{margin:2mm 0 4mm;color:#555;font-size:10px}
    @media print{body{background:#fff}.page{width:auto;min-height:0;margin:0;padding:0}.nutrient-table{width:78%;min-width:145mm}}
  </style></head><body><main class="page">
    <div class="date-title"><strong>Totals For The Day Of:</strong><span>${escapeHtml(reportDateText(report.date))}</span></div>
    <div class="summary">
      <table><thead><tr><th class="summary-title" colspan="3">By N-R-H Categories</th></tr><tr><th></th><th>Total.Vol.</th><th>Numb.Of.Amp</th></tr></thead><tbody>${proteinRows}</tbody></table>
      <table><thead><tr><th class="summary-title" colspan="3">NaCl</th></tr><tr><th></th><th>Total.Vol.</th><th>Numb.Of.Amp</th></tr></thead><tbody>${naclRows}</tbody></table>
    </div>
    <div class="report-meta">${Number(report.orderCount) || 0} prescribe orders</div>
    <table class="nutrient-table"><thead><tr><th>Nutrients:</th><th>Total.Vol.</th><th>G.</th><th>Number Of Ampoules</th></tr></thead>
      <tbody>${nutrientRows}</tbody></table>
    <table class="total"><tbody><tr><th>Total</th><td>${amount(report.totalVolume)} &nbsp; ml</td></tr></tbody></table>
  </main><script>window.addEventListener('load',function(){window.focus();setTimeout(function(){window.print();},250);});</script></body></html>`;
};

const VolumesPerDay = () => {
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
      const response = await fetch(`/api/volumesPerDay?date=${encodeURIComponent(date)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load the daily volumes report.");
      printWindow.document.open();
      printWindow.document.write(dailyReportHtml(data));
      printWindow.document.close();
    } catch (reportError) {
      printWindow.close();
      setError(reportError.message || "Unable to print the daily volumes report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subject-page volumes-per-day-page" dir={isRTL ? "rtl" : "ltr"}>
      <div className="subject-header">
        <div>
          <h1 className="subject-title">{isRTL ? "إجمالي الأحجام اليومية" : "Volumes Per Day"}</h1>
          <p className="subject-subtitle">{isRTL ? "اختر يوماً لطباعة تقرير إجمالي أحجام التحضير." : "Choose a day to print the total preparation volumes report."}</p>
        </div>
      </div>

      <section className="volumes-per-day-panel">
        <div className="subject-form-group">
          <label htmlFor="volumesReportDate">{isRTL ? "التاريخ" : "Report date"}</label>
          <input id="volumesReportDate" type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={loading} />
        </div>
        <button type="button" className="volumes-per-day-print-button" onClick={printReport} disabled={loading}>
          {loading ? (isRTL ? "جارٍ تجهيز التقرير..." : "Preparing report...") : (isRTL ? "طباعة تقرير PDF" : "Print PDF Report")}
        </button>
      </section>

      {error && <div className="subject-error" role="alert">{error}</div>}
    </div>
  );
};

export default VolumesPerDay;
