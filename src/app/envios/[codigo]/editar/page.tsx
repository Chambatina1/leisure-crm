"use client";
import { useState, useEffect } from "react";
import { PROVINCIAS, MUNICIPIOS } from "@/lib/municipios";

// ════════════════════════════════════════════════════════════════════════════
// /envios/[codigo]/editar — Editar un envío existente.
// Carga los datos del paquete, permite editarlos, y guarda con PATCH.
// ════════════════════════════════════════════════════════════════════════════

export default function EditarEnvioPage({ params }: { params: Promise<{ codigo: string }> }) {
  const [codigo, setCodigo] = useState("");
  const [p, setP] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ codigo }) => {
      setCodigo(codigo);
      fetch(`/api/paquetes/${codigo}`).then(r => r.json()).then(d => setP(d.paquete)).catch(() => setError("No se pudo cargar el envío"));
    });
  }, []);

  function set(k: string, v: any) {
    setP((prev: any) => ({ ...prev, [k]: v }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const res = await fetch(`/api/paquetes/${codigo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Error"); setGuardando(false); return; }
      setGuardado(true);
    } catch { setError("No se pudo conectar"); }
    setGuardando(false);
  }

  if (guardado) {
    return (
      <div style={{ maxWidth: 500, margin: "40px auto", padding: 20, fontFamily: "Arial", textAlign: "center" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 40, boxShadow: "0 4px 20px rgba(0,0,0,.06)" }}>
          <h2 style={{ color: "#1f6b3a" }}>Cambios guardados</h2>
          <p style={{ color: "#6b7280" }}>El envío {codigo} fue actualizado.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
            <a href={`/etiqueta/${codigo}`} target="_blank" style={btnPrim}>Ver etiqueta</a>
            <a href={`/hbl/${codigo}`} target="_blank" style={btnOut}>Ver HBL</a>
            <a href="/envios" style={btnOut}>Volver a envíos</a>
          </div>
        </div>
      </div>
    );
  }

  if (!p && !error) return <div style={{ textAlign: "center", padding: 40, fontFamily: "Arial", color: "#6b7280" }}>Cargando…</div>;
  if (error && !p) return <div style={{ textAlign: "center", padding: 40, fontFamily: "Arial", color: "#dc2626" }}>{error}</div>;

  const pesoNum = parseFloat(p?.peso) || 0;

  return (
    <div style={{ maxWidth: 600, margin: "20px auto", padding: "0 16px 60px", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ color: "#C23B22", fontSize: 22, margin: 0 }}>Editar envío {codigo}</h1>
        <a href="/envios" style={{ ...btnOut, fontSize: 13 }}>← Volver</a>
      </div>

      <form onSubmit={guardar} style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,.06)", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ ...grid2, alignItems: "end" }}>
          <div>
            <label style={lbl}>Peso (lb)</label>
            <input type="number" step="0.1" value={p.peso ?? 0} onChange={e => set("peso", e.target.value)} style={inp} />
            <small style={{ color: "#1f6b3a", fontWeight: 700 }}>{(Number(p.peso || 0) * 0.453592).toFixed(2)} kg</small>
          </div>
          <div>
            <label style={lbl}>Piezas</label>
            <input type="number" value={p.piezas ?? 1} onChange={e => set("piezas", e.target.value)} style={inp} />
          </div>
        </div>

        <div style={grid2}>
          <div>
            <label style={lbl}>Estado</label>
            <select value={p.estado ?? "en_origen"} onChange={e => set("estado", e.target.value)} style={inp}>
              <option value="en_origen">En origen</option>
              <option value="en_transito">En tránsito</option>
              <option value="en_almacen">En almacén</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Categoría</label>
            <input value={p.categoria ?? ""} onChange={e => set("categoria", e.target.value)} style={inp} />
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />

        <div>
          <label style={lbl}>Remitente</label>
          <input value={p.remitente ?? ""} onChange={e => set("remitente", e.target.value)} style={{ ...inp, fontSize: 16 }} />
        </div>
        <div style={grid2}>
          <div>
            <label style={lbl}>Carnet remitente</label>
            <input value={p.remitenteCarnet ?? ""} onChange={e => set("remitenteCarnet", e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Teléfono remitente</label>
            <input value={p.remitenteTel ?? ""} onChange={e => set("remitenteTel", e.target.value)} style={inp} />
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />

        <div>
          <label style={lbl}>Consignatario (destinatario)</label>
          <input value={p.destinatario ?? ""} onChange={e => set("destinatario", e.target.value)} style={{ ...inp, fontSize: 16 }} />
        </div>
        <div style={grid2}>
          <div>
            <label style={lbl}>Carnet / CI</label>
            <input value={p.consignatarioCarnet ?? ""} onChange={e => set("consignatarioCarnet", e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Teléfono</label>
            <input value={p.consignatarioTel ?? ""} onChange={e => set("consignatarioTel", e.target.value)} style={inp} />
          </div>
        </div>
        <div>
          <label style={lbl}>DIRECCIÓN (calle, número, entre calles, reparto)</label>
          <textarea value={p.consignatarioCalle ?? ""} onChange={e => set("consignatarioCalle", e.target.value)}
            placeholder="Ej: Calle Loma No. 62, e/ Aspuru y Linea, Poblado Camarioca"
            style={{ ...inp, minHeight: 60, resize: "vertical" }} />
        </div>
        <div style={grid2}>
          <div>
            <label style={lbl}>Municipio</label>
            <select value={p.consignatarioMunicipio ?? ""} onChange={e => set("consignatarioMunicipio", e.target.value)} style={inp}>
              <option value="">—</option>
              {(MUNICIPIOS[p.consignatarioProvincia || "La Habana"] || []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Provincia</label>
            <select value={p.consignatarioProvincia ?? "La Habana"}
              onChange={e => { set("consignatarioProvincia", e.target.value); set("consignatarioMunicipio", ""); }}
              style={inp}>
              {[...PROVINCIAS].map(pr => <option key={pr} value={pr}>{pr}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={lbl}>Contenido</label>
          <input value={p.contenido ?? ""} onChange={e => set("contenido", e.target.value)} style={inp} />
        </div>
        <div>
          <label style={lbl}>Notas</label>
          <input value={p.notas ?? ""} onChange={e => set("notas", e.target.value)} style={inp} />
        </div>

        {error && <div style={{ color: "#dc2626", padding: 12, background: "#fef2f2", borderRadius: 10, fontSize: 14 }}>{error}</div>}

        <button type="submit" disabled={guardando} style={{ ...btnPrim, width: "100%", fontSize: 16, padding: "14px" }}>
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4 };
const inp: React.CSSProperties = { width: "100%", padding: "11px 13px", border: "1px solid #d1d5db", borderRadius: 9, fontSize: 15, boxSizing: "border-box" };
const btnPrim: React.CSSProperties = { padding: "12px 24px", borderRadius: 10, background: "#C23B22", color: "#fff", textDecoration: "none", fontWeight: 800, border: "none", cursor: "pointer", textAlign: "center" };
const btnOut: React.CSSProperties = { ...btnPrim, background: "transparent", color: "#C23B22", border: "2px solid #C23B22" };
