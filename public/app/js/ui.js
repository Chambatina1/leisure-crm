/* ====================================================================
   ui.js — Utilidades de interfaz compartidas
   CRM Leisure Exporting LLC · geocabezas
   ==================================================================== */
(function (global) {
  "use strict";

  const ESTADOS = {
    creado:      { label: "Creado",       cls: "estado-creado",      ico: "⚪" },
    en_origen:   { label: "En origen",    cls: "estado-en_origen",   ico: "🔵" },
    en_transito: { label: "En tránsito",  cls: "estado-en_transito", ico: "🟡" },
    en_almacen:  { label: "En almacén",   cls: "estado-en_almacen",  ico: "🟣" },
    entregado:   { label: "Entregado",    cls: "estado-entregado",   ico: "🟢" },
  };

  function estadoInfo(e) { return ESTADOS[e] || ESTADOS.en_origen; }

  const ROLES = {
    admin:     { label: "Administrador" },
    agencia:   { label: "Agencia" },
    operario:  { label: "Operario" },
    camionero: { label: "Camionero" },
  };
  function rolInfo(r) { return ROLES[r] || { label: r }; }

  function fechaCorta(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" }) +
      " · " + d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  }

  function fechaSolo(ts) {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function dinero(n) {
    const v = Number(n || 0);
    return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Toast simple
  let toastTimer = null;
  function toast(msg, esError) {
    const el = document.getElementById("toast");
    if (!el) return alert(msg);
    el.textContent = msg;
    el.classList.toggle("err", !!esError);
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => { el.hidden = true; }, 300);
    }, 2800);
  }

  // Iniciales para avatar
  function iniciales(nombre) {
    if (!nombre) return "?";
    return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("") || "?";
  }

  // Navegación SPA
  function navegar(hash) {
    if (!hash || hash === "#") hash = "#dashboard";
    const id = hash.replace("#", "");
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");
    else { document.getElementById("dashboard")?.classList.add("active"); }
    document.querySelectorAll(".topnav a").forEach(a => {
      a.classList.toggle("active", a.getAttribute("href") === "#" + id);
    });
    const nav = document.getElementById("topnav");
    if (nav) nav.classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
    global.dispatchEvent(new CustomEvent("view:changed", { detail: { id } }));
  }

  // Genera QR como data-URL SVG (usa qrcode-generator global)
  function generarQR(texto) {
    const qr = qrcode(0, "M");
    qr.addData(texto);
    qr.make();
    const cell = 4;
    const count = qr.getModuleCount();
    const size = cell * (count + 8);
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    svg += `<rect width="${size}" height="${size}" fill="#fff"/>`;
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          svg += `<rect x="${(c + 4) * cell}" y="${(r + 4) * cell}" width="${cell}" height="${cell}" fill="#000"/>`;
        }
      }
    }
    svg += `</svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  // GPS
  function obtenerGPS() {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  // Modal genérico
  function modal(html) {
    const backdrop = document.getElementById("modalBackdrop");
    const box = document.getElementById("modalBox");
    box.innerHTML = html;
    backdrop.classList.add("show");
    backdrop.onclick = (e) => { if (e.target === backdrop) cerrarModal(); };
  }
  function cerrarModal() {
    document.getElementById("modalBackdrop").classList.remove("show");
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarModal(); });

  // Escape HTML para inyectar texto del usuario de forma segura
  function esc(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  global.UI = {
    ESTADOS, estadoInfo, ROLES, rolInfo,
    fechaCorta, fechaSolo, dinero, iniciales,
    toast, navegar, generarQR, obtenerGPS,
    modal, cerrarModal, esc,
  };
})(window);
