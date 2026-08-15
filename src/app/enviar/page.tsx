"use client";
import { useState } from "react";
import { PROVINCIAS, MUNICIPIOS } from "@/lib/municipios";

// ════════════════════════════════════════════════════════════════════════════
// /enviar — Página PÚBLICA para clientes crear etiquetas desde el celular.
// Link compartible: https://leisure-crm-1.onrender.com/enviar
// Sin login. Mobile-first. Simple y rápido.
// ════════════════════════════════════════════════════════════════════════════

export default function EnviarPage() {
  const [paso, setPaso] = useState(1);
  const [tipoEnvio, setTipoEnvio] = useState("mail");
  const [peso, setPeso] = useState("1");
  const [piezas, setPiezas] = useState("1");
  const [contenido, setContenido] = useState("");

  const [remitente, setRemitente] = useState("");
  const [remitenteApellidos, setRemitenteApellidos] = useState("");
  const [remitenteTel, setRemitenteTel] = useState("");

  const [destinatario, setDestinatario] = useState("");
  const [consignatarioCarnet, setConsignatarioCarnet] = useState("");
  const [consignatarioTel, setConsignatarioTel] = useState("");
  const [consignatarioCalle, setConsignatarioCalle] = useState("");
  const [consignatarioMunicipio, setConsignatarioMunicipio] = useState("");
  const [consignatarioProvincia, setConsignatarioProvincia] = useState("La Habana");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [codigo, setCodigo] = useState<string | null>(null);

  const pesoNum = parseFloat(peso) || 0;
  const pesoKg = (pesoNum * 0.453592).toFixed(2);

  const paso1Ok = pesoNum > 0;
  const paso2Ok = remitente.trim() !== "" && destinatario.trim() !== "" && consignatarioCarnet.length === 11;

  async function guardar() {
    setError(""); setGuardando(true);
    try {
      const res = await fetch("/api/solved/public-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agenciaUrl: new URLSearchParams(window.location.search).get("ag") || "",
          typecorrespond: tipoEnvio,
          peso, piezas, contenido,
          remitente: `${remitente} ${remitenteApellidos}`.trim(),
          remitenteTel,
          destinatario,
          consignatarioCarnet,
          consignatarioTel,
          consignatarioCalle,
          consignatarioMunicipio,
          consignatarioProvincia,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Error"); setGuardando(false); return; }
      setCodigo(d.code || d.paquete?.codigo);
    } catch { setError("No se pudo conectar"); setGuardando(false); }
  }

  // Éxito: mostrar etiqueta
  if (codigo) {
    return (
      <div style={wrap}>
        <div style={cardOk}>
          <h2 style={{ color: "#1f6b3a", marginTop: 0 }}>¡Envío creado!</h2>
          <div style={codeBox}>{codigo}</div>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Peso: {peso} lb · {pesoKg} kg</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            <a href={`/etiqueta/${codigo}`} target="_blank" style={btnPrim}>Ver etiqueta 4×6</a>
            <a href={`/hbl/${codigo}`} target="_blank" style={btnOut}>Ver HBL</a>
            <button onClick={() => window.location.href = "/enviar"} style={btnOut}>Crear otro</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/chambatina.png" alt="Chambatina" style={{ width: 48, height: 48, objectFit: "contain" }} />
        <h1 style={{ color: "#C23B22", fontSize: 22, margin: "8px 0 4px" }}>Nuevo envío</h1>
        <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Llená los datos y generá tu etiqueta</p>
      </div>

      {/* Barra de progreso */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {[1,2,3].map(n => (
          <div key={n} style={{ flex: 1, height: 4, borderRadius: 2, background: n <= paso ? "#C23B22" : "#e5e7eb" }} />
        ))}
      </div>

      {paso === 1 && (
        <div style={card}>
          <div style={grid2}>
            <div>
              <label style={lbl}>Tipo de envío</label>
              <select value={tipoEnvio} onChange={e => setTipoEnvio(e.target.value)} style={inp}>
                <option value="mail">Marítimo</option>
                <option value="cc">Correo Aéreo</option>
                <option value="av">Aerovaradero</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Peso (lb)</label>
              <input type="number" min="0" step="0.1" value={peso} onChange={e => setPeso(e.target.value)} style={inp} autoFocus />
              <small style={{ color: "#1f6b3a", fontWeight: 700 }}>{pesoKg} kg</small>
            </div>
          </div>
          <div style={grid2}>
            <div>
              <label style={lbl}>Piezas</label>
              <input type="number" value={piezas} onChange={e => setPiezas(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Contenido</label>
              <input value={contenido} onChange={e => setContenido(e.target.value)} placeholder="Ropa, comida..." style={inp} />
            </div>
          </div>
          <button onClick={() => setPaso(2)} disabled={!paso1Ok} style={{ ...btnPrim, width: "100%", opacity: paso1Ok ? 1 : 0.5 }}>Siguiente</button>
        </div>
      )}

      {paso === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={card}>
            <h3 style={{ ...sectionHeader, marginTop: 0 }}>Embarcador</h3>
            <div style={grid2}>
              <div>
                <label style={lbl}>Nombre *</label>
                <input value={remitente} onChange={e => setRemitente(e.target.value)} placeholder="Alexis" style={inp} />
              </div>
              <div>
                <label style={lbl}>Apellidos *</label>
                <input value={remitenteApellidos} onChange={e => setRemitenteApellidos(e.target.value)} placeholder="Valdes Elis" style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>Teléfono</label>
              <input type="tel" value={remitenteTel} onChange={e => setRemitenteTel(e.target.value)} placeholder="7867780119" style={inp} />
            </div>
          </div>

          <div style={card}>
            <h3 style={sectionHeader}>Destinatario</h3>
            <div>
              <label style={lbl}>Nombre completo *</label>
              <input value={destinatario} onChange={e => setDestinatario(e.target.value)} placeholder="Orlando Valdes Elis" style={inp} />
            </div>
            <div style={grid2}>
              <div>
                <label style={lbl}>Carnet (11 números) *</label>
                <input inputMode="numeric" value={consignatarioCarnet} onChange={e => setConsignatarioCarnet(e.target.value.replace(/[^0-9]/g,"").slice(0,11))} placeholder="62062304929" style={inp} />
                <small style={{ color: consignatarioCarnet.length === 11 ? "#1f6b3a" : "#dc2626", fontSize: 11 }}>{consignatarioCarnet.length}/11</small>
              </div>
              <div>
                <label style={lbl}>Teléfono *</label>
                <input type="tel" value={consignatarioTel} onChange={e => setConsignatarioTel(e.target.value)} placeholder="59043148" style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>Dirección completa *</label>
              <textarea value={consignatarioCalle} onChange={e => setConsignatarioCalle(e.target.value)} placeholder="Calle G #18206 e/ 2 y Parque Rpto. 4" style={{...inp, minHeight: 60}} />
            </div>
            <div style={grid2}>
              <div>
                <label style={lbl}>Municipio</label>
                <select value={consignatarioMunicipio} onChange={e => setConsignatarioMunicipio(e.target.value)} style={inp}>
                  <option value="">—</option>
                  {(MUNICIPIOS[consignatarioProvincia] || []).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Provincia</label>
                <select value={consignatarioProvincia} onChange={e => { setConsignatarioProvincia(e.target.value); setConsignatarioMunicipio(""); }} style={inp}>
                  {[...PROVINCIAS].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setPaso(1)} style={{ ...btnOut, flex: 1 }}>Atrás</button>
            <button onClick={() => setPaso(3)} disabled={!paso2Ok} style={{ ...btnPrim, flex: 1, opacity: paso2Ok ? 1 : 0.5 }}>Siguiente</button>
          </div>
        </div>
      )}

      {paso === 3 && (
        <div style={card}>
          <h3 style={{ ...sectionHeader, marginTop: 0 }}>Confirmar envío</h3>
          <div style={resumenBox}>
            <div style={resumenRow}><span>Tipo:</span><b>{tipoEnvio === "mail" ? "Marítimo" : tipoEnvio === "cc" ? "Aéreo" : "Aerovaradero"}</b></div>
            <div style={resumenRow}><span>Peso:</span><b>{peso} lb / {pesoKg} kg</b></div>
            <div style={resumenRow}><span>De:</span><b>{remitente} {remitenteApellidos}</b></div>
            <div style={resumenRow}><span>Para:</span><b>{destinatario}</b></div>
            <div style={resumenRow}><span>CI:</span><b>{consignatarioCarnet}</b></div>
            <div style={resumenRow}><span>Dir:</span><b>{consignatarioCalle}</b></div>
            <div style={resumenRow}><span>Ubic:</span><b>{consignatarioMunicipio}, {consignatarioProvincia}</b></div>
          </div>
          {error && <div style={errBox}>{error}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setPaso(2)} style={{ ...btnOut, flex: 1 }}>Atrás</button>
            <button onClick={guardar} disabled={guardando} style={{ ...btnPrim, flex: 1 }}>
              {guardando ? "Creando..." : "Crear etiqueta"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const wrap: React.CSSProperties = { maxWidth: 480, margin: "0 auto", padding: "16px 12px 60px", fontFamily: "Arial" };
const card: React.CSSProperties = { background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,.06)", display: "flex", flexDirection: "column", gap: 12 };
const cardOk: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 30, textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,.06)" };
const codeBox: React.CSSProperties = { display: "inline-block", fontSize: 20, fontWeight: 900, color: "#C23B22", letterSpacing: 1, background: "#faf5f5", padding: "10px 20px", borderRadius: 10, margin: "12px 0" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 3 };
const inp: React.CSSProperties = { width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 16, boxSizing: "border-box" };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const sectionHeader: React.CSSProperties = { fontSize: 15, fontWeight: 800, color: "#1f2937", marginBottom: 4 };
const btnPrim: React.CSSProperties = { padding: "14px", borderRadius: 12, background: "#C23B22", color: "#fff", border: "none", fontWeight: 800, fontSize: 16, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "block" };
const btnOut: React.CSSProperties = { ...btnPrim, background: "transparent", color: "#C23B22", border: "2px solid #C23B22" };
const errBox: React.CSSProperties = { color: "#dc2626", padding: 10, background: "#fef2f2", borderRadius: 8, fontSize: 13 };
const resumenBox: React.CSSProperties = { background: "#f9fafb", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 6 };
const resumenRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 13 };
