/* ====================================================================
   api.js — Capa de datos del frontend (reemplaza a db.js)
   CRM Leisure Exporting LLC · geocabezas
   Llama a las API routes (/api/...) en vez de a IndexedDB.
   Mantiene las mismas firmas que usaba db.js para que app.js cambie poco.
   ==================================================================== */
(function (global) {
  "use strict";

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Error de servidor (" + res.status + ")");
    return data;
  }

  /* ================================================================
     AUTH (la sesión vive en cookie httpOnly; aquí solo logout/me)
     ================================================================ */
  const Auth = {
    logout: () => api("/api/auth/logout", { method: "POST" }),
    me: () => api("/api/auth/me"),
  };

  /* ================================================================
     AGENCIAS
     ================================================================ */
  const Agencias = {
    all: async () => (await api("/api/agencias")).agencias,
    get: async (id) => (await api("/api/agencias/" + id)).agencia,
    hijos: async (padreId) => (await api("/api/agencias")).agencias.filter((a) => a.padreId === padreId),
    save: async (a) => {
      if (a.id) return (await api("/api/agencias/" + a.id, { method: "PUT", body: JSON.stringify(a) })).agencia;
      return (await api("/api/agencias", { method: "POST", body: JSON.stringify(a) })).agencia;
    },
    remove: (id) => api("/api/agencias/" + id, { method: "DELETE" }),
    crearSubagencia: (padreId, data) =>
      api("/api/agencias/" + padreId + "/subagencias", { method: "POST", body: JSON.stringify(data) }).then((r) => r.agencia),
  };

  /* ================================================================
     USUARIOS
     ================================================================ */
  const Usuarios = {
    all: async () => (await api("/api/usuarios")).usuarios,
    save: async (u) => {
      if (u.id) return (await api("/api/usuarios/" + u.id, { method: "PUT", body: JSON.stringify(u) })).usuario;
      return (await api("/api/usuarios", { method: "POST", body: JSON.stringify(u) })).usuario;
    },
    remove: (id) => api("/api/usuarios/" + id, { method: "DELETE" }),
    byAgencia: async (agenciaId) => (await api("/api/usuarios")).usuarios.filter((u) => u.agenciaId === agenciaId),
  };

  /* ================================================================
     CLIENTES
     ================================================================ */
  const Clientes = {
    all: async () => (await api("/api/clientes")).clientes,
    save: (c) => api("/api/clientes", { method: "POST", body: JSON.stringify(c) }).then((r) => r.cliente),
    remove: (id) => api("/api/clientes/" + id, { method: "DELETE" }),
    byAgencia: async (agenciaId) => (await api("/api/clientes")).clientes.filter((c) => c.agenciaId === agenciaId),
  };

  /* ================================================================
     PAQUETES
     ================================================================ */
  const Paquetes = {
    all: async () => (await api("/api/paquetes")).paquetes,
    get: async (codigo) => (await api("/api/paquetes/" + encodeURIComponent(String(codigo).toUpperCase()))).paquete,
    crear: async (data) => (await api("/api/paquetes", { method: "POST", body: JSON.stringify(data) })).paquete,
    cambiarEstado: async (codigo, data) =>
      api("/api/paquetes/" + encodeURIComponent(String(codigo).toUpperCase()) + "/estado", {
        method: "PUT", body: JSON.stringify(data),
      }),
    qrUrl: (codigo) => "/api/paquetes/" + encodeURIComponent(String(codigo).toUpperCase()) + "/qr",
  };

  /* ================================================================
     ESCANEO
     ================================================================ */
  const Escaneo = {
    registrar: (data) => api("/api/escaneo", { method: "POST", body: JSON.stringify(data) }).then((r) => r.evento),
  };

  /* ================================================================
     CONTABILIDAD
     ================================================================ */
  const Asientos = {
    mayor: async () => (await api("/api/contabilidad?modo=mayor")).mayor,
    resumen: async () => (await api("/api/contabilidad?modo=resumen")).resumen,
    all: async () => (await api("/api/contabilidad/asientos")).asientos,
    registrar: (data) =>
      api("/api/contabilidad/asientos", { method: "POST", body: JSON.stringify(data) }).then((r) => ({ id: r.id })),
    remove: (id) => api("/api/contabilidad/asientos/" + id, { method: "DELETE" }),
    CUENTAS: null, // se carga dinámicamente abajo
  };

  /* ================================================================
     DASHBOARD (rastreador central del admin)
     ================================================================ */
  const Dashboard = {
    get: () => api("/api/dashboard"),
  };

  global.API = { Auth, Agencias, Usuarios, Clientes, Paquetes, Escaneo, Asientos, Dashboard, _raw: api };
})(window);
