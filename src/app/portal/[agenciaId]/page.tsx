"use client";
import { useState, useEffect } from "react";

// ════════════════════════════════════════════════════════════════════════════
// /portal/[agenciaId] — Página de entrada bonita de cada agencia.
// Muestra logo, nombre, estadísticas y accesos directos.
// El admin la abre desde el panel para ver cómo se ve cada agencia.
// ════════════════════════════════════════════════════════════════════════════

export default function PortalAgenciaPage({ params }: { params: Promise<{ agenciaId: string }> }) {
  const [agenciaId, setAgenciaId] = useState("");
  const [agencia, setAgencia] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    params.then(({ agenciaId }) => {
      setAgenciaId(agenciaId);
      // Cargar datos de la agencia
      fetch("/api/agencias").then(r => r.json()).then(d => {
        const a = (d.agencias || []).find((x: any) => x.id === agenciaId);
        setAgencia(a);
      }).catch(() => {});
      // Cargar envíos para stats
      fetch("/api/paquetes").then(r => r.json()).then(d => {
        const paquetes = d.paquetes || [];
        setStats({
          total: paquetes.length,
          enTransito: paquetes.filter((p:any) => p.estado === "en_transito").length,
          entregados: paquetes.filter((p:any) => p.estado === "entregado").length,
          pesoTotal: paquetes.reduce((s:number, p:any) => s + (Number(p.peso) || 0), 0),
        });
        setCargando(false);
      }).catch(() => setCargando(false));
    });
  }, [params]);

  if (cargando) return <div style={{ textAlign: "center", padding: 60, fontFamily: "Arial", color: "#6b7280" }}>Cargando…</div>;
  if (!agencia) return <div style={{ textAlign: "center", padding: 60, fontFamily: "Arial", color: "#dc2626" }}>Agencia no encontrada</div>;

  return (
    <div style={wrap}>
      {/* Header con logo */}
      <div style={header}>
        {agencia.logo && (
          <img src={agencia.logo} alt={agencia.nombre} style={{ height: 60, background: "#fff", borderRadius: 10, padding: "6px 12px", objectFit: "contain" }} />
        )}
        <div>
          <h1 style={{ margin: 0, color: "#fff", fontSize: 28, fontWeight: 800 }}>{agencia.nombre}</h1>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,.8)", fontSize: 14 }}>
            {[agencia.ciudad, agencia.pais].filter(Boolean).join(", ") || "Envíos y logística"}
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div style={statsRow}>
        <div style={{ ...statCardBase, borderLeft: "4px solid #C23B22" }}>
          <div style={statNum}>{stats?.total || 0}</div>
          <div style={statLbl}>Envíos totales</div>
        </div>
        <div style={{ ...statCardBase, borderLeft: "4px solid #e0a106" }}>
          <div style={statNum}>{stats?.enTransito || 0}</div>
          <div style={statLbl}>En tránsito</div>
        </div>
        <div style={{ ...statCardBase, borderLeft: "4px solid #1f6b3a" }}>
          <div style={statNum}>{stats?.entregados || 0}</div>
          <div style={statLbl}>Entregados</div>
        </div>
        <div style={{ ...statCardBase, borderLeft: "4px solid #2563eb" }}>
          <div style={statNum}>{Math.round(stats?.pesoTotal || 0)}</div>
          <div style={statLbl}>Libras</div>
        </div>
      </div>

      {/* Accesos directos */}
      <div style={accesosGrid}>
        <a href="/nuevo-paquete" style={accesoCardBase}>
          <div style={{ ...accesoIconBase, background: "#C23B22" }}>ETQ</div>
          <strong>Nueva etiqueta</strong>
          <small>Crear envío con etiqueta térmica</small>
        </a>
        <a href="/envios" style={accesoCardBase}>
          <div style={{ ...accesoIconBase, background: "#1f6b3a" }}>ENV</div>
          <strong>Mis envíos</strong>
          <small>Ver, editar y eliminar envíos</small>
        </a>
        <a href="/bol" target="_blank" style={accesoCardBase}>
          <div style={{ ...accesoIconBase, background: "#374151" }}>MAN</div>
          <strong>Manifiesto</strong>
          <small>Lista de embarque</small>
        </a>
        <a href="/login" style={accesoCardBase}>
          <div style={{ ...accesoIconBase, background: "#e0a106" }}>ACC</div>
          <strong>Cambiar de cuenta</strong>
          <small>Volver al login</small>
        </a>
      </div>

      <div style={footer}>
        <a href="/" style={{ color: "#6b7280", fontSize: 13, textDecoration: "none" }}>← Volver al inicio</a>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { maxWidth: 800, margin: "0 auto", padding: "0 16px 60px", fontFamily: "Arial" };
const header: React.CSSProperties = { background: "linear-gradient(135deg, #0b1e2d, #1a3a5c)", padding: "32px 24px", borderRadius: "0 0 20px 20px", display: "flex", alignItems: "center", gap: 20, marginBottom: 24, flexWrap: "wrap" };
const statsRow: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 };
const statCardBase: React.CSSProperties = { background: "#fff", borderRadius: 10, padding: 16, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,.06)" };
const statNum: React.CSSProperties = { fontSize: 28, fontWeight: 800, color: "#1f2937" };
const statLbl: React.CSSProperties = { fontSize: 11, color: "#6b7280", textTransform: "uppercase", marginTop: 2 };
const accesosGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 };
const accesoCardBase: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 24, background: "#fff", borderRadius: 14, border: "2px solid #f3f4f6", textDecoration: "none", color: "inherit", transition: ".15s", textAlign: "center" };
const accesoIconBase: React.CSSProperties = { width: 48, height: 48, borderRadius: 12, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13 };
const footer: React.CSSProperties = { textAlign: "center", marginTop: 40 };
