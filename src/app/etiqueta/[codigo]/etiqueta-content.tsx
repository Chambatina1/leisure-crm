"use client";

// ════════════════════════════════════════════════════════════════════════════
// etiqueta-content — Client Component. Etiqueta térmica 4×6 replica exacta
// del formato de referencia: grid de campos compacto, todo mayúsculas,
// logo arriba, barcode + tracking abajo, QR lateral.
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
  hawb?: string | null;
}

export default function EtiquetaContent({ p }: { p: EtiquetaData }) {
  const cod = p.codigo;
  const fecha = new Date(p.creado).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const pesoKg = p.pesoKg ?? (Number(p.peso) * 0.453592);
  const hawb = p.hawb || cod;

  const upper = (s?: string | null) => (s || "").toUpperCase();

  return (
    <>
      <div className="no-print etq-toolbar">
        <button onClick={() => window.print()}>IMPRIMIR ETIQUETA</button>
        <a href="/nuevo-paquete" className="etq-link">NUEVA ETIQUETA</a>
        <a href="/bol" className="etq-link">MANIFIESTO</a>
        <a href="/" className="etq-link">INICIO</a>
      </div>

      <div className="etq">
        {/* ── FILA 1: Logo + empresa + K ── */}
        <div className="etq-top">
          <div className="etq-logo-area">
            <div className="etq-logo-box">LXE</div>
            <div className="etq-empresa">
              <strong>LEISURE EXPORTING LLC</strong>
              <small>SHIPPING TO CUBA</small>
            </div>
          </div>
          <div className="etq-k">K</div>
        </div>

        {/* ── Logos grupo empresarial ── */}
        <div className="etq-grupo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/chambatina.png" alt="Chambatina" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/servitravel.png" alt="ServiTravels" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/mdl-travel.png" alt="MDL Travel" />
        </div>

        {/* ── FILA 2: Tracking (HAWB) grande ── */}
        <div className="etq-hawb">
          <span className="etq-hawb-label">HBL / HAWB</span>
          <span className="etq-hawb-num">{hawb}</span>
        </div>

        {/* ── FILA 3: Grid de campos — EMBARCADOR / CONSIGNATARIO ── */}
        <div className="etq-grid">
          <div className="etq-field etq-field-wide">
            <label>EMBARCADOR</label>
            <div className="etq-field-val">{upper(p.remitente)}</div>
          </div>
          <div className="etq-field etq-field-wide">
            <label>CONSIGNATARIO</label>
            <div className="etq-field-val">{upper(p.destinatario)}</div>
          </div>
          <div className="etq-field">
            <label>CARNET / ID</label>
            <div className="etq-field-val">{upper(p.consignatarioCarnet) || "—"}</div>
          </div>
          <div className="etq-field">
            <label>TELEFONO</label>
            <div className="etq-field-val">{p.consignatarioTel || "—"}</div>
          </div>
          <div className="etq-field etq-field-wide">
            <label>DIRECCION</label>
            <div className="etq-field-val">{upper(p.consignatarioCalle)}</div>
          </div>
          <div className="etq-field">
            <label>MUNICIPIO</label>
            <div className="etq-field-val">{upper(p.consignatarioMunicipio)}</div>
          </div>
          <div className="etq-field">
            <label>PROVINCIA</label>
            <div className="etq-field-val">{upper(p.consignatarioProvincia) || "LA HABANA"}</div>
          </div>
        </div>

        {/* ── FILA 4: Descripción + Envío ── */}
        <div className="etq-grid">
          <div className="etq-field etq-field-wide">
            <label>DESCRIPCION</label>
            <div className="etq-field-val">{upper(p.contenido)}{p.categoria ? ` · ${upper(p.categoria)}` : ""}</div>
          </div>
          <div className="etq-field">
            <label>FECHA ENVIO</label>
            <div className="etq-field-val">{fecha}</div>
          </div>
        </div>

        {/* ── FILA 5: Peso / Bultos / Piezas — cajas grandes ── */}
        <div className="etq-peso-row">
          <div className="etq-peso-box">
            <label>PESO LB</label>
            <div className="etq-peso-val">{Number(p.peso).toFixed(1)}</div>
          </div>
          <div className="etq-peso-box">
            <label>PESO KG</label>
            <div className="etq-peso-val">{Number(pesoKg).toFixed(2)}</div>
          </div>
          <div className="etq-peso-box">
            <label>BULTOS</label>
            <div className="etq-peso-val">{p.piezas}</div>
          </div>
          <div className="etq-peso-box etq-qr-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/paquetes/${cod}/qr`} alt="QR" width="70" height="70" />
          </div>
        </div>

        {/* ── FILA 6: Barcode + número ── */}
        <div className="etq-barcode-area">
          <div className="etq-barcode-bars">
            <BarcodeSvg code={cod} />
          </div>
          <div className="etq-barcode-num">*{cod}*</div>
        </div>

        {/* ── FILA 7: Footer ── */}
        <div className="etq-footer">
          LEISURE EXPORTING LLC · +1 727-598-6802 · SALES@LEISUREEXPORTINGLLC.COM
        </div>
      </div>
    </>
  );
}

// Barcode Code128 simplificado (barras negras variables)
function BarcodeSvg({ code }: { code: string }) {
  const bars: React.ReactElement[] = [];
  let x = 0;
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    const w = (c % 3) + 1;
    const gap = ((c >> 2) % 2) + 1;
    bars.push(<rect key={`b${i}`} x={x} y={0} width={w * 2} height={50} fill="#000" />);
    x += w * 2;
    bars.push(<rect key={`g${i}`} x={x} y={0} width={gap * 2} height={50} fill="transparent" />);
    x += gap * 2;
  }
  return (
    <svg viewBox={`0 0 ${x} 50`} width="100%" height="50" preserveAspectRatio="none" shapeRendering="crispEdges">
      {bars}
    </svg>
  );
}
