/**
 * Takes a standalone D2P Tasarım HTML (Downloads) and writes the site-ready
 * public/tasarim/index.html with local vendors + workshop hardenings.
 *
 * Usage: node scripts/upgrade-tasarim-from-html.mjs "C:\Users\...\D2P Tasarım (8).html"
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = process.argv[2];
if (!srcPath || !fs.existsSync(srcPath)) {
  console.error("Usage: node scripts/upgrade-tasarim-from-html.mjs <path-to-html>");
  process.exit(1);
}

let html = fs.readFileSync(srcPath, "utf8");

// Remove Google Fonts (blocked by CSP; system fonts are fine)
html = html.replace(
  /\n<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\n<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Nunito:[^"]+" rel="stylesheet">/,
  "",
);
html = html.replace(
  /font-family:"Nunito",ui-rounded/,
  'font-family:ui-rounded',
);

// noindex
if (!html.includes('name="robots"')) {
  html = html.replace(
    "<title>D2P Tasarım</title>",
    '<title>D2P Tasarım</title>\n<meta name="robots" content="noindex, nofollow">',
  );
}

// Link-friendly toolbar buttons
html = html.replace(
  ".tb{flex:none;display:inline-flex;align-items:center;gap:6px;height:42px;padding:0 11px;border-radius:12px;border:1px solid transparent;background:transparent;font-weight:800;font-size:14px;white-space:nowrap}",
  ".tb{flex:none;display:inline-flex;align-items:center;gap:6px;height:42px;padding:0 11px;border-radius:12px;border:1px solid transparent;background:transparent;font-weight:800;font-size:14px;white-space:nowrap;color:inherit;text-decoration:none}",
);

// Panel back link after brand
if (!html.includes('id="btn-panel"')) {
  html = html.replace(
    `<div class="brand">
    <span class="badge" aria-hidden="true">D2P</span>
    <span class="brand-tx"><b>D2P Tasarım</b><span>Tasarımdan üretime</span></span>
  </div>`,
    `<div class="brand">
    <span class="badge" aria-hidden="true">D2P</span>
    <span class="brand-tx"><b>D2P Tasarım</b><span>Tasarımdan üretime</span></span>
  </div>
  <a class="tb" id="btn-panel" href="/dashboard" title="Panele dön"><svg viewBox="0 0 24 24"><path d="M15 18 9 12l6-6"/></svg><span class="lb">Panel</span></a>`,
  );
}

// Boot + panel href script before importmap
const bootScript = `<script>
window.__d2pBootTimer = setTimeout(function () {
  if (window.__d2pReady) return;
  document.body.innerHTML = '<main style="font:600 16px/1.5 system-ui,sans-serif;max-width:420px;margin:12vh auto;padding:24px;color:#1C1917">'
    + '<h1 style="font-size:22px;margin:0 0 12px">D2P Tasarım açılamadı</h1>'
    + '<p style="color:#5C534D;margin:0 0 12px">3D kütüphanesi yüklenemedi. Sayfayı yenileyin. Sorun sürerse eğitmene haber verin.</p>'
    + '<button type="button" onclick="location.reload()" style="height:44px;padding:0 16px;border:0;border-radius:12px;background:#2A9D8F;color:#fff;font:800 15px system-ui">Yenile</button>'
    + '</main>';
}, 12000);
(function () {
  var from = new URLSearchParams(location.search).get("from");
  var panel = document.getElementById("btn-panel");
  if (!panel) return;
  if (from === "student") panel.href = "/student-dashboard";
  else if (from === "instructor") panel.href = "/instructor";
  else panel.href = "/dashboard";
})();
</script>
`;

html = html.replace(
  /<script type="importmap">[\s\S]*?<\/script>/,
  `${bootScript}<script type="importmap">
{
  "imports": {
    "three": "/tasarim/vendor/three/three.module.js",
    "three/addons/": "/tasarim/vendor/three/addons/",
    "three-mesh-bvh": "/tasarim/vendor/three-mesh-bvh/index.module.js",
    "three-bvh-csg": "/tasarim/vendor/three-bvh-csg/index.module.js"
  }
}
</script>`,
);

// sanitizeText after setFont
if (!html.includes("function sanitizeText")) {
  html = html.replace(
    "let FONT = null;\nfunction setFont(json) { FONT = new Font(json); }",
    `let FONT = null;
function setFont(json) { FONT = new Font(json); }
function sanitizeText(raw) {
  const glyphs = FONT && FONT.data && FONT.data.glyphs ? FONT.data.glyphs : null;
  let t = String(raw ?? '');
  if (glyphs) t = [...t].filter(ch => ch === ' ' || glyphs[ch]).join('');
  t = t.trim();
  return t || '?';
}`,
  );
}

html = html.replace(
  /case 'text': \{\s*let t = \(params\.text \|\| ''\)\.trim\(\) \? params\.text : '\?';/,
  "case 'text': {\n      const t = sanitizeText(params.text);",
);

// Orbit + webgl (after OrbitControls setup)
if (!html.includes("maxPolarAngle")) {
  html = html.replace(
    `const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true; orbit.dampingFactor = 0.12;
orbit.minDistance = 15; orbit.maxDistance = 1800;`,
    `const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true; orbit.dampingFactor = 0.12;
orbit.minDistance = 15; orbit.maxDistance = 1800;
orbit.maxPolarAngle = Math.PI * 0.49;`,
  );
}

// dispose meshes
html = html.replace(
  `function addMesh(m) { scene.add(m); objects.push(m); }
function removeMesh(m) { scene.remove(m); objects = objects.filter(o => o !== m); }
function clearScene() { for (const m of objects) scene.remove(m); objects = []; }`,
  `function disposeMesh(m) {
  scene.remove(m);
  if (m.geometry) m.geometry.dispose();
  if (m.material) {
    if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
    else m.material.dispose();
  }
}
function addMesh(m) { scene.add(m); objects.push(m); }
function removeMesh(m) { disposeMesh(m); objects = objects.filter(o => o !== m); }
function clearScene() { for (const m of [...objects]) disposeMesh(m); objects = []; }`,
);

// History limit
html = html.replace(
  `  history = history.slice(0, hIndex + 1);
  history.push(snap);
  if (history.length > 80) history.shift();
  hIndex = history.length - 1;`,
  `  history = history.slice(0, hIndex + 1);
  history.push(snap);
  const maxHist = snap.some(s => s.kind === 'group') ? 25 : 50;
  while (history.length > maxHist) { history.shift(); if (hIndex > 0) hIndex--; }
  hIndex = history.length - 1;`,
);

// Group size limit
if (!html.includes("En fazla 12 parçayı")) {
  html = html.replace(
    `async function groupSel() {
  if (selected.length < 2) { toast('Gruplamak için en az iki şekil seç. Çoklu seçimi aç ya da Shift’e basılı tut.', 3500); return; }
  toast('Gruplanıyor…', 20000);`,
    `async function groupSel() {
  if (selected.length < 2) { toast('Gruplamak için en az iki şekil seç. Çoklu seçimi aç ya da Shift’e basılı tut.', 3500); return; }
  if (selected.length > 12) { toast('En fazla 12 parçayı bir arada grupla. Önce alt gruplar yap.', 4000); return; }
  toast('Gruplanıyor…', 20000);`,
  );
}

// Replace Claude download helpers with simple anchorSave
html = html.replace(
  /let dlPromise = null;\nfunction getDownloads\(\) \{[\s\S]*?\n\}\ngetDownloads\(\);\nfunction anchorSave\(name, blob\) \{[\s\S]*?\n\}\nasync function offerFile\(dl, filename, blob\) \{[\s\S]*?\n\}\nasync function exportSTL\(\) \{[\s\S]*?\n\}\nasync function saveProject\(\) \{[\s\S]*?\n\}/,
  `function anchorSave(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
async function exportSTL() {
  const list = objects.filter(m => !m.userData.hole);
  if (!list.length) { toast('Dışa aktarılacak katı şekil yok.'); return; }
  try {
    const geos = list.map(m => { m.updateMatrixWorld(); return m.geometry.clone().applyMatrix4(m.matrixWorld); });
    const bytes = stlBytes(geos);
    anchorSave('d2p-model.stl', new Blob([bytes], { type: 'model/stl' }));
    toast('STL indirildi');
  } catch (err) {
    console.error(err);
    toast('STL oluşturulamadı. Modeli sadeleştirip yeniden dene.', 4000);
  }
}
async function saveProject() {
  if (!objects.length) { toast('Kaydedilecek şekil yok.'); return; }
  flushSave();
  const blob = new Blob([projectJSON()], { type: 'application/json' });
  const fname = ((projectName || 'd2p-proje').toLocaleLowerCase('tr').replace(/[^a-z0-9çğıöşü]+/g, '-').replace(/^-|-$/g, '') || 'd2p-proje') + '.json';
  anchorSave(fname, blob);
  toast('Proje indirildi');
}`,
);

// Drop Claude-only zip helpers (unused after anchorSave)
html = html.replace(
  /\nconst CRC = \(\(\) => \{[\s\S]*?\nreturn out;\n\}\n\n/,
  "\n",
);

// File open size limit
html = html.replace(
  `$('#file').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {`,
  `$('#file').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  if (f.size > 8 * 1024 * 1024) { toast('Dosya çok büyük (en fazla 8 MB).'); return; }
  try {`,
);

// WebGL handlers after toast()
if (!html.includes("webglcontextlost")) {
  html = html.replace(
    `function toast(msg, ms = 2400) {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}`,
    `function toast(msg, ms = 2400) {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}
renderer.domElement.addEventListener('webglcontextlost', e => {
  e.preventDefault();
  toast('Görüntü sıfırlandı. Sayfayı yenilemen gerekebilir.', 5000);
});
renderer.domElement.addEventListener('webglcontextrestored', () => {
  buildBed();
  toast('Görüntü geri geldi');
});`,
  );
}

// Mark ready at end
html = html.replace(
  `if (!lsGet(TUT_KEY)) tutOffer();
else if (readIndex().length) openProjects(true);

</script>`,
  `if (!lsGet(TUT_KEY)) tutOffer();
else if (readIndex().length) openProjects(true);
window.__d2pReady = true;
clearTimeout(window.__d2pBootTimer);

</script>`,
);

// Apply D2P brand theme (logo: d=red, 2=yellow, p=green)
html = html.replace(
  /:root\{[\s\S]*?--scene:[^;]+; --plane:[^;]+; --grid-minor:[^;]+; --grid-major:[^;]+;\s*color-scheme:light;/,
  `:root{
  /* D2P logo palette: d=red, 2=yellow, p=green */
  --ink:#1C1917; --muted:#5C534D; --paper:#FAF8F5; --panel:#FFFFFF; --panel-2:#F5F1EC; --line:#D8E8E5;
  --brand:#E63946; --brand-soft:#FCE8EA;
  --accent:#2A9D8F; --accent-soft:#E6F5F3; --sun:#FFB703; --sun-ink:#2A1E00;
  --ok:#2A9D8F; --ok-soft:#E6F5F3; --warn:#D99B03; --warn-soft:#FFF6D9; --danger:#E63946;
  --scene:#F0EBE4; --plane:#FFFFFF; --grid-minor:#E8E1D8; --grid-major:#B8AFA4;
  color-scheme:light;`,
);
html = html.replace(
  /@media \(prefers-color-scheme: dark\)\{\s*:root:not\(\[data-theme="light"\]\)\{[\s\S]*?color-scheme:dark;\s*\}\s*\}\s*:root\[data-theme="dark"\]\{[\s\S]*?color-scheme:dark;\s*\}/,
  `@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --ink:#F5F0EB; --muted:#A89F96; --paper:#1A1714; --panel:#221E1A; --panel-2:#2A2520; --line:#3D3832;
    --brand:#F0525E; --brand-soft:#3A1C1F;
    --accent:#33B5A5; --accent-soft:#1A3D38; --ok:#33B5A5; --ok-soft:#1A3D38; --warn:#FFB703; --warn-soft:#3D2E12; --danger:#F0525E;
    --scene:#14110F; --plane:#221E1A; --grid-minor:#2A2520; --grid-major:#4A433C;
    color-scheme:dark;
  }
}
:root[data-theme="dark"]{
  --ink:#F5F0EB; --muted:#A89F96; --paper:#1A1714; --panel:#221E1A; --panel-2:#2A2520; --line:#3D3832;
  --brand:#F0525E; --brand-soft:#3A1C1F;
  --accent:#33B5A5; --accent-soft:#1A3D38; --ok:#33B5A5; --ok-soft:#1A3D38; --warn:#FFB703; --warn-soft:#3D2E12; --danger:#F0525E;
  --scene:#14110F; --plane:#221E1A; --grid-minor:#2A2520; --grid-major:#4A433C;
  color-scheme:dark;
}`,
);
html = html.replace(
  ".badge{display:grid;place-items:center;width:40px;height:34px;border-radius:10px;background:var(--accent);color:#fff;",
  ".badge{display:grid;place-items:center;width:40px;height:34px;border-radius:10px;background:var(--brand);color:#fff;",
);
html = html.replace(/\.stl:hover:not\(:disabled\)\{background:[^}]+\}/, ".stl:hover:not(:disabled){background:#D99B03;color:#1C1400}");
html = html.replace(
  /\.cx\{color:[^}]+\}\.cy\{color:[^}]+\}\.cz\{color:[^}]+\}/,
  ".cx{color:#E63946}.cy{color:#2A9D8F}.cz{color:#2563EB}",
);
html = html.replace(
  /const TC = \{ blue: '[^']+', yellow: '[^']+', red: '[^']+', green: '[^']+', teal: '[^']+', purple: '[^']+', pink: '[^']+', orange: '[^']+' \};/,
  "const TC = { blue: '#2563EB', yellow: '#FFB703', red: '#E63946', green: '#2A9D8F', teal: '#1FA3B3', purple: '#8B5CF6', pink: '#E255A1', orange: '#F28C28' };",
);
html = html.replace(
  /const COLORS = \[[^\]]+\];/,
  "const COLORS = ['#E63946', '#FFB703', '#2A9D8F', '#F28C28', '#2563EB', '#34B36B', '#8B5CF6', '#E255A1', '#F4F4F2', '#5B6577'];",
);
html = html.replace(/color: spec\.color \|\| COLORS\[\d+\]/g, "color: spec.color || COLORS[2]");
html = html.replace(/color: solid \? solid\.userData\.color : COLORS\[\d+\]/g, "color: solid ? solid.userData.color : COLORS[2]");
html = html.replace(
  "scene.add(new THREE.HemisphereLight(0xffffff, 0x7d8aa3, 1.15));",
  "scene.add(new THREE.HemisphereLight(0xfffaf5, 0xa89f96, 1.15));",
);
html = html.replace(
  /const holeMat = \(\) => new THREE\.MeshStandardMaterial\(\{ color: 0x[0-9a-fA-F]+,/,
  "const holeMat = () => new THREE.MeshStandardMaterial({ color: 0xa89f96,",
);
html = html.replace(
  /background:#E5484D/g,
  "background:#E63946",
);
html = html.replace(
  /background:#2FA866/g,
  "background:#2A9D8F",
);
html = html.replace(
  /background:#3F6BFF/g,
  "background:#2563EB",
);

const out = path.join(root, "public", "tasarim", "index.html");
fs.writeFileSync(out, html, "utf8");
console.log("Wrote", out, `(${html.length} bytes)`);

// Sanity checks
const checks = [
  ["/tasarim/vendor/three/three.module.js", true],
  ["cdn.jsdelivr", false],
  ["btn-panel", true],
  ["__d2pReady", true],
  ["sanitizeText", true],
  ["IDX_KEY", true],
  ["tutOffer", true],
  ["window.claude", false],
  ["fonts.googleapis", false],
  ["--brand:#E63946", true],
  ["--accent:#2A9D8F", true],
];
let ok = true;
for (const [needle, want] of checks) {
  const has = html.includes(needle);
  if (has !== want) {
    console.error(`CHECK FAIL: "${needle}" expected ${want}, got ${has}`);
    ok = false;
  }
}
if (!ok) process.exit(1);
console.log("All sanity checks passed");
