"use client";
import { useState, useEffect } from "react";

// ════════════════════════════════════════════════════════════════════════════
// /nuevo-paquete — Registro de etiqueta SIMPLE y rápido.
// 3 campos grandes obligatorios: PESO, REMITENTE, RECEPTOR.
// El resto (carnet, dirección Cuba, teléfono) es opcional en "Más detalles".
// La contabilidad solo aparece si la agencia la tiene activada.
// Al guardar → genera la etiqueta térmica 4×6 lista para imprimir.
// ════════════════════════════════════════════════════════════════════════════
const PROVINCIAS = ["La Habana","Artemisa","Mayabeque","Matanzas","Villa Clara","Cienfuegos","Sancti Spíritus","Ciego de Ávila","Camagüey","Las Tunas","Holguín","Granma","Santiago de Cuba","Guantánamo","Isla de la Juventud","Pinar del Río"];
const CATEGORIAS = ["Comida","Ropa","Electrodoméstico","Medicina","Documentos","Higiene","Repuestos","Otro"];

export default function NuevoPaquetePage() {
  const [peso, setPeso] = useState("1");
  const [remitente, setRemitente] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [extra, setExtra] = useState(false); // plegable "Más detalles"
  const [contabilidad, setContabilidad] = useState(false); // ¿agencia tiene contabilidad?
  const [usarConta, setUsarConta] = useState(false);
  const [formaPago, setFormaPago] = useState("efectivo");
  const [tarifa, setTarifa] = useState("");
  const [agenciaId, setAgenciaId] = useState("");
  const [det, setDet] = useState({
    piezas: "1", categoria: "Comida", contenido: "Paquete",
    remitenteTel: "", remitenteCarnet: "", remitenteDir: "",
    consignatarioCarnet: "", consignatarioTel: "",
    consignatarioCalle: "", consignatarioEntre: "", consignatarioMunicipio: "", consignatarioProvincia: "La Habana",
    notas: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [creado, setCreado] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agencias").then(r => r.json()).then(d => {
      const a = d.agencias?.[0];
      if (a) { setAgenciaId(a.id); setContabilidad(!!a.contabilidadActiva); }
    }).catch(() => {});
  }, []);

  const pesoNum = parseFloat(peso) || 0;
  const pesoKg = (pesoNum * 0.453592).toFixed(2);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setGuardando(true);
    try {
      const body: Record<string, unknown> = {
        agenciaId, peso, remitente, destinatario,
        piezas: det.piezas, categoria: det.categoria, contenido: det.contenido,
        notas: det.notas,
      };
      if (extra) Object.assign(body, {
        remitenteTel: det.remitenteTel, remitenteCarnet: det.remitenteCarnet, remitenteDir: det.remitenteDir,
        consignatarioCarnet: det.consignatarioCarnet, consignatarioTel: det.consignatarioTel,
        consignatarioCalle: det.consignatarioCalle, consignatarioEntre: det.consignatarioEntre,
        consignatarioMunicipio: det.consignatarioMunicipio, consignatarioProvincia: det.consignatarioProvincia,
        destino: det.consignatarioProvincia,
      });
      if (contabilidad && usarConta) { body.formaPago = formaPago; body.tarifa = tarifa; }
      const res = await fetch("/api/paquetes", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Error"); setGuardando(false); return; }
      setCreado(d.paquete.codigo);
    } catch { setError("No se pudo conectar"); setGuardando(false); }
  }

  // Pantalla de éxito
  if (creado) {
    return (
      <div style={wrap}>
        <div style={cardOk}>
          <div style={{ fontSize: 56 }}>✅</div>
          <h2 style={{ color: "#1f6b3a", marginTop: 8 }}>¡Listo!</h2>
          <p style={{ color: "#6b7280", marginTop: 4 }}>Etiqueta generada</p>
          <div style={codeBox}>{creado}</div>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Peso: {peso} lb · {pesoKg} kg</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
            <a href={`/etiqueta/${creado}`} target="_blank" style={btnPrim}>🖨️ Imprimir etiqueta</a>
            <a href="/bol" target="_blank" style={btnOut}>📋 Bill of Lading</a>
            <button onClick={() => { setCreado(null); setRemitente(""); setDestinatario(""); }} style={btnOut}>➕ Otra</button>
          </div>
        </div>
      </div>
    );
  }

  // Formulario
  return (
    <div style={wrap}>
      <h1 style={h1}>🏷️ Nueva etiqueta</h1>
      <p style={sub}>3 datos y listo. El resto es opcional.</p>

      <form onSubmit={guardar} style={formCard}>
        {/* PESO — grande, con conversión kg en vivo */}
        <div style={pesoBox}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Peso (libras) *</label>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <input type="number" min="0" step="0.1" value={peso} onChange={e => setPeso(e.target.value)} required
              style={pesoInput} autoFocus />
            <span style={{ fontSize: 16, color: "#1f6b3a", fontWeight: 700 }}>= {pesoKg} kg</span>
          </div>
        </div>

        {/* REMITENTE */}
        <BigField label="Remitente (quién envía) *" value={remitente} onChange={setRemitente} placeholder="Ej: Ana Pérez" required />

        {/* RECEPTOR */}
        <BigField label="Receptor (quién recibe) *" value={destinatario} onChange={setDestinatario} placeholder="Ej: José Gómez" required />

        {/* Plegable: Más detalles */}
        <button type="button" onClick={() => setExtra(x => !x)} style={toggleBtn}>
          {extra ? "▾ Ocultar detalles" : "▸ Más detalles (carnet, dirección Cuba, teléfono)"}
        </button>

        {extra && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={grid2}>
              <Small label="Piezas" value={det.piezas} onChange={v => setDet({ ...det, piezas: v })} type="number" />
              <Select label="Categoría" value={det.categoria} onChange={v => setDet({ ...det, categoria: v })} options={CATEGORIAS} />
            </div>
            <div style={{ ...grid2, borderTop: "1px solid #eee", paddingTop: 12 }}>
              <Small label="🆔 Carnet receptor" value={det.consignatarioCarnet} onChange={v => setDet({ ...det, consignatarioCarnet: v })} />
              <Small label="📞 Teléfono receptor" value={det.consignatarioTel} onChange={v => setDet({ ...det, consignatarioTel: v })} />
              <Small label="🏠 Calle y número" value={det.consignatarioCalle} onChange={v => setDet({ ...det, consignatarioCalle: v })} />
              <Small label="↔ Entre calles" value={det.consignatarioEntre} onChange={v => setDet({ ...det, consignatarioEntre: v })} />
              <Small label="🏘️ Municipio" value={det.consignatarioMunicipio} onChange={v => setDet({ ...det, consignatarioMunicipio: v })} />
              <Select label="🗺️ Provincia" value={det.consignatarioProvincia} onChange={v => setDet({ ...det, consignatarioProvincia: v })} options={PROVINCIAS} />
            </div>
            <div style={{ ...grid2, borderTop: "1px solid #eee", paddingTop: 12 }}>
              <Small label="🆔 Carnet remitente" value={det.remitenteCarnet} onChange={v => setDet({ ...det, remitenteCarnet: v })} />
              <Small label="📞 Teléfono remitente" value={det.remitenteTel} onChange={v => setDet({ ...det, remitenteTel: v })} />
            </div>
            <Small label="📝 Notas" value={det.notas} onChange={v => setDet({ ...det, notas: v })} />
          </div>
        )}

        {/* Contabilidad opcional */}
        {contabilidad && (
          <>
            <button type="button" onClick={() => setUsarConta(x => !x)} style={{ ...toggleBtn, color: "#e0a106" }}>
              {usarConta ? "▾ Contabilidad (activada)" : "▸ Registrar en contabilidad (opcional)"}
            </button>
            {usarConta && (
              <div style={{ ...grid2, marginTop: 12 }}>
                <Small label="Tarifa / lb" value={tarifa} onChange={setTarifa} type="number" placeholder="4.50" />
                <Select label="Forma de pago" value={formaPago} onChange={setFormaPago} options={[
                  { v: "efectivo", l: "Efectivo" }, { v: "banco", l: "Banco/Transferencia" }, { v: "credito", l: "A crédito" },
                ]} />
              </div>
            )}
          </>
        )}

        {error && <div style={errBox}>{error}</div>}

        <button type="submit" disabled={guardando} style={{ ...btnPrim, width: "100%", fontSize: 17, padding: "16px" }}>
          {guardando ? "Generando…" : "🏷️ Generar etiqueta"}
        </button>
      </form>

      <style>{`
        @media (min-width: 640px) { .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } }
      `}</style>
    </div>
  );
}

// ── Componentes ──
function BigField({ label, value, onChange, placeholder, required }:
  { label: string; value: string; onChange:(v:string)=>void; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        style={{ ...inp, fontSize: 18, padding: "14px 16px" }} />
    </div>
  );
}
function Small({ label, value, onChange, type="text", placeholder="" }:
  { label: string; value: string; onChange:(v:string)=>void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={inp} />
    </div>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange:(v:string)=>void; options: (string|{v:string;l:string})[] }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={inp}>
        {options.map(o => { const v = typeof o==="string"?o:o.v; const l = typeof o==="string"?o:o.l; return <option key={v} value={v}>{l}</option>; })}
      </select>
    </div>
  );
}

// ── Estilos ──
const wrap: React.CSSProperties = { maxWidth: 560, margin: "20px auto", padding: "0 16px 80px", fontFamily: "Arial" };
const h1: React.CSSProperties = { color: "#C23B22", fontSize: 26, margin: "16px 0 4px" };
const sub: React.CSSProperties = { color: "#6b7280", marginBottom: 20 };
const formCard: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,.06)", display: "flex", flexDirection: "column", gap: 16 };
const pesoBox: React.CSSProperties = { background: "#fef3c7", borderRadius: 12, padding: 14 };
const pesoInput: React.CSSProperties = { width: "100%", fontSize: 32, fontWeight: 800, padding: "8px 12px", border: "2px solid #e0a106", borderRadius: 10, marginTop: 6 };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4 };
const inp: React.CSSProperties = { width: "100%", padding: "11px 13px", border: "1px solid #d1d5db", borderRadius: 9, fontSize: 15, boxSizing: "border-box" };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const toggleBtn: React.CSSProperties = { background: "none", border: "none", color: "#C23B22", cursor: "pointer", fontSize: 13, fontWeight: 700, textAlign: "left", padding: "6px 0" };
const btnPrim: React.CSSProperties = { display: "inline-block", padding: "14px 28px", borderRadius: 12, background: "#C23B22", color: "#fff", textDecoration: "none", fontWeight: 800, border: "none", cursor: "pointer", textAlign: "center" };
const btnOut: React.CSSProperties = { ...btnPrim, background: "transparent", color: "#C23B22", border: "2px solid #C23B22" };
const errBox: React.CSSProperties = { color: "#dc2626", padding: 12, background: "#fef2f2", borderRadius: 10, fontSize: 14 };
const cardOk: React.CSSProperties = { background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,.06)" };
const codeBox: React.CSSProperties = { display: "inline-block", fontSize: 28, fontWeight: 900, color: "#C23B22", letterSpacing: 2, background: "#faf5f5", padding: "12px 24px", borderRadius: 12, margin: "16px 0" };
