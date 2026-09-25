/* ============================================================
 * ShopingListPro — aplikacja Home Assistant (panel + karta, 1 plik)
 *
 * Serwowany przez integrację moje_zakupy:
 *   * moduł panelu  -> strona  /moje-zakupy   (pełny klon starej strony)
 *   * zasób karty   -> custom:moje-zakupy-card (w dashboardach)
 *
 * Samodzielna: dane żyją w Home Assistant, operacje idą przez
 * serwisy integracji (moje_zakupy.*). Bez PHP, bez backendu.
 * ============================================================ */

/* ------------------ stałe ------------------ */

const MZ_DOMAIN = "moje_zakupy";
const MZ_OPT_BOUGHT = "Kupione";
const MZ_OPT_TO_BUY = "Do kupienia";
const MZ_ACCENTS = ["#0ea5e9", "#10b981", "#f43f5e", "#f59e0b", "#a855f7"];

/* ------------------ design tokens (port ze starej strony) ------------------ */

const MZ_LIGHT = `
  --primary:#4f46e5; --primary-hover:#4338ca; --primary-soft:#eef2ff; --on-primary:#ffffff;
  --success:#16a34a; --success-soft:#dcfce7; --success-text:#15803d;
  --warning-soft:#fef3c7; --warning-text:#b45309;
  --danger:#ef4444; --danger-soft:#fee2e2; --danger-text:#dc2626;
  --bg:#f1f5f9; --bg-soft:#f8fafc; --card:#ffffff;
  --text:#0f172a; --text-muted:#64748b;
  --border:rgba(15,23,42,.08); --border-strong:rgba(15,23,42,.2);
  --bought-bg:rgba(22,163,74,.05); --glow:rgba(79,70,229,.08);
  --cat-1:#0ea5e9; --cat-2:#10b981; --cat-3:#f43f5e; --cat-4:#f59e0b; --cat-5:#a855f7;
  --shadow:0 10px 30px -12px rgba(15,23,42,.16); --shadow-sm:0 1px 3px rgba(15,23,42,.06);
`;

const MZ_DARK = `
  --primary:#818cf8; --primary-hover:#a5b4fc; --primary-soft:rgba(129,140,248,.14); --on-primary:#1e1b4b;
  --success:#4ade80; --success-soft:rgba(74,222,128,.12); --success-text:#86efac;
  --warning-soft:rgba(245,158,11,.14); --warning-text:#fcd34d;
  --danger:#f87171; --danger-soft:rgba(248,113,113,.14); --danger-text:#fca5a5;
  --bg:#0b1120; --bg-soft:#111b2e; --card:#152036;
  --text:#e2e8f0; --text-muted:#8fa3bf;
  --border:rgba(255,255,255,.07); --border-strong:rgba(255,255,255,.18);
  --bought-bg:rgba(74,222,128,.07); --glow:rgba(129,140,248,.12);
  --cat-1:#38bdf8; --cat-2:#34d399; --cat-3:#fb7185; --cat-4:#fbbf24; --cat-5:#c084fc;
  --shadow:0 10px 30px -12px rgba(0,0,0,.5); --shadow-sm:0 1px 3px rgba(0,0,0,.3);
`;

/* ------------------ style ------------------ */

const MZ_CSS = `
.mz-app {
  ${MZ_LIGHT}
  --radius:16px; --radius-sm:10px;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  line-height:1.55;
  color:var(--text);
  background-color:var(--bg);
  background-image:radial-gradient(900px 420px at 50% -80px, var(--glow), transparent 70%);
  min-height:100vh;
  transition:background-color .3s, color .3s;
}
.mz-app[data-mz-theme="dark"] { ${MZ_DARK} }
@media (prefers-color-scheme: dark) {
  .mz-app[data-mz-theme="auto"] { ${MZ_DARK} }
}

.mz-card {
  ${MZ_LIGHT}
  --radius:16px; --radius-sm:10px;
  --bg:transparent; --card:transparent; --bg-soft:rgba(128,128,128,.08);
  padding:16px;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  line-height:1.5;
  color:var(--text);
}
@media (prefers-color-scheme: dark) {
  .mz-card { ${MZ_DARK} --bg:transparent; --card:transparent; --bg-soft:rgba(255,255,255,.06); }
}

.mz-app *, .mz-card * { box-sizing:border-box; margin:0; padding:0; }
.mz-app button, .mz-card button {
  font-family:inherit; border:none; background:none; color:inherit;
  cursor:pointer; touch-action:manipulation;
}
.mz-app button:focus-visible, .mz-app select:focus-visible,
.mz-card button:focus-visible, .mz-card select:focus-visible {
  outline:2px solid var(--primary); outline-offset:2px;
}

/* kolory kategorii */
.mz-cat-accent-1 { --cat-color:var(--cat-1); }
.mz-cat-accent-2 { --cat-color:var(--cat-2); }
.mz-cat-accent-3 { --cat-color:var(--cat-3); }
.mz-cat-accent-4 { --cat-color:var(--cat-4); }
.mz-cat-accent-5 { --cat-color:var(--cat-5); }

/* ---------- nagłówek (panel) ---------- */
.mz-header {
  position:sticky; top:0; z-index:50;
  background:var(--card);
  background:color-mix(in srgb, var(--card) 82%, transparent);
  backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid var(--border);
}
.mz-header-inner {
  max-width:1100px; margin:0 auto; padding:.8rem 1.25rem;
  display:flex; align-items:center; justify-content:space-between;
  gap:.6rem 1.25rem; flex-wrap:wrap;
}
.mz-brand { display:flex; align-items:center; gap:.55rem; }
.mz-brand-icon { font-size:1.5em; line-height:1; }
.mz-app-title { font-size:1.2em; font-weight:800; letter-spacing:-.02em; }

.mz-tabs-nav {
  display:flex; gap:.25rem; padding:.3rem;
  background:var(--bg-soft); border:1px solid var(--border); border-radius:999px;
}
.mz-nav-btn {
  display:inline-flex; align-items:center; justify-content:center; gap:.4rem;
  padding:.5rem 1rem; border-radius:999px;
  font-size:.875em; font-weight:600; color:var(--text-muted);
  transition:background-color .2s, color .2s, box-shadow .2s;
}
.mz-nav-btn:hover:not(.active) { color:var(--text); background:var(--card); }
.mz-nav-btn.active {
  background:var(--primary); color:var(--on-primary);
  box-shadow:0 2px 10px rgba(79,70,229,.35);
}
.mz-badge {
  display:none;
  min-width:1.3em; height:1.3em; padding:0 .35em; border-radius:999px;
  background:var(--primary-soft); color:var(--primary);
  font-size:.72em; font-weight:700; line-height:1.3em; text-align:center;
}
.mz-nav-btn.active .mz-badge { background:rgba(255,255,255,.25); color:inherit; }

/* ---------- main / zakładki (panel) ---------- */
.mz-main { max-width:1100px; margin:0 auto; width:100%; padding:1.25rem 1.25rem 2rem; }
.mz-tab { display:none; }
.mz-tab.active { display:block; animation:mzFadeIn .3s ease; }
@keyframes mzFadeIn {
  from { opacity:0; transform:translateY(10px); }
  to   { opacity:1; transform:translateY(0); }
}
.mz-section-head {
  display:flex; align-items:flex-end; justify-content:space-between;
  gap:.75rem 1rem; flex-wrap:wrap; margin-bottom:1.1rem;
}
.mz-section-head h2 { font-size:1.35em; font-weight:800; letter-spacing:-.02em; }
.mz-section-sub { font-size:.85em; color:var(--text-muted); margin-top:.15rem; }

/* ---------- siatka sklepów ---------- */
.mz-shop-grid { display:grid; grid-template-columns:1fr; gap:1.25rem; align-items:start; }
.mz-shop {
  background:var(--card); border:1px solid var(--border);
  border-radius:var(--radius); box-shadow:var(--shadow-sm);
  padding:1.25rem; transition:background-color .3s, border-color .3s;
}
.mz-card .mz-shop {
  background:var(--card); border:1px solid var(--border);
  border-radius:var(--radius); box-shadow:none; padding:1rem;
}
.mz-shop-head {
  display:flex; align-items:center; gap:.4rem .75rem; flex-wrap:wrap; margin-bottom:.9rem;
}
.mz-shop-name { font-size:1.1em; font-weight:700; letter-spacing:-.01em; }
.mz-shop-meta { font-size:.8em; color:var(--text-muted); }
.mz-shop-actions { margin-left:auto; display:flex; gap:.15rem; }

.mz-shop-progress {
  height:6px; border-radius:999px; background:var(--bg-soft);
  border:1px solid var(--border); overflow:hidden; margin-bottom:1rem;
}
.mz-shop-progress-fill {
  height:100%; border-radius:999px; background:var(--primary);
  transition:width .3s ease;
}

/* ---------- kategoria ---------- */
.mz-category { margin-bottom:1.1rem; }
.mz-category:last-child { margin-bottom:0; }
.mz-cat-head { display:flex; align-items:center; justify-content:space-between; gap:.5rem; }
.mz-category-title {
  display:flex; align-items:center; gap:.5rem;
  font-size:.8em; font-weight:700; text-transform:uppercase; letter-spacing:.07em;
  color:var(--text-muted); margin-bottom:.6rem;
}
.mz-category-title::before {
  content:''; flex:none; width:.6em; height:.6em; border-radius:.25em;
  background:var(--cat-color, var(--primary));
}
.mz-cat-actions { display:flex; gap:.15rem; }
.mz-chevron {
  display:inline-flex; padding:2px; border-radius:6px;
  color:var(--text-muted); opacity:.8;
  transition:transform .2s ease;
}
.mz-category.mz-collapsed .mz-chevron { transform:rotate(-90deg); }
.mz-category.mz-collapsed .mz-product-list,
.mz-category.mz-collapsed .mz-add-product { display:none; }

/* ---------- produkty ---------- */
.mz-product-list { list-style:none; display:grid; gap:.5rem; margin-bottom:.6rem; }
.mz-product-list li {
  display:flex; align-items:center; gap:.7rem;
  padding:.65rem .85rem; border-radius:12px;
  background:var(--bg-soft); border:1px solid transparent;
  cursor:pointer; font-weight:500; user-select:none; -webkit-user-select:none;
  touch-action:manipulation;
  transition:transform .15s ease, background-color .15s ease,
             border-color .15s ease, box-shadow .15s ease;
}
.mz-product-list li:hover {
  transform:translateY(-1px);
  border-color:var(--border);
  box-shadow:var(--shadow-sm);
}
.mz-product-list li:active { transform:scale(.99); }
.mz-product-list li.mz-dragging { opacity:.45; }
.mz-check {
  flex:none; width:1.3em; height:1.3em; border-radius:50%;
  border:2px solid var(--border-strong);
  display:grid; place-items:center;
  font-size:.75em; font-weight:800; color:transparent;
  transition:background-color .2s, border-color .2s, color .2s;
}
.mz-product-list li:hover .mz-check { border-color:var(--primary); }
li.mz-bought { background:var(--bought-bg); }
li.mz-bought .mz-check { background:var(--success); border-color:var(--success); color:#fff; }
li.mz-bought .mz-prod-name { text-decoration:line-through; color:var(--text-muted); }
.mz-prod-name { flex:1; min-width:0; overflow-wrap:anywhere; }

.mz-pill {
  flex:none; padding:.3rem .7rem; border-radius:999px;
  font-size:.72em; font-weight:700; letter-spacing:.02em;
  transition:filter .15s;
}
.mz-pill:hover { filter:brightness(.94); }
.mz-pill-do { background:var(--warning-soft); color:var(--warning-text); }
.mz-pill-done { background:var(--success-soft); color:var(--success-text); }

.mz-icon-btn {
  flex:none; width:2.1rem; height:2.1rem;
  display:grid; place-items:center; border-radius:9px;
  color:var(--text-muted); font-size:.95em;
  transition:background-color .15s, color .15s;
}
.mz-icon-btn:hover { background:var(--danger-soft); color:var(--danger-text); }
.mz-icon-btn.mz-safe:hover { background:var(--success-soft); color:var(--success-text); }
.mz-icon-btn.mz-acc:hover { background:var(--primary-soft); color:var(--primary); }

/* ---------- przyciski ---------- */
.mz-btn {
  display:inline-flex; align-items:center; justify-content:center; gap:.45rem;
  padding:.6rem 1.1rem; border-radius:12px;
  background:var(--primary); color:var(--on-primary);
  font-size:.9em; font-weight:600;
  transition:background-color .2s, transform .15s, box-shadow .2s,
             color .2s, border-color .2s;
}
.mz-btn:hover {
  background:var(--primary-hover);
  transform:translateY(-1px);
  box-shadow:0 4px 14px rgba(79,70,229,.3);
}
.mz-btn-block { width:100%; }
.mz-btn-outline { background:transparent; color:var(--text); border:1px solid var(--border-strong); }
.mz-btn-outline:hover { background:var(--bg-soft); box-shadow:none; }
.mz-btn-danger { background:var(--danger); color:#fff; }
.mz-btn-danger:hover { background:var(--danger); filter:brightness(1.1); box-shadow:0 4px 14px rgba(239,68,68,.3); }
.mz-btn-dashed {
  background:transparent; color:var(--text-muted);
  border:1.5px dashed var(--border-strong);
}
.mz-btn-dashed:hover {
  color:var(--primary); border-color:var(--primary);
  background:var(--primary-soft); box-shadow:none;
}

/* ---------- stan pusty ---------- */
.mz-empty {
  grid-column:1 / -1; text-align:center;
  padding:3.5rem 1.5rem;
  background:var(--card);
  border:1.5px dashed var(--border-strong);
  border-radius:var(--radius);
  color:var(--text-muted);
}
.mz-empty-icon { font-size:2.75em; margin-bottom:.75rem; }
.mz-empty h3 { color:var(--text); font-size:1.15em; font-weight:700; margin-bottom:.3rem; }
.mz-empty p { font-size:.9em; margin-bottom:1.1rem; }

/* ---------- ustawienia ---------- */
.mz-settings-card {
  background:var(--card); border:1px solid var(--border);
  border-radius:var(--radius); box-shadow:var(--shadow-sm);
  padding:1.25rem;
}
.mz-settings-list { margin:.25rem 0; }
.mz-settings-row {
  display:flex; align-items:center; justify-content:space-between;
  gap:1rem; padding:.8rem 0; border-bottom:1px solid var(--border);
}
.mz-settings-label { font-weight:600; }
.mz-app select, .mz-card select {
  appearance:none; -webkit-appearance:none;
  font-family:inherit; font-size:.85em; font-weight:600;
  color:var(--text); background-color:var(--bg-soft);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right .85rem center; background-size:.7em auto;
  border:1px solid var(--border); border-radius:999px;
  padding:.5rem 2.3rem .5rem 1rem; cursor:pointer;
}
.mz-settings-divider { border:none; height:1px; background:var(--border); margin:1rem 0; }
.mz-settings-actions { display:flex; flex-wrap:wrap; gap:.6rem; }
.mz-file-label { cursor:pointer; }
.mz-file-label input[type="file"] { display:none; }

/* ---------- stopka ---------- */
.mz-footer {
  max-width:1100px; margin:0 auto; padding:0 1.25rem 2.5rem;
  text-align:center; font-size:.78em; color:var(--text-muted);
}
.mz-footer code {
  background:var(--bg-soft); border:1px solid var(--border);
  border-radius:6px; padding:.1em .4em; font-size:.9em;
}

/* ---------- karta: nagłówek + search + scroll ---------- */
.mz-card { display:flex; flex-direction:column; gap:.75rem; }
.mz-card-header { display:flex; align-items:center; justify-content:space-between; gap:.75rem; flex-wrap:wrap; }
.mz-card-title { display:flex; align-items:center; gap:.5rem; font-size:1.05em; font-weight:800; }
.mz-card-title .mz-brand-icon { font-size:1.25em; }
.mz-card-header-right { display:flex; align-items:center; gap:.6rem; flex:1; min-width:120px; max-width:260px; justify-content:flex-end; }
.mz-card-badge-num { font-size:1.25em; font-weight:800; color:var(--warning-text); }
.mz-card-badge-label { font-size:.75em; color:var(--text-muted); }
.mz-card-progress {
  flex:1; height:6px; border-radius:999px; overflow:hidden;
  background:var(--bg-soft); border:1px solid var(--border); min-width:80px;
}
.mz-card-progress-fill { height:100%; background:var(--success); border-radius:999px; transition:width .3s ease; }
.mz-search-row { display:flex; align-items:center; gap:.5rem; }
.mz-search-row svg { opacity:.7; flex:none; }
.mz-search {
  flex:1; padding:.45rem .8rem; border-radius:10px;
  border:1px solid var(--border);
  background:var(--bg-soft); color:var(--text);
  font:inherit; font-size:.85em; outline:none;
}
.mz-search:focus { border-color:var(--primary); }
.mz-list-wrap { overflow-y:auto; min-height:40px; scrollbar-width:thin; }
.mz-list { display:grid; gap:1.25rem; }
.mz-card .mz-shop-grid { gap:1rem; }

/* ---------- dialog ---------- */
.mz-overlay {
  position:fixed; inset:0; z-index:1000;
  background:rgba(0,0,0,.45);
  display:flex; align-items:center; justify-content:center; padding:20px;
}
.mz-dialog {
  width:100%; max-width:440px;
  background:var(--card); color:var(--text);
  border:1px solid var(--border);
  border-radius:14px; padding:18px;
  box-shadow:var(--shadow);
  display:flex; flex-direction:column; gap:12px;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}
.mz-dialog-head { display:flex; align-items:center; justify-content:space-between; }
.mz-dialog-title { font-size:16px; font-weight:700; }
.mz-dialog-msg { font-size:13.5px; color:var(--text-muted); }
.mz-dialog-field { display:flex; flex-direction:column; gap:5px; }
.mz-dialog-label { font-size:12.5px; color:var(--text-muted); }
.mz-dialog-input {
  font:inherit; padding:9px 11px; border-radius:9px;
  border:1px solid var(--border-strong);
  background:var(--bg-soft); color:var(--text); outline:none;
}
.mz-dialog-input:focus { border-color:var(--primary); }
.mz-input-err { border-color:var(--danger) !important; }
.mz-dialog-foot { display:flex; justify-content:flex-end; gap:8px; }

/* ---------- toasty ---------- */
.mz-toasts {
  position:fixed; right:18px; bottom:18px; z-index:1200;
  display:flex; flex-direction:column; gap:8px; max-width:340px;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}
.mz-toast {
  background:var(--card); color:var(--text);
  border:1px solid var(--border); border-left:4px solid var(--success);
  border-radius:10px; padding:10px 14px; font-size:13px;
  box-shadow:var(--shadow);
  animation:mzToastIn .25s ease;
}
.mz-toast-err { border-left-color:var(--danger); }
.mz-toast-out { opacity:0; transform:translateY(6px); transition:all .5s ease; }
@keyframes mzToastIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }

/* ---------- responsywność (panel) ---------- */
@media (min-width:720px) {
  .mz-shop-grid { grid-template-columns:repeat(2, 1fr); }
  .mz-card .mz-shop-grid { grid-template-columns:1fr; }
}
@media (max-width:640px) {
  .mz-header-inner { padding:.7rem 1rem; }
  .mz-app-title { font-size:1.1em; }
  .mz-brand-icon { font-size:1.3em; }
  .mz-tabs-nav { width:100%; }
  .mz-nav-btn { flex:1; padding:.55rem .5rem; font-size:.8em; }
  .mz-main { padding:1rem 1rem 1.5rem; }
  .mz-shop, .mz-settings-card { padding:1rem; }
  .mz-section-head h2 { font-size:1.25em; }
  .mz-product-list li { padding:.6rem .75rem; gap:.6rem; }
  .mz-settings-actions .mz-btn { flex:1; }
}
@media (max-width:480px) {
  .mz-pill { display:none; }
}
@media (prefers-reduced-motion: reduce) {
  .mz-app *, .mz-card * {
    animation-duration:.01ms !important;
    transition-duration:.01ms !important;
  }
}
`;

/* ------------------ pomocnicze ------------------ */

function mzEl(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

const MZ_ICONS = {
  trash:
    '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  cart:
    '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  chevron: '<polyline points="9 18 15 12 9 6"/>',
  search:
    '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
};

function mzIcon(name, size, width) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size || 16));
  svg.setAttribute("height", String(size || 16));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", String(width || 2));
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.innerHTML = MZ_ICONS[name] || "";
  return svg;
}

function mzPlural(n, one, few, many) {
  if (n === 1) return one;
  const d = n % 10;
  const h = n % 100;
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return few;
  return many;
}

/* ------------------ zbieranie danych ------------------ */

function mzEntries(hass) {
  const entries = new Map();
  for (const st of Object.values(hass.states)) {
    const a = st.attributes || {};
    if (a.mz === "1" && a.mz_entry) {
      if (!entries.has(a.mz_entry)) entries.set(a.mz_entry, { id: a.mz_entry, count: 0 });
      if (st.entity_id.startsWith("select.") && a.product != null) entries.get(a.mz_entry).count++;
    }
  }
  return [...entries.values()].sort((a, b) => b.count - a.count);
}

function mzCollect(hass, entryId) {
  const products = [];
  const shopCats = {};
  const shopCatOrder = {};
  const shopIdx = {};
  let anyMz = false;
  for (const eid of Object.keys(hass.states)) {
    const st = hass.states[eid];
    const a = st.attributes || {};
    if (a.mz !== "1" || (entryId && a.mz_entry !== entryId)) continue;
    anyMz = true;
    if (eid.startsWith("select.") && a.product != null) {
      products.push(st);
      if (!shopCats[a.shop]) shopCats[a.shop] = new Set();
      shopCats[a.shop].add(a.category);
      const i = Number.isFinite(a.shop_index) ? a.shop_index : 999;
      shopIdx[a.shop] = Math.min(shopIdx[a.shop] != null ? shopIdx[a.shop] : 999, i);
    } else if (eid.startsWith("sensor.") && Array.isArray(a.categories) && a.shop) {
      if (!shopCats[a.shop]) shopCats[a.shop] = new Set();
      for (const c of a.categories) if (c && c.name) shopCats[a.shop].add(c.name);
      if (!shopCatOrder[a.shop]) shopCatOrder[a.shop] = a.categories.map((c) => c.name);
      const si = Number.isFinite(a.shop_index) ? a.shop_index : 999;
      shopIdx[a.shop] = Math.min(shopIdx[a.shop] != null ? shopIdx[a.shop] : 999, si);
    }
  }
  return { products, shopCats, shopCatOrder, shopIdx, anyMz };
}

function mzStats(products) {
  const total = products.length;
  const bought = products.filter((p) => p.state === MZ_OPT_BOUGHT).length;
  return { total, bought, toBuy: total - bought };
}

/* ------------------ akcje (serwisy) ------------------ */

async function mzSvc(hass, root, name, data) {
  try {
    const entry = data.entry || root._entryId || root._config?.entry;
    return await hass.callService(MZ_DOMAIN, name, entry ? { ...data, entry } : data);
  } catch (err) {
    const msg =
      (err && err.message && err.message !== "HTTP error" && err.message !== "Invalid") ||
      (err && err.userMessage) ||
      (err && err.error && err.error.message) ||
      "Błąd operacji";
    mzToast(root, msg, true);
    throw err;
  }
}

async function mzToggle(host, st) {
  const a = st.attributes;
  const bought = st.state === MZ_OPT_BOUGHT;
  await mzSvc(host._hass, host, "toggle_product", {
    entry: a.mz_entry,
    shop: a.shop,
    category: a.category,
    product: a.product,
    value: !bought,
  });
}

function mzToast(root, msg, isErr) {
  let wrap = root.querySelector(":scope > .mz-toasts");
  if (!wrap) {
    wrap = mzEl("div", "mz-toasts");
    root.appendChild(wrap);
  }
  const t = mzEl("div", "mz-toast" + (isErr ? " mz-toast-err" : ""), msg);
  wrap.appendChild(t);
  setTimeout(() => t.classList.add("mz-toast-out"), 3600);
  setTimeout(() => t.remove(), 4200);
}

function mzDialog(root, opts) {
  return new Promise((resolve) => {
    const {
      title = "",
      message = "",
      label = "",
      placeholder = "",
      value = "",
      danger = false,
      okText = "Zapisz",
      requireText = !!label,
    } = opts || {};

    const overlay = mzEl("div", "mz-overlay");
    const dlg = mzEl("div", "mz-dialog");
    const head = mzEl("div", "mz-dialog-head");
    head.appendChild(mzEl("h3", "mz-dialog-title", title));
    const x = mzEl("button", "mz-icon-btn");
    x.setAttribute("aria-label", "Zamknij");
    x.appendChild(mzIcon("x", 15, 2.2));
    x.addEventListener("click", () => done(null));
    head.appendChild(x);
    dlg.appendChild(head);
    if (message) dlg.appendChild(mzEl("p", "mz-dialog-msg", message));

    const input = document.createElement("input");
    input.type = "text";
    input.className = "mz-dialog-input";
    input.placeholder = placeholder;
    input.value = value;
    let visible = false;
    if (label) {
      visible = true;
      const field = mzEl("div", "mz-dialog-field");
      field.appendChild(mzEl("span", "mz-dialog-label", label));
      field.appendChild(input);
      dlg.appendChild(field);
    } else if (!message) {
      visible = true;
      dlg.appendChild(input);
    }

    const foot = mzEl("div", "mz-dialog-foot");
    const cancel = mzEl("button", "mz-btn mz-btn-outline", "Anuluj");
    cancel.addEventListener("click", () => done(null));
    const ok = mzEl("button", "mz-btn" + (danger ? " mz-btn-danger" : ""), okText);
    ok.addEventListener("click", () => {
      const v = input.value.trim();
      if (visible && requireText && v === "") {
        input.classList.add("mz-input-err");
        input.focus();
        return;
      }
      done(v);
    });
    foot.append(cancel, ok);
    dlg.appendChild(foot);
    overlay.appendChild(dlg);
    root.appendChild(overlay);

    let closed = false;
    function done(v) {
      if (closed) return;
      closed = true;
      overlay.remove();
      document.removeEventListener("keydown", onKey, true);
      resolve(v);
    }
    function onKey(e) {
      if (e.key === "Escape") done(null);
    }
    document.addEventListener("keydown", onKey, true);
    input.addEventListener("input", () => input.classList.remove("mz-input-err"));
    if (visible) {
      input.focus();
      if (value) input.select();
    } else {
      ok.focus();
    }
  });
}

/* ------------------ rendering (wspólny panel/karta) ------------------ */

function mzBuildRow(host, shop, cat, st, manage) {
  const a = st.attributes;
  const bought = st.state === MZ_OPT_BOUGHT;
  const li = mzEl("li", "product" + (bought ? " mz-bought" : ""));
  li.dataset.shop = a.shop;
  li.dataset.category = a.category;
  li.dataset.product = a.product;
  if (manage) li.draggable = true;

  const check = mzEl("span", "mz-check", bought ? "✓" : "");
  li.appendChild(check);
  li.appendChild(mzEl("span", "mz-prod-name", (a.product || "").trim()));

  if (manage) {
    const pill = mzEl("button", "mz-pill" + (bought ? " mz-pill-done" : " mz-pill-do"));
    pill.textContent = bought ? "Kupione" : "Do kupienia";
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      mzToggle(host, st);
    });
    li.appendChild(pill);
  }

  if (manage) {
    const del = mzEl("button", "mz-icon-btn");
    del.title = "Usuń produkt";
    del.setAttribute("aria-label", `Usuń produkt ${(a.product || "").trim()}`);
    del.appendChild(mzIcon("trash", 15, 2));
    del.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ok = await mzDialog(host, {
        title: "Usunięcie produktu",
        message: `Usunąć „${(a.product || "").trim()}” z listy?`,
        danger: true,
        okText: "Usuń",
      });
      if (ok === null) return;
      await mzSvc(host._hass, host, "delete_product", {
        shop: a.shop,
        category: a.category,
        product: a.product,
        confirm: true,
      });
    });
    li.appendChild(del);
  }

  li.addEventListener("click", () => {
    if (host._suppressClick) return;
    mzToggle(host, st);
  });

  if (manage) {
    li.addEventListener("dragstart", (e) => {
      host._dragged = li;
      li.classList.add("mz-dragging");
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", "");
      } catch (_) {
        /* ignore */
      }
    });
    li.addEventListener("dragend", () => {
      li.classList.remove("mz-dragging");
      host._dragged = null;
    });
    li.addEventListener("dragover", (e) => e.preventDefault());
    li.addEventListener("drop", async (e) => {
      e.preventDefault();
      const dragged = host._dragged;
      if (!dragged || dragged === li) return;
      const ul = li.parentNode;
      ul.insertBefore(dragged, li.nextSibling);
      host._suppressClick = true;
      setTimeout(() => (host._suppressClick = false), 150);
      const order = [...ul.querySelectorAll("li")].map((r) => r.dataset.product);
      try {
        await mzSvc(host._hass, host, "reorder", {
          shop: a.shop,
          category: a.category,
          order,
        });
      } catch (_) {
        /* dane wrócą przy kolejnym renderze */
      }
    });
  }
  return li;
}

function mzBuildCategory(host, shop, cat, prods, accentIdx, manage) {
  const el = mzEl("div", `mz-category mz-cat-accent-${(accentIdx % 5) + 1}`);
  const head = mzEl("div", "mz-cat-head");

  const chevron = mzEl("button", "mz-chevron");
  chevron.setAttribute("aria-label", "Zwiń / rozwij kategorię");
  chevron.appendChild(mzIcon("chevron", 13, 2.4));
  const title = mzEl("h4", "mz-category-title", cat);
  const collapsedKey = `${shop}|${cat}`;
  const toggleCollapse = (e) => {
    e.stopPropagation();
    if (host._collapsed.has(collapsedKey)) host._collapsed.delete(collapsedKey);
    else host._collapsed.add(collapsedKey);
    host._render(true);
  };
  chevron.addEventListener("click", toggleCollapse);
  title.addEventListener("click", toggleCollapse);
  head.appendChild(chevron);
  head.appendChild(title);
  if (host._collapsed.has(collapsedKey)) el.classList.add("mz-collapsed");

  const actions = mzEl("span", "mz-cat-actions");
  if (manage) {
    const addProd = mzEl("button", "mz-icon-btn mz-acc");
    addProd.title = "Dodaj produkt";
    addProd.appendChild(mzIcon("plus", 15, 2.4));
    addProd.addEventListener("click", async (e) => {
      e.stopPropagation();
      const name = await mzDialog(host, {
        title: "Nowy produkt",
        label: `Produkt w „${cat}” (${shop})`,
      });
      if (!name) return;
      await mzSvc(host._hass, host, "add_product", { shop, category: cat, name });
    });
    actions.appendChild(addProd);

    const delCat = mzEl("button", "mz-icon-btn");
    delCat.title = "Usuń kategorię";
    delCat.appendChild(mzIcon("trash", 15, 2));
    delCat.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ok = await mzDialog(host, {
        title: "Usunięcie kategorii",
        message: `Usunąć kategorię „${cat}”? Kategoria musi być pusta.`,
        danger: true,
        okText: "Usuń kategorię",
      });
      if (ok === null) return;
      await mzSvc(host._hass, host, "delete_category", { shop, category: cat, confirm: true });
    });
    actions.appendChild(delCat);
  }
  head.appendChild(actions);
  el.appendChild(head);

  const ul = mzEl("ul", "mz-product-list");
  for (const st of prods) ul.appendChild(mzBuildRow(host, shop, cat, st, manage));
  if (prods.length) el.appendChild(ul);

  if (manage) {
    const addProdBtn = mzEl("button", "mz-btn mz-btn-dashed mz-btn-block mz-add-product");
    addProdBtn.appendChild(mzIcon("plus", 15, 2.4));
    addProdBtn.appendChild(document.createTextNode(" Dodaj produkt"));
    addProdBtn.addEventListener("click", async () => {
      const name = await mzDialog(host, {
        title: "Nowy produkt",
        label: `Produkt w „${cat}” (${shop})`,
      });
      if (!name) return;
      await mzSvc(host._hass, host, "add_product", { shop, category: cat, name });
    });
    el.appendChild(addProdBtn);
  }
  return el;
}

function mzBuildShop(host, shop, cats, products, accentIdx, manage) {
  const el = mzEl("div", "mz-shop");
  const head = mzEl("div", "mz-shop-head");

  const name = mzEl("h3", "mz-shop-name", shop);
  head.appendChild(name);

  const toBuy = products.filter((p) => p.state !== MZ_OPT_BOUGHT);
  const bought = products.length - toBuy.length;
  const meta = mzEl(
    "span",
    "mz-shop-meta",
    manage
      ? products.length
        ? `${bought} z ${products.length} kupionych`
        : "brak produktów"
      : `${toBuy.length} ${mzPlural(toBuy.length, "produkt do kupienia", "produkty do kupienia", "produktów do kupienia")}`
  );
  head.appendChild(meta);

  if (manage) {
    const actions = mzEl("span", "mz-shop-actions");
    const markAll = mzEl("button", "mz-icon-btn mz-safe");
    markAll.title = "Oznacz wszystko jako kupione";
    markAll.appendChild(mzIcon("check", 15, 2.4));
    markAll.addEventListener("click", (e) => {
      e.stopPropagation();
      mzSvc(host._hass, host, "mark_all_bought", { shop });
    });
    actions.appendChild(markAll);

    const reset = mzEl("button", "mz-icon-btn");
    reset.title = "Resetuj (wszystko do kupienia)";
    reset.appendChild(mzIcon("reset", 15, 2));
    reset.addEventListener("click", (e) => {
      e.stopPropagation();
      mzSvc(host._hass, host, "reset_all", { shop });
    });
    actions.appendChild(reset);

    const addCat = mzEl("button", "mz-icon-btn mz-acc");
    addCat.title = "Dodaj kategorię";
    addCat.appendChild(mzIcon("plus", 15, 2.4));
    addCat.addEventListener("click", async (e) => {
      e.stopPropagation();
      const c = await mzDialog(host, {
        title: "Nowa kategoria",
        label: `Kategoria w „${shop}”`,
      });
      if (!c) return;
      await mzSvc(host._hass, host, "add_category", { shop, name: c });
    });
    actions.appendChild(addCat);

    const delShop = mzEl("button", "mz-icon-btn");
    delShop.title = "Usuń sklep";
    delShop.appendChild(mzIcon("trash", 15, 2));
    delShop.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ok = await mzDialog(host, {
        title: "Usunięcie sklepu",
        message: `Usunąć sklep „${shop}”? Sklep musi być pusty.`,
        danger: true,
        okText: "Usuń sklep",
      });
      if (ok === null) return;
      await mzSvc(host._hass, host, "delete_shop", { shop, confirm: true });
    });
    actions.appendChild(delShop);
    head.appendChild(actions);
  }
  el.appendChild(head);

  if (manage && products.length) {
    const bar = mzEl("div", "mz-shop-progress");
    const fill = mzEl("div", "mz-shop-progress-fill");
    fill.style.width = `${Math.round((bought / products.length) * 100)}%`;
    bar.appendChild(fill);
    el.appendChild(bar);
  }

  let ci = 0;
  for (const cat of cats) {
    const catProds = products
      .filter((p) => p.attributes.shop === shop && p.attributes.category === cat)
      .sort((x, y) => (x.attributes.prod_index ?? 999) - (y.attributes.prod_index ?? 999));
    const visible = manage ? catProds : catProds.filter((p) => p.state !== MZ_OPT_BOUGHT);
    if (!visible.length && !manage) continue;
    el.appendChild(mzBuildCategory(host, shop, cat, visible, accentIdx + ci, manage));
    ci++;
  }

  if (manage) {
    const addCatBtn = mzEl("button", "mz-btn mz-btn-dashed mz-btn-block");
    addCatBtn.appendChild(mzIcon("plus", 15, 2.4));
    addCatBtn.appendChild(document.createTextNode(" Dodaj kategorię"));
    addCatBtn.addEventListener("click", async () => {
      const c = await mzDialog(host, {
        title: "Nowa kategoria",
        label: `Kategoria w „${shop}”`,
      });
      if (!c) return;
      await mzSvc(host._hass, host, "add_category", { shop, name: c });
    });
    el.appendChild(addCatBtn);
  }
  return el;
}

function mzBuildEmpty(icon, title, sub, btnText, btnFn) {
  const box = mzEl("div", "mz-empty");
  box.appendChild(mzEl("div", "mz-empty-icon", icon));
  box.appendChild(mzEl("h3", null, title));
  if (sub) box.appendChild(mzEl("p", null, sub));
  if (btnText && btnFn) {
    const b = mzEl("button", "mz-btn");
    b.textContent = btnText;
    b.addEventListener("click", btnFn);
    box.appendChild(b);
  }
  return box;
}

/* ------------------ eksport / import (strona) ------------------ */

function mzBuildRaw(data) {
  const out = {};
  const shops = Object.keys(data.shopCats).sort((a, b) => {
    const ia = data.shopIdx[a] != null ? data.shopIdx[a] : 999;
    const ib = data.shopIdx[b] != null ? data.shopIdx[b] : 999;
    return ia - ib || a.localeCompare(b, "pl");
  });
  for (const shop of shops) {
    out[shop] = { categories: {} };
    const ordered =
      data.shopCatOrder[shop] || [...data.shopCats[shop]].sort((x, y) => x.localeCompare(y, "pl"));
    for (const cat of ordered) {
      out[shop].categories[cat] = { products: {} };
      const prods = data.products
        .filter((p) => p.attributes.shop === shop && p.attributes.category === cat)
        .sort((x, y) => (x.attributes.prod_index ?? 999) - (y.attributes.prod_index ?? 999));
      for (const p of prods) {
        out[shop].categories[cat].products[p.attributes.product] = {
          bought: p.state === MZ_OPT_BOUGHT,
        };
      }
    }
  }
  return out;
}

function mzDownload(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function mzImportFile(root, file) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_) {
    mzToast(root, "Nieprawidłowy plik JSON", true);
    return;
  }
  await mzSvc(root._hass, root, "import_data", { data: text });
  mzToast(root, "Zaimportowano dane");
}

/* ------------------ PANEŁ (pełna strona) ------------------ */

class MojeZakupyPanel extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._entryId = null;
    this._tab = "zakupy";
    this._collapsed = new Set();
    this._suppressClick = false;
    this._dragged = null;
    this._lastSig = "";
    this._font = "16px";
    this._theme = "auto";
    try {
      this._font = localStorage.getItem("mz-font-size") || "16px";
      this._theme = localStorage.getItem("mz-theme") || "auto";
    } catch (_) {
      /* ignore */
    }
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    const style = document.createElement("style");
    style.textContent = MZ_CSS;
    this.appendChild(style);
    this._style = style;
    this._render();
  }

  _collect() {
    if (this._hass) {
      const entries = mzEntries(this._hass);
      if (!entries.some((item) => item.id === this._entryId)) {
        this._entryId = entries[0]?.id || null;
      }
      return mzCollect(this._hass, this._entryId);
    }
    return {
      products: [], shopCats: {}, shopCatOrder: {}, shopIdx: {}, anyMz: false,
    };
  }

  _shopOrder(data) {
    return Object.keys(data.shopCats).sort((a, b) => {
      const ia = data.shopIdx[a] != null ? data.shopIdx[a] : 999;
      const ib = data.shopIdx[b] != null ? data.shopIdx[b] : 999;
      return ia - ib || a.localeCompare(b, "pl");
    });
  }

  _catOrder(data, shop) {
    if (data.shopCatOrder[shop]) return data.shopCatOrder[shop];
    return [...(data.shopCats[shop] || [])].sort((x, y) => x.localeCompare(y, "pl"));
  }

  _render(force) {
    if (!this._hass) return;
    const data = this._collect();
    const sig =
      data.products.map((p) => p.entity_id + ":" + p.state).join(",") +
      "|" +
      Object.keys(data.shopCats)
        .sort()
        .map((s) => s + "[" + [...data.shopCats[s]].sort().join("+") + "]")
        .join(";") +
      "|" +
      this._tab;
    const fullSig = sig + "|" + (this._entryId || "");
    if (!force && fullSig === this._lastSig) return;
    this._lastSig = fullSig;

    if (this._style && !this.contains(this._style)) this.appendChild(this._style);
    this.innerHTML = "";
    if (this._style) this.appendChild(this._style);

    const root = mzEl("div", "mz-app");
    root.dataset.mzTheme = this._theme;
    root.style.fontSize = this._font;
    this.appendChild(root);

    const stats = mzStats(data.products);

    /* nagłówek */
    const header = mzEl("header", "mz-header");
    const inner = mzEl("div", "mz-header-inner");
    const brand = mzEl("div", "mz-brand");
    brand.appendChild(mzEl("span", "mz-brand-icon", "🛒"));
    brand.appendChild(mzEl("h1", "mz-app-title", "ShopingListPro"));
    inner.appendChild(brand);

    const entries = mzEntries(this._hass);
    if (entries.length > 1) {
      const listSelect = document.createElement("select");
      listSelect.setAttribute("aria-label", "Wybierz listę zakupów");
      entries.forEach((item, index) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `Lista ${index + 1} (${item.count} produktów)`;
        option.selected = item.id === this._entryId;
        listSelect.appendChild(option);
      });
      listSelect.addEventListener("change", () => {
        this._entryId = listSelect.value;
        this._render(true);
      });
      inner.appendChild(listSelect);
    }

    const nav = mzEl("nav", "mz-tabs-nav");
    const mkTab = (id, label, badgeVal) => {
      const b = mzEl("button", "mz-nav-btn" + (this._tab === id ? " active" : ""));
      b.textContent = label + " ";
      if (badgeVal != null) {
        const badge = mzEl("span", "mz-badge", String(badgeVal));
        badge.style.display = badgeVal > 0 ? "" : "none";
        b.appendChild(badge);
      }
      b.addEventListener("click", () => {
        this._tab = id;
        this._render(true);
      });
      return b;
    };
    nav.appendChild(mkTab("zakupy", "Zakupy", stats.toBuy));
    nav.appendChild(mkTab("koszyk", "Koszyk", stats.total));
    nav.appendChild(mkTab("ustawienia", "Ustawienia", null));
    inner.appendChild(nav);
    header.appendChild(inner);
    root.appendChild(header);

    const main = mzEl("main", "mz-main");
    root.appendChild(main);

    /* zakładka: zakupy */
    const secZakupy = mzEl("section", "mz-tab" + (this._tab === "zakupy" ? " active" : ""));
    secZakupy.dataset.tab = "zakupy";
    const sh1 = mzEl("div", "mz-section-head");
    const t1 = mzEl("div");
    t1.appendChild(mzEl("h2", null, "Lista zakupów"));
    t1.appendChild(mzEl("p", "mz-section-sub", "Kliknij produkt, aby oznaczyć go jako kupiony"));
    sh1.appendChild(t1);
    secZakupy.appendChild(sh1);
    const grid1 = mzEl("div", "mz-shop-grid");
    secZakupy.appendChild(grid1);
    main.appendChild(secZakupy);

    /* zakładka: koszyk */
    const secKoszyk = mzEl("section", "mz-tab" + (this._tab === "koszyk" ? " active" : ""));
    secKoszyk.dataset.tab = "koszyk";
    const sh2 = mzEl("div", "mz-section-head");
    const t2 = mzEl("div");
    t2.appendChild(mzEl("h2", null, "Koszyk"));
    t2.appendChild(mzEl("p", "mz-section-sub", "Oznaczaj zakupy i zarządzaj listą"));
    sh2.appendChild(t2);
    const addShopBtn = mzEl("button", "mz-btn");
    addShopBtn.appendChild(mzIcon("plus", 16, 2.5));
    addShopBtn.appendChild(document.createTextNode(" Dodaj sklep"));
    addShopBtn.addEventListener("click", async () => {
      const name = await mzDialog(this, {
        title: "Nowy sklep",
        label: "Nazwa sklepu",
        placeholder: "np. Lidl",
      });
      if (!name) return;
      await mzSvc(this._hass, this, "add_shop", { name });
    });
    sh2.appendChild(addShopBtn);
    secKoszyk.appendChild(sh2);
    const grid2 = mzEl("div", "mz-shop-grid");
    secKoszyk.appendChild(grid2);
    main.appendChild(secKoszyk);

    /* zakładka: ustawienia */
    const secSet = mzEl("section", "mz-tab" + (this._tab === "ustawienia" ? " active" : ""));
    secSet.dataset.tab = "ustawienia";
    main.appendChild(secSet);
    secSet.appendChild(this._buildSettings());

    /* treść — brak integracji */
    if (!data.anyMz) {
      grid1.appendChild(
        mzBuildEmpty(
          "🧩",
          "Dodaj integrację ShopingListPro",
          "Ustawienia → Urządzenia i usługi → ShopingListPro → Dodaj integrację. Możesz wkleić tam starą listę (data.json) i ją zaimportować."
        )
      );
      grid2.appendChild(
        mzBuildEmpty(
          "🛒",
          "Brak sklepów",
          "Dodaj pierwszy sklep, aby stworzyć listę.",
          "Dodaj sklep",
          () => addShopBtn.click()
        )
      );
      this.appendChild(this._toastsWrap());
      return;
    }

    /* treść: zakupy (tylko do kupienia) */
    let hasToBuy = false;
    this._shopOrder(data).forEach((shop, i) => {
      const shopProds = data.products.filter((p) => p.attributes.shop === shop);
      const toBuy = shopProds.filter((p) => p.state !== MZ_OPT_BOUGHT);
      if (!toBuy.length) return;
      hasToBuy = true;
      const block = mzBuildShop(this, shop, this._catOrder(data, shop), shopProds, i, false);
      // w trybie "zakupy" pokazujemy tylko niekupione (mzBuildShop filtruje widoczność)
      grid1.appendChild(block);
    });
    if (!hasToBuy) {
      grid1.appendChild(
        mzBuildEmpty(
          "🎉",
          "Wszystko kupione!",
          "Brak produktów do kupienia — zajrzyj do koszyka.",
          "Przejdź do koszyka",
          () => {
            this._tab = "koszyk";
            this._render(true);
          }
        )
      );
    }

    /* treść: koszyk (wszystko + zarządzanie) */
    if (stats.total === 0 && Object.keys(data.shopCats).length === 0) {
      grid2.appendChild(
        mzBuildEmpty(
          "🛒",
          "Brak sklepów",
          "Dodaj pierwszy sklep, aby stworzyć listę.",
          "Dodaj sklep",
          () => addShopBtn.click()
        )
      );
    } else {
      this._shopOrder(data).forEach((shop, i) => {
        const shopProds = data.products.filter((p) => p.attributes.shop === shop);
        grid2.appendChild(
          mzBuildShop(this, shop, this._catOrder(data, shop), shopProds, i, true)
        );
      });
    }

    /* stopka */
    const footer = mzEl("footer", "mz-footer");
    footer.textContent = "ShopingListPro · dane przechowywane w Home Assistant";
    root.appendChild(footer);

    this.appendChild(this._toastsWrap());
  }

  _toastsWrap() {
    const w = mzEl("div", "mz-toasts");
    return w;
  }

  _buildSettings() {
    const card = mzEl("div", "mz-settings-card");

    const head = mzEl("div", "mz-section-head");
    const t = mzEl("div");
    t.appendChild(mzEl("h2", null, "Wygląd"));
    t.appendChild(mzEl("p", "mz-section-sub", "Personalizacja interfejsu"));
    head.appendChild(t);
    card.appendChild(head);

    const list = mzEl("div", "mz-settings-list");

    const row1 = mzEl("label", "mz-settings-row");
    row1.appendChild(mzEl("span", "mz-settings-label", "Wielkość czcionki"));
    const sizeSel = document.createElement("select");
    for (const v of ["14px", "16px", "18px", "20px"]) {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      o.selected = this._font === v;
      sizeSel.appendChild(o);
    }
    sizeSel.addEventListener("change", () => {
      this._font = sizeSel.value;
      try {
        localStorage.setItem("mz-font-size", this._font);
      } catch (_) {
        /* ignore */
      }
      this._render(true);
    });
    row1.appendChild(sizeSel);
    list.appendChild(row1);

    const row2 = mzEl("label", "mz-settings-row");
    row2.appendChild(mzEl("span", "mz-settings-label", "Motyw"));
    const themeSel = document.createElement("select");
    const themes = [
      ["auto", "Automatyczny"],
      ["light", "Światły"],
      ["dark", "Ciemny"],
    ];
    for (const [v, l] of themes) {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = l;
      o.selected = this._theme === v;
      themeSel.appendChild(o);
    }
    themeSel.addEventListener("change", () => {
      this._theme = themeSel.value;
      try {
        localStorage.setItem("mz-theme", this._theme);
      } catch (_) {
        /* ignore */
      }
      this._render(true);
    });
    row2.appendChild(themeSel);
    list.appendChild(row2);

    card.appendChild(list);
    card.appendChild(mzEl("hr", "mz-settings-divider"));

    const head2 = mzEl("div", "mz-section-head");
    const t2 = mzEl("div");
    t2.appendChild(mzEl("h2", null, "Dane"));
    t2.appendChild(mzEl("p", "mz-section-sub", "Kopia zapasowa lub przywracanie listy"));
    head2.appendChild(t2);
    card.appendChild(head2);

    const actions = mzEl("div", "mz-settings-actions");

    const exportBtn = mzEl("button", "mz-btn", "Eksportuj dane");
    exportBtn.addEventListener("click", () => {
      const raw = mzBuildRaw(this._collect());
      mzDownload(raw, "data.json");
      mzToast(this, "Wyeksportowano data.json");
    });
    actions.appendChild(exportBtn);

    const fileLabel = mzEl("label", "mz-btn mz-btn-outline mz-file-label");
    fileLabel.textContent = "Wybierz plik JSON ";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json,application/json";
    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files.length) {
        this._filePending = fileInput.files[0];
      }
    });
    fileLabel.appendChild(fileInput);
    actions.appendChild(fileLabel);

    const importBtn = mzEl("button", "mz-btn", "Importuj");
    importBtn.addEventListener("click", async () => {
      if (!this._filePending) {
        mzToast(this, "Najpierw wybierz plik JSON", true);
        return;
      }
      const ok = await mzDialog(this, {
        title: "Import danych",
        message: "Import zastąpi wszystkie obecne dane. Kontynuować?",
        danger: true,
        okText: "Importuj",
      });
      if (ok === null) return;
      await mzImportFile(this, this._filePending);
      fileInput.value = "";
      this._filePending = null;
    });
    actions.appendChild(importBtn);

    const clearBtn = mzEl("button", "mz-btn mz-btn-danger", "Wyczyść wszystkie dane");
    clearBtn.addEventListener("click", async () => {
      const ok = await mzDialog(this, {
        title: "Czyszczenie danych",
        message: "Usunąć wszystkie sklepy, kategorie i produkty? Tej operacji nie można cofnąć.",
        danger: true,
        okText: "Usuń wszystko",
      });
      if (ok === null) return;
      await mzSvc(this._hass, this, "import_data", { data: "{}" });
    });
    actions.appendChild(clearBtn);

    card.appendChild(actions);
    return card;
  }
}

/* ------------------ KARTA (dashboard) ------------------ */

class MojeZakupyCard extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._config = null;
    this._collapsed = new Set();
    this._suppressClick = false;
    this._dragged = null;
    this._lastSig = "";
    this._filter = "";
  }

  static getStubConfig() {
    return { title: "ShopingListPro" };
  }

  setConfig(config) {
    if (!config) throw new Error("Brak konfiguracji");
    const type = config.type || "custom:moje-zakupy-card";
    if (type !== "custom:moje-zakupy-card") {
      throw new Error("Nieprawidłowy typ karty — użyj custom:moje-zakupy-card");
    }
    this._config = {
      title: config.title != null ? config.title : "ShopingListPro",
      entry: config.entry || "",
      shops: Array.isArray(config.shops) ? config.shops : [],
      show_progress: config.show_progress !== false,
      show_search: config.show_search !== false,
      max_height: parseInt(config.max_height || 640, 10) || 640,
    };
    this._render(true);
  }

  static getConfigElement() {
    return document.createElement("moje-zakupy-card-options");
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    const n = this._renderedCount || 0;
    if (!n) return 5;
    return Math.max(5, Math.min(26, 5 + Math.ceil(n / 8) + 3));
  }

  _collect() {
    if (this._hass) {
      const entries = mzEntries(this._hass);
      this._entryId = entries.some((item) => item.id === this._config?.entry)
        ? this._config.entry : entries[0]?.id || null;
      return mzCollect(this._hass, this._entryId);
    }
    return {
      products: [], shopCats: {}, shopCatOrder: {}, shopIdx: {}, anyMz: false,
    };
  }

  _shopOrder(data) {
    const all = Object.keys(data.shopCats).sort((a, b) => {
      const ia = data.shopIdx[a] != null ? data.shopIdx[a] : 999;
      const ib = data.shopIdx[b] != null ? data.shopIdx[b] : 999;
      return ia - ib || a.localeCompare(b, "pl");
    });
    return this._config.shops.length
      ? this._config.shops.filter((s) => data.shopCats[s])
      : all;
  }

  _catOrder(data, shop) {
    if (data.shopCatOrder[shop]) return data.shopCatOrder[shop];
    return [...(data.shopCats[shop] || [])].sort((x, y) => x.localeCompare(y, "pl"));
  }

  _render(force) {
    if (!this._hass || !this._config) return;
    const data = this._collect();
    const sig =
      data.products.map((p) => p.entity_id + ":" + p.state).join(",") +
      "|" +
      Object.keys(data.shopCats)
        .sort()
        .map((s) => s + "[" + [...data.shopCats[s]].sort().join("+") + "]")
        .join(";") +
      "|" +
      this._config.shops.join(",");
    const fullSig = sig + "|" + (this._entryId || "");
    if (!force && fullSig === this._lastSig) return;
    this._lastSig = fullSig;

    const style = document.createElement("style");
    style.textContent = MZ_CSS;

    this.innerHTML = "";
    this.appendChild(style);

    const root = mzEl("ha-card", "mz-card");
    this.appendChild(root);

    const visible = this._config.shops.length
      ? data.products.filter((p) => this._config.shops.includes(p.attributes.shop))
      : data.products;
    const stats = mzStats(visible);
    this._renderedCount = stats.total;

    /* nagłówek */
    const header = mzEl("div", "mz-card-header");
    const title = mzEl("div", "mz-card-title");
    title.appendChild(mzEl("span", "mz-brand-icon", "🛒"));
    title.appendChild(mzEl("span", null, this._config.title));
    header.appendChild(title);
    const right = mzEl("div", "mz-card-header-right");
    if (this._config.show_progress && stats.total) {
      const badge = mzEl("div");
      badge.appendChild(mzEl("span", "mz-card-badge-num", String(stats.toBuy)));
      badge.appendChild(mzEl("span", "mz-card-badge-label", " do kupienia"));
      right.appendChild(badge);
      const bar = mzEl("div", "mz-card-progress");
      const fill = mzEl("div", "mz-card-progress-fill");
      fill.style.width = `${Math.round((stats.bought / stats.total) * 100)}%`;
      bar.appendChild(fill);
      right.appendChild(bar);
    }
    header.appendChild(right);
    root.appendChild(header);

    /* wyszukiwarka */
    let searchInput = null;
    if (this._config.show_search && stats.total) {
      const srow = mzEl("div", "mz-search-row");
      srow.appendChild(mzIcon("search", 14, 2));
      searchInput = document.createElement("input");
      searchInput.type = "search";
      searchInput.className = "mz-search";
      searchInput.placeholder = "Szukaj produktu…";
      searchInput.value = this._filter;
      searchInput.addEventListener("input", () => {
        this._filter = searchInput.value.trim().toLowerCase();
        this._applyFilter();
      });
      srow.appendChild(searchInput);
      root.appendChild(srow);
    }

    /* lista */
    const wrap = mzEl("div", "mz-list-wrap");
    wrap.style.maxHeight = `${this._config.max_height}px`;
    const list = mzEl("div", "mz-list");
    wrap.appendChild(list);
    root.appendChild(wrap);

    const shopNames = this._shopOrder(data);
    if (!shopNames.length) {
      list.appendChild(
        mzBuildEmpty(
          "🛒",
          "Brak sklepów",
          "Dodaj sklep, aby zacząć.",
          "Dodaj sklep",
          async () => {
            const name = await mzDialog(this, {
              title: "Nowy sklep",
              label: "Nazwa sklepu",
              placeholder: "np. Lidl",
            });
            if (name) await mzSvc(this._hass, this, "add_shop", { name });
          }
        )
      );
    }
    shopNames.forEach((shop, i) => {
      const shopProds = visible.filter((p) => p.attributes.shop === shop);
      list.appendChild(mzBuildShop(this, shop, this._catOrder(data, shop), shopProds, i, true));
    });

    const addShop = mzEl("button", "mz-btn mz-btn-dashed mz-btn-block");
    addShop.appendChild(mzIcon("plus", 15, 2.4));
    addShop.appendChild(document.createTextNode(" Dodaj sklep"));
    addShop.addEventListener("click", async () => {
      const name = await mzDialog(this, {
        title: "Nowy sklep",
        label: "Nazwa sklepu",
        placeholder: "np. Lidl",
      });
      if (!name) return;
      await mzSvc(this._hass, this, "add_shop", { name });
    });
    list.appendChild(addShop);

    this._applyFilter();
    this.appendChild(this._toastsWrap());
  }

  _applyFilter() {
    const f = this._filter;
    this.querySelectorAll(".mz-product-list li").forEach((li) => {
      const text = (li.querySelector(".mz-prod-name") || {}).textContent || "";
      li.style.display = !f || text.toLowerCase().includes(f) ? "" : "none";
    });
    this.querySelectorAll(".mz-category").forEach((c) => {
      const vis = [...c.querySelectorAll("li")].some((r) => r.style.display !== "none");
      c.style.display = f && !vis ? "none" : "";
    });
    this.querySelectorAll(".mz-shop").forEach((s) => {
      const vis = [...s.querySelectorAll("li")].some((r) => r.style.display !== "none");
      s.style.display = f && !vis ? "none" : "";
    });
  }

  _toastsWrap() {
    return mzEl("div", "mz-toasts");
  }
}

/* ------------------ edytor opcji karty ------------------ */

class MojeZakupyCardOptions extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
  }

  setConfig(config) {
    this._config = {
      ...config,
      type: "custom:moje-zakupy-card",
      title: config.title != null ? config.title : "ShopingListPro",
      entry: config.entry || "",
      shops: Array.isArray(config.shops) ? [...config.shops] : [],
      show_progress: config.show_progress !== false,
      show_search: config.show_search !== false,
      max_height: config.max_height || 640,
    };
    this._renderForm();
  }

  setHass(hass) {
    this._hass = hass;
    if (this._config) this._renderForm();
  }

  set hass(hass) {
    const wasUnset = !this._hass;
    this._hass = hass;
    if (wasUnset && this._config) this._renderForm();
  }

  get hass() {
    return this._hass;
  }

  _shopNames() {
    const shops = new Set();
    if (this._hass) {
      const entry = this._config.entry || mzEntries(this._hass)[0]?.id;
      for (const eid of Object.keys(this._hass.states)) {
        const a = this._hass.states[eid].attributes || {};
        if (a.mz === "1" && a.shop && (!entry || a.mz_entry === entry)) shops.add(a.shop);
      }
    }
    return [...shops].sort((a, b) => a.localeCompare(b, "pl"));
  }

  _renderForm() {
    const form = mzEl("div", "mz-opt-form");
    const mkField = (label, input) => {
      const f = mzEl("label");
      f.style.cssText =
        "display:flex;flex-direction:column;gap:5px;font-size:13px;";
      const l = mzEl("span");
      l.textContent = label;
      l.style.cssText = "opacity:.8;";
      f.append(l, input);
      return f;
    };

    const title = document.createElement("input");
    title.type = "text";
    title.value = this._config.title;
    title.addEventListener("change", () => {
      this._config.title = title.value;
      this._save();
    });
    form.appendChild(mkField("Tytuł", title));

    if (this._hass && mzEntries(this._hass).length > 1) {
      const entrySelect = document.createElement("select");
      for (const [index, entry] of mzEntries(this._hass).entries()) {
        const option = document.createElement("option");
        option.value = entry.id;
        option.textContent = `Lista ${index + 1} (${entry.count} produktów)`;
        option.selected = this._config.entry === entry.id;
        entrySelect.appendChild(option);
      }
      entrySelect.addEventListener("change", () => {
        this._config.entry = entrySelect.value;
        this._config.shops = [];
        this._save();
        this._renderForm();
      });
      form.appendChild(mkField("Lista zakupów", entrySelect));
    }

    const sSelect = document.createElement("select");
    sSelect.multiple = true;
    sSelect.size = Math.max(3, Math.min(8, this._shopNames().length || 3));
    this._shopNames().forEach((s) => {
      const o = document.createElement("option");
      o.value = s;
      o.textContent = s;
      o.selected = this._config.shops.includes(s);
      sSelect.appendChild(o);
    });
    sSelect.addEventListener("change", () => {
      this._config.shops = [...sSelect.selectedOptions].map((o) => o.value);
      this._save();
    });
    form.appendChild(mkField("Sklepy (puste = wszystkie)", sSelect));

    const mkCheck = (label, key) => {
      const f = mzEl("label");
      f.style.cssText = "display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;";
      const c = document.createElement("input");
      c.type = "checkbox";
      c.checked = this._config[key];
      c.addEventListener("change", () => {
        this._config[key] = c.checked;
        this._save();
      });
      const l = mzEl("span", null, label);
      f.append(c, l);
      return f;
    };
    form.appendChild(mkCheck("Pokaż pasek postępu", "show_progress"));
    form.appendChild(mkCheck("Pokaż wyszukiwarkę", "show_search"));

    const h = document.createElement("input");
    h.type = "number";
    h.min = "200";
    h.max = "4000";
    h.value = String(this._config.max_height);
    h.addEventListener("change", () => {
      this._config.max_height = parseInt(h.value, 10) || 640;
      this._save();
    });
    form.appendChild(mkField("Maks. wysokość listy (px)", h));

    this.innerHTML = "";
    this.appendChild(form);
  }

  _save() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: { ...this._config } },
        bubbles: true,
        composed: true,
      })
    );
  }
}

/* ------------------ rejestracja ------------------ */

if (!customElements.get("moje-zakupy-panel")) {
  customElements.define("moje-zakupy-panel", MojeZakupyPanel);
}
if (!customElements.get("moje-zakupy-card")) {
  customElements.define("moje-zakupy-card", MojeZakupyCard);
}
if (!customElements.get("moje-zakupy-card-options")) {
  customElements.define("moje-zakupy-card-options", MojeZakupyCardOptions);
}
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "moje-zakupy-card")) {
  window.customCards.push({
    type: "moje-zakupy-card",
    name: "ShopingListPro Card",
    description:
      "Lista zakupów z integracji ShopingListPro: sklepy, kategorie, produkty, postęp, zarządzanie",
    preview: true,
  });
}
