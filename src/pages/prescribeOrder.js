import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

const emptyForm = {
  a_request_date: "",
  a_pes_name: "", 
  a_pes_birth_date: "", 
  a_pes_weight: "",
  a_comp_code: "", 
  a_comp_name: "", 
  d_milk: "0", 
  d_drugs: "0", 
  d_gluc_mgkgmin: "0",
  d_gluc_gmkgday: "0", 
  d_Gluc_percent: "0", 
  d_Tvol: "0", 
  d_proteins: "0", 
  d_lipids: "0",
  d_Na: "0", 
  d_K: "0", 
  d_Ca: "0", 
  d_Mg: "0", 
  d_vitamens: "0", 
  d_Traces_element: "0",
  d_Glucophos: "0", 
  d_heparin: "0", 
  d_total_volume: "0",
};

const num = (value) => Number.parseFloat(value) || 0;

const formulaA = (concentration, amount, required) => concentration ? required * amount / concentration : 0;

//const formulaB = (concentration, amount, required) => concentration ? required *  concentration / amount : 0;

const fmt = (value) => Number.isFinite(value) ? value.toFixed(2) : "0.00";

const normalizeCompanySearch = (value) => String(value || "")
  // In the company list, "م." is often used as an abbreviation before a place name.
  .replace(/^\s*م\s*\.\s*/u, "")
  .normalize("NFKC")
  .toLocaleLowerCase()
  .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
  .replace(/[أإآٱ]/g, "ا")
  .replace(/ى/g, "ي")
  .replace(/[^\p{L}\p{N}]+/gu, "");

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

function calculateOrder(form, options) {
  const weight = num(form.a_pes_weight);
  const patientWeight = weight * (options.fourLine ? 1.2 : 1);
  const proteinPerKg = num(form.d_proteins);
  const lipidPerKg = num(form.d_lipids);
  const sodiumPerKg = num(form.d_Na);
  const potassiumPerKg = num(form.d_K);
  const calcium = num(form.d_Ca) * patientWeight;
  const magnesium = num(form.d_Mg) * patientWeight;
  const vitamins = num(form.d_vitamens) * patientWeight;
  const glucophos = num(form.d_Glucophos) * patientWeight;
  const proteinStrength = options.protein === "R" ? 7 : options.protein === "H" ? 8 : 10;
  const protein = formulaA(proteinStrength, 100, proteinPerKg * patientWeight);
  const lipidStrength = Number(options.lipid);
  const lipid = formulaA(lipidStrength, 100, lipidPerKg * patientWeight);
  const traces = options.protein === "N" ? num(form.d_Traces_element) * patientWeight : 0;
  let glucosePerDay = num(form.d_gluc_gmkgday);
  const glucosePhosphateSodium = num(form.d_Glucophos) * patientWeight;
  const sodiumToSupply = sodiumPerKg * patientWeight - (glucosePhosphateSodium * 2);
  const sodiumNeeds = glucosePhosphateSodium === 0 ? sodiumPerKg * patientWeight : sodiumToSupply;
  const nacl = sodiumNeeds < 0 ? 0 : formulaA(13, 26, sodiumNeeds * (options.sodium === "09" ? 3.35 : 1));
  const kcl = formulaA(10, 5, potassiumPerKg * patientWeight);
  const milk = num(form.d_milk);
  const drugs = num(form.d_drugs);
  const heparinInput = num(form.d_heparin);
  const totalVolume = num(form.d_total_volume) * weight;
  const totalRequired = (totalVolume - milk - drugs - (options.check3 ? lipid : 0)) * (options.fourLine ? 1.2 : 1);
  let sg25 = glucosePerDay * patientWeight * 100 / 25;
  let tracesForSubtotal = traces;
  let subtotal = sg25 + protein + nacl + magnesium + calcium + kcl + tracesForSubtotal + vitamins + glucophos + 
                  (options.check3 ? 0 : lipid);
  let remaining = totalRequired - subtotal;
  let excess = Math.max(0, -remaining);
  let water = Math.max(0, remaining);
  let finalTotal = totalRequired + excess;

  if (options.glucoseMode === "P" && finalTotal > 0) {
    let requiredPercent = glucosePerDay * patientWeight * 100 / finalTotal;
    let attempts = 0;
    while (requiredPercent > 12.99 && glucosePerDay > 0 && attempts < 100) {
      glucosePerDay = Math.max(0, glucosePerDay - 1);
      attempts += 1;
      sg25 = glucosePerDay * patientWeight * 100 / 25;
      tracesForSubtotal = options.protein === "N" ? 0.1 * patientWeight : 0;
      subtotal = sg25 + protein + nacl + magnesium + calcium + kcl + tracesForSubtotal + lipid + vitamins + glucophos;
      remaining = totalRequired - subtotal;
      excess = Math.max(0, -remaining);
      water = Math.max(0, remaining);
      finalTotal = totalRequired + excess;
      requiredPercent = totalRequired > 0 ? glucosePerDay * patientWeight * 100 / totalRequired : 0;
    }
  }

  const glucoseRate = glucosePerDay * 1000 / 1440;
  const heparin = finalTotal ? heparinInput * finalTotal * 10 / 5000 : 0;

  const labelMultiplier = options.fourLine ? weight * 1.2 : weight;
  const labelGlucose = glucosePerDay * labelMultiplier;
  const labelProteins = proteinPerKg * labelMultiplier;
  const labelLipids = lipidPerKg * labelMultiplier;
  const labelNa = sodiumPerKg * labelMultiplier;
  const labelK = potassiumPerKg * labelMultiplier;
  const labelCa = num(form.d_Ca) * labelMultiplier;
  const labelMg = num(form.d_Mg) * labelMultiplier;
  const labelVolume = Math.max(0, (totalVolume - milk - drugs - (options.check3 ? lipid : 0)) * (options.fourLine ? 1.2 : 1) + excess * (options.fourLine && !options.check3 ? 2 : 1));
  const osmolarity = labelVolume > 0 ?
      ((labelProteins * 1000 / labelVolume) * 10) + ((labelGlucose * 1000 / labelVolume) * 5) + 
      ((labelNa * 1000 / labelVolume) * 2) + ((labelK * 1000 / labelVolume) * 2)
      : 0;

  return {
    c_sg25: sg25, 
    c_sg10: 0, 
    c_dest_steril_H2O: water, 
    c_Aminosteril10: protein,
    c_Nacl: nacl, 
    c_Mgso4: magnesium, 
    c_CaGlucose: calcium, 
    c_Kcl15: kcl,
    c_Traces: tracesForSubtotal, 
    c_Intralipid: lipid, 
    c_vitamens: vitamins, 
    c_glucophos: glucophos,
    c_heparin: heparin, 
    c_total_required: totalRequired, 
    c_subtotal: subtotal,
    c_remain: remaining >= 0 ? water : 0, 
    c_excess: excess, 
    c_final_total: finalTotal, 
    c_osmolarity: osmolarity,
    glucosePerDay, 
    glucoseRate, 
    label: {
      L_gluc_gmday: labelGlucose, 
      L_proteins: labelProteins, 
      L_lipids: labelLipids,
      L_Na: labelNa, 
      L_k: labelK, 
      L_Ca: labelCa, 
      L_Mg: labelMg,
      L_vitamens: num(form.d_vitamens) ? "Positive" : "Negative",
      L_Traces_element: num(form.d_Traces_element) ? "Positive" : "Negative",
      L_Glucophos: glucosePhosphateSodium ? "Positive" : "Negative",
      L_heparin: heparinInput ? "Positive" : "Negative", 
      L_total_volume: labelVolume, 
      L_excess: excess,
    },
    warnings: sodiumToSupply < 0 ? ["Glucophos exceeds the available sodium; NaCl was set to zero."] : [],
  };
}

function calculateHeparinPreview(form) {
  const weight = num(form.a_pes_weight);
  const protein = formulaA(10, 100, num(form.d_proteins) * weight);
  const lipid = formulaA(20, 100, num(form.d_lipids) * weight);
  const sodium = formulaA(13, 26, num(form.d_Na) * weight);
  const potassium = formulaA(10, 5, num(form.d_K) * weight);
  const calcium = num(form.d_Ca) * weight;
  const magnesium = num(form.d_Mg) * weight;
  const traces = num(form.d_Traces_element) * weight;
  const vitamins = num(form.d_vitamens) * weight;
  const glucophos = num(form.d_Glucophos) * weight;
  const heparin = num(form.d_heparin) * (10 * num(form.d_Tvol)) / 5000;
  const milk = num(form.d_milk);
  const drugs = num(form.d_drugs);
  const subtotal = protein + sodium + magnesium + calcium + potassium + traces + lipid + milk + drugs;
  const totalRequired = num(form.d_total_volume) * weight - milk - drugs;
  const remaining = totalRequired - subtotal;

  return {
    c_sg25: 0, c_sg10: 0, c_dest_steril_H2O: 0, c_Aminosteril10: protein,
    c_Nacl: sodium, c_Mgso4: magnesium, c_CaGlucose: calcium, c_Kcl15: potassium,
    c_Traces: traces, c_Intralipid: lipid, c_vitamens: vitamins, c_glucophos: glucophos,
    c_heparin: heparin, c_total_required: totalRequired, c_subtotal: subtotal,
    c_remain: remaining, c_excess: 0, c_final_total: 0, c_osmolarity: 0,
    glucosePerDay: num(form.d_gluc_gmkgday), glucoseRate: num(form.d_gluc_mgkgmin),
    label: {
      L_gluc_gmday: 0, L_proteins: 0, L_lipids: 0, L_Na: 0, L_k: 0, L_Ca: 0, L_Mg: 0,
      L_vitamens: num(form.d_vitamens) ? "Positive" : "Negative",
      L_Traces_element: num(form.d_Traces_element) ? "Positive" : "Negative",
      L_Glucophos: num(form.d_Glucophos) ? "Positive" : "Negative",
      L_heparin: num(form.d_heparin) ? "Positive" : "Negative",
      L_total_volume: 0, L_excess: 0,
    },
    warnings: [],
  };
}

function orderFromDatabase(row, companies) {
  const company = companies.find((item) => String(item.COMP_CODE) === String(row.COMP_CODE));
  const form = {
    a_request_date: row.REQUEST_DATE ? String(row.REQUEST_DATE).slice(0, 10) : "",
    a_pes_name: row.PES_NAME || "",
    a_pes_birth_date: row.PES_BIRTH_DATE ? String(row.PES_BIRTH_DATE).slice(0, 10) : "",
    a_pes_weight: row.PES_WEIGHT ?? "",
    a_comp_code: row.COMP_CODE ?? "",
    a_comp_name: company?.COMP_NAME || "",
    d_milk: row.D_MILK ?? 0,
    d_drugs: row.D_DRUGS ?? 0,
    d_gluc_mgkgmin: row.D_GLUC_MGKGMIN ?? 0,
    d_gluc_gmkgday: row.D_GLUC_GMKGDAY ?? 0,
    d_Gluc_percent: row.D_GLUC_PERCENT ?? 0,
    d_Tvol: row.D_TVOL ?? 0,
    d_proteins: row.D_PROTEINS ?? 0,
    d_lipids: row.D_LIPIDS ?? 0,
    d_Na: row.D_NA ?? 0,
    d_K: row.D_K ?? 0,
    d_Ca: row.D_CA ?? 0,
    d_Mg: row.D_MG ?? 0,
    d_vitamens: row.D_VITAMENS ?? 0,
    d_Traces_element: row.D_TRACES_ELEMENT ?? 0,
    d_Glucophos: row.D_GLUCOPHOS ?? 0,
    d_heparin: row.D_HEPARIN ?? 0,
    d_total_volume: row.D_TOTAL_VOLUME ?? 0,
  };
  const options = {
    protein: row.OPTION_R ? "R" : row.OPTION_H ? "H" : "N",
    lipid: row.OPTION_10 ? "10" : "20",
    sodium: row.OPTION_09 ? "09" : "27",
    fourLine: Boolean(row.CHECK_4LINE),
    check3: Boolean(row.SP),
    glucoseMode: row.OPTION_P ? "P" : "C",
  };
  return {
    ...form,
    orderId: String(row.PRESCRIBE_ORDER_ID),
    requestNo: row.REQUEST_NO == null ? "" : String(row.REQUEST_NO),
    options,
    calculation: calculateOrder(form, options),
    localOnly: false,
  };
}

const PrescribeOrder = () => {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isRTL = mounted && i18n.language === "ar";
  const t = (en, ar) => isRTL ? ar : en;
  const [orders, setOrders] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState("");
  const [companyResults, setCompanyResults] = useState([]);
  const [companySearchDone, setCompanySearchDone] = useState(false);
  const [companyError, setCompanyError] = useState("");
  const [search, setSearch] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [options, setOptions] = useState({ protein: "N", lipid: "20", sodium: "27", fourLine: false, check3: false, glucoseMode: "C" });
  const [calculationOverride, setCalculationOverride] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    const loadCompanies = async () => {
      try {
        const response = await fetch("/api/companies");
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load companies.");
        if (isCurrent) setCompanies(Array.isArray(data.companies) ? data.companies : []);
      } catch (error) {
        if (isCurrent) setCompanyError(error.message || "Failed to load companies.");
      }
    };
    loadCompanies();
    return () => { isCurrent = false; };
  }, []);

  useEffect(() => {
    if (companies.length === 0) return;
    setOrders((current) => current.map((order) => {
      const company = companies.find((item) => String(item.COMP_CODE) === String(order.a_comp_code));
      return company ? { ...order, a_comp_name: company.COMP_NAME } : order;
    }));
  }, [companies]);

  const calculatedOrder = useMemo(() => calculateOrder(form, options), [form, options]);
  const calculation = calculationOverride || calculatedOrder;
  useEffect(() => setCalculationOverride(null), [form, options]);
  const selectedCompany = companies.find((company) => String(company.COMP_CODE) === String(form.a_comp_code));
  const searchOrders = async () => {
    const query = search.trim();
    setSearchError("");
    if (!query) {
      setOrders([]);
      setHasSearched(false);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(`/api/prescribeOrders?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to search prescribe orders.");
      setOrders(Array.isArray(data.orders) ? data.orders.map((order) => orderFromDatabase(order, companies)) : []);
      setHasSearched(true);
    } catch (error) {
      setOrders([]);
      setHasSearched(true);
      setSearchError(error.message || "Failed to search prescribe orders.");
    } finally {
      setSearching(false);
    }
  };

  const openAddForm = () => {
    setForm({ ...emptyForm, a_request_date: today() });
    setCompanySearch("");
    setCompanyResults([]);
    setCompanySearchDone(false);
    setOptions({ protein: "N", lipid: "20", sodium: "27", fourLine: false, check3: false, glucoseMode: "C" });
    setShowLabel(false);
    setShowForm(true);
  };
  
  const closeForm = () => setShowForm(false);
  const handleSearchChange = (event) => setSearch(event.target.value);
  const handleRequestDateChange = (event) => setForm((current) => ({ ...current, a_request_date: event.target.value }));
  const handlePatientNameChange = (event) => setForm((current) => ({ ...current, a_pes_name: event.target.value }));
  const handleBirthDateChange = (event) => setForm((current) => ({ ...current, a_pes_birth_date: event.target.value }));
  const handlePatientWeightChange = (event) => setForm((current) => ({ ...current, a_pes_weight: event.target.value }));
  const handleMilkChange = (event) => setForm((current) => ({ ...current, d_milk: event.target.value }));
  const handleDrugsChange = (event) => setForm((current) => ({ ...current, d_drugs: event.target.value }));
  const handleGlucoseRateChange = (event) => setForm((current) => ({ ...current, d_gluc_mgkgmin: event.target.value }));
  const handleGlucosePerDayChange = (event) => setForm((current) => ({ ...current, d_gluc_gmkgday: event.target.value }));
  const handleGlucosePercentChange = (event) => setForm((current) => ({ ...current, d_Gluc_percent: event.target.value }));
  const handleTvolChange = (event) => setForm((current) => ({ ...current, d_Tvol: event.target.value }));
  const handleProteinsChange = (event) => setForm((current) => ({ ...current, d_proteins: event.target.value }));
  const handleLipidsChange = (event) => setForm((current) => ({ ...current, d_lipids: event.target.value }));
  const handleSodiumChange = (event) => setForm((current) => ({ ...current, d_Na: event.target.value }));
  const handlePotassiumChange = (event) => setForm((current) => ({ ...current, d_K: event.target.value }));
  const handleCalciumChange = (event) => setForm((current) => ({ ...current, d_Ca: event.target.value }));
  const handleMagnesiumChange = (event) => setForm((current) => ({ ...current, d_Mg: event.target.value }));
  const handleVitaminsChange = (event) => setForm((current) => ({ ...current, d_vitamens: event.target.value }));
  const handleTraceElementsChange = (event) => setForm((current) => ({ ...current, d_Traces_element: event.target.value }));
  const handleGlucophosChange = (event) => setForm((current) => ({ ...current, d_Glucophos: event.target.value }));
  const handleHeparinChange = (event) => setForm((current) => ({ ...current, d_heparin: event.target.value }));
  const handleTotalVolumeChange = (event) => setForm((current) => ({ ...current, d_total_volume: event.target.value }));
  const selectCompany = (company) => {
    setForm((current) => ({ ...current, a_comp_code: company ? String(company.COMP_CODE) : "", a_comp_name: company?.COMP_NAME || "" }));
    setCompanySearch("");
    setCompanyResults([]);
    setCompanySearchDone(false);
  };
  const handleCompanySearchChange = (event) => {
    const value = event.target.value;
    setCompanySearch(value);
    if (!value.trim()) {
      setCompanyResults([]);
      setCompanySearchDone(false);
    }
  };
  const handleCompanySearch = (event) => {
    event.preventDefault();
    const query = normalizeCompanySearch(companySearch);
    if (!query) {
      setCompanyResults([]);
      setCompanySearchDone(false);
      return;
    }
    setCompanyResults(companies.filter((company) => normalizeCompanySearch(company.COMP_NAME).includes(query)));
    setCompanySearchDone(true);
  };
  const handleFourLineChange = (event) => setOptions((current) => ({ ...current, fourLine: event.target.checked }));
  const handleGlucoseOptionChange = (event) => setOptions((current) => ({ ...current, glucoseMode: event.target.value }));
  const handleProteinOptionChange = (event) => setOptions((current) => ({ ...current, protein: event.target.value }));
  const handleLipidOptionChange = (event) => setOptions((current) => ({ ...current, lipid: event.target.value }));
  const handleSodiumOptionChange = (event) => setOptions((current) => ({ ...current, sodium: event.target.value }));
  const handleSpChange = (event) => setOptions((current) => ({ ...current, check3: event.target.checked }));

  const focusField = (id) => document.getElementById(id)?.focus();
  
  const handleNumericKeyDown = (event, onEnter, onEscape, invalidKeyFocus, filterInvalid = true) => {
    if (event.key === "Enter" || event.key === "/") {
      event.preventDefault();
      onEnter();
      return;
    }
    if (event.key === "Escape") {
      onEscape?.();
      return;
    }
    if (event.key.length === 1 && !/[0-9.]/.test(event.key) && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      if (filterInvalid && invalidKeyFocus) focusField(invalidKeyFocus);
    }
  };

  const handleRequestDateKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!form.a_request_date) return toast.error(t("Enter the request date.", "أدخل تاريخ الطلب."));
      focusField("companyCode");
    }
  };
  const handlePatientNameKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!form.a_pes_name.trim()) return focusField("a_pes_name");
      focusField("a_pes_birth_date");
    } else if (event.key === "Escape") focusField("a_request_date");
  };
  const handleBirthDateKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    focusField("a_pes_weight");
  };
  const handlePatientWeightKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!form.a_pes_weight) return toast.error(t("Enter the patient weight.", "أدخل وزن المريض."));
    focusField("CHECK_4LINE");
  };
  const handleFourLineKeyDown = (event) => {
    if (event.key === "Enter") { event.preventDefault(); focusField("glucoseMode"); }
  };
  const handleGlucoseOptionKeyDown = (event) => {
    if (event.key === "Enter") { event.preventDefault(); focusField("proteinOption"); }
  };
  const handleProteinOptionKeyDown = (event) => {
    if (event.key === "Enter") { event.preventDefault(); focusField("d_milk"); }
  };
  const handleMilkKeyDown = (event) => handleNumericKeyDown(event, () => {
    if (form.d_milk === "") setForm((current) => ({ ...current, d_milk: "0" }));
    focusField("d_drugs");
  }, undefined, "d_Mg");
  const handleDrugsKeyDown = (event) => handleNumericKeyDown(event, () => {
    if (form.d_drugs === "") setForm((current) => ({ ...current, d_drugs: "0" }));
    focusField("d_gluc_mgkgmin");
  }, undefined, "d_Mg");
  const handleGlucoseRateKeyDown = (event) => handleNumericKeyDown(event, () => {
    const rate = form.d_gluc_mgkgmin;
    setForm((current) => rate === ""
      ? { ...current, d_Gluc_percent: "0" }
      : { ...current, d_Gluc_percent: "0", d_Tvol: "0", d_gluc_gmkgday: fmt(num(rate) * 1440 / 1000) });
    focusField("d_gluc_gmkgday");
  }, undefined, "d_gluc_mgkgmin");
  const handleGlucosePerDayKeyDown = (event) => handleNumericKeyDown(event, () => {
    const daily = form.d_gluc_gmkgday;
    if (daily === "") toast.error(t("Enter a glucose amount.", "أدخل كمية الجلوكوز."));
    setForm((current) => daily === ""
      ? { ...current, d_gluc_gmkgday: "0" }
      : { ...current, d_Gluc_percent: "0", d_Tvol: "0", d_gluc_mgkgmin: fmt(num(daily) * 1000 / 1440) });
    focusField("d_proteins");
  }, undefined, "d_gluc_gmkgday");
  const handleGlucosePercentKeyDown = (event) => handleNumericKeyDown(event, () => {
    if (form.d_Gluc_percent === "") setForm((current) => ({ ...current, d_gluc_gmkgday: "0" }));
    focusField("d_total_volume");
  }, undefined, "d_gluc_mgkgmin");

  const handleTvolKeyDown = (event) => handleNumericKeyDown(event, () => {
    const volume = form.d_Tvol;
    setForm((current) => ({ ...current, d_gluc_gmkgday: volume === "" ? "0" : fmt(num(volume) * num(current.d_Gluc_percent) / 100) }));
    focusField("d_proteins");
  }, undefined, "d_gluc_mgkgmin");

  const handleProteinsKeyDown = (event) => handleNumericKeyDown(event, () => {
    if (form.d_proteins === "") {
      toast.error(t("Enter the protein amount.", "أدخل كمية البروتين."));
      setForm((current) => ({ ...current, d_proteins: "0" }));
    }
    focusField("SP");
  }, undefined, undefined, false);
  const handleSpKeyDown = (event) => {
    if (event.key === "Enter") { event.preventDefault(); focusField("lipidOption"); }
  };
  const handleLipidOptionKeyDown = (event) => {
    if (event.key === "Enter") { event.preventDefault(); focusField("d_lipids"); }
  };
  const handleLipidsKeyDown = (event) => handleNumericKeyDown(event, () => {
    if (form.d_lipids === "") {
      toast.error(t("Enter the lipid amount.", "أدخل كمية الدهون."));
      setForm((current) => ({ ...current, d_lipids: "0" }));
    }
    focusField("sodiumOption");
  }, undefined, "d_lipids");
  const handleSodiumOptionKeyDown = (event) => {
    if (event.key === "Enter") { event.preventDefault(); focusField("d_Na"); }
  };
  const handleSodiumKeyDown = (event) => handleNumericKeyDown(event, () => {
    if (form.d_Na === "") {
      toast.error(t("Enter the sodium amount.", "أدخل كمية الصوديوم."));
      setForm((current) => ({ ...current, d_Na: "0" }));
    }
    focusField("d_K");
  }, undefined, "d_Na");
  const handlePotassiumKeyDown = (event) => handleNumericKeyDown(event, () => {
    if (form.d_K === "") {
      toast.error(t("Enter the potassium amount.", "أدخل كمية البوتاسيوم."));
      setForm((current) => ({ ...current, d_K: "0" }));
    }
    focusField("d_Ca");
  }, undefined, "d_K");
  const handleCalciumKeyDown = (event) => handleNumericKeyDown(event, () => {
    if (form.d_Ca === "") {
      toast.error(t("Enter the calcium amount.", "أدخل كمية الكالسيوم."));
      setForm((current) => ({ ...current, d_Ca: "0" }));
    }
    focusField("d_Mg");
  }, undefined, "d_Ca");
  const handleMagnesiumKeyDown = (event) => handleNumericKeyDown(event, () => {
    if (form.d_Mg === "") {
      toast.error(t("Enter the magnesium amount.", "أدخل كمية المغنيسيوم."));
      setForm((current) => ({ ...current, d_Mg: "0" }));
    }
    focusField("d_vitamens");
  }, undefined, "d_Mg");
  const handleVitaminsKeyDown = (event) => handleNumericKeyDown(event, () => {
    if (form.d_vitamens === "") {
      toast.error(t("Enter the vitamin amount.", "أدخل كمية الفيتامينات."));
      setForm((current) => ({ ...current, d_vitamens: "0" }));
    }
    focusField("d_Traces_element");
  }, undefined, "d_Mg");
  const handleTraceElementsKeyDown = (event) => handleNumericKeyDown(event, () => {
    if (form.d_Traces_element === "") {
      toast.error(t("Enter the trace-element amount.", "أدخل كمية العناصر النزرة."));
      setForm((current) => ({ ...current, d_Traces_element: "0" }));
    }
    focusField("d_Glucophos");
  }, undefined, "d_Mg");
  const handleGlucophosKeyDown = (event) => handleNumericKeyDown(event, () => {
    if (form.d_Glucophos === "") {
      toast.error(t("Enter the Glucophos amount.", "أدخل كمية الجلوكوفوس."));
      setForm((current) => ({ ...current, d_Glucophos: "0" }));
    }
    focusField("d_heparin");
  }, undefined, "d_Mg");

  const handleHeparinKeyDown = (event) => handleNumericKeyDown(event, () => {
    if (form.d_heparin === "") {
      setForm((current) => ({ ...current, d_heparin: "0" }));
      focusField("d_total_volume");
    } else if (num(form.d_Gluc_percent) === 0) {
      focusField("d_total_volume");
    } else {
      setCalculationOverride(calculateHeparinPreview(form));
      setShowLabel(false);
      focusField("labelPreviewToggle");
    }
  }, undefined, "d_Mg");

  const handleTotalVolumeKeyDown = (event) => handleNumericKeyDown(event, () => {
    if (form.d_total_volume === "") {
      toast.error(t("Enter a total volume.", "أدخل الحجم الكلي."));
      focusField("d_total_volume");
      return;
    }
    if (num(form.d_Gluc_percent) === 0) {
      const result = calculateOrder(form, options);
      setCalculationOverride(result);
      if (options.glucoseMode === "P") {
        setForm((current) => ({
          ...current,
          d_gluc_gmkgday: fmt(result.glucosePerDay),
          d_gluc_mgkgmin: fmt(result.glucoseRate),
        }));
      }
      focusField("printOrderButton");
    }
  }, undefined, "d_total_volume");
  
  const saveOrder = async (event) => {
    event.preventDefault();
    if (!form.a_pes_name.trim()) return toast.error(t("Enter the patient name.", "أدخل اسم المريض."));
    if (!form.a_pes_weight || num(form.a_pes_weight) <= 0) return toast.error(t("Enter a patient weight greater than zero.", "أدخل وزنًا للمريض أكبر من صفر."));

    const payload = {
      REQUEST_DATE: form.a_request_date,
      COMP_FLAG: Boolean(form.a_comp_code),
      COMP_CODE: form.a_comp_code,
      PES_NAME: form.a_pes_name.trim(),
      PES_BIRTH_DATE: form.a_pes_birth_date,
      PES_WEIGHT: form.a_pes_weight,
      CHECK_4LINE: options.fourLine,
      OPTION_C: options.glucoseMode === "C",
      OPTION_P: options.glucoseMode === "P",
      OPTION_N: options.protein === "N",
      OPTION_R: options.protein === "R",
      OPTION_H: options.protein === "H",
      D_MILK: form.d_milk,
      D_DRUGS: form.d_drugs,
      D_GLUC_MGKGMIN: calculation.glucoseRate,
      D_GLUC_PERCENT: form.d_Gluc_percent,
      D_TVOL: form.d_Tvol,
      D_GLUC_GMKGDAY: calculation.glucosePerDay,
      D_PROTEINS: form.d_proteins,
      SP: options.check3,
      OPTION_10: options.lipid === "10",
      OPTION_20: options.lipid === "20",
      D_LIPIDS: form.d_lipids,
      OPTION_27: options.sodium === "27",
      OPTION_09: options.sodium === "09",
      D_NA: form.d_Na,
      D_K: form.d_K,
      D_CA: form.d_Ca,
      D_MG: form.d_Mg,
      D_VITAMENS: form.d_vitamens,
      D_TRACES_ELEMENT: form.d_Traces_element,
      D_GLUCOPHOS: form.d_Glucophos,
      D_HEPARIN: form.d_heparin,
      D_TOTAL_VOLUME: form.d_total_volume,
      PERFUSION: {
        C_SG25: calculation.c_sg25,
        C_SG10: calculation.c_sg10,
        C_DESC_STERIL_H2O: calculation.c_dest_steril_H2O,
        C_AMINOSTERIL10: calculation.c_Aminosteril10,
        C_NACL: calculation.c_Nacl,
        C_MGSO4: calculation.c_Mgso4,
        C_CAGLUCOSE: calculation.c_CaGlucose,
        C_KCL15: calculation.c_Kcl15,
        C_TRACES: calculation.c_Traces,
        C_INTRALIPID: calculation.c_Intralipid,
        C_VITAMENS: calculation.c_vitamens,
        C_GLUCOPHOS: calculation.c_glucophos,
        C_HEPARIN: calculation.c_heparin,
        C_TOTAL_REQUIRED: calculation.c_total_required,
        C_SUBTOTAL: calculation.c_subtotal,
        C_REMAIN: calculation.c_remain,
        C_EXCESS: calculation.c_excess,
        C_FINAL_TOTAL: calculation.c_final_total,
        C_OSMOLARITY: calculation.c_osmolarity,
      },
      LABEL: {
        L_GLUC_GMDAY: calculation.label.L_gluc_gmday,
        L_PROTEINS: calculation.label.L_proteins,
        L_LIPIDS: calculation.label.L_lipids,
        L_NA: calculation.label.L_Na,
        L_K: calculation.label.L_k,
        L_CA: calculation.label.L_Ca,
        L_MG: calculation.label.L_Mg,
        L_TOTAL_VOLUME: calculation.label.L_total_volume,
        L_EXCESS: calculation.label.L_excess,
        L_VITAMENS: calculation.label.L_vitamens,
        L_TRACES_ELEMET: calculation.label.L_Traces_element,
        L_HEPARIN: calculation.label.L_heparin,
        L_GLUCOPHOS: calculation.label.L_Glucophos,
      },
    };

    try {
      setSaving(true);
      const response = await fetch("/api/prescribeOrders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save prescribe order.");

      const savedOrder = data.order;
      const record = {
        ...form,
        d_gluc_gmkgday: fmt(calculation.glucosePerDay),
        d_gluc_mgkgmin: fmt(calculation.glucoseRate),
        orderId: String(savedOrder.PRESCRIBE_ORDER_ID),
        requestNo: String(savedOrder.REQUEST_NO),
        options: { ...options },
        calculation,
        localOnly: false,
      };
      setOrders([record]);
      setSearch(form.a_pes_name);
      setHasSearched(true);
      setShowForm(false);
      toast.success(t("Prescribe order saved.", "تم حفظ الوصفة."));
    } catch (error) {
      console.error("Save prescribe order error:", error);
      toast.error(error.message || t("Unable to save prescribe order.", "تعذر حفظ الوصفة."));
    } finally {
      setSaving(false);
    }
  };
  const printOrder = () => {
    setShowLabel(true);
    window.setTimeout(() => window.print(), 0);
  };

  const renderResults = (result) => (
    <div className="prescribe-order-results">
      <div className="prescribe-order-result"><span>SG 25%</span><strong>{fmt(result.c_sg25)} ml</strong></div>
      <div className="prescribe-order-result"><span>SG 10%</span><strong>{fmt(result.c_sg10)} ml</strong></div>
      <div className="prescribe-order-result"><span>{t("Sterile water", "ماء معقم")}</span><strong>{fmt(result.c_dest_steril_H2O)} ml</strong></div>
      <div className="prescribe-order-result"><span>Aminosteril 10%</span><strong>{fmt(result.c_Aminosteril10)} ml</strong></div>
      <div className="prescribe-order-result"><span>NaCl</span><strong>{fmt(result.c_Nacl)} ml</strong></div>
      <div className="prescribe-order-result"><span>MgSO₄</span><strong>{fmt(result.c_Mgso4)} ml</strong></div>
      <div className="prescribe-order-result"><span>{t("Calcium gluconate", "جلوكونات الكالسيوم")}</span><strong>{fmt(result.c_CaGlucose)} ml</strong></div>
      <div className="prescribe-order-result"><span>KCl 15%</span><strong>{fmt(result.c_Kcl15)} ml</strong></div>
      <div className="prescribe-order-result"><span>{t("Trace elements", "العناصر النزرة")}</span><strong>{fmt(result.c_Traces)} ml</strong></div>
      <div className="prescribe-order-result"><span>Intralipid</span><strong>{fmt(result.c_Intralipid)} ml</strong></div>
      <div className="prescribe-order-result"><span>{t("Vitamins", "الفيتامينات")}</span><strong>{fmt(result.c_vitamens)} ml</strong></div>
      <div className="prescribe-order-result"><span>Glucophos</span><strong>{fmt(result.c_glucophos)} ml</strong></div>
      <div className="prescribe-order-result"><span>Heparin</span><strong>{fmt(result.c_heparin)} ml</strong></div>
      <div className="prescribe-order-result"><span>{t("Total required", "الإجمالي المطلوب")}</span><strong>{fmt(result.c_total_required)} ml</strong></div>
      <div className="prescribe-order-result"><span>{t("Subtotal", "المجموع الفرعي")}</span><strong>{fmt(result.c_subtotal)} ml</strong></div>
      <div className="prescribe-order-result"><span>{t("Remaining", "المتبقي")}</span><strong>{fmt(result.c_remain)} ml</strong></div>
      <div className="prescribe-order-result"><span>{t("Excess", "الزيادة")}</span><strong>{fmt(result.c_excess)} ml</strong></div>
      <div className="prescribe-order-result"><span>{t("Final total", "الإجمالي النهائي")}</span><strong>{fmt(result.c_final_total)} ml</strong></div>
      <div className="prescribe-order-result"><span>{t("Osmolarity", "الأسمولارية")}</span><strong>{fmt(result.c_osmolarity)} mOsm/L</strong></div>
    </div>
  );

  const renderLabel = (orderForm, result) => (
    <div className="prescribe-order-label">
      <div className="prescribe-order-label-heading"><div><h3>{t("Nutrition label", "ملصق التغذية")}</h3><p>{orderForm.a_pes_name} · {orderForm.a_request_date}</p></div></div>
      <div className="prescribe-order-results">
        <div className="prescribe-order-result"><span>L_gluc_gmday</span><strong>{fmt(result.label.L_gluc_gmday)}</strong></div>
        <div className="prescribe-order-result"><span>L_proteins</span><strong>{fmt(result.label.L_proteins)}</strong></div>
        <div className="prescribe-order-result"><span>L_lipids</span><strong>{fmt(result.label.L_lipids)}</strong></div>
        <div className="prescribe-order-result"><span>L_Na</span><strong>{fmt(result.label.L_Na)}</strong></div>
        <div className="prescribe-order-result"><span>L_k</span><strong>{fmt(result.label.L_k)}</strong></div>
        <div className="prescribe-order-result"><span>L_Ca</span><strong>{fmt(result.label.L_Ca)}</strong></div>
        <div className="prescribe-order-result"><span>L_Mg</span><strong>{fmt(result.label.L_Mg)}</strong></div>
        <div className="prescribe-order-result"><span>L_vitamens</span><strong>{result.label.L_vitamens}</strong></div>
        <div className="prescribe-order-result"><span>L_Traces_element</span><strong>{result.label.L_Traces_element}</strong></div>
        <div className="prescribe-order-result"><span>L_Glucophos</span><strong>{result.label.L_Glucophos}</strong></div>
        <div className="prescribe-order-result"><span>L_heparin</span><strong>{result.label.L_heparin}</strong></div>
        <div className="prescribe-order-result"><span>L_total_volume</span><strong>{fmt(result.label.L_total_volume)}</strong></div>
        <div className="prescribe-order-result"><span>L_excess</span><strong>{fmt(result.label.L_excess)}</strong></div>
      </div>
      <p className="prescribe-order-osmolarity">{t("Osmolarity", "الأسمولارية")}: {fmt(result.c_osmolarity)} mOsm/L</p>
    </div>
  );

  return (
    <div className="subject-page prescribe-order-page" dir={isRTL ? "rtl" : "ltr"}>
      <div className="subject-header">
        <div><h1 className="subject-title">{t("Prescribe Orders", "أوامر الوصفات")}</h1>
          <p className="subject-subtitle">{t("Calculate an order and preview its nutrition label.", "احسب الوصفة وعاين ملصق التغذية.")}</p>
        </div>
        <button type="button" className="subject-add-button" onClick={openAddForm}><span className="subject-add-icon">+</span>{t("Add Prescribe Order", "إضافة وصفة")}</button>
      </div>

      <div className="subject-toolbar">
        <div className="subject-search">
          <span className="subject-search-icon">🔍</span>
          <input name="patientNameSearch" value={search} onChange={handleSearchChange} placeholder={t("Search by patient name…", "ابحث باسم المريض…")} onKeyDown={(event) => { if (event.key === "Enter") searchOrders(); }} />
          <button type="button" onClick={searchOrders} disabled={searching}>{searching ? t("Searching…", "جارٍ البحث…") : t("Search", "بحث")}</button>
        </div>
        <div className="subject-count">{hasSearched && !searching ? t(`${orders.length} order${orders.length === 1 ? "" : "s"}`, `${orders.length} وصفة`) : ""}</div>
      </div>

      {searchError && <div className="subject-error">{searchError}</div>}
      {searching ? <div className="subject-loading">{t("Searching prescribe orders…", "جارٍ البحث عن الوصفات…")}</div>
        : !hasSearched ? <div className="subject-search-message">{t("Search prescribe orders by patient name, or add a new order.", "ابحث عن الوصفات باسم المريض أو أضف وصفة جديدة.")}</div>
        : orders.length === 0 ? <div className="subject-search-message">{t("No prescribe orders found.", "لا توجد وصفات.")}</div>
          : <div className="subject-table-wrapper"><table className="subject-table prescribe-order-table"><thead><tr>
            <th>{t("Request No", "رقم الطلب")}</th><th>{t("Date", "التاريخ")}</th><th>{t("Patient", "المريض")}</th><th>{t("Weight", "الوزن")}</th><th>{t("Total volume", "الحجم الكلي")}</th><th>{t("Actions", "الإجراءات")}</th>
          </tr></thead><tbody>{orders.map((order) => <tr key={order.orderId}>
            <td>{order.requestNo || order.orderId}</td><td>{order.a_request_date || "—"}</td><td><div className="subject-name">{order.a_pes_name}</div></td>
            <td>{order.a_pes_weight} kg</td><td>{fmt(order.calculation.c_final_total)} ml</td><td><div className="subject-actions">
              <button type="button" className="subject-edit-button" onClick={() => setViewingOrder(order)}>{t("Preview", "معاينة")}</button>
              <button type="button" className="subject-coupon-button" onClick={() => { setViewingOrder(order); setTimeout(printOrder, 0); }}>{t("Print", "طباعة")}</button>
            </div></td>
          </tr>)}</tbody></table></div>}

      {showForm && <div className="subject-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
        <div className="subject-modal prescribe-order-modal">
          <div className="subject-modal-header"><div><h2>{t("Add Prescribe Order", "إضافة وصفة جديدة")}</h2><p>{t("Enter the patient and prescription values to calculate the order.", "أدخل بيانات المريض والوصفة لحساب المكونات.")}</p></div>
            <button type="button" className="subject-close-button" onClick={closeForm} disabled={saving}>×</button>
          </div>

          <form className="subject-form" onSubmit={saveOrder}>
            <section className="prescribe-order-form-section">
              <h3>{t("Patient and request", "بيانات المريض والطلب")}</h3>
              <div className="subject-form-grid">
                <div className="subject-form-group">
                  <label htmlFor="a_request_date">{t("Request date", "تاريخ الطلب")}</label>
                  <input id="a_request_date" name="a_request_date" type="date" value={form.a_request_date} onChange={handleRequestDateChange} onKeyDown={handleRequestDateKeyDown} required />
                </div>

                <div className="subject-form-group prescribe-order-company-field">
                  <label htmlFor="companyCode">{t("Company (optional)", "الشركة (اختياري)")}</label>
                  <div className="prescribe-order-company-search">
                    <div className="prescribe-order-company-search-row">
                    <input
                      id="companyCode"
                      name="a_comp_code"
                      type="search"
                      autoComplete="off"
                      value={companySearch}
                      onChange={handleCompanySearchChange}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleCompanySearch(event);
                      }}
                      placeholder={selectedCompany?.COMP_NAME || t("Search company name…", "ابحث باسم الشركة...")}
                      aria-label={t("Search companies", "البحث عن شركة")}
                    />
                    <button type="button" onClick={handleCompanySearch}>{t("Search", "بحث")}</button>
                    </div>
                    {selectedCompany && <div className="prescribe-order-selected-company">
                      <span>{t("Selected company", "الشركة المختارة")}: <strong>{selectedCompany.COMP_NAME}</strong></span>
                      <button type="button" onClick={() => selectCompany(null)}>{t("Remove", "إزالة")}</button>
                    </div>}
                    {companySearchDone && companyResults.length === 0 ? (
                      <div className="prescribe-order-company-message">{t("No companies found.", "لم يتم العثور على شركات.")}</div>
                    ) : companyResults.length > 0 ? (
                      <div className="prescribe-order-company-results">
                        {companyResults.map((company) => <button
                          type="button"
                          key={company.COMP_CODE}
                          className={`prescribe-order-company-result${String(company.COMP_CODE) === String(form.a_comp_code) ? " selected" : ""}`}
                          onClick={() => selectCompany(company)}
                        >{company.COMP_NAME || "—"}</button>)}
                      </div>
                    ) : !selectedCompany ? (
                      <div className="prescribe-order-company-message">{t("Search for a company or leave this field empty.", "ابحث عن شركة أو اترك هذا الحقل فارغاً.")}</div>
                    ) : null}
                  </div>
                  {companyError && <small className="prescribe-order-company-error">{companyError}</small>}
                </div>

                <div className="subject-form-group">
                  <label htmlFor="a_pes_name">{t("Patient name", "اسم المريض")} *</label>
                  <input id="a_pes_name" name="a_pes_name" type="text" value={form.a_pes_name} onChange={handlePatientNameChange} onKeyDown={handlePatientNameKeyDown} maxLength={120} required />
                </div>

                <div className="subject-form-group">
                  <label htmlFor="a_pes_birth_date">{t("Birth date", "تاريخ الميلاد")}</label>
                  <input id="a_pes_birth_date" name="a_pes_birth_date" type="date" value={form.a_pes_birth_date} onChange={handleBirthDateChange} onKeyDown={handleBirthDateKeyDown} />
                </div>

                <div className="subject-form-group">
                  <label htmlFor="a_pes_weight">{t("Weight (kg)", "الوزن (كجم)")} *</label>
                  <input id="a_pes_weight" name="a_pes_weight" type="number" min="0.01" max="999.99" step="0.01" value={form.a_pes_weight} onChange={handlePatientWeightChange} onKeyDown={handlePatientWeightKeyDown} required />
                </div>
            </div>

              <div className="prescribe-order-patient-options">
                <label className="prescribe-order-check"><input id="CHECK_4LINE" type="checkbox" name="CHECK_4LINE" checked={options.fourLine} onChange={handleFourLineChange} onKeyDown={handleFourLineKeyDown} />{t("Check_4Line", "Check_4Line")}</label>
                <label>{t("Glucose option", "خيار الجلوكوز")}<select id="glucoseMode" name="glucoseMode" value={options.glucoseMode} onChange={handleGlucoseOptionChange} onKeyDown={handleGlucoseOptionKeyDown}><option value="C">C</option><option value="P">P</option></select></label>
                <label>{t("Protein option", "خيار البروتين")}<select id="proteinOption" name="proteinOption" value={options.protein} onChange={handleProteinOptionChange} onKeyDown={handleProteinOptionKeyDown}><option value="N">N</option><option value="R">R</option><option value="H">H</option></select></label>
              </div>
            </section>

            <section className="prescribe-order-form-section">
              <h3>{t("Daily prescription", "الوصفة اليومية")}</h3>
              <div className="subject-form-grid">
                <div className="subject-form-group"><label htmlFor="d_milk">{t("Milk (ml)", "الحليب (مل)")}</label><input id="d_milk" name="d_milk" type="number" min="0" step="0.01" value={form.d_milk} onChange={handleMilkChange} onKeyDown={handleMilkKeyDown} /></div>
                <div className="subject-form-group"><label htmlFor="d_drugs">{t("Drugs (ml)", "الأدوية (مل)")}</label><input id="d_drugs" name="d_drugs" type="number" min="0" step="0.01" value={form.d_drugs} onChange={handleDrugsChange} onKeyDown={handleDrugsKeyDown} /></div>
                <div className="subject-form-group"><label htmlFor="d_gluc_mgkgmin">{t("Glucose (mg/kg/min)", "الجلوكوز (ملجم/كجم/دقيقة)")}</label><input id="d_gluc_mgkgmin" name="d_gluc_mgkgmin" type="number" min="0" step="0.01" value={form.d_gluc_mgkgmin} onChange={handleGlucoseRateChange} onKeyDown={handleGlucoseRateKeyDown} /></div>
                <div className="subject-form-group"><label htmlFor="d_gluc_gmkgday">{t("Glucose (g/kg/day)", "الجلوكوز (جم/كجم/يوم)")}</label><input id="d_gluc_gmkgday" name="d_gluc_gmkgday" type="number" min="0" step="0.01" value={form.d_gluc_gmkgday} onChange={handleGlucosePerDayChange} onKeyDown={handleGlucosePerDayKeyDown} /></div>
                <div className="subject-form-group"><label htmlFor="d_Gluc_percent">{t("Glucose concentration (%)", "تركيز الجلوكوز (%)")}</label><input id="d_Gluc_percent" name="d_Gluc_percent" type="number" min="0" step="0.01" value={form.d_Gluc_percent} onChange={handleGlucosePercentChange} onKeyDown={handleGlucosePercentKeyDown} /></div>
                <div className="subject-form-group"><label htmlFor="d_Tvol">{t("T volume", "حجم T")}</label><input id="d_Tvol" name="d_Tvol" type="number" min="0" step="0.01" value={form.d_Tvol} onChange={handleTvolChange} onKeyDown={handleTvolKeyDown} /></div>
                <div className="subject-form-group"><label htmlFor="d_proteins">{t("Proteins (g/kg/day)", "البروتينات (جم/كجم/يوم)")}</label><input id="d_proteins" name="d_proteins" type="number" min="0" step="0.01" value={form.d_proteins} onChange={handleProteinsChange} onKeyDown={handleProteinsKeyDown} /></div>

            <section className="prescribe-order-form-section">
              <h3>{t("Additional options", "خيارات إضافية")}</h3>
              <div className="prescribe-order-options">
                <label>{t("Lipid concentration", "تركيز الدهون")}
                  <select id="lipidOption" name="lipidOption" value={options.lipid} onChange={handleLipidOptionChange} onKeyDown={handleLipidOptionKeyDown}>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                  </select>
                </label>

                <label className="prescribe-order-check">
                  <input id="SP" type="checkbox" name="SP" checked={options.check3} onChange={handleSpChange} onKeyDown={handleSpKeyDown} />
                    SP / Check3
                </label>


              </div>
            </section>


                <div className="subject-form-group"><label htmlFor="d_lipids">{t("Lipids (g/kg/day)", "الدهون (جم/كجم/يوم)")}</label><input id="d_lipids" name="d_lipids" type="number" min="0" step="0.01" value={form.d_lipids} onChange={handleLipidsChange} onKeyDown={handleLipidsKeyDown} /></div>
            <section className="prescribe-order-form-section">
              <h3>{t("Additional options", "خيارات إضافية")}</h3>
              <div className="prescribe-order-options">
                <label>{t("Sodium option", "خيار الصوديوم")}
                  <select id="sodiumOption" name="sodiumOption" value={options.sodium} onChange={handleSodiumOptionChange} onKeyDown={handleSodiumOptionKeyDown}>
                    <option value="27">27</option>
                    <option value="09">09</option>
                  </select>
                </label>

              </div>
            </section>


                <div className="subject-form-group"><label htmlFor="d_Na">{t("Sodium (Na)", "الصوديوم (Na)")}</label><input id="d_Na" name="d_Na" type="number" min="0" step="0.01" value={form.d_Na} onChange={handleSodiumChange} onKeyDown={handleSodiumKeyDown} /></div>
                <div className="subject-form-group"><label htmlFor="d_K">{t("Potassium (K)", "البوتاسيوم (K)")}</label><input id="d_K" name="d_K" type="number" min="0" step="0.01" value={form.d_K} onChange={handlePotassiumChange} onKeyDown={handlePotassiumKeyDown} /></div>
                <div className="subject-form-group"><label htmlFor="d_Ca">{t("Calcium (Ca)", "الكالسيوم (Ca)")}</label><input id="d_Ca" name="d_Ca" type="number" min="0" step="0.01" value={form.d_Ca} onChange={handleCalciumChange} onKeyDown={handleCalciumKeyDown} /></div>
                <div className="subject-form-group"><label htmlFor="d_Mg">{t("Magnesium (Mg)", "المغنيسيوم (Mg)")}</label><input id="d_Mg" name="d_Mg" type="number" min="0" step="0.01" value={form.d_Mg} onChange={handleMagnesiumChange} onKeyDown={handleMagnesiumKeyDown} /></div>
                <div className="subject-form-group"><label htmlFor="d_vitamens">{t("Vitamins", "الفيتامينات")}</label><input id="d_vitamens" name="d_vitamens" type="number" min="0" step="0.01" value={form.d_vitamens} onChange={handleVitaminsChange} onKeyDown={handleVitaminsKeyDown} /></div>
                <div className="subject-form-group"><label htmlFor="d_Traces_element">{t("Trace elements", "العناصر النزرة")}</label><input id="d_Traces_element" name="d_Traces_element" type="number" min="0" step="0.01" value={form.d_Traces_element} onChange={handleTraceElementsChange} onKeyDown={handleTraceElementsKeyDown} /></div>
                <div className="subject-form-group"><label htmlFor="d_Glucophos">Glucophos</label><input id="d_Glucophos" name="d_Glucophos" type="number" min="0" step="0.01" value={form.d_Glucophos} onChange={handleGlucophosChange} onKeyDown={handleGlucophosKeyDown} /></div>
                <div className="subject-form-group"><label htmlFor="d_heparin">Heparin</label><input id="d_heparin" name="d_heparin" type="number" min="0" step="0.01" value={form.d_heparin} onChange={handleHeparinChange} onKeyDown={handleHeparinKeyDown} /></div>
                <div className="subject-form-group"><label htmlFor="d_total_volume">{t("Total volume (ml/kg/day)", "الحجم الكلي (مل/كجم/يوم)")}</label><input id="d_total_volume" name="d_total_volume" type="number" min="0" step="0.01" value={form.d_total_volume} onChange={handleTotalVolumeChange} onKeyDown={handleTotalVolumeKeyDown} /></div>
              </div>
            </section>


            <section className="prescribe-order-form-section">
              <div className="prescribe-order-result-heading">
                <h3>{t("Calculated components", "المكونات المحسوبة")}</h3>
                <button id="labelPreviewToggle" type="button" onClick={() => setShowLabel((visible) => !visible)}>
                  {showLabel ? t("Hide label", "إخفاء الملصق") : t("Preview label", "معاينة الملصق")}
                </button>
              </div>
              {renderResults(calculation)}
              <p className="prescribe-order-note">{t("Glucose conversion", "تحويل الجلوكوز")}: {fmt(calculation.glucoseRate)} mg/kg/min · {fmt(calculation.glucosePerDay)} g/kg/day</p>
              {calculation.warnings.map((warning) => <p className="prescribe-order-warning" key={warning}>{t(warning, "كمية الجلوكوفوس تتجاوز الصوديوم المتاح؛ تم ضبط كلوريد الصوديوم إلى صفر.")}</p>)}
              {showLabel && renderLabel(form, calculation)}
            </section>
            <p className="prescribe-order-local-note">{t("Calculated values and label preview are generated from the entered prescription. Saving creates the order in the database.", "يتم حساب المكونات ومعاينة الملصق من بيانات الوصفة. يؤدي الحفظ إلى إضافة الطلب لقاعدة البيانات.")}</p>
            <div className="subject-form-actions"><button type="button" className="subject-cancel-button" onClick={closeForm} disabled={saving}>{t("Cancel", "إلغاء")}</button><button type="button" id="printOrderButton" className="prescribe-order-print-button" onClick={printOrder}>{t("Print preview", "طباعة المعاينة")}</button><button type="submit" className="subject-save-button" disabled={saving}>{saving ? t("Saving…", "جارٍ الحفظ…") : t("Save order", "حفظ الوصفة")}</button></div>
          </form>
        </div>
      </div>}

      {viewingOrder && <div className="subject-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewingOrder(null); }}>
        <div className="subject-modal prescribe-order-modal prescribe-order-preview-modal"><div className="subject-modal-header"><div><h2>{t("Order preview", "معاينة الوصفة")}</h2><p>{viewingOrder.a_pes_name} · {viewingOrder.a_request_date}</p></div><button type="button" className="subject-close-button" onClick={() => setViewingOrder(null)}>×</button></div>
          <div className="subject-form"><div className="prescribe-order-preview-meta"><span>{t("Weight", "الوزن")}: {viewingOrder.a_pes_weight} kg</span><span>{t("Company", "الشركة")}: {viewingOrder.a_comp_name || "—"}</span></div>{renderResults(viewingOrder.calculation)}{renderLabel(viewingOrder, viewingOrder.calculation)}<div className="subject-form-actions"><button type="button" className="subject-cancel-button" onClick={() => setViewingOrder(null)}>{t("Close", "إغلاق")}</button><button type="button" className="prescribe-order-print-button" onClick={printOrder}>{t("Print", "طباعة")}</button></div></div>
        </div>
      </div>}
    </div>
  );
}

export default PrescribeOrder;
