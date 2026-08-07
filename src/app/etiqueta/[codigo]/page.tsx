import { db } from "@/lib/db";

// ════════════════════════════════════════════════════════════════════════════
// /etiqueta/[codigo] — Etiqueta térmica 4×6 (101×152mm) lista para imprimir.
// Replica el formato del sistema de referencia (ikomsoft):
//   - Header con logo + nombre
//   - Código de tracking grande + código de barras
//   - Sección FROM (remitente) y TO (consignatario con carnet + dirección Cuba)
//   - Peso en LB y KG, piezas, contenido
//   - QR para rastreo
//   - Letra "K" como identificador de tipo (como en el sistema de referencia)
// Acceso público (para que el chofer la pueda abrir/imprimir).
// ════════════════════════════════════════════════════════════════════════════
export const dynamic = "force-dynamic";

function barcodeBars(code: string): string {
  // Genera barras verticales a partir del código (estilo Code128 simplificado).
  const bars = [];
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    const w = (c % 3) + 1; // ancho 1-3
    const gap = ((c >> 2) % 2) + 1;
    bars.push(`<div style="display:inline-block;width:${w * 2}px;height:100%;background:#000"></div>`);
    bars.push(`<div style="display:inline-block;width:${gap * 2}px;height:100%"></div>`);
  }
  return `<div style="height:50px;line-height:0;white-space:nowrap;overflow:hidden">${bars.join("")}</div>`;
}

export default async function EtiquetaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cod = codigo.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  let p;
  try {
    p = await db.paquete.findUnique({
      where: { codigo: cod },
      include: { agencia: true },
    });
  } catch (e: any) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: "Arial" }}>
      <h2>Error cargando etiqueta</h2>
      <p>Error: {String(e?.message || e).slice(0, 300)}</p>
      <p style={{ color: "#999", fontSize: 12 }}>Código: {cod}</p>
      <a href="/">← Volver</a>
    </div>;
  }

  if (!p) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: "Arial" }}>
      <h2>Etiqueta no encontrada</h2>
      <p>El código <b>{cod}</b> no existe.</p>
      <a href="/">← Volver</a>
    </div>;
  }

  const fecha = new Date(p.creado).toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
  const dirCuba = [
    p.consignatarioCalle,
    p.consignatarioEntre ? `e/ ${p.consignatarioEntre}` : null,
    p.consignatarioMunicipio,
    p.consignatarioProvincia,
    "Cuba",
  ].filter(Boolean).join(", ");

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Etiqueta {cod}</title>
        <style dangerouslySetInnerHTML={{ __html: ETIQUETA_CSS }} />
      </head>
      <body>
        <div className="no-print toolbar">
          <button onClick={() => window.print()}>🖨️ Imprimir etiqueta</button>
          <a href="/" className="btn-link">← Volver al CRM</a>
        </div>

        {/* ─────────── Hoja 4×6 ─────────── */}
        <div className="etiqueta">
          {/* Header */}
          <div className="e-header">
            <div className="e-logo">
              <div className="e-barco">🚢</div>
              <div className="e-marca">
                <strong>LEISURE EXPORTING LLC</strong>
                <small>Shipping to Cuba · Tampa, FL</small>
              </div>
            </div>
            <div className="e-tipo"><span className="e-k">K</span></div>
          </div>

          {/* Tracking + barcode */}
          <div className="e-tracking">
            <div className="e-tracking-num">
              <small>TRACKING #</small>
              <div className="e-code">{cod}</div>
            </div>
            <div className="e-qr">
              <img src={`/api/paquetes/${cod}/qr`} alt="QR" width="90" height="90" />
            </div>
          </div>
          <div className="e-barcode">{barcodeBars(cod)}</div>
          <div className="e-barcode-text">*{cod}*</div>

          {/* From / To */}
          <div className="e-sections">
            <div className="e-section">
              <div className="e-section-title">FROM / DE</div>
              <div className="e-data">
                <div className="e-line"><b>{p.remitente}</b></div>
                {p.remitenteCarnet && <div className="e-line">ID: {p.remitenteCarnet}</div>}
                {p.remitenteTel && <div className="e-line">Tel: {p.remitenteTel}</div>}
                {p.remitenteDir && <div className="e-line">{p.remitenteDir}</div>}
                <div className="e-line muted">{p.agencia?.nombre}</div>
              </div>
            </div>
            <div className="e-section e-section-to">
              <div className="e-section-title">TO / PARA</div>
              <div className="e-data">
                <div className="e-line big"><b>{p.destinatario}</b></div>
                {p.consignatarioCarnet && <div className="e-line">Carnet/ID: <b>{p.consignatarioCarnet}</b></div>}
                {p.consignatarioTel && <div className="e-line">Tel: {p.consignatarioTel}</div>}
                <div className="e-line">{dirCuba}</div>
              </div>
            </div>
          </div>

          {/* Peso / piezas */}
          <div className="e-peso-grid">
            <div className="e-peso-box">
              <small>WEIGHT</small>
              <div className="e-peso-val">{p.peso} <span>lb</span></div>
            </div>
            <div className="e-peso-box">
              <small>PESO</small>
              <div className="e-peso-val">{p.pesoKg ?? (p.peso * 0.453592).toFixed(2)} <span>kg</span></div>
            </div>
            <div className="e-peso-box">
              <small>PIECES</small>
              <div className="e-peso-val">{p.piezas}</div>
            </div>
            <div className="e-peso-box">
              <small>DATE</small>
              <div className="e-peso-val small">{fecha}</div>
            </div>
          </div>

          {/* Contenido */}
          <div className="e-contenido">
            <span className="e-cat">CONTENT: {p.contenido}{p.categoria ? ` · ${p.categoria}` : ""}</span>
            {p.notas && <span className="e-notas">Notes: {p.notas}</span>}
          </div>

          {/* Footer */}
          <div className="e-footer">
            <small>📞 +1 727-598-6802 · sales@leisureexportingllc.com · leisureexportingllc.com</small>
          </div>
        </div>
      </body>
    </html>
  );
}

const ETIQUETA_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Arial Narrow", Arial, sans-serif; background: #f0f0f0; }
  .toolbar { display: flex; gap: 12px; padding: 14px; justify-content: center; background: #fff; border-bottom: 1px solid #ccc; }
  .toolbar button, .toolbar .btn-link {
    padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; text-decoration: none;
    background: #C23B22; color: #fff; border: none; font-size: 1rem;
  }
  .toolbar .btn-link { background: #6b7280; }

  /* Hoja 4×6 (101×152 mm). 1mm ≈ 3.78px */
  .etiqueta {
    width: 384px; height: 576px; margin: 20px auto; padding: 14px;
    background: #fff; border: 2px solid #000;
    display: flex; flex-direction: column; gap: 8px;
    font-size: 11px; color: #000;
  }

  /* Header */
  .e-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #C23B22; padding-bottom: 6px; }
  .e-logo { display: flex; align-items: center; gap: 8px; }
  .e-barco { font-size: 22px; }
  .e-marca strong { font-size: 13px; color: #C23B22; display: block; letter-spacing: .3px; }
  .e-marca small { font-size: 8px; color: #666; }
  .e-tipo { background: #C23B22; color: #fff; border-radius: 4px; }
  .e-k { font-size: 24px; font-weight: 900; padding: 2px 12px; display: block; }

  /* Tracking */
  .e-tracking { display: flex; justify-content: space-between; align-items: center; }
  .e-tracking-num small { font-size: 9px; color: #666; display: block; }
  .e-code { font-size: 20px; font-weight: 900; letter-spacing: 1px; }
  .e-qr img { border: 1px solid #000; }

  /* Barcode */
  .e-barcode { margin: 4px 0; height: 50px; }
  .e-barcode-text { text-align: center; font-size: 14px; font-weight: 700; letter-spacing: 3px; }

  /* Secciones From / To */
  .e-sections { display: flex; gap: 6px; margin-top: 4px; }
  .e-section { flex: 1; border: 1px solid #000; padding: 6px; }
  .e-section-to { background: #faf5f5; }
  .e-section-title { font-size: 9px; font-weight: 900; color: #C23B22; border-bottom: 1px solid #C23B22; margin-bottom: 4px; padding-bottom: 2px; }
  .e-data { display: flex; flex-direction: column; gap: 2px; }
  .e-line { font-size: 11px; line-height: 1.3; }
  .e-line.big { font-size: 13px; }
  .e-line.muted { color: #666; font-size: 9px; }

  /* Peso */
  .e-peso-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 4px; margin-top: 4px; }
  .e-peso-box { border: 1px solid #000; padding: 4px; text-align: center; }
  .e-peso-box small { font-size: 8px; color: #666; display: block; }
  .e-peso-val { font-size: 15px; font-weight: 800; }
  .e-peso-val span { font-size: 10px; font-weight: 600; }
  .e-peso-val.small { font-size: 11px; }

  /* Contenido */
  .e-contenido { display: flex; flex-direction: column; gap: 2px; border-top: 1px dashed #000; padding-top: 4px; }
  .e-cat { font-size: 10px; font-weight: 700; }
  .e-notas { font-size: 9px; color: #666; }

  /* Footer */
  .e-footer { border-top: 2px solid #C23B22; padding-top: 4px; text-align: center; }

  @media print {
    body { background: #fff; }
    .toolbar { display: none !important; }
    .etiqueta { border: none; margin: 0; width: 4in; height: 6in; padding: 8px; }
    @page { size: 4in 6in; margin: 0; }
  }
`;
