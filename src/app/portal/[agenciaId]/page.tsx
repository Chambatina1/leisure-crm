"use client";
import { useState, useEffect } from "react";

// ════════════════════════════════════════════════════════════════════════════
// /portal/[agenciaId] — Portal de la agencia.
// Misma experiencia visual que la landing principal (video de fondo) pero con
// los datos de la agencia: logo, nombre, estadísticas.
// Botón grande "CREAR ETIQUETA" que lleva al formulario.
// Todo protegido: si no hay sesión, redirige a /login.
// ════════════════════════════════════════════════════════════════════════════

const VIDEO_BG = "https://videos.pexels.com/video-files/3840442/3840442-hd_1280_720_30fps.mp4";

export default function PortalAgenciaPage({ params }: { params: Promise<{ agenciaId: string }> }) {
  const [agencia, setAgencia] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, enTransito: 0, entregados: 0, pesoTotal: 0 });
  const [cargando, setCargando] = useState(true);
  const [sinSesion, setSinSesion] = useState(false);

  useEffect(() => {
    // Verificar sesión
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.usuario) { setSinSesion(true); setCargando(false); return; }
      setUsuario(d.usuario);
      // Cargar agencia
      params.then(({ agenciaId }) => {
        fetch("/api/agencias").then(r => r.json()).then(data => {
          const a = (data.agencias || []).find((x: any) => x.id === agenciaId);
          setAgencia(a);
        }).catch(() => {});
        // Cargar stats - SOLO de la agencia del usuario logueado
        fetch("/api/paquetes").then(r => {
          if (!r.ok) { setStats({ total: 0, enTransito: 0, entregados: 0, pesoTotal: 0 }); setCargando(false); return []; }
          return r.json();
        }).then(data => {
          const todos = data?.paquetes || [];
          // FILTRAR solo los paquetes de ESTA agencia (por si acaso)
          const agId = d.usuario?.agenciaId;
          const paquetes = agId ? todos.filter((p:any) => p.agenciaId === agId) : todos;
          setStats({
            total: paquetes.length,
            enTransito: paquetes.filter((p:any) => p.estado === "en_transito").length,
            entregados: paquetes.filter((p:any) => p.estado === "entregado").length,
            pesoTotal: paquetes.reduce((s:number, p:any) => s + (Number(p.peso) || 0), 0),
          });
          setCargando(false);
        }).catch(() => { setStats({ total: 0, enTransito: 0, entregados: 0, pesoTotal: 0 }); setCargando(false); });
      });
    }).catch(() => { setSinSesion(true); setCargando(false); });
  }, [params]);

  // Si no hay sesión → redirigir a login
  useEffect(() => {
    if (sinSesion) window.location.href = "/login";
  }, [sinSesion]);

  if (cargando) return <div style={{ textAlign: "center", padding: 60, fontFamily: "Arial", color: "#6b7280" }}>Cargando…</div>;
  if (sinSesion) return null;

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflow: "hidden", fontFamily: "Arial" }}>
      {/* Video de fondo (igual que la landing) */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <video autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }}>
          <source src={VIDEO_BG} type="video/mp4" />
        </video>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,30,45,.7), rgba(11,30,45,.85))" }} />
      </div>

      {/* Contenido */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Navbar */}
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {agencia?.logo && (
              <img src={agencia.logo} alt={agencia.nombre} style={{ height: 44, background: "#fff", borderRadius: 8, padding: "4px 10px", objectFit: "contain" }} />
            )}
            <div>
              <strong style={{ color: "#fff", fontSize: 18, display: "block", lineHeight: 1 }}>{agencia?.nombre || "Agencia"}</strong>
              <small style={{ color: "rgba(255,255,255,.7)", fontSize: 11 }}>{[agencia?.ciudad, agencia?.pais].filter(Boolean).join(", ") || "Envíos y logística"}</small>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,.8)", fontSize: 13 }}>Hola, {usuario?.nombre}</span>
            <a href="/envios" style={navBtn}>Mis envíos</a>
            {usuario?.rol === "admin" && <a href="/admin" style={navBtn}>Admin</a>}
            <a href="/login" style={navBtn}>Salir</a>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "40px 24px" }}>
          <h1 style={{ color: "#fff", fontSize: 38, fontWeight: 800, margin: 0, textShadow: "0 2px 10px rgba(0,0,0,.3)" }}>
            Portal de envíos
          </h1>
          <p style={{ color: "rgba(255,255,255,.9)", fontSize: 16, marginTop: 8 }}>
            Creá etiquetas, HBL y manifiestos — todo guardado en tu agencia
          </p>

          {/* Botón principal */}
          <a href="/nuevo-paquete" style={ctaBtn}>
            CREAR ETIQUETA
          </a>

          {/* Estadísticas */}
          <div style={{ display: "flex", gap: 20, marginTop: 40, flexWrap: "wrap", justifyContent: "center" }}>
            <div style={statBox}>
              <div style={statNum}>{stats.total}</div>
              <div style={statLbl}>Envíos</div>
            </div>
            <div style={statBox}>
              <div style={statNum}>{stats.enTransito}</div>
              <div style={statLbl}>En tránsito</div>
            </div>
            <div style={statBox}>
              <div style={statNum}>{stats.entregados}</div>
              <div style={statLbl}>Entregados</div>
            </div>
            <div style={statBox}>
              <div style={statNum}>{Math.round(stats.pesoTotal)}</div>
              <div style={statLbl}>Libras</div>
            </div>
          </div>

          {/* Accesos rápidos */}
          <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/nuevo-paquete" style={quickBtn}>Nueva etiqueta</a>
            <a href="/bol" target="_blank" style={quickBtn}>Manifiesto</a>
            <a href="/envios" style={quickBtn}>Mis envíos</a>
            <a href="/almacen" style={quickBtn}>Contar almacén</a>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ textAlign: "center", padding: 16, color: "rgba(255,255,255,.5)", fontSize: 12 }}>
          {agencia?.nombre} · Portal de envíos · {new Date().getFullYear()}
        </footer>
      </div>
    </main>
  );
}

const navBtn: React.CSSProperties = { padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,.15)", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,255,255,.2)" };
const ctaBtn: React.CSSProperties = { display: "inline-block", marginTop: 24, padding: "18px 48px", borderRadius: 14, background: "#C23B22", color: "#fff", textDecoration: "none", fontWeight: 900, fontSize: 20, boxShadow: "0 8px 24px rgba(194,59,34,.4)", letterSpacing: 1 };
const statBox: React.CSSProperties = { background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 12, padding: "16px 24px", textAlign: "center", minWidth: 90 };
const statNum: React.CSSProperties = { fontSize: 28, fontWeight: 800, color: "#fff" };
const statLbl: React.CSSProperties = { fontSize: 11, color: "rgba(255,255,255,.7)", textTransform: "uppercase", marginTop: 2 };
const quickBtn: React.CSSProperties = { padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,.12)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, border: "1px solid rgba(255,255,255,.2)" };
