import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// ════════════════════════════════════════════════════════════════════════════
// /r/[codigo] — Página pública de rastreo.
// El cliente escanea el QR de la etiqueta y llega acá.
// Muestra el estado del paquete y su historial de eventos.
// No requiere login.
// ════════════════════════════════════════════════════════════════════════════
export const dynamic = "force-dynamic";

const ESTADOS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  en_origen: { label: "En origen", color: "#1e40af", bg: "#dbeafe", icon: "📦" },
  en_transito: { label: "En tránsito", color: "#92400e", bg: "#fef3c7", icon: "🚢" },
  en_almacen: { label: "En almacén", color: "#5b21b6", bg: "#ede9fe", icon: "🏗️" },
  entregado: { label: "Entregado", color: "#065f46", bg: "#d1fae5", icon: "✅" },
};

export default async function RastreoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cod = codigo.toUpperCase().replace(/[^A-Z0-9-]/g, "");

  let p;
  try {
    p = await db.paquete.findUnique({
      where: { codigo: cod },
      include: { eventos: { orderBy: { ts: "desc" } } },
    });
  } catch {
    p = null;
  }

  if (!p) {
    return (
      <html>
        <head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
        <body style={{ fontFamily: "Arial", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#f0f0f0" }}>
          <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 16 }}>
            <h1 style={{ color: "#dc2626" }}>Paquete no encontrado</h1>
            <p>El código <b>{cod}</b> no existe en el sistema.</p>
            <a href="/" style={{ color: "#C23B22" }}>← Volver al inicio</a>
          </div>
        </body>
      </html>
    );
  }

  const est = ESTADOS[p.estado] || ESTADOS.en_origen;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Rastreo {cod}</title>
      </head>
      <body style={{ fontFamily: "Arial", background: "#f0f0f0", margin: 0, padding: 0 }}>
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "20px 16px 40px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h1 style={{ color: "#C23B22", fontSize: 20, margin: 0 }}>CHAMBATINA</h1>
            <small style={{ color: "#6b7280" }}>Rastreo de envíos</small>
          </div>

          {/* Estado actual */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
            <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>Código de tracking</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#1f2937", fontFamily: "Courier New, monospace", marginBottom: 16 }}>{cod}</div>
            <div style={{ display: "inline-block", background: est.bg, color: est.color, padding: "10px 24px", borderRadius: 999, fontSize: 18, fontWeight: 800 }}>
              {est.icon} {est.label}
            </div>
          </div>

          {/* Datos del envío */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#6b7280", fontSize: 13 }}>De</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{p.remitente}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#6b7280", fontSize: 13 }}>Para</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{p.destinatario}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#6b7280", fontSize: 13 }}>Peso</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{Number(p.peso).toFixed(1)} lb / {(Number(p.pesoKg ?? p.peso * 0.453592)).toFixed(2)} kg</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6b7280", fontSize: 13 }}>Fecha</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{new Date(p.creado).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
          </div>

          {/* Historial */}
          {p.eventos.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
              <h2 style={{ fontSize: 15, color: "#1f2937", marginBottom: 12 }}>Historial del envío</h2>
              {p.eventos.map((ev: any, i: number) => {
                const e = ESTADOS[ev.estado] || ESTADOS.en_origen;
                return (
                  <div key={ev.id} style={{ display: "flex", gap: 12, paddingBottom: 12, marginBottom: i < p.eventos.length - 1 ? 12 : 0, borderBottom: i < p.eventos.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ fontSize: 20 }}>{e.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: e.color }}>{e.label}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{new Date(ev.ts).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                      {ev.nota && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{ev.nota}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 20, color: "#9ca3af", fontSize: 12 }}>
            Chambatina · Envíos, exportación y logística
          </div>
        </div>
      </body>
    </html>
  );
}
