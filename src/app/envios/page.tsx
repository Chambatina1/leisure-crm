"use client";
import { useState, useEffect } from "react";

// ════════════════════════════════════════════════════════════════════════════
// /envios — Tabla de envíos completa (estilo ikomsoft) con TODAS las columnas.
// Resumen superior (Envíos, Bultos, m³, ft³, Kg, Lb) + tabla con todas las
// columnas solicitadas. Buscable, con totales al pie, imprimible.
// ════════════════════════════════════════════════════════════════════════════
type Paquete = Record<string, unknown>;

export default function EnviosPage() {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [filtro, setFiltro] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargar(); }, []);
  async function cargar() {
    setCargando(true);
    try {
      const r = await fetch("/api/paquetes");
      const d = await r.json();
      setPaquetes(d.paquetes || []);
    } catch {} setCargando(false);
  }

  const txt = filtro.toLowerCase();
  const filtrados = paquetes.filter(p => {
    if (!txt) return true;
    return JSON.stringify(p).toLowerCase().includes(txt);
  });

  // Totales del resumen
  const tot = (key: string, def = 0) => filtrados.reduce((s, p) => s + (Number(p[key]) || def), 0);
  const resumen = {
    envios: filtrados.length,
    bultos: tot("bultos"),
    m3: tot("volumenM3").toFixed(3),
    ft3: tot("volumenFt3").toFixed(2),
    kg: tot("pesoKg").toFixed(2),
    lb: tot("peso").toFixed(2),
  };

  const COLS: { k: string; l: string; w?: string; num?: boolean }[] = [
    { k: "idx", l: "#", w: "40px" },
    { k: "creadoPorNombre", l: "Creado por" },
    { k: "imagen", l: "Imagen" },
    { k: "codigo", l: "HAWB" },
    { k: "estado", l: "Estado" },
    { k: "escaneado", l: "Escaneado" },
    { k: "manifiesto", l: "Manifiesto" },
    { k: "guiaBuque", l: "Guía/Buque" },
    { k: "clasificacion", l: "Clasificación" },
    { k: "mercancias", l: "Mercancías" },
    { k: "palet", l: "Palet" },
    { k: "creado", l: "Fecha" },
    { k: "destinatario", l: "CONSIGNATARIO" },
    { k: "consignatarioCarnet", l: "Pasaporte" },
    { k: "consignatarioCarnet", l: "C.Identidad" },
    { k: "consignatarioCalle", l: "Dirección Con." },
    { k: "consignatarioTel", l: "Teléfono" },
    { k: "remitente", l: "EMBARCADOR" },
    { k: "remitenteCarnet", l: "Pasaporte" },
    { k: "remitenteDir", l: "Dirección Emb." },
    { k: "valorFact", l: "Valor Fact.", num: true },
    { k: "valorDocum", l: "Valor Docum", num: true },
    { k: "piezas", l: "Cantidad", num: true },
    { k: "peso", l: "Peso (Lb)", num: true },
    { k: "pesoKg", l: "Kg", num: true },
    { k: "volumenM3", l: "Volumen m³", num: true },
    { k: "valor", l: "Valor", num: true },
    { k: "valorPelig", l: "Valor Pelig.", num: true },
    { k: "pagado", l: "Pagado" },
    { k: "observaciones", l: "Observaciones" },
    { k: "factura", l: "# Factura" },
    { k: "_acciones", l: "Acciones", w: "140px" },
  ];

  const cellVal = (p: Paquete, i: number, k: string) => {
    if (k === "idx") return i + 1;
    if (k === "creadoPorNombre") return "—";
    if (k === "_acciones") {
      const cod = String(p.codigo);
      return (
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <a href={`/etiqueta/${cod}`} target="_blank" rel="noopener" style={{ fontSize: 9, padding: "3px 6px", background: "#C23B22", color: "#fff", textDecoration: "none", borderRadius: 4, fontWeight: 700 }}>Etiqueta</a>
          <a href={`/hbl/${cod}`} target="_blank" rel="noopener" style={{ fontSize: 9, padding: "3px 6px", background: "#1f6b3a", color: "#fff", textDecoration: "none", borderRadius: 4, fontWeight: 700 }}>HBL</a>
          <a href="/bol" target="_blank" rel="noopener" style={{ fontSize: 9, padding: "3px 6px", background: "#374151", color: "#fff", textDecoration: "none", borderRadius: 4, fontWeight: 700 }}>Manif</a>
          <a href={`/envios/${cod}/editar`} style={{ fontSize: 9, padding: "3px 6px", background: "#e0a106", color: "#fff", textDecoration: "none", borderRadius: 4, fontWeight: 700 }}>Editar</a>
        </div>
      );
    }
    const v = p[k];
    if (v === null || v === undefined || v === "") return "—";
    if (k === "creado") return new Date(v as string).toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "2-digit" });
    if (k === "imagen") return v ? "🖼️" : "—";
    if (typeof v === "boolean") return v ? "✓" : "—";
    if (k === "pesoKg" && v) return Number(v).toFixed(2);
    if (k === "volumenM3" && v) return Number(v).toFixed(3);
    return String(v);
  };

  return (
    <div style={{ maxWidth: "100%", margin: "0", padding: "16px 20px 60px", fontFamily: "Arial" }}>
      {/* Barra superior */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ color: "#C23B22", fontSize: 22, margin: 0 }}>📋 Envíos</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/nuevo-paquete" style={btnP}>➕ NUEVO</a>
          <a href="/bol" style={btnO}>📋 BOL</a>
          <button onClick={() => window.print()} style={btnO}>🖨️ IMPRIMIR</button>
        </div>
      </div>

      {/* Resumen (como ikomsoft) */}
      <div style={resumenRow}>
        {[
          { l: "Envíos", v: resumen.envios },
          { l: "Bultos", v: resumen.bultos },
          { l: "m³", v: resumen.m3 },
          { l: "ft³", v: resumen.ft3 },
          { l: "Kg.", v: resumen.kg },
          { l: "Lb.", v: resumen.lb },
        ].map(r => (
          <div key={r.l} style={resumenBox}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#C23B22" }}>{r.v}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{r.l}</div>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="🔍 Buscar en todos los campos…" style={search} />

      {/* Tabla */}
      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>{COLS.map(c => <th key={c.l} style={{ ...th, ...(c.num ? { textAlign: "right" as const } : {}), ...(c.w ? { width: c.w } : {}) }}>{c.l}</th>)}</tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={COLS.length} style={{ textAlign: "center", padding: 30, color: "#6b7280" }}>Cargando…</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={COLS.length} style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Sin envíos. Creá uno con "NUEVO".</td></tr>
            ) : filtrados.map((p, i) => (
              <tr key={String(p.codigo)}>
                {COLS.map(c => <td key={c.l} style={{ ...td, ...(c.num ? { textAlign: "right" as const, fontFamily: "monospace" } : {}) }}>{cellVal(p, i, c.k)}</td>)}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#1f2937", color: "#fff" }}>
              <td colSpan={22} style={{ textAlign: "right", padding: "8px 12px", fontSize: 11 }}>TOTALES</td>
              <td style={tfootNum}>{tot("piezas")}</td>
              <td style={tfootNum}>{tot("peso").toFixed(2)}</td>
              <td style={tfootNum}>{tot("pesoKg").toFixed(2)}</td>
              <td style={tfootNum}>{tot("volumenM3").toFixed(3)}</td>
              <td colSpan={5}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
        {filtrados.length} envío(s) · {COLS.length} columnas
      </div>

      <style>{`@media print { .no-print { display:none } }`}</style>
    </div>
  );
}

// ── Estilos ──
const th: React.CSSProperties = { background: "#f3f4f6", padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#374151", borderBottom: "2px solid #d1d5db", textTransform: "uppercase", whiteSpace: "nowrap", position: "sticky", top: 0 };
const td: React.CSSProperties = { padding: "7px 10px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap", color: "#1f2937" };
const tfootNum: React.CSSProperties = { padding: "8px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 700 };
const btnP: React.CSSProperties = { display: "inline-block", padding: "8px 16px", borderRadius: 8, background: "#C23B22", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 12 };
const btnO: React.CSSProperties = { ...btnP, background: "transparent", color: "#C23B22", border: "1px solid #C23B22" };
const resumenRow: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 16 };
const resumenBox: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 8px", textAlign: "center" };
const search: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };
