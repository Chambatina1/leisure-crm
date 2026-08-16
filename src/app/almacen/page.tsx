"use client";
import { useState, useRef } from "react";

// ════════════════════════════════════════════════════════════════════════════
// /almacen — Contador de bultos por foto.
// Subís/tomás foto panorámica del almacén → tocás cada bulto →
// cuenta automática → peso promedio → total calculado.
// ════════════════════════════════════════════════════════════════════════════

interface Marcado { x: number; y: number }

export default function AlmacenPage() {
  const [foto, setFoto] = useState<string | null>(null);
  const [marcados, setMarcados] = useState<Marcado[]>([]);
  const [pesoProm, setPesoProm] = useState("25");
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const total = marcados.length;
  const pesoNum = parseFloat(pesoProm) || 0;
  const pesoTotalLb = total * pesoNum;
  const pesoTotalKg = pesoTotalLb * 0.453592;

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { setFoto(r.result as string); setMarcados([]); };
    r.readAsDataURL(f);
  }

  function marcar(e: React.MouseEvent<HTMLDivElement>) {
    if (!foto || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMarcados(prev => [...prev, { x, y }]);
  }

  function deshacerUltimo() { setMarcados(prev => prev.slice(0, -1)); }
  function limpiar() { setMarcados([]); }

  function exportarReporte() {
    const texto = `REPORTE DE ALMACÉN
Fecha: ${new Date().toLocaleString()}
Bultos contados: ${total}
Peso promedio: ${pesoNum} lb
Peso total: ${pesoTotalLb.toFixed(1)} lb / ${pesoTotalKg.toFixed(2)} kg`;
    const blob = new Blob([texto], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `almacen-${Date.now()}.txt`; a.click();
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 12px 60px", fontFamily: "Arial" }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ color: "#C23B22", fontSize: 24, margin: "0 0 4px" }}>Contador de Almacén</h1>
        <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Tomá una foto panorámica del almacén y tocá cada bulto para contar</p>
      </div>

      {/* Upload / Camera */}
      {!foto && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", padding: 40, background: "#fff", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
          <button onClick={() => fileRef.current?.click()} style={{ padding: "16px 32px", borderRadius: 12, background: "#C23B22", color: "#fff", border: "none", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
            Tomar / Subir foto del almacén
          </button>
          <small style={{ color: "#9ca3af", fontSize: 12 }}>Podés tomar foto o subir una imagen existente</small>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} style={{ display: "none" }} />
        </div>
      )}

      {/* Foto + Marcas */}
      {foto && (
        <>
          {/* Controles */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <div style={{ ...statBox, borderLeft: "4px solid #C23B22" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#C23B22" }}>{total}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>BULTOS</div>
            </div>
            <div style={{ ...statBox, borderLeft: "4px solid #e0a106" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#92400e" }}>{pesoTotalLb.toFixed(0)}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>TOTAL LB</div>
            </div>
            <div style={{ ...statBox, borderLeft: "4px solid #1f6b3a" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#1f6b3a" }}>{pesoTotalKg.toFixed(1)}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>TOTAL KG</div>
            </div>
          </div>

          {/* Foto con marcas */}
          <div ref={imgRef} onClick={marcar} style={{ position: "relative", background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.08)", cursor: "crosshair" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto} alt="almacén" style={{ width: "100%", display: "block" }} />
            
            {/* Grilla */}
            <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gridTemplateRows: "repeat(6, 1fr)", pointerEvents: "none" }}>
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} style={{ border: "1px solid rgba(255,255,255,.15)" }} />
              ))}
            </div>

            {/* Marcas */}
            {marcados.map((m, i) => (
              <div key={i} style={{
                position: "absolute", left: `${m.x}%`, top: `${m.y}%`,
                transform: "translate(-50%, -50%)",
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(194,59,34,.85)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 11, border: "2px solid #fff",
                pointerEvents: "none", zIndex: 5,
              }}>{i + 1}</div>
            ))}
          </div>

          {/* Peso promedio */}
          <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Peso promedio por bulto (lb)</label>
              <input type="number" value={pesoProm} onChange={e => setPesoProm(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 16, boxSizing: "border-box" }} />
            </div>
            <button onClick={deshacerUltimo} disabled={total === 0} style={{ ...btn, opacity: total ? 1 : 0.5 }}>↩ Deshacer</button>
            <button onClick={limpiar} disabled={total === 0} style={{ ...btn, background: "#dc2626", opacity: total ? 1 : 0.5 }}>🗑 Limpiar</button>
          </div>

          {/* Botones finales */}
          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => { setFoto(null); setMarcados([]); }} style={{ ...btn, background: "#374151" }}>📷 Nueva foto</button>
            <button onClick={exportarReporte} disabled={total === 0} style={{ ...btn, background: "#1f6b3a", opacity: total ? 1 : 0.5 }}>📄 Exportar reporte</button>
          </div>

          <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 12, marginTop: 12 }}>
            Tocá cada bulto en la foto para marcarlo. El número aparece encima.
          </p>
        </>
      )}
    </div>
  );
}

const statBox: React.CSSProperties = { background: "#fff", borderRadius: 10, padding: "10px 18px", textAlign: "center", minWidth: 90, boxShadow: "0 2px 8px rgba(0,0,0,.05)" };
const btn: React.CSSProperties = { padding: "12px 20px", borderRadius: 10, background: "#C23B22", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" };
