"use client";

// ════════════════════════════════════════════════════════════════════════════
// etiqueta-content — Client Component para la etiqueta térmica.
// Separado de page.tsx (Server Component) porque usa window.print() en onClick.
// ════════════════════════════════════════════════════════════════════════════

interface EtiquetaData {
  codigo: string;
  remitente: string;
  remitenteCarnet?: string | null;
  remitenteTel?: string | null;
  remitenteDir?: string | null;
  destinatario: string;
  consignatarioCarnet?: string | null;
  consignatarioTel?: string | null;
  consignatarioCalle?: string | null;
  consignatarioEntre?: string | null;
  consignatarioMunicipio?: string | null;
  consignatarioProvincia?: string | null;
  peso: number;
  pesoKg?: number | null;
  piezas: number;
  contenido: string;
  categoria?: string | null;
  notas?: string;
  creado: string | Date;
  agenciaNombre?: string;
  destino?: string;
}

function barcodeBars(code: string): string {
  const bars: string[] = [];
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    const w = (c % 3) + 1;
    const gap = ((c >> 2) % 2) + 1;
    bars.push(`<div style="display:inline-block;width:${w * 2}px;height:100%;background:#000"></div>`);
    bars.push(`<div style="display:inline-block;width:${gap * 2}px;height:100%"></div>`);
  }
  return `<div style="height:48px;line-height:0;white-space:nowrap;overflow:hidden">${bars.join("")}</div>`;
}

export default function EtiquetaContent({ p }: { p: EtiquetaData }) {
  const cod = p.codigo;
  const fecha = new Date(p.creado).toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
  const pesoKg = p.pesoKg ?? (Number(p.peso) * 0.453592).toFixed(2);
  const dirCuba = [
    p.consignatarioCalle,
    p.consignatarioEntre ? `E/ ${p.consignatarioEntre}` : null,
    p.consignatarioMunicipio,
    p.consignatarioProvincia,
  ].filter(Boolean).join(", ");

  return (
    <>
      <div className="no-print toolbar">
        <button onClick={() => window.print()}>IMPRIMIR ETIQUETA</button>
        <a href="/" className="btn-link">Volver al CRM</a>
        <a href="/nuevo-paquete" className="btn-link">Nueva etiqueta</a>
      </div>

      <div className="etiqueta">
        {/* ── Fila 1: Header ── */}
        <div className="etq-header">
          <div className="etq-logo">
            <strong>LEISURE EXPORTING LLC</strong>
            <small>SHIPPING TO CUBA · TAMPA, FL</small>
          </div>
          <div className="etq-k">K</div>
        </div>

        {/* ── Fila 2: Tracking + QR ── */}
        <div className="etq-tracking">
          <div className="etq-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/paquetes/${cod}/qr`} alt="QR" width="80" height="80" />
          </div>
          <div className="etq-tracking-num">
            <small>TRACKING</small>
            <div className="etq-code">{cod}</div>
          </div>
        </div>

        {/* ── Fila 3: Barcode ── */}
        <div className="etq-barcode" dangerouslySetInnerHTML={{ __html: barcodeBars(cod) }} />
        <div className="etq-barcode-text">*{cod}*</div>

        {/* ── Fila 4: REMITENTE / CONSIGNATARIO ── */}
        <div className="etq-personas">
          <div className="etq-persona">
            <div className="etq-persona-title">REMITENTE</div>
            <div className="etq-persona-nombre">{(p.remitente || "").toUpperCase()}</div>
            {p.remitenteTel && <div className="etq-persona-line">TEL: {p.remitenteTel}</div>}
            {p.remitenteCarnet && <div className="etq-persona-line">CAR/PAS: {p.remitenteCarnet}</div>}
          </div>
          <div className="etq-persona etq-persona-to">
            <div className="etq-persona-title">CONSIGNATARIO</div>
            <div className="etq-persona-nombre">{(p.destinatario || "").toUpperCase()}</div>
            {p.consignatarioTel && <div className="etq-persona-line">TEL: {p.consignatarioTel}</div>}
            {p.consignatarioCarnet && <div className="etq-persona-line">CI/PAS: <b>{p.consignatarioCarnet}</b></div>}
            {dirCuba && <div className="etq-persona-line">{dirCuba.toUpperCase()}</div>}
            {p.destino && <div className="etq-persona-line muted">{(p.destino || "").toUpperCase()}, CUBA</div>}
          </div>
        </div>

        {/* ── Fila 5: Peso / Piezas / Fecha / Contenido ── */}
        <div className="etq-datos">
          <div className="etq-dato">
            <small>PESO LB</small>
            <b>{Number(p.peso).toFixed(1)}</b>
          </div>
          <div className="etq-dato">
            <small>PESO KG</small>
            <b>{Number(pesoKg).toFixed(2)}</b>
          </div>
          <div className="etq-dato">
            <small>PIEZAS</small>
            <b>{p.piezas}</b>
          </div>
          <div className="etq-dato">
            <small>FECHA</small>
            <b className="etq-dato-fecha">{fecha}</b>
          </div>
        </div>

        {/* ── Fila 6: Contenido ── */}
        <div className="etq-contenido">
          <small>DESCRIPCION / CONTENT</small>
          <div>{(p.contenido || "").toUpperCase()}{p.categoria ? ` · ${(p.categoria || "").toUpperCase()}` : ""}</div>
          {p.notas && <div className="etq-notas">NOTAS: {p.notas.toUpperCase()}</div>}
        </div>

        {/* ── Fila 7: Footer ── */}
        <div className="etq-footer">
          +1 727-598-6802 · SALES@LEISUREEXPORTINGLLC.COM · LEISUREEXPORTINGLLC.COM
        </div>
      </div>
    </>
  );
}
