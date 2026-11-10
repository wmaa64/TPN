import { useState } from "react";
import { useTranslation } from "react-i18next";

const number = (value) => Number(value) || 0;
const isChecked = (value) => value === true || Number(value) === 1;
const amount = (value) => number(value).toFixed(2);
const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

const getAge = (birthDate, referenceDate) => {
  if (!birthDate) return { years: "", months: "", days: "" };
  const birth = new Date(birthDate);
  const reference = referenceDate ? new Date(referenceDate) : new Date();
  if (Number.isNaN(birth.getTime()) || Number.isNaN(reference.getTime())) return { years: "", months: "", days: "" };
  let years = reference.getFullYear() - birth.getFullYear();
  let months = reference.getMonth() - birth.getMonth();
  let days = reference.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(reference.getFullYear(), reference.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) };
};

const reportHtml = (order) => {
  const age = getAge(order.PES_BIRTH_DATE, order.REQUEST_DATE);
  const weight = number(order.PES_WEIGHT);
  const glucoseGrams = number(order.L_GLUC_GMDAY);
  const proteinGrams = number(order.L_PROTEINS);
  const lipidGrams = number(order.L_LIPIDS);
  const calories = glucoseGrams * 3.4 + proteinGrams * 4 + lipidGrams * 10;
  const proteinName = isChecked(order.OPTION_R) ? "Aminosteril NHEPA 8%" : isChecked(order.OPTION_H) ? "Nephrosteril 7%" : "Aminoven 10% Adult";
  const selectedLipid = isChecked(order.OPTION_10) ? "Intralipid 10%" : isChecked(order.OPTION_20) ? "SMOF Lipid 20%" : "";
  const selectedLipid10 = isChecked(order.OPTION_10);
  const selectedLipid20 = isChecked(order.OPTION_20);

  const row = (name, volume, grams = "", gir = "", className = "", showCheck = false) => `
    <tr class="${className}"><th>${escapeHtml(name)}</th><td>${escapeHtml(volume)}</td><td>${escapeHtml(grams)}</td><td>${showCheck ? check(Boolean(gir)) : escapeHtml(gir)}</td></tr>`;
  const check = (checked) => `<span class="check ${checked ? "checked" : ""}">${checked ? "✓" : ""}</span>`;

  return `<!doctype html>
  <html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Perfusion Sheet - ${escapeHtml(order.PES_NAME)}</title>
  <style>
    *{box-sizing:border-box} @page{size:A4 portrait;margin:7mm}
    body{margin:0;background:#e5e7eb;color:#111;font:10px Arial,Helvetica,sans-serif}
    .sheet{width:196mm;min-height:283mm;margin:12px auto;padding:5mm 4mm;background:white;border:1px solid #999}
    .top{display:grid;grid-template-columns:1fr 1.2fr 1fr;align-items:center;gap:5px;border-bottom:1px solid #777;padding-bottom:5px}
    .top .stamp{font-size:9px;line-height:1.7}.title{text-align:center;font-size:18px;font-weight:bold;text-decoration:underline}
    .hospital{text-align:right;direction:rtl;font-size:10px;line-height:1.6;font-weight:bold}
    .request-row{display:grid;grid-template-columns:1fr 1.1fr 1fr;gap:8px;margin:9px 0}
    .request-pair{display:grid;grid-template-columns:auto 1fr;gap:3px 8px;align-content:start;font-size:11px}
    .request-pair b{background:#d1d1d1;padding:3px 5px}.request-pair span{padding:3px 5px;font-weight:bold;font-size:13px}
    .gir-head{grid-column:3;grid-row:1/3;text-align:center;font-weight:bold}
    .gir-table,.patient-table,.sign-table,.nutrient-table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #777;padding:4px;vertical-align:middle}
    .gir-table th,.gir-table td{height:19px;text-align:center}.patient-sign{display:grid;grid-template-columns:1.05fr .95fr;gap:8px;margin:7px 0}
    .patient-table th{width:34%;background:#d4d4d4;text-align:left;font-size:11px}.patient-table td{height:21px;font-size:11px}
    .patient-table .age-cell{display:flex;justify-content:space-around;gap:5px}.age-cell span{display:grid;text-align:center;min-width:34px}.age-cell small{font-size:8px;color:#555}
    .sign-table th{text-align:left;background:#eee;width:32%;font-size:11px}.sign-table td{height:22px}
    .sign-table .doctor-row td{height:20px}.sign-table .doctor-row th{font-weight:normal;background:#fff}
    .report-body{display:grid;grid-template-columns:57% 43%;gap:7px;margin-top:7px}
    .nutrient-table th{text-align:left;background:#d3d3d3;width:43%;font-size:10px}
    .nutrient-table td{text-align:center;height:21px;font-weight:bold;font-size:10px}
    .nutrient-table thead th{text-align:center;height:27px;font-size:12px}
    .nutrient-table .section-row th{background:#bfc1c2;font-size:11px}
    .nutrient-table .substance td:first-of-type{text-align:left}
    .nutrient-table .total-row th,.nutrient-table .total-row td{font-size:13px;font-weight:bold;height:34px}
    .protein-select{margin-top:7px;border:1px solid #777;padding:5px 7px;line-height:1.7;font-size:10px}
    .protein-line{display:flex;justify-content:space-between;align-items:center;gap:5px}.check{display:inline-flex;width:13px;height:13px;border:1px solid #555;align-items:center;justify-content:center;font-weight:bold}
    .summary{margin-top:9px;border:1px solid #777;padding:8px 10px;display:grid;grid-template-columns:1fr auto auto;gap:6px 9px;font-size:11px;min-height:62px;align-content:center}
    .summary strong{font-size:12px}.label-values{display:grid;grid-template-columns:1fr 54px;gap:0 7px;align-items:center;margin:3px 0 12px;font-size:11px}
    .label-values div{padding:4px 2px}.label-values .value{border:1px solid #777;text-align:center;height:21px}
    .external{margin-top:10px;padding:5px}.external h3{font-size:11px;text-decoration:underline;margin:0 0 7px}.external-row{display:grid;grid-template-columns:1fr auto auto;gap:12px;padding:4px 2px;font-size:11px}
    .remarks{margin-top:12px}.remarks h3{font-size:11px;font-style:italic;margin:0 0 3px}.remarks-box{height:42mm;border:1px solid #777;padding:7px;font-weight:bold}
    .signature{text-align:right;margin-top:2px;font-weight:bold;font-style:italic}.footer-total{margin-top:10px;text-align:right;font-size:12px;font-weight:bold}
    @media print{body{background:#fff}.sheet{width:auto;min-height:0;margin:0;padding:0;border:0}.no-print{display:none!important}}
  </style></head><body>
    <main class="sheet">
      <header class="top">
        <div class="stamp">${escapeHtml(formatDate(order.REQUEST_DATE))} &nbsp; Date<br/>1 &nbsp; Page No.</div>
        <div class="title">Perfusion Sheet</div>
        <div class="hospital">مستشفى القصر العيني التعليمي الجديد<br/>كلية الطب - جامعة القاهرة<br/>وحدة التغذية الوريدية</div>
      </header>
      <section class="request-row">
        <div class="request-pair"><b>REQUEST NO</b><span>${escapeHtml(order.REQUEST_NO || "—")}</span><b>REQUEST DATE</b><span>${escapeHtml(formatDate(order.REQUEST_DATE))}</span></div>
        <div></div>
        <div><div class="gir-head">GIR</div><table class="gir-table"><thead><tr><th>Date:</th><th>Dr. Name:</th><th>Date:</th><th>Dr. Name:</th></tr></thead><tbody><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></tbody></table></div>
      </section>
      <section class="patient-sign">
        <table class="patient-table"><tbody>
          <tr><th>Name:</th><td>${escapeHtml(order.PES_NAME || "—")}</td></tr>
          <tr><th>Hospital No.:</th><td>${escapeHtml(order.COMP_NAME || order.COMP_CODE || "—")}</td></tr>
          <tr><th>Ward:</th><td></td></tr>
          <tr><th>Weight:</th><td>${escapeHtml(amount(weight))} kg</td></tr>
          <tr><th>Age:</th><td class="age-cell"><span>${age.years}<small>Year</small></span><span>${age.months}<small>Month</small></span><span>${age.days}<small>Day</small></span></td></tr>
        </tbody></table>
        <table class="sign-table"><tbody>
          <tr><th>Prescriber's Name:</th><td></td></tr><tr><th>Mixed by:</th><td></td></tr><tr><th>Checked by:</th><td></td></tr>
        </tbody></table>
      </section>
      <section class="report-body">
        <div>
          <table class="nutrient-table"><thead><tr><th>Nutrients:</th><th>Vol.</th><th>G.</th><th>GIR.</th></tr></thead><tbody>
            ${row("S.G. 50%", "", "", "")}
            ${row("S.G. 25%", amount(order.C_SG25), amount(glucoseGrams), amount(order.D_GLUC_MGKGMIN))}
            ${row("S.G. 10%", amount(order.C_SG10))}
            ${row("S.G. 5%", "")}
            ${row("Dist. steril H2O", amount(order.C_DESC_STERIL_H2O))}
            <tr class="section-row"><th colspan="4">${escapeHtml(proteinName)}</th></tr>
            ${row("Aminoven / Aminosteril", amount(order.C_AMINOSTERIL10), amount(order.L_PROTEINS))}
            ${row("NaCl", amount(order.C_NACL), amount(order.L_NA), "", "substance")}
            ${row("K cl 15%", amount(order.C_KCL15), amount(order.L_K), "", "substance")}
            ${row("Glycophos", amount(order.C_GLUCOPHOS))}
            ${row("Ca Gluconate", amount(order.C_CAGLUCOSE), amount(order.L_CA))}
            ${row("MgSo4", amount(order.C_MGSO4), amount(order.L_MG))}
            ${row("Traces Elements", amount(order.C_TRACES), String(order.L_TRACES_ELEMET || "Negative"))}
            ${row("Vitamins", amount(order.C_VITAMENS), String(order.L_VITAMENS || "Negative"))}
            ${row("Heparine (IU)", amount(order.C_HEPARIN), String(order.L_HEPARIN || "Negative"))}
            ${row("Intralipid 10%", selectedLipid10 ? amount(order.C_INTRALIPID) : "", selectedLipid10 ? amount(order.L_LIPIDS) : "", selectedLipid10, "", true)}
            ${row("SMOF LIPID 20%", selectedLipid20 ? amount(order.C_INTRALIPID) : "", selectedLipid20 ? amount(order.L_LIPIDS) : "", selectedLipid20, "", true)}
            ${row("Vitalipid", "")}
            ${row("Dipeptiven", "")}
            ${row("Others", "")}
            <tr class="total-row"><th>Total</th><td colspan="3">${amount(order.C_FINAL_TOTAL)} ml</td></tr>
          </tbody></table>
        </div>
        <div>
          <div class="label-values">
            <div>Gluc: &nbsp; g/kg/d</div><div class="value">${escapeHtml(amount(order.D_GLUC_GMKGDAY))}</div>
            <div>Prot: &nbsp; g/kg/g</div><div class="value">${escapeHtml(amount(order.D_PROTEINS))}</div>
            <div>Lipids: &nbsp; g/kg/d</div><div class="value">${escapeHtml(amount(order.D_LIPIDS))}</div>
          </div>
          <div class="protein-select">
            <div class="protein-line"><span>Aminoven 10% Adult</span>${check(isChecked(order.OPTION_N))}</div>
            <div class="protein-line"><span>Aminosteril NHEPA 8%</span>${check(isChecked(order.OPTION_R))}</div>
            <div class="protein-line"><span>Nephrosteril 7%</span>${check(isChecked(order.OPTION_H))}</div>
          </div>
          <div class="summary"><strong>Total Calories:</strong><strong>${amount(calories)}</strong><strong>Kcal</strong><strong>Osmolarity:</strong><strong>${amount(order.C_OSMOLARITY)}</strong><strong>mOsm/L</strong></div>
          <div class="external"><h3>EXTERNAL:</h3>
            <div class="external-row"><span>Milk</span><strong>${amount(order.D_MILK)}</strong><span>ml</span></div>
            <div class="external-row"><span>Drugs</span><strong>${amount(order.D_DRUGS)}</strong><span>ml</span></div>
            ${selectedLipid ? `<div class="external-row"><span>${escapeHtml(selectedLipid)}</span><strong>${amount(order.C_INTRALIPID)}</strong><span>ml</span></div>` : ""}
          </div>
          <div class="remarks"><h3>Remarks</h3><div class="remarks-box">EXCESS VOLUME &nbsp; ${amount(order.C_EXCESS)} &nbsp; ml</div></div>
          <div class="signature">Signature</div>
        </div>
      </section>
      <div class="footer-total">Total: ${amount(order.C_FINAL_TOTAL)} ml</div>
    </main>
    <script>window.addEventListener('load',function(){window.focus();setTimeout(function(){window.print();},250);});</script>
  </body></html>`;
};

const labelHtml = (order) => {
  const calories = number(order.L_GLUC_GMDAY) * 3.4 + number(order.L_PROTEINS) * 4 + number(order.L_LIPIDS) * 10;
  const field = (label, value = "", unit = "") => `
    <div class="field"><span class="field-label">${escapeHtml(label)}</span><span class="field-value">${escapeHtml(value)}</span>${unit ? `<span class="field-unit">${escapeHtml(unit)}</span>` : ""}</div>`;

  return `<!doctype html>
  <html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Nutrition Label - ${escapeHtml(order.PES_NAME)}</title>
  <style>
    *{box-sizing:border-box} @page{size:A5 landscape;margin:5mm}
    body{margin:0;background:#e5e7eb;color:#171717;font:13px "Times New Roman",serif}
    .label{width:200mm;min-height:138mm;margin:12px auto;padding:0;background:#fff;border:2px solid #444}
    .label-header{min-height:25mm;display:grid;grid-template-columns:1.05fr 1fr .25fr;align-items:center;border-bottom:1.5px solid #444;padding:3mm 6mm;gap:5mm}
    .neonates{font-size:23px;font-weight:bold}.unit{text-align:left;font-size:19px;line-height:1.25;font-weight:bold}
    .logo-mark{width:16mm;height:16mm;border:1px solid #777;border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;font-size:8px;line-height:1.1}
    table{width:100%;border-collapse:collapse;table-layout:fixed}td{border:1px solid #555;padding:0 5px;height:10.7mm;vertical-align:middle}
    .patient-info col:nth-child(1){width:55%}.patient-info col:nth-child(2){width:45%}
    .field{display:flex;align-items:baseline;gap:4px;width:100%;min-width:0;font-size:13px;white-space:nowrap}
    .field-label{flex:0 0 auto}.field-value{flex:1;min-width:8mm;min-height:16px;border-bottom:1px dotted #555;text-align:center;font-size:14px;font-weight:bold;overflow:hidden}
    .field-unit{flex:0 0 auto}
    .nutrition col:nth-child(1){width:29%}.nutrition col:nth-child(2){width:28%}.nutrition col:nth-child(3){width:43%}
    .nutrition td{height:10.7mm}.nutrition .field{font-size:12px}.nutrition .field-label{font-size:13px}
    .nutrition .field-value{font-size:14px}
    .warning{min-height:8mm;display:flex;align-items:center;padding:1mm 5px;font-size:15px}
    .footer{font-size:8px;text-align:right;padding:0 4mm 1mm;color:#555}
    @media print{body{background:#fff}.label{width:auto;min-height:0;margin:0;border:2px solid #444}}
  </style></head><body>
    <main class="label">
      <header class="label-header">
        <div class="neonates">Neonates</div>
        <div class="unit">T.P.N UNIT<br/>PHARMACY DEP<br/>TEL.: 23654039.</div>
        <div class="logo-mark">TPN<br/>UNIT</div>
      </header>
      <table class="patient-info"><colgroup><col/><col/></colgroup><tbody>
        <tr><td>${field("Mother / Father Name:")}</td><td>${field("Prescriber's Name:")}</td></tr>
        <tr><td>${field("Name:", order.PES_NAME || "")}</td><td>${field("Mixed by:")}</td></tr>
        <tr><td>${field("Hospital No:", order.COMP_NAME || order.COMP_CODE || "")}</td><td>${field("Checked by:")}</td></tr>
        <tr><td>${field("Ward:")}</td><td>${field("Heparin:", order.L_HEPARIN || "")}</td></tr>
      </tbody></table>
      <table class="nutrition"><colgroup><col/><col/><col/></colgroup><tbody>
        <tr><td>${field("Glucose:", amount(order.L_GLUC_GMDAY), "gm")}</td><td>${field("Ca+:", amount(order.L_CA), "ml")}</td><td>${field("Delivery Date:")}</td></tr>
        <tr><td>${field("Protein:", amount(order.L_PROTEINS), "gm")}</td><td>${field("Mg+:", amount(order.L_MG), "ml")}</td><td>${field("Exp. Date:")}</td></tr>
        <tr><td>${field("Lipids:", amount(order.L_LIPIDS), "gm")}</td><td>${field("Traces Elements:", order.L_TRACES_ELEMET || "")}</td><td>${field("Storage Temp:")}</td></tr>
        <tr><td>${field("Na+:", amount(order.L_NA), "mmol")}</td><td>${field("Vitamins:", order.L_VITAMENS || "")}</td><td>${field("Total Volume:", amount(order.L_TOTAL_VOLUME), "ml")}</td></tr>
        <tr><td>${field("K+:", amount(order.L_K), "mmol")}</td><td>${field("Glycophos:", order.L_GLUCOPHOS || "")}</td><td>${field("Total Calories:", amount(calories), "kcal")}</td></tr>
      </tbody></table>
      <div class="warning">To be Rejected if the Solution is Cloudy, or the Container is Damaged</div>
    </main>
    <div class="footer">Cairo University Press</div>
    <script>window.addEventListener('load',function(){window.focus();setTimeout(function(){window.print();},250);});</script>
  </body></html>`;
};

const PerfusionSheet = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  const searchOrders = async () => {
    const query = search.trim();
    if (!query) {
      setOrders([]);
      setHasSearched(false);
      setError("");
      return;
    }
    try {
      setSearching(true);
      setError("");
      const response = await fetch(`/api/perfusionSheets?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to search perfusion sheets.");
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setHasSearched(true);
    } catch (searchError) {
      setOrders([]);
      setHasSearched(true);
      setError(searchError.message || "Failed to search perfusion sheets.");
    } finally {
      setSearching(false);
    }
  };

  const openPrintWindow = (html) => {
    const printWindow = window.open("", "_blank", "width=1100,height=850");
    if (!printWindow) {
      setError(isRTL ? "يرجى السماح بالنوافذ المنبثقة لفتح التقرير." : "Allow pop-ups to open the report for printing.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };
  const printSheet = (order) => openPrintWindow(reportHtml(order));
  const printLabel = (order) => openPrintWindow(labelHtml(order));

  return (
    <div className="subject-page perfusion-sheet-page" dir={isRTL ? "rtl" : "ltr"}>
      <div className="subject-header">
        <div>
          <h1 className="subject-title">{isRTL ? "ورقة التحضير" : "Perfusion Sheets"}</h1>
          <p className="subject-subtitle">{isRTL ? "ابحث عن المريض ثم اطبع ورقة التحضير والملصق." : "Search for a patient, then print their perfusion sheet and label."}</p>
        </div>
      </div>

      <div className="subject-toolbar">
        <div className="subject-search">
          <span className="subject-search-icon">🔍</span>
          <input
            name="patientNameSearch"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={isRTL ? "ابحث باسم المريض..." : "Search by patient name..."}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); searchOrders(); } }}
          />
          <button type="button" onClick={searchOrders} disabled={searching}>
            {searching ? (isRTL ? "جارٍ البحث..." : "Searching...") : (isRTL ? "بحث" : "Search")}
          </button>
        </div>
        <div className="subject-count">{hasSearched && !searching ? (isRTL ? `${orders.length} ورقة` : `${orders.length} sheet${orders.length === 1 ? "" : "s"}`) : ""}</div>
      </div>

      {error && <div className="subject-error" role="alert">{error}</div>}
      {searching ? <div className="subject-loading">{isRTL ? "جارٍ البحث عن الوصفات..." : "Searching orders..."}</div>
        : !hasSearched ? <div className="subject-search-message">{isRTL ? "ابحث باسم المريض لعرض أوراق التحضير." : "Search by patient name to display perfusion sheets."}</div>
          : orders.length === 0 ? <div className="subject-search-message">{isRTL ? "لم يتم العثور على وصفات لهذا المريض." : "No prescribe orders found for this patient."}</div>
            : <div className="subject-table-wrapper"><table className="subject-table perfusion-sheet-table">
              <thead><tr>
                <th>{isRTL ? "رقم الطلب" : "Request No."}</th>
                <th>{isRTL ? "التاريخ" : "Date"}</th>
                <th>{isRTL ? "المريض" : "Patient"}</th>
                <th>{isRTL ? "المستشفى" : "Hospital"}</th>
                <th>{isRTL ? "الوزن" : "Weight"}</th>
                <th>{isRTL ? "الحجم النهائي" : "Final Volume"}</th>
                <th>{isRTL ? "طباعة" : "Print"}</th>
              </tr></thead><tbody>
                {orders.map((order) => <tr key={order.PRESCRIBE_ORDER_ID}>
                  <td>{order.REQUEST_NO || order.PRESCRIBE_ORDER_ID}</td>
                  <td>{formatDate(order.REQUEST_DATE)}</td>
                  <td><div className="subject-name">{order.PES_NAME || "—"}</div></td>
                  <td>{order.COMP_NAME || "—"}</td>
                  <td>{amount(order.PES_WEIGHT)} kg</td>
                  <td>{amount(order.C_FINAL_TOTAL)} ml</td>
                  <td><div className="perfusion-sheet-print-actions">
                    <button type="button" className="perfusion-sheet-print-button" onClick={() => printSheet(order)}>{isRTL ? "ورقة التحضير" : "Perfusion"}</button>
                    <button type="button" className="perfusion-sheet-print-button label-print-button" onClick={() => printLabel(order)}>{isRTL ? "الملصق" : "Label"}</button>
                  </div></td>
                </tr>)}
              </tbody>
            </table></div>}
    </div>
  );
};

export default PerfusionSheet;
