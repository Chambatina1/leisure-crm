"use client";

// ════════════════════════════════════════════════════════════════════════════
// hbl-content — Client Component del HBL (Combined Transport Bill of Lading).
// Formato exacto del sistema de referencia (ikomsoft/solvedcargo).
// ════════════════════════════════════════════════════════════════════════════

interface HblData {
  codigo: string;
  hawb: string;
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
  pesoKg: number;
  piezas: number;
  contenido: string;
  categoria?: string | null;
  creado: string | Date;
  agenciaNombre?: string;
  agenciaDir?: string;
  agenciaCiudad?: string;
  agenciaPais?: string;
}

const upper = (s?: string | null) => (s || "").toUpperCase();

export default function HblContent({ p, brands = [] }: { p: HblData; brands?: { nombre: string; logo: string }[] }) {
  const fechaEmision = new Date(p.creado).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const pesoKg = p.pesoKg ?? Number(p.peso) * 0.453592;

  return (
    <>
      <div className="no-print hbl-toolbar">
        <button onClick={() => window.print()}>IMPRIMIR HBL</button>
        <a href={`/etiqueta/${p.codigo}`}>VER ETIQUETA</a>
        <a href="/bol">VER MANIFIESTO</a>
        <a href="/">INICIO</a>
      </div>

      <div className="hbl">
        {/* ── FILA SUPERIOR: Título + HBL ── */}
        <div className="hbl-top">
          <div className="hbl-forwarding">
            <label>FORWARDING AGENT</label>
            <div className="hbl-agent-name">{p.agenciaNombre ? upper(p.agenciaNombre) : "GRUPO EMPRESARIAL"}</div>
            {brands.length > 0 && (
              <div className="hbl-grupo-logos">
                {brands.map(b => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={b.nombre} src={b.logo} alt={b.nombre} />
                ))}
              </div>
            )}
          </div>
          <div className="hbl-title-area">
            <div className="hbl-title">COMBINED TRANSPORT BILL OF LADING</div>
            <div className="hbl-num"><label>HBL</label> <b>{p.hawb}</b></div>
          </div>
        </div>

        {/* ── SHIPPER + NOTIFY PARTY ── */}
        <div className="hbl-row-2">
          <div className="hbl-block">
            <label>SHIPPER</label>
            <div className="hbl-val">{upper(p.remitente)}</div>
          </div>
          <div className="hbl-block">
            <label>NOTIFY PARTY / INTERMEDIATE CONSIGNEE</label>
            <div className="hbl-val">TRANSCARGO</div>
            <div className="hbl-sub">Fabrica no. 54 e/ Aspuru y Linea del Ferrocarril</div>
            <div className="hbl-sub">Habana Vieja, La Habana, Cuba · Tel: +537 698 1458</div>
          </div>
        </div>

        {/* ── CONSIGNED TO ── */}
        <div className="hbl-row-2">
          <div className="hbl-block">
            <label>CONSIGNED TO</label>
            <div className="hbl-val">{upper(p.destinatario)}</div>
          </div>
          <div className="hbl-block hbl-block-tel">
            <label>TELEFONOS</label>
            <div className="hbl-sub">{p.consignatarioTel || p.remitenteTel || "—"}</div>
          </div>
        </div>

        {/* ── Datos del consignatario ── */}
        <div className="hbl-datos">
          <div className="hbl-dato"><label>CI:</label><span>{upper(p.consignatarioCarnet) || "—"}</span></div>
          <div className="hbl-dato hbl-dato-wide"><label>Direccion:</label><span>{upper(p.consignatarioCalle)}{p.consignatarioEntre ? ` E/ ${upper(p.consignatarioEntre)}` : ""}</span></div>
          <div className="hbl-dato"><label>Municipio:</label><span>{upper(p.consignatarioMunicipio) || "—"}</span></div>
          <div className="hbl-dato"><label>Provincia:</label><span>{upper(p.consignatarioProvincia) || "—"}</span></div>
        </div>

        {/* ── Tabla de mercancía ── */}
        <table className="hbl-tabla">
          <thead>
            <tr>
              <th className="col-marks">MARKS AND NUMBERS</th>
              <th className="col-pack">N PACK</th>
              <th>DESCRIPTION OF COMMODITIES</th>
              <th className="col-gw">G W (KG)</th>
              <th className="col-m3">M. (M3)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">{p.hawb}</td>
              <td className="num">{p.piezas}</td>
              <td>{upper(p.contenido)}{p.categoria ? ` · ${upper(p.categoria)}` : ""}</td>
              <td className="num">{pesoKg.toFixed(2)}</td>
              <td className="num">—</td>
            </tr>
          </tbody>
        </table>

        {/* ── Casillas inferiores ── */}
        <div className="hbl-footer-grid">
          <div className="hbl-foot-box">
            <label>FECHA EMISION</label>
            <div className="hbl-foot-val">{fechaEmision}</div>
          </div>
          <div className="hbl-foot-box">
            <label>FECHA ENTREGA</label>
            <div className="hbl-foot-val">—</div>
          </div>
          <div className="hbl-foot-box">
            <label>FIRMA AGENTE</label>
            <div className="hbl-foot-line"></div>
          </div>
          <div className="hbl-foot-box">
            <label>MANIFIESTO</label>
            <div className="hbl-foot-val">MANIFIESTO</div>
          </div>
          <div className="hbl-foot-box">
            <label>TIPO ENVIO</label>
            <div className="hbl-foot-val">ENVIO</div>
          </div>
        </div>
      </div>
    </>
  );
}
