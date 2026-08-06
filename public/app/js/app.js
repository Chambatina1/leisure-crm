/* ====================================================================
   app.js — Lógica principal del CRM (frontend)
   Leisure Exporting LLC · geocabezas
   Datos vía API (fetch a /api/...). Sesión por cookie httpOnly.
   ==================================================================== */
(function () {
  "use strict";

  const { API, UI } = window;

  let SESSION = null; // { usuario, agencia }
  let MAPA = null, MARKERS = [];
  let SCAN_RUN = false, SCAN_RAF = null, SCAN_STREAM = null;
  let CUENTAS_CACHE = [
    { codigo: "110", nombre: "Caja / Efectivo",     tipo: "activo" },
    { codigo: "120", nombre: "Bancos",              tipo: "activo" },
    { codigo: "130", nombre: "Cuentas por cobrar",  tipo: "activo" },
    { codigo: "210", nombre: "Cuentas por pagar",   tipo: "pasivo" },
    { codigo: "300", nombre: "Capital",             tipo: "patrimonio" },
    { codigo: "400", nombre: "Ingresos por envío",  tipo: "ingreso" },
    { codigo: "410", nombre: "Otros ingresos",      tipo: "ingreso" },
    { codigo: "500", nombre: "Costo de transporte", tipo: "gasto" },
    { codigo: "510", nombre: "Gastos operativos",   tipo: "gasto" },
    { codigo: "520", nombre: "Combustible",         tipo: "gasto" },
  ];

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    try {
      const r = await API.Auth.me();
      if (!r.usuario) { location.href = "/login"; return; }
      SESSION = { usuario: r.usuario, agencia: r.agencia };
    } catch (e) {
      location.href = "/login"; return;
    }
    mostrarApp();
    bindGlobal();
    bindModulos();
    await cargarDashboard();
  }

  /* ================================================================
     HELPERS DE ALCANCE (espejo de permisos.ts, para el frontend)
     ================================================================ */
  const esAdmin = () => SESSION && SESSION.usuario && SESSION.usuario.rol === "admin";
  const miAgenciaId = () => SESSION && SESSION.agencia ? SESSION.agencia.id : null;
  const tengoPermisoSubagencias = () => !!(SESSION && SESSION.agencia && SESSION.agencia.puedeCrearSubagencias);
  async function alcanceAgencias() {
    if (esAdmin()) return await API.Agencias.all();
    if (!SESSION.agencia) return [];
    const mias = [SESSION.agencia];
    if (tengoPermisoSubagencias()) {
      const subs = await API.Agencias.hijos(SESSION.agencia.id);
      return [...mias, ...subs];
    }
    return mias;
  }
  function soloAdmin(accion) {
    if (!esAdmin()) { UI.toast("Solo el administrador puede " + accion, true); return false; }
    return true;
  }

  /* ================================================================
     APP SHELL + SESIÓN
     ================================================================ */
  function mostrarApp() {
    const el = document.getElementById("appShell");
    el.classList.add("ready");
    const c = document.getElementById("cargandoInicial");
    if (c) c.remove();
    const u = SESSION.usuario;
    document.getElementById("userName").textContent = u.nombre || u.usuario;
    document.getElementById("userRol").textContent = UI.rolInfo(u.rol).label;
    document.getElementById("userAvatar").textContent = UI.iniciales(u.nombre || u.usuario);
    document.querySelectorAll(".topnav a").forEach((a) => {
      const roles = (a.dataset.roles || "").split(",");
      let ver = roles.includes(u.rol);
      if (a.getAttribute("href") === "#agencias" && !ver) ver = tengoPermisoSubagencias();
      a.classList.toggle("hidden-role", !ver);
    });
  }

  async function logout() {
    detenerScan();
    try { await API.Auth.logout(); } catch {}
    SESSION = null;
    location.href = "/login";
  }

  function bindGlobal() {
    window.addEventListener("hashchange", () => UI.navegar(location.hash));
    document.querySelectorAll(".topnav a").forEach((a) =>
      a.addEventListener("click", () => UI.navegar(a.getAttribute("href")))
    );
    document.getElementById("menuBtn").addEventListener("click", () =>
      document.getElementById("topnav").classList.toggle("open")
    );
    document.getElementById("btnLogout").addEventListener("click", logout);
    window.addEventListener("view:changed", async (e) => {
      const id = e.detail.id;
      if (id === "dashboard") await cargarDashboard();
      if (id === "paquetes") await cargarPaquetes();
      if (id === "etiqueta") await cargarFormEtiqueta();
      if (id === "rastrear") await cargarRastreo();
      if (id === "escanear") await cargarEscaneosRecientes();
      if (id === "clientes") await cargarClientes();
      if (id === "agencias") await cargarAgencias();
      if (id === "contabilidad") await cargarContabilidad();
    });
  }

  /* ================================================================
     DASHBOARD (rastreador central para admin)
     ================================================================ */
  async function cargarDashboard() {
    try {
      const d = await API.Dashboard.get();
      const k = d.kpis, r = d.resumen;
      document.getElementById("dashSub").textContent =
        esAdmin() ? "Rastreo general · todas las agencias (consolidado)" : `Resumen — ${SESSION.agencia?.nombre || ""}`;
      document.getElementById("kpis").innerHTML = `
        <div class="kpi kpi-prim"><div class="kpi-label">Paquetes totales</div><div class="kpi-value">${k.paquetes}</div></div>
        <div class="kpi kpi-gold"><div class="kpi-label">En tránsito</div><div class="kpi-value">${k.enTransito}</div></div>
        <div class="kpi"><div class="kpi-label">Entregados</div><div class="kpi-value">${k.entregados}</div></div>
        <div class="kpi kpi-prim"><div class="kpi-label">Monto envíos</div><div class="kpi-value">${UI.dinero(k.montoTotal)}</div></div>`;
      const ult = d.ultimos || [];
      document.getElementById("dashPaquetes").innerHTML = ult.length ? ult.map((p) => {
        const ei = UI.estadoInfo(p.estado);
        return `<tr><td><b>${UI.esc(p.codigo)}</b></td><td>${UI.esc(p.destinatario)}</td>
          <td><span class="estado-badge ${ei.cls}">${ei.label}</span></td>
          <td class="text-right">${UI.dinero(p.monto)}</td></tr>`;
      }).join("") : `<tr><td colspan="4" class="muted" style="padding:20px;text-align:center">Sin paquetes</td></tr>`;
      document.getElementById("dashFin").innerHTML = `
        <div class="kpis" style="margin:0">
          <div class="kpi"><div class="kpi-label">Ingresos</div><div class="kpi-value">${UI.dinero(r.ingreso)}</div></div>
          <div class="kpi kpi-red"><div class="kpi-label">Gastos</div><div class="kpi-value">${UI.dinero(r.gasto)}</div></div>
          <div class="kpi kpi-gold"><div class="kpi-label">Utilidad</div><div class="kpi-value">${UI.dinero(r.utilidad)}</div></div>
        </div>
        <div class="flex" style="margin-top:14px; gap:18px; flex-wrap:wrap; font-size:.86rem;">
          <span class="muted">Caja: <b style="color:var(--verde)">${UI.dinero(r.caja)}</b></span>
          <span class="muted">Bancos: <b style="color:var(--verde)">${UI.dinero(r.bancos)}</b></span>
        </div>`;
    } catch (e) { UI.toast("Error al cargar panel: " + e.message, true); }
  }

  /* ================================================================
     PAQUETES
     ================================================================ */
  function bindModulos() {
    document.getElementById("btnNuevoPaquete").addEventListener("click", abrirModalPaquete);
    document.getElementById("paqBuscar").addEventListener("input", cargarPaquetes);
    document.getElementById("paqFiltroEstado").addEventListener("change", cargarPaquetes);
    document.getElementById("formEtiqueta").addEventListener("submit", crearDesdeEtiqueta);
    document.getElementById("btnImprimir").addEventListener("click", () => window.print());
    document.getElementById("searchForm").addEventListener("submit", (e) => {
      e.preventDefault(); buscarPaquete(document.getElementById("searchInput").value);
    });
    document.getElementById("btnIniciarScan").addEventListener("click", iniciarScan);
    document.getElementById("btnDetenerScan").addEventListener("click", detenerScan);
    document.getElementById("formManual").addEventListener("submit", (e) => {
      e.preventDefault();
      const codigo = document.getElementById("manualCodigo").value.trim().toUpperCase();
      if (codigo) procesarEscaneo(codigo);
    });
    document.getElementById("btnNuevoCliente").addEventListener("click", abrirModalCliente);
    document.getElementById("btnNuevaAgencia").addEventListener("click", () => abrirModalAgencia(null));
    document.getElementById("btnNuevoAsiento").addEventListener("click", abrirModalAsiento);
  }

  async function cargarPaquetes() {
    try {
      const buscar = (document.getElementById("paqBuscar").value || "").trim();
      const estado = document.getElementById("paqFiltroEstado").value;
      const params = new URLSearchParams();
      if (buscar) params.set("buscar", buscar);
      if (estado) params.set("estado", estado);
      const q = params.toString() ? "?" + params.toString() : "";
      const paquetes = (await API._raw("/api/paquetes" + q)).paquetes;
      const tbody = document.getElementById("tablaPaquetes");
      tbody.innerHTML = paquetes.length ? paquetes.map((p) => {
        const ei = UI.estadoInfo(p.estado);
        return `<tr>
          <td><b>${UI.esc(p.codigo)}</b><br><small class="muted">${UI.esc(p.agencia?.nombre || "")}</small></td>
          <td>${UI.esc(p.remitente)}</td><td>${UI.esc(p.destinatario)}</td>
          <td>${UI.esc(p.destino)}</td><td>${UI.esc(p.peso)} lb</td>
          <td><span class="estado-badge ${ei.cls}">${ei.label}</span></td>
          <td class="text-right">${UI.dinero(p.monto)}</td>
          <td class="text-right"><button class="btn btn-ghost btn-sm" onclick="App.verPaquete('${p.codigo}')">Ver</button></td>
        </tr>`;
      }).join("") : `<tr><td colspan="8" class="empty-state"><div class="ico">📦</div>No hay paquetes.</td></tr>`;
    } catch (e) { UI.toast("Error: " + e.message, true); }
  }

  async function abrirModalPaquete() {
    if (!esAdmin() && !SESSION.agencia) return UI.toast("No tienes agencia asignada", true);
    const ags = await alcanceAgencias();
    const clientes = (await API.Clientes.all()).filter((c) => ags.some((a) => a.id === c.agenciaId));
    UI.modal(`
      <h3>➕ Nuevo paquete</h3>
      <form id="fNuevoPaq">
        <div class="field"><label>Agencia</label><select name="agenciaId" required>
          ${ags.map((a) => `<option value="${a.id}">${UI.esc(a.nombre)}</option>`).join("")}
        </select></div>
        <div class="field"><label>Cliente (opcional)</label><select name="clienteId">
          <option value="">— Sin cliente —</option>
          ${clientes.map((c) => `<option value="${c.id}">${UI.esc(c.nombre)}</option>`).join("")}
        </select></div>
        <div class="field-row">
          <div class="field"><label>Remitente *</label><input name="remitente" required /></div>
          <div class="field"><label>Destinatario *</label><input name="destinatario" required /></div>
        </div>
        <div class="field"><label>Destino *</label><input name="destino" required placeholder="La Habana, Cuba" /></div>
        <div class="field-row">
          <div class="field"><label>Peso (lb)</label><input name="peso" type="number" min="0" step="0.1" value="1" /></div>
          <div class="field"><label>Tarifa / lb</label><input name="tarifa" type="number" min="0" step="0.01" /></div>
        </div>
        <div class="field"><label>Contenido</label><select name="contenido">
          <option>Paquete</option><option>Documentos</option><option>Comida</option><option>Ropa</option><option>Electrodoméstico</option><option>Medicina</option><option>Otro</option>
        </select></div>
        <div class="form-actions"><button class="btn btn-primary" type="submit">Crear</button><button class="btn btn-ghost" type="button" onclick="UI.cerrarModal()">Cancelar</button></div>
      </form>`);
    document.getElementById("fNuevoPaq").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const p = await API.Paquetes.crear({
          agenciaId: fd.get("agenciaId"), clienteId: fd.get("clienteId") || null,
          remitente: fd.get("remitente"), destinatario: fd.get("destinatario"),
          destino: fd.get("destino"), peso: fd.get("peso"), contenido: fd.get("contenido"),
          tarifa: fd.get("tarifa"),
        });
        UI.cerrarModal(); UI.toast("Paquete " + p.codigo + " creado");
        await cargarPaquetes();
      } catch (err) { UI.toast(err.message, true); }
    });
  }

  window.App = {
    verPaquete: (codigo) => { location.hash = "#rastrear"; setTimeout(() => buscarPaquete(codigo), 120); },
    cambiarEstado: cambiarEstadoPaquete,
    editarAgencia: (id) => abrirModalAgencia(id),
    eliminarAgencia: eliminarAgencia,
    eliminarCliente: eliminarCliente,
  };

  async function cambiarEstadoPaquete(codigo, estado) {
    const gps = await UI.obtenerGPS();
    try {
      await API.Paquetes.cambiarEstado(codigo, {
        estado, nota: "Cambio manual",
        lat: gps?.lat, lng: gps?.lng, accuracy: gps?.accuracy,
      });
      UI.toast("Estado actualizado → " + UI.estadoInfo(estado).label);
      await cargarPaquetes();
    } catch (e) { UI.toast(e.message, true); }
  }

  /* ================================================================
     ETIQUETA
     ================================================================ */
  async function cargarFormEtiqueta() {
    const ags = await alcanceAgencias();
    const sel = document.getElementById("e_agencia");
    sel.innerHTML = ags.map((a) => `<option value="${a.id}">${UI.esc(a.nombre)}</option>`).join("");
    if (SESSION.agencia && !esAdmin()) sel.value = SESSION.agencia.id;
    const clientes = (await API.Clientes.all()).filter((c) => ags.some((a) => a.id === c.agenciaId));
    document.getElementById("e_cliente").innerHTML =
      `<option value="">— Sin cliente —</option>` + clientes.map((c) => `<option value="${c.id}">${UI.esc(c.nombre)}</option>`).join("");
    if (!document.getElementById("e_tarifa").value) document.getElementById("e_tarifa").value = "4.50";
  }

  async function crearDesdeEtiqueta(e) {
    e.preventDefault();
    const agenciaId = document.getElementById("e_agencia").value;
    const data = {
      agenciaId,
      clienteId: document.getElementById("e_cliente").value || null,
      remitente: document.getElementById("e_remitente").value,
      destinatario: document.getElementById("e_destinatario").value,
      destino: document.getElementById("e_destino").value,
      peso: document.getElementById("e_peso").value,
      contenido: document.getElementById("e_contenido").value,
      notas: document.getElementById("e_notas").value,
      tarifa: document.getElementById("e_tarifa").value,
      formaPago: document.getElementById("e_pago").value,
    };
    try {
      const p = await API.Paquetes.crear(data);
      renderEtiqueta(p);
      UI.toast("Etiqueta " + p.codigo + " creada");
      document.getElementById("btnImprimir").disabled = false;
    } catch (err) { UI.toast(err.message, true); }
  }

  function renderEtiqueta(p) {
    const qr = UI.generarQR(p.codigo);
    const prev = document.getElementById("etiquetaPreview");
    prev.classList.remove("etiqueta-empty");
    prev.innerHTML = `
      <div class="etiqueta-sheet" id="hojaEtiqueta">
        <div class="e-head"><img src="icons/logo.svg" alt="logo" /><div class="e-codigo">${UI.esc(p.codigo)}</div></div>
        <div class="e-grid">
          <div class="e-data">
            <div><b>De:</b> ${UI.esc(p.remitente)}</div>
            <div><b>Para:</b> ${UI.esc(p.destinatario)}</div>
            <div><b>Destino:</b> ${UI.esc(p.destino)}</div>
            <div><b>Contenido:</b> ${UI.esc(p.contenido)} · ${UI.esc(p.peso)} lb</div>
            ${p.notas ? `<div><b>Notas:</b> ${UI.esc(p.notas)}</div>` : ""}
            <div><b>Monto:</b> ${UI.dinero(p.monto)}</div>
          </div>
          <div class="e-qr"><img src="${qr}" alt="QR" /></div>
        </div>
        <div class="e-foot">Leisure Exporting LLC · Escanea el QR para rastrear este paquete</div>
      </div>`;
  }

  /* ================================================================
     RASTREO + MAPA
     ================================================================ */
  async function cargarRastreo() {
    await renderListaRastreo();
    if (!MAPA) initMapa();
    else setTimeout(() => MAPA.invalidateSize(), 100);
  }
  function initMapa() {
    MAPA = L.map("mapa", { zoomControl: true }).setView([23.1, -82.3], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", maxZoom: 19,
    }).addTo(MAPA);
  }
  async function renderListaRastreo() {
    const paquetes = await API.Paquetes.all();
    const ul = document.getElementById("paqueteLista");
    ul.innerHTML = paquetes.length ? paquetes.slice(0, 50).map((p) => {
      const ei = UI.estadoInfo(p.estado);
      return `<li style="padding:9px 10px;border-radius:8px;cursor:pointer;font-size:.86rem;display:flex;justify-content:space-between;align-items:center;gap:8px"
        onclick="App.verPaquete('${p.codigo}')">
        <span><b>${UI.esc(p.codigo)}</b><br><small class="muted">${UI.esc(p.destinatario)} → ${UI.esc(p.destino)}</small></span>
        <span class="estado-badge ${ei.cls}">${ei.label}</span></li>`;
    }).join("") : `<li class="muted" style="padding:14px">Sin paquetes</li>`;
  }

  async function buscarPaquete(codigo) {
    codigo = String(codigo || "").trim().toUpperCase();
    if (!codigo) return;
    const box = document.getElementById("paqueteDetalle");
    try {
      const p = await API.Paquetes.get(codigo);
      const ei = UI.estadoInfo(p.estado);
      box.hidden = false;
      box.innerHTML = `
        <h3>${UI.esc(p.codigo)} <span class="estado-badge ${ei.cls}" style="margin-left:6px">${ei.label}</span></h3>
        <div style="font-size:.84rem;">
          <div style="padding:4px 0;border-bottom:1px dashed var(--gris-2)"><b>De:</b> ${UI.esc(p.remitente)}</div>
          <div style="padding:4px 0;border-bottom:1px dashed var(--gris-2)"><b>Para:</b> ${UI.esc(p.destinatario)}</div>
          <div style="padding:4px 0;border-bottom:1px dashed var(--gris-2)"><b>Destino:</b> ${UI.esc(p.destino)}</div>
          <div style="padding:4px 0;border-bottom:1px dashed var(--gris-2)"><b>Agencia:</b> ${UI.esc(p.agencia?.nombre || "—")}</div>
          <div style="padding:4px 0"><b>Monto:</b> ${UI.dinero(p.monto)}</div>
        </div>
        <h4 style="margin:14px 0 4px;font-size:.86rem;color:var(--prim)">Historial GPS</h4>
        <ul class="timeline">
          ${(p.eventos || []).slice().reverse().map((h) => {
            const hi = UI.estadoInfo(h.estado);
            const gps = (h.lat != null && h.lng != null) ? `<small>📍 ${Number(h.lat).toFixed(5)}, ${Number(h.lng).toFixed(5)}</small>` : "";
            return `<li><b>${hi.ico} ${hi.label}</b> · ${UI.fechaCorta(h.ts)}<br>${UI.esc(h.nota || "")}${gps}</li>`;
          }).join("")}
        </ul>
        <div class="form-actions" style="margin-top:14px">
          ${["en_transito", "en_almacen", "entregado"].map((est) =>
            `<button class="btn btn-ghost btn-sm" onclick="App.cambiarEstado('${p.codigo}','${est}')">→ ${UI.estadoInfo(est).label}</button>`
          ).join("")}
        </div>`;
      dibujarMapa(p);
    } catch {
      box.hidden = false;
      box.innerHTML = `<h3>No encontrado</h3><p class="muted">El código <b>${UI.esc(codigo)}</b> no existe.</p>`;
    }
  }

  function dibujarMapa(p) {
    if (!MAPA) return;
    MARKERS.forEach((m) => MAPA.removeLayer(m));
    MARKERS = [];
    const pts = (p.eventos || []).filter((h) => h.lat != null && h.lng != null);
    if (!pts.length) { UI.toast("Este paquete aún no tiene puntos GPS", true); return; }
    const color = { en_origen: "#2563eb", en_transito: "#e0a106", en_almacen: "#7c3aed", entregado: "#1f6b3a" };
    pts.forEach((h) => {
      const m = L.circleMarker([Number(h.lat), Number(h.lng)], {
        radius: 9, color: "#fff", weight: 2, fillColor: color[h.estado] || "#C23B22", fillOpacity: 1,
      }).addTo(MAPA).bindPopup(`<b>${UI.esc(p.codigo)}</b><br>${UI.estadoInfo(h.estado).label}<br>${UI.fechaCorta(h.ts)}`);
      MARKERS.push(m);
    });
    const latlngs = pts.map((h) => [Number(h.lat), Number(h.lng)]);
    if (latlngs.length > 1) MARKERS.push(L.polyline(latlngs, { color: "#C23B22", weight: 2.5, opacity: .7, dashArray: "6 6" }).addTo(MAPA));
    const last = pts[pts.length - 1];
    MAPA.setView([Number(last.lat), Number(last.lng)], 13);
  }

  /* ================================================================
     ESCANEO
     ================================================================ */
  async function iniciarScan() {
    const video = document.getElementById("scanVideo");
    try {
      SCAN_STREAM = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = SCAN_STREAM;
      await video.play();
    } catch {
      UI.toast("No se pudo acceder a la cámara. Usa el registro manual.", true); return;
    }
    document.getElementById("scanStage").hidden = false;
    document.getElementById("btnDetenerScan").hidden = false;
    document.getElementById("btnIniciarScan").textContent = "📷 Cámara activa…";
    SCAN_RUN = true;
    tickScan();
  }
  function tickScan() {
    if (!SCAN_RUN) return;
    const video = document.getElementById("scanVideo");
    const canvas = document.getElementById("scanCanvas");
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const w = video.videoWidth, h = video.videoHeight;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, w, h);
      const img = ctx.getImageData(0, 0, w, h);
      const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
      if (code && code.data) { detenerScan(); procesarEscaneo(code.data); return; }
    }
    SCAN_RAF = requestAnimationFrame(tickScan);
  }
  function detenerScan() {
    SCAN_RUN = false;
    if (SCAN_RAF) cancelAnimationFrame(SCAN_RAF);
    SCAN_RAF = null;
    if (SCAN_STREAM) { SCAN_STREAM.getTracks().forEach((t) => t.stop()); SCAN_STREAM = null; }
    const stage = document.getElementById("scanStage");
    if (stage) stage.hidden = true;
    const btnDet = document.getElementById("btnDetenerScan");
    if (btnDet) btnDet.hidden = true;
    const btnIni = document.getElementById("btnIniciarScan");
    if (btnIni) btnIni.textContent = "📷 Iniciar cámara";
  }

  async function procesarEscaneo(codigoRaw) {
    let codigo = String(codigoRaw || "").trim().toUpperCase();
    codigo = codigo.replace(/^.*?\/R\//, "").replace(/^.*?[?&]C=/, "").replace(/[^A-Z0-9-]/g, "");
    if (!codigo) return;
    const estado = document.getElementById("scanEstado").value;
    const gps = await UI.obtenerGPS();
    const box = document.getElementById("scanResultado");
    box.hidden = false;
    try {
      const r = await API._raw("/api/escaneo", {
        method: "POST", body: JSON.stringify({ codigo, estado, lat: gps?.lat, lng: gps?.lng, accuracy: gps?.accuracy }),
      });
      const ei = UI.estadoInfo(r.paquete.estado);
      box.className = "scan-resultado ok";
      box.innerHTML = `<h4>✅ ${UI.esc(r.paquete.codigo)} → ${ei.label}</h4>
        <p style="margin:4px 0">Registrado en el servidor central.</p>
        ${gps ? `<small class="muted">📍 ${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)} (±${Math.round(gps.accuracy)}m)</small>` : `<small class="muted">Sin GPS</small>`}`;
      UI.toast("Escaneo registrado: " + r.paquete.codigo);
      await cargarEscaneosRecientes();
    } catch (e) {
      box.className = "scan-resultado err";
      box.innerHTML = `<h4>❌ Error</h4><p>${UI.esc(e.message)}</p>`;
      UI.toast(e.message, true);
    }
  }

  async function cargarEscaneosRecientes() {
    try {
      const paquetes = await API.Paquetes.all();
      const recientes = paquetes
        .map((p) => ({ p, last: (p.eventos || []).slice(-1)[0] || { ts: p.ultimoEscaneo } }))
        .filter((x) => x.last && x.last.ts)
        .sort((a, b) => new Date(b.last.ts) - new Date(a.last.ts))
        .slice(0, 12);
      const ul = document.getElementById("scanHistorial");
      ul.innerHTML = recientes.length ? recientes.map(({ p, last }) => {
        const ei = UI.estadoInfo(last.estado || p.estado);
        const gps = (last.lat != null && last.lng != null)
          ? `<a class="gps-link" target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${last.lat}&mlon=${last.lng}#map=16/${last.lat}/${last.lng}">📍 Ver mapa</a>`
          : `<span class="muted">sin GPS</span>`;
        return `<li><span><b>${UI.esc(p.codigo)}</b> · ${ei.label}<br><small class="muted">${UI.esc(p.destinatario)} · ${UI.fechaCorta(last.ts)}</small></span><span></span><span>${gps}</span></li>`;
      }).join("") : `<li class="muted" style="padding:14px">Aún no hay escaneos</li>`;
    } catch {}
  }

  /* ================================================================
     CLIENTES
     ================================================================ */
  async function cargarClientes() {
    const clientes = await API.Clientes.all();
    document.getElementById("tablaClientes").innerHTML = clientes.length ? clientes.map((c) =>
      `<tr><td><b>${UI.esc(c.nombre)}</b></td><td>${UI.esc(c.telefono || "—")}</td><td>${UI.esc(c.email || "—")}</td><td>${UI.esc(c.direccion || "—")}</td>
       <td class="text-right"><button class="btn btn-ghost btn-sm" onclick="App.eliminarCliente('${c.id}')">🗑️</button></td></tr>`
    ).join("") : `<tr><td colspan="5" class="empty-state"><div class="ico">👥</div>Sin clientes</td></tr>`;
  }
  async function abrirModalCliente() {
    const ags = await alcanceAgencias();
    UI.modal(`
      <h3>➕ Nuevo cliente</h3>
      <form id="fCliente">
        <div class="field"><label>Nombre *</label><input name="nombre" required /></div>
        <div class="field-row">
          <div class="field"><label>Teléfono</label><input name="telefono" /></div>
          <div class="field"><label>Email</label><input name="email" type="email" /></div>
        </div>
        <div class="field"><label>Dirección</label><input name="direccion" /></div>
        <div class="field"><label>Agencia</label><select name="agenciaId">
          ${ags.map((a) => `<option value="${a.id}" ${SESSION.agencia && a.id === SESSION.agencia.id ? "selected" : ""}>${UI.esc(a.nombre)}</option>`).join("")}
        </select></div>
        <div class="form-actions"><button class="btn btn-primary" type="submit">Guardar</button><button class="btn btn-ghost" type="button" onclick="UI.cerrarModal()">Cancelar</button></div>
      </form>`);
    document.getElementById("fCliente").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const agenciaId = esAdmin() ? fd.get("agenciaId") : miAgenciaId();
      try {
        await API.Clientes.save({ nombre: fd.get("nombre"), telefono: fd.get("telefono"), email: fd.get("email"), direccion: fd.get("direccion"), agenciaId });
        UI.cerrarModal(); UI.toast("Cliente guardado"); await cargarClientes();
      } catch (err) { UI.toast(err.message, true); }
    });
  }
  async function eliminarCliente(id) {
    if (!confirm("¿Eliminar este cliente?")) return;
    try { await API.Clientes.remove(id); await cargarClientes(); UI.toast("Cliente eliminado"); }
    catch (e) { UI.toast(e.message, true); }
  }

  /* ================================================================
     AGENCIAS
     ================================================================ */
  async function cargarAgencias() {
    const todas = await API.Agencias.all();
    const usuarios = await API.Usuarios.all();
    const contarUsers = (id) => usuarios.filter((u) => u.agenciaId === id).length;
    const puedeEditar = (a) => esAdmin() || miAgenciaId() === a.id;
    const puedeSubDe = (a) => esAdmin() || (tengoPermisoSubagencias() && miAgenciaId() === a.id);
    const permisoTag = (a) => a.puedeCrearSubagencias ? ` <span class="estado-badge estado-entregado" style="margin-left:4px">✓ subagencias</span>` : "";
    const nodo = (a, nivel) => {
      const tipoCls = a.tipo === "matriz" ? "tipo-matriz" : (a.tipo === "subagencia" ? "tipo-subagencia" : "tipo-agencia");
      const btnEditar = puedeEditar(a) ? `<button class="btn btn-ghost btn-sm" onclick="App.editarAgencia('${a.id}')">✏️ Editar</button>` : "";
      const btnSub = puedeSubDe(a) ? `<button class="btn btn-verde btn-sm" onclick="abrirSubagencia('${a.id}')">➕ Subagencia</button>` : "";
      const btnEliminar = esAdmin() ? `<button class="btn btn-ghost btn-sm" onclick="App.eliminarAgencia('${a.id}')" title="Eliminar">🗑️</button>` : "";
      return `<div class="panel" style="margin-left:${nivel * 20}px; margin-bottom:12px">
        <div class="flex" style="justify-content:space-between; flex-wrap:wrap; align-items:flex-start">
          <div>
            <span class="tipo-agencia ${tipoCls}">${UI.esc(a.tipo)}</span>
            <b style="margin-left:8px">${UI.esc(a.nombre)}</b>${permisoTag(a)}
            <br><small class="muted">${UI.esc(a.direccion || "")} ${a.ciudad ? "· " + UI.esc(a.ciudad) : ""} ${a.pais ? "· " + UI.esc(a.pais) : ""} · 👥 ${contarUsers(a.id)}</small>
          </div>
          <div class="flex gap-sm">${btnEditar}${btnSub}${btnEliminar}</div>
        </div></div>`;
    };
    let html = "";
    if (esAdmin()) {
      const roots = todas.filter((a) => a.tipo === "matriz" || !a.padreId);
      const render = (a, nivel) => { html += nodo(a, nivel); todas.filter((x) => x.padreId === a.id).forEach((h) => render(h, nivel + 1)); };
      roots.forEach((r) => render(r, 0));
      if (!html) todas.forEach((a) => { html += nodo(a, 0); });
    } else {
      const mia = SESSION.agencia;
      if (mia) {
        html += nodo(mia, 0);
        todas.filter((a) => a.padreId === mia.id).forEach((s) => { html += nodo(s, 1); });
      }
    }
    document.getElementById("agenciasTree").innerHTML = html || `<div class="empty-state"><div class="ico">🏢</div>Sin agencias</div>`;
  }

  async function abrirModalAgencia(id) {
    const a = id ? await API.Agencias.get(id) : null;
    if (esAdmin()) {
      // ok
    } else if (tengoPermisoSubagencias() && !id) {
      // crea subagencia bajo mí
    } else if (tengoPermisoSubagencias() && id && a && a.padreId === miAgenciaId()) {
      // editar subagencia propia
    } else { UI.toast("No tienes permiso para gestionar agencias", true); return; }
    const todas = await API.Agencias.all();
    const padres = todas.filter((x) => x.id !== id);
    const soyAgenciaConPermiso = !esAdmin() && tengoPermisoSubagencias();
    const tipoField = soyAgenciaConPermiso
      ? `<input type="hidden" name="tipo" value="subagencia"><div class="field"><label>Tipo</label><input value="Subagencia" disabled></div>`
      : `<div class="field"><label>Tipo</label><select name="tipo">
          <option value="matriz" ${a?.tipo === "matriz" ? "selected" : ""}>Matriz</option>
          <option value="agencia" ${a?.tipo === "agencia" || !a ? "selected" : ""}>Agencia</option>
          <option value="subagencia" ${a?.tipo === "subagencia" ? "selected" : ""}>Subagencia</option>
        </select></div>`;
    const padreField = soyAgenciaConPermiso
      ? `<input type="hidden" name="padreId" value="${miAgenciaId() || ""}"><div class="field"><label>Depende de</label><input value="${UI.esc(SESSION.agencia?.nombre || "—")}" disabled></div>`
      : `<div class="field"><label>Depende de (padre)</label><select name="padreId">
          <option value="">— Ninguna —</option>
          ${padres.map((p) => `<option value="${p.id}" ${a?.padreId === p.id ? "selected" : ""}>${UI.esc(p.nombre)}</option>`).join("")}
        </select></div>`;
    const permisoField = esAdmin()
      ? `<div class="field" style="display:flex;align-items:center;gap:8px">
          <input type="checkbox" name="puedeCrearSubagencias" id="chkPerm" ${a?.puedeCrearSubagencias ? "checked" : ""}>
          <label for="chkPerm" style="margin:0">Esta agencia <b>puede crear subagencias</b> debajo de ella</label>
        </div>`
      : `<input type="hidden" name="puedeCrearSubagencias" value="${a?.puedeCrearSubagencias ? "on" : ""}">`;
    UI.modal(`
      <h3>${a ? "✏️ Editar agencia" : "➕ Nueva agencia"}</h3>
      <form id="fAgencia">
        <div class="field"><label>Nombre *</label><input name="nombre" required value="${UI.esc(a?.nombre || "")}" /></div>
        <div class="field-row">${tipoField}${padreField}</div>
        <div class="field"><label>Dirección</label><input name="direccion" value="${UI.esc(a?.direccion || "")}" /></div>
        <div class="field-row">
          <div class="field"><label>Ciudad</label><input name="ciudad" value="${UI.esc(a?.ciudad || "")}" /></div>
          <div class="field"><label>País</label><input name="pais" value="${UI.esc(a?.pais || "")}" /></div>
        </div>
        <div class="field"><label>Teléfono</label><input name="telefono" value="${UI.esc(a?.telefono || "")}" /></div>
        ${permisoField}
        <div class="form-actions"><button class="btn btn-primary" type="submit">Guardar</button><button class="btn btn-ghost" type="button" onclick="UI.cerrarModal()">Cancelar</button></div>
      </form>`);
    document.getElementById("fAgencia").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      let data;
      if (esAdmin()) {
        data = {
          nombre: fd.get("nombre"), tipo: fd.get("tipo"),
          padreId: fd.get("padreId") || null, direccion: fd.get("direccion"),
          ciudad: fd.get("ciudad"), pais: fd.get("pais"), telefono: fd.get("telefono"),
          puedeCrearSubagencias: fd.get("puedeCrearSubagencias") === "on",
        };
      } else {
        data = { nombre: fd.get("nombre"), tipo: "subagencia", padreId: miAgenciaId(),
          direccion: fd.get("direccion"), ciudad: fd.get("ciudad"), pais: fd.get("pais"), telefono: fd.get("telefono") };
      }
      try {
        await API.Agencias.save(a ? { ...a, ...data } : data);
        if (a && miAgenciaId() === a.id) SESSION.agencia = await API.Agencias.get(a.id);
        UI.cerrarModal(); UI.toast("Agencia guardada"); await cargarAgencias();
      } catch (err) { UI.toast(err.message, true); }
    });
  }

  async function abrirSubagencia(padreId) {
    if (esAdmin()) {
      await abrirModalAgencia(null);
      setTimeout(() => {
        const t = document.querySelector("#fAgencia [name=tipo]");
        const p = document.querySelector("#fAgencia [name=padreId]");
        if (t) t.value = "subagencia";
        if (p) p.value = padreId;
      }, 50);
    } else if (tengoPermisoSubagencias()) {
      if (padreId !== miAgenciaId()) { UI.toast("Solo puedes crear subagencias dentro de tu agencia", true); return; }
      await abrirModalAgencia(null);
    } else {
      UI.toast("No tienes permiso para crear subagencias. Pídelo al administrador.", true);
    }
  }
  window.abrirSubagencia = abrirSubagencia;

  async function eliminarAgencia(id) {
    if (!soloAdmin("eliminar agencias")) return;
    if (!confirm("¿Eliminar esta agencia?")) return;
    try { await API.Agencias.remove(id); await cargarAgencias(); UI.toast("Agencia eliminada"); }
    catch (e) { UI.toast(e.message, true); }
  }

  /* ================================================================
     CONTABILIDAD
     ================================================================ */
  async function cargarContabilidad() {
    try {
      const [mayor, r, asientos] = await Promise.all([API.Asientos.mayor(), API.Asientos.resumen(), API.Asientos.all()]);
      document.getElementById("kpiFinanciero").innerHTML = `
        <div class="kpi"><div class="kpi-label">Ingresos</div><div class="kpi-value">${UI.dinero(r.ingreso)}</div></div>
        <div class="kpi kpi-red"><div class="kpi-label">Gastos</div><div class="kpi-value">${UI.dinero(r.gasto)}</div></div>
        <div class="kpi kpi-gold"><div class="kpi-label">Utilidad</div><div class="kpi-value">${UI.dinero(r.utilidad)}</div></div>
        <div class="kpi kpi-prim"><div class="kpi-label">Caja</div><div class="kpi-value">${UI.dinero(r.caja)}</div></div>`;
      document.getElementById("tablaMayor").innerHTML = mayor.map((c) =>
        `<tr class="${c.tipo}"><td><b>${c.codigo}</b> ${UI.esc(c.nombre)}<br><small class="muted">${c.tipo}</small></td>
         <td class="text-right">${UI.dinero(c.debito)}</td><td class="text-right">${UI.dinero(c.credito)}</td>
         <td class="text-right saldo">${UI.dinero(c.saldo)}</td></tr>`
      ).join("");
      document.getElementById("listaAsientos").innerHTML = asientos.length ? asientos.slice(0, 30).map((a) =>
        `<div style="padding:10px; border-bottom:1px solid var(--gris-2); font-size:.84rem">
          <div class="flex" style="justify-content:space-between"><b>${UI.esc(a.descripcion || "(sin desc.)")}</b><small class="muted">${UI.fechaSolo(a.fecha)}</small></div>
          ${(a.lineas || []).map((l) => `<div style="display:flex;justify-content:space-between;color:var(--gris)"><span>${l.cuenta}</span><span>${l.debito ? "+" + UI.dinero(l.debito) + " Db" : ""} ${l.credito ? "−" + UI.dinero(l.credito) + " Cr" : ""}</span></div>`).join("")}
        </div>`
      ).join("") : `<div class="empty-state"><div class="ico">💰</div>Sin asientos</div>`;
    } catch (e) { UI.toast("Error: " + e.message, true); }
  }

  async function abrirModalAsiento() {
    const agId = SESSION.agencia?.id;
    const cuentasOpts = CUENTAS_CACHE.map((c) => `<option value="${c.codigo}">${c.codigo} — ${UI.esc(c.nombre)}</option>`).join("");
    UI.modal(`
      <h3>➕ Nuevo asiento contable</h3>
      <form id="fAsiento">
        <div class="field"><label>Descripción</label><input name="descripcion" placeholder="Ej: Pago de combustible" /></div>
        <div class="field-row">
          <div class="field"><label>Fecha</label><input name="fecha" type="date" value="${new Date().toISOString().slice(0, 10)}" /></div>
          <div class="field" ${!esAdmin() ? "hidden" : ""}><label>Agencia</label><select name="agenciaId" ${!esAdmin() ? "disabled" : ""}>
            ${(await API.Agencias.all()).map((a) => `<option value="${a.id}" ${a.id === agId ? "selected" : ""}>${UI.esc(a.nombre)}</option>`).join("")}
          </select></div>
        </div>
        <h4 style="margin:14px 0 6px;color:var(--prim)">Líneas (debe cuadrar débito = crédito)</h4>
        <table class="data" style="font-size:.8rem"><thead><tr><th>Cuenta</th><th class="text-right">Débito</th><th class="text-right">Crédito</th><th></th></tr></thead>
          <tbody id="bodyLineas"></tbody></table>
        <button type="button" class="btn btn-ghost btn-sm" id="addLinea" style="margin-top:8px">➕ Añadir línea</button>
        <div id="cuadreInfo" class="muted" style="margin-top:8px;font-size:.84rem"></div>
        <div class="form-actions"><button class="btn btn-primary" type="submit">Guardar</button><button class="btn btn-ghost" type="button" onclick="UI.cerrarModal()">Cancelar</button></div>
      </form>`);
    const body = document.getElementById("bodyLineas");
    const addLinea = () => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td><select style="width:100%;padding:6px;border:1px solid var(--gris-2);border-radius:6px">${cuentasOpts}</select></td>
        <td><input type="number" min="0" step="0.01" class="dbt" style="width:90px;padding:6px;border:1px solid var(--gris-2);border-radius:6px" value="0"></td>
        <td><input type="number" min="0" step="0.01" class="crd" style="width:90px;padding:6px;border:1px solid var(--gris-2);border-radius:6px" value="0"></td>
        <td><button type="button" class="btn btn-ghost btn-sm" onclick="this.closest('tr').remove();recalc()">✕</button></td>`;
      body.appendChild(tr);
      tr.querySelectorAll("input").forEach((i) => i.addEventListener("input", recalc));
    };
    const recalc = () => {
      let d = 0, c = 0;
      body.querySelectorAll("tr").forEach((tr) => {
        d += parseFloat(tr.querySelector(".dbt").value) || 0;
        c += parseFloat(tr.querySelector(".crd").value) || 0;
      });
      const info = document.getElementById("cuadreInfo");
      info.textContent = `Débito: ${UI.dinero(d)} · Crédito: ${UI.dinero(c)} · Diferencia: ${UI.dinero((d - c).toFixed(2))}`;
      info.style.color = Math.abs(d - c) < 0.01 ? "var(--verde)" : "var(--rojo)";
    };
    document.getElementById("addLinea").addEventListener("click", () => { addLinea(); recalc(); });
    addLinea(); addLinea(); recalc();
    document.getElementById("fAsiento").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const lineas = [];
      body.querySelectorAll("tr").forEach((tr) => {
        const cuenta = tr.querySelector("select").value;
        const debito = parseFloat(tr.querySelector(".dbt").value) || 0;
        const credito = parseFloat(tr.querySelector(".crd").value) || 0;
        if (cuenta && (debito || credito)) lineas.push({ cuenta, debito, credito });
      });
      if (lineas.length < 2) return UI.toast("Añade al menos 2 líneas", true);
      try {
        await API.Asientos.registrar({
          descripcion: fd.get("descripcion"),
          agenciaId: esAdmin() ? (fd.get("agenciaId") || null) : agId,
          lineas, fecha: fd.get("fecha") ? new Date(fd.get("fecha")).toISOString() : undefined,
        });
        UI.cerrarModal(); UI.toast("Asiento registrado"); await cargarContabilidad();
      } catch (err) { UI.toast(err.message, true); }
    });
  }
})();
