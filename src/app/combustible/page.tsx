"use client";
import { useState, useEffect } from "react";

// ════════════════════════════════════════════════════════════════════════════
// /combustible — Venta de combustible con ticket QR único
// ════════════════════════════════════════════════════════════════════════════

const TIPOS = [
  { id: "gasolina", label: "Gasolina", precio: 5.26, color: "#C23B22" },
  { id: "diesel", label: "Diésel", precio: 6.21, color: "#1f6b3a" },
  { id: "petroleo", label: "Petróleo", precio: 7.57, color: "#e0a106" },
];

export default function CombustiblePage() {
  const [tipo, setTipo] = useState("gasolina");
  const [litros, setLitros] = useState("10");
  const [cliente, setCliente] = useState("");
  const [carnet, setCarnet] = useState("");
  const [vehiculo, setVehiculo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<null | { venta: any; qr: string }>(null);

  const tipoActual = TIPOS.find(t => t.id === tipo) || TIPOS[0];
  const litrosNum = parseFloat(litros) || 0;
  const total = (litrosNum * tipoActual.precio).toFixed(2);

  async function vender(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setGuardando(true);
    try {
      const res = await fetch("/api/combustible", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, litros, cliente, clienteCarnet: carnet, vehiculo }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Error"); setGuardando(false); return; }
      setTicket({ venta: d.venta, qr: d.qr });
    } catch { setError("No se pudo conectar"); }
    setGuardando(false);
  }

  // Pantalla de éxito con ticket imprimible
  if (ticket) {
    const v = ticket.venta;
    return (
      <div style={wrap}>
        <div className="ticket-print" style={ticketCard}>
          <h2 style={{ textAlign: "center", color: "#1f2937", marginTop: 0 }}>COMBUSTIBLE</h2>
          <div style={{ textAlign: "center", fontSize: 24, fontWeight: 900, color: "#C23B22", marginBottom: 10 }}>
            {v.ticket}
          </div>
          <div style={{ textAlign: "center", marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: ticket.qr }} />
          <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
            <tr><td style={td}>Tipo:</td><td style={{...td, textAlign: "right", fontWeight: 700}}>{v.tipo.toUpperCase()}</td></tr>
            <tr><td style={td}>Litros:</td><td style={{...td, textAlign: "right", fontWeight: 700}}>{v.litros}</td></tr>
            <tr><td style={td}>Precio/L:</td><td style={{...td, textAlign: "right"}}>${v.precioLitro.toFixed(2)}</td></tr>
            <tr><td style={{...td, borderTop: "2px solid #000"}}><b>TOTAL:</b></td><td style={{...td, textAlign: "right", borderTop: "2px solid #000"}}><b>${v.total.toFixed(2)}</b></td></tr>
            {v.cliente && <tr><td style={td}>Cliente:</td><td style={{...td, textAlign: "right"}}>{v.cliente}</td></tr>}
            {v.vehiculo && <tr><td style={td}>Vehículo:</td><td style={{...td, textAlign: "right"}}>{v.vehiculo}</td></tr>}
            <tr><td style={td}>Fecha:</td><td style={{...td, textAlign: "right"}}>{new Date(v.creado).toLocaleString()}</td></tr>
          </table>
          <button onClick={() => window.print()} style={{ ...btn, width: "100%", marginTop: 16 }}>IMPRIMIR TICKET</button>
          <button onClick={() => { setTicket(null); setLitros("10"); }} style={{ ...btn, background: "#374151", width: "100%", marginTop: 8 }}>Nueva venta</button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <h1 style={{ color: "#C23B22", fontSize: 22, textAlign: "center", margin: "0 0 16px" }}>Venta de Combustible</h1>

      <form onSubmit={vender} style={card}>
        {/* Tipo de combustible */}
        <div>
          <label style={lbl}>Tipo de combustible</label>
          <div style={{ display: "flex", gap: 8 }}>
            {TIPOS.map(t => (
              <button key={t.id} type="button" onClick={() => setTipo(t.id)}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: tipo === t.id ? `3px solid ${t.color}` : "1px solid #d1d5db", background: tipo === t.id ? `${t.color}15` : "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                <div style={{ color: t.color, fontWeight: 800 }}>{t.label}</div>
                <small style={{ color: "#6b7280" }}>${t.precio}/L</small>
              </button>
            ))}
          </div>
        </div>

        {/* Litros */}
        <div>
          <label style={lbl}>Litros</label>
          <input type="number" step="0.01" min="0" value={litros} onChange={e => setLitros(e.target.value)} required
            style={{ ...inp, fontSize: 28, fontWeight: 800, textAlign: "center" }} autoFocus />
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 16, fontWeight: 800, color: "#1f6b3a" }}>
            Total: ${total}
          </div>
        </div>

        {/* Datos opcionales */}
        <div style={grid2}>
          <div>
            <label style={lbl}>Cliente</label>
            <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Consumidor Final" style={inp} />
          </div>
          <div>
            <label style={lbl}>Carnet</label>
            <input value={carnet} onChange={e => setCarnet(e.target.value)} style={inp} />
          </div>
        </div>
        <div>
          <label style={lbl}>Vehículo (placa)</label>
          <input value={vehiculo} onChange={e => setVehiculo(e.target.value)} placeholder="Ej: ABC-123" style={inp} />
        </div>

        {error && <div style={errBox}>{error}</div>}

        <button type="submit" disabled={guardando || litrosNum <= 0} style={{ ...btn, fontSize: 17, padding: 16 }}>
          {guardando ? "Procesando..." : `VENDER — $${total}`}
        </button>
      </form>

      <style>{`@media print { .no-print { display:none } body { margin:0 } }`}</style>
    </div>
  );
}

const wrap: React.CSSProperties = { maxWidth: 440, margin: "0 auto", padding: "16px 12px 60px", fontFamily: "Arial" };
const card: React.CSSProperties = { background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,.06)", display: "flex", flexDirection: "column", gap: 14 };
const ticketCard: React.CSSProperties = { background: "#fff", borderRadius: 14, padding: 24, maxWidth: 320, boxShadow: "0 2px 10px rgba(0,0,0,.08)" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4 };
const inp: React.CSSProperties = { width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 16, boxSizing: "border-box" };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const btn: React.CSSProperties = { padding: "14px", borderRadius: 12, background: "#C23B22", color: "#fff", border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer" };
const errBox: React.CSSProperties = { color: "#dc2626", padding: 10, background: "#fef2f2", borderRadius: 8, fontSize: 13 };
const td: React.CSSProperties = { padding: "6px 4px", borderBottom: "1px solid #eee", fontSize: 13 };
