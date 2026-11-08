// Límite de caracteres del chat de Guild Wars 2.
const GW2_CHAT_LIMIT = 199;

const root = document.documentElement;
const tabsEl = document.getElementById("tabs");
const panelsEl = document.getElementById("panels");
const statusEl = document.getElementById("status");
const statusText = document.getElementById("status-text");
const filePicker = document.getElementById("file-picker");
const fileInput = document.getElementById("file-input");
const toastEl = document.getElementById("toast");
const themeBtn = document.getElementById("theme-toggle");

/* ---------- Tema ---------- */
function applyTheme(theme) {
  root.dataset.theme = theme;
  themeBtn.setAttribute("aria-label", theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  try { localStorage.setItem("theme", theme); } catch (_) {}
}
themeBtn.addEventListener("click", () => applyTheme(root.dataset.theme === "dark" ? "light" : "dark"));
applyTheme(root.dataset.theme || "dark");

/* ---------- Utilidades ---------- */
function slugify(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  // Respaldo para contextos no seguros (p. ej. http en red local).
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  if (!ok) throw new Error("No se pudo copiar");
}

let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1600);
}

/* ---------- Render ---------- */
function renderMessage(text) {
  const li = document.createElement("li");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "message";
  btn.title = "Copiar al portapapeles";

  const span = document.createElement("span");
  span.className = "text";
  span.textContent = text;

  const meta = document.createElement("span");
  meta.className = "meta";
  const label = document.createElement("span");
  label.className = "copy-label";
  label.textContent = "Copiar";
  const count = document.createElement("span");
  count.className = "count";
  count.textContent = `${text.length}/${GW2_CHAT_LIMIT}`;
  if (text.length > GW2_CHAT_LIMIT) {
    count.classList.add("over");
    count.title = "Supera el límite del chat de GW2 y se cortará";
  }
  meta.append(label, count);
  btn.append(span, meta);

  btn.addEventListener("click", async () => {
    try {
      await copyText(text);
      label.textContent = "¡Copiado!";
      btn.classList.add("copied");
      toast("Mensaje copiado");
      setTimeout(() => { label.textContent = "Copiar"; btn.classList.remove("copied"); }, 1600);
    } catch {
      toast("No se pudo copiar");
    }
  });

  li.append(btn);
  return li;
}

function selectTab(id, { focus = false, updateHash = true } = {}) {
  for (const tab of tabsEl.querySelectorAll('[role="tab"]')) {
    const active = tab.id === `tab-${id}`;
    tab.setAttribute("aria-selected", active);
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
    if (active && focus) tab.focus();
  }
  if (updateHash) history.replaceState(null, "", `#${id}`);
}

function showStatus(text, { picker = false } = {}) {
  statusText.textContent = text;
  filePicker.hidden = !picker;
  statusEl.hidden = false;
}

function render(data) {
  statusEl.hidden = true;
  tabsEl.replaceChildren();
  panelsEl.replaceChildren();

  // Cada clave del JSON es una pestaña; su valor, la lista de mensajes.
  const categories = Object.entries(data).filter(([, msgs]) => Array.isArray(msgs));
  if (categories.length === 0) {
    showStatus("No hay mensajes en messages.json.");
    return;
  }

  const ids = [];
  for (const [name, messages] of categories) {
    let id = slugify(name) || "tab";
    while (ids.includes(id)) id += "-";
    ids.push(id);

    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "tab";
    tab.role = "tab";
    tab.id = `tab-${id}`;
    tab.setAttribute("aria-controls", `panel-${id}`);
    tab.textContent = name;
    tab.addEventListener("click", () => selectTab(id));
    tabsEl.append(tab);

    const panel = document.createElement("div");
    panel.role = "tabpanel";
    panel.id = `panel-${id}`;
    panel.setAttribute("aria-labelledby", tab.id);
    const ul = document.createElement("ul");
    ul.className = "messages";
    for (const m of messages) {
      const text = String(m ?? "").trim();
      if (text) ul.append(renderMessage(text));
    }
    panel.append(ul);
    panelsEl.append(panel);
  }

  // Navegación con flechas entre pestañas.
  tabsEl.addEventListener("keydown", (e) => {
    const current = ids.findIndex((id) => document.getElementById(`tab-${id}`) === document.activeElement);
    if (current < 0) return;
    let next;
    if (e.key === "ArrowRight") next = (current + 1) % ids.length;
    else if (e.key === "ArrowLeft") next = (current - 1 + ids.length) % ids.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = ids.length - 1;
    else return;
    e.preventDefault();
    selectTab(ids[next], { focus: true });
  });

  const fromHash = decodeURIComponent(location.hash.slice(1));
  selectTab(ids.includes(fromHash) ? fromHash : ids[0], { updateHash: ids.includes(fromHash) });
}

/* ---------- Carga de datos ---------- */

// Respaldo para cuando la página se abre desde disco (file://): el navegador
// bloquea fetch, así que se permite elegir o arrastrar el archivo JSON.
async function loadFromFile(file) {
  try {
    render(JSON.parse(await file.text()));
  } catch (err) {
    showStatus(`El archivo no es un JSON válido (${err.message}).`, { picker: true });
  }
}
fileInput.addEventListener("change", () => fileInput.files[0] && loadFromFile(fileInput.files[0]));
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) loadFromFile(file);
});

fetch("messages.json", { cache: "no-cache" })
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then(render)
  .catch((err) => {
    console.error(err);
    if (location.protocol === "file:") {
      showStatus(
        "Abriste la página desde el disco y el navegador no permite leer messages.json así. " +
        "Elige el archivo (o arrástralo aquí), o sirve la carpeta con: python3 -m http.server 8000",
        { picker: true },
      );
    } else if (err instanceof SyntaxError) {
      showStatus(`messages.json tiene un error de formato: ${err.message}`);
    } else {
      showStatus(`No se pudo cargar messages.json (${err.message}).`);
    }
  });
