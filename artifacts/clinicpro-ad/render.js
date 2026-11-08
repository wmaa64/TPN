const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const outputDir = __dirname;
const width = 1080;
const height = 1920;
const panel = { x: 40, y: 635, width: 1000, height: 475 };

const scenes = [
  { image: "appointments.jpg", seconds: 2, headline: "عيادتك بتخسر فلوس؟", sub: "ومش عارف الفلوس بتروح فين؟", tag: "المواعيد" },
  { image: "patients.jpg", seconds: 1.5, headline: "بيانات مرضاك", sub: "ومواعيدهم في مكان واحد", tag: "المرضى" },
  { image: "appointments.jpg", seconds: 1.1, headline: "اعرف مين حضر ومين لأ", sub: "تابع حالة كل موعد بسرعة", tag: "متابعة المواعيد" },
  { image: "sessiondue.jpg", seconds: 1.1, headline: "كل جلسة حسابها واضح", sub: "الخدمات والمدفوعات قدامك", tag: "الجلسات" },
  { image: "offersubscription.jpg", seconds: 2.6, headline: "٦٠٠٠ نبضة بـ ٢٤٠٠ جنيه", sub: "استهلكت ٣٠٠ • متبقي ٥٧٠٠", tag: "العروض والاشتراكات", hero: true },
  { image: "doctorRevenue.jpg", seconds: 1.3, headline: "إيراد كل طبيب في ثانية", sub: "تقارير واضحة خلال أي فترة", tag: "إيرادات الأطباء" },
  { image: "store.jpg", seconds: 1.1, headline: "ومخزونك تحت السيطرة", sub: "تابع الرصيد وحركة المستلزمات", tag: "إدارة المخزون" },
  { image: "dashboard.jpg", seconds: 2.1, headline: "عيادتك كلها", sub: "في نظام واحد", tag: "ClinicPro" },
  { image: null, seconds: 2.2, headline: "جرّب ClinicPro مجانًا", sub: "٣ أيام • الرابط في الوصف ↓", tag: "ابدأ الآن", cta: true },
];

const cues = [
  [0, 2.4, "عيادتك بتخسر فلوس ومش عارف ليه؟"],
  [2.4, 5.7, "مواعيد ومرضى وجلسات، كلهم في مكان واحد."],
  [5.7, 8.3, "٦٠٠٠ نبضة، ٣٠٠ مستخدمة، ٥٧٠٠ باقي."],
  [8.3, 10.7, "إيراد كل طبيب ومخزونك تحت السيطرة."],
  [10.7, 12.8, "ClinicPro، عيادتك كلها في نظام واحد."],
  [12.8, 15, "جرّب مجانًا تلات أيام، الرابط في الوصف."],
];

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;",
}[char]));

async function blurPatch(imagePath, regions) {
  const overlays = [];
  for (const region of regions) {
    const patch = await sharp(imagePath).extract(region).blur(18).png().toBuffer();
    overlays.push({ input: patch, left: region.left, top: region.top });
  }
  const image = sharp(imagePath);
  if (overlays.length > 0) image.composite(overlays);
  return image
    .extract({ left: 4, top: 80, width: 1358, height: 640 })
    .jpeg({ quality: 88 })
    .toBuffer();
}

const redactions = {
  "appointments.jpg": [
    { left: 35, top: 510, width: 155, height: 245 },
  ],
  "patients.jpg": [
    { left: 24, top: 285, width: 1110, height: 425 },
  ],
  "patientoffers.jpg": [
    { left: 35, top: 230, width: 1080, height: 92 },
  ],
  "offersubscription.jpg": [
    { left: 845, top: 400, width: 285, height: 115 },
    { left: 630, top: 570, width: 500, height: 155 },
  ],
  "doctorRevenue.jpg": [
    { left: 25, top: 610, width: 1110, height: 120 },
  ],
  "sessiondue.jpg": [
    { left: 25, top: 620, width: 1110, height: 115 },
  ],
};

async function renderScene(scene, index) {
  let screenshotMarkup = "";
  let privacyMarkup = "";
  if (scene.image) {
    const imagePath = path.join(outputDir, scene.image);
    const redacted = await blurPatch(imagePath, redactions[scene.image] || []);
    const imageData = `data:image/jpeg;base64,${redacted.toString("base64")}`;
    screenshotMarkup = `
      <defs>
        <clipPath id="screen-clip"><rect x="${panel.x}" y="${panel.y}" width="${panel.width}" height="${panel.height}" rx="28"/></clipPath>
        <filter id="screen-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#000" flood-opacity=".38"/></filter>
      </defs>
      <rect x="${panel.x}" y="${panel.y}" width="${panel.width}" height="${panel.height}" rx="28" fill="#fff" filter="url(#screen-shadow)"/>
      <image href="${imageData}" x="${panel.x}" y="${panel.y}" width="${panel.width}" height="${panel.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#screen-clip)"/>
      <rect x="${panel.x}" y="${panel.y}" width="${panel.width}" height="${panel.height}" rx="28" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/>
    `;
    const masks = {
      "appointments.jpg": [[55, 950, 138, 158]],
      "patients.jpg": [[54, 925, 952, 182]],
      "patientoffers.jpg": [[630, 820, 370, 118]],
      "offersubscription.jpg": [[650, 850, 225, 106], [570, 980, 435, 120]],
      "doctorRevenue.jpg": [[55, 1000, 950, 105]],
      "sessiondue.jpg": [[55, 1000, 950, 105]],
    };
    privacyMarkup = (masks[scene.image] || []).map(([x, y, w, h]) => `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#eef4ff" fill-opacity=".96"/>
    `).join("");
  } else {
    screenshotMarkup = `
      <rect x="72" y="670" width="936" height="365" rx="40" fill="#102954" stroke="#72f0d2" stroke-width="2"/>
      <circle cx="540" cy="817" r="76" fill="#173d75"/>
      <path d="M540 752 L556 802 L610 817 L556 832 L540 882 L524 832 L470 817 L524 802 Z" fill="#67e8cc"/>
      <text x="540" y="960" text-anchor="middle" direction="ltr" font-family="Tahoma,Arial,sans-serif" font-size="39" font-weight="700" fill="#fff">CLINICPRO</text>
    `;
  }

  const accent = scene.cta || scene.hero ? "#6df0d2" : "#fff";
  const eyebrow = scene.cta ? "لأصحاب العيادات" : "إدارة عيادتك بذكاء";
  const safeTag = esc(scene.tag);
  const subSize = scene.hero ? 43 : 38;
  const headlineSize = scene.hero ? 57 : 62;
  const ctaMarkup = scene.cta ? `
    <rect x="267" y="1180" width="546" height="118" rx="59" fill="#68e9cd"/>
    <text x="540" y="1255" text-anchor="middle" direction="rtl" font-family="Tahoma,Arial,sans-serif" font-size="39" font-weight="700" fill="#06213f">جرّب مجانًا ٣ أيام</text>
    <text x="540" y="1387" text-anchor="middle" direction="rtl" font-family="Tahoma,Arial,sans-serif" font-size="34" font-weight="600" fill="#d9e9ff">الرابط في الوصف ↓</text>
  ` : `
    <rect x="400" y="1195" width="280" height="62" rx="31" fill="#ffffff" fill-opacity=".12" stroke="#ffffff" stroke-opacity=".22"/>
    <text x="540" y="1236" text-anchor="middle" direction="rtl" font-family="Tahoma,Arial,sans-serif" font-size="27" font-weight="600" fill="#dbeafe">${safeTag}</text>
  `;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#07152f"/><stop offset=".53" stop-color="#132d66"/><stop offset="1" stop-color="#07182d"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="#2634ff" stop-opacity=".54"/><stop offset="1" stop-color="#2634ff" stop-opacity="0"/></radialGradient>
      <linearGradient id="bar" x1="0" x2="1"><stop stop-color="#6de8cc"/><stop offset="1" stop-color="#2d68ff"/></linearGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#bg)"/>
    <ellipse cx="910" cy="430" rx="520" ry="500" fill="url(#glow)"/>
    <ellipse cx="80" cy="1520" rx="510" ry="460" fill="url(#glow)" opacity=".55"/>
    <rect x="40" y="38" width="1000" height="9" rx="5" fill="#fff" fill-opacity=".16"/>
    <rect x="40" y="38" width="${Math.round(1000 * ((index + 1) / scenes.length))}" height="9" rx="5" fill="url(#bar)"/>
    <text x="540" y="126" text-anchor="middle" direction="ltr" font-family="Tahoma,Arial,sans-serif" font-size="38" font-weight="700" letter-spacing="2" fill="#fff">CLINICPRO</text>
    <text x="540" y="177" text-anchor="middle" direction="rtl" font-family="Tahoma,Arial,sans-serif" font-size="25" font-weight="500" fill="#99b4db">${eyebrow}</text>
    <text x="540" y="330" text-anchor="middle" direction="rtl" font-family="Tahoma,Arial,sans-serif" font-size="${headlineSize}" font-weight="700" fill="${accent}">${esc(scene.headline)}</text>
    <text x="540" y="420" text-anchor="middle" direction="rtl" font-family="Tahoma,Arial,sans-serif" font-size="${subSize}" font-weight="600" fill="#f1f5ff">${esc(scene.sub)}</text>
    ${screenshotMarkup}
    ${privacyMarkup}
    ${ctaMarkup}
    <text x="540" y="1790" text-anchor="middle" direction="rtl" font-family="Tahoma,Arial,sans-serif" font-size="25" font-weight="500" fill="#a9bddb">ClinicPro • نظام إدارة العيادات</text>
  </svg>`;

  const framePath = path.join(outputDir, `scene-${String(index + 1).padStart(2, "0")}.png`);
  await sharp(Buffer.from(svg)).png().toFile(framePath);
  return { ...scene, frame: framePath };
}

async function main() {
  const rendered = [];
  for (let i = 0; i < scenes.length; i += 1) rendered.push(await renderScene(scenes[i], i));
  const manifest = { width, height, fps: 30, duration: 15, scenes: rendered, cues };
  await fs.writeFile(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  await fs.writeFile(path.join(outputDir, "voiceover.txt"), cues.map(([start, end, line]) => `${start.toFixed(1)}–${end.toFixed(1)}s  ${line}`).join("\n"), "utf8");
  await fs.writeFile(path.join(outputDir, "voiceover.srt"), cues.map(([start, end, line], i) => {
    const stamp = (seconds) => {
      const ms = Math.round(seconds * 1000);
      const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
      const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
      const milli = String(ms % 1000).padStart(3, "0");
      return `${h}:${m}:${s},${milli}`;
    };
    return `${i + 1}\n${stamp(start)} --> ${stamp(end)}\n${line}\n`;
  }).join("\n"), "utf8");
  const tileWidth = 270;
  const tileHeight = 480;
  const tiles = await Promise.all(rendered.map((scene) =>
    sharp(scene.frame).resize(tileWidth, tileHeight).png().toBuffer()
  ));
  const preview = sharp({ create: { width: tileWidth * 3, height: tileHeight * 3, channels: 3, background: "#09172e" } });
  await preview.composite(tiles.map((input, i) => ({
    input,
    left: (i % 3) * tileWidth,
    top: Math.floor(i / 3) * tileHeight,
  }))).png().toFile(path.join(outputDir, "storyboard-preview.png"));
  console.log(`Rendered ${rendered.length} portrait scenes at ${width}x${height}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
