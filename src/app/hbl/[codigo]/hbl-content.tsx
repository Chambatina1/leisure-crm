"use client";

// ════════════════════════════════════════════════════════════════════════════
// hbl-content — Client Component del House Bill of Lading.
// Estilo solvecargo: documento A4 profesional con secciones del transportista.
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

export default function HblContent({ p }: { p: HblData }) {
  const fecha = new Date(p.creado).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const dirConsign = [p.consignatarioCalle, p.consignatarioEntre ? `E/ ${p.consignatarioEntre}` : null, p.consignatarioMunicipio, p.consignatarioProvincia, "CUBA"].filter(Boolean).join(", ");

  return (
    <>
      <div className="no-print hbl-toolbar">
        <button onClick={() => window.print()}>IMPRIMIR HBL</button>
        <a href={`/etiqueta/${p.codigo}`}>VER ETIQUETA</a>
        <a href="/bol">VER MANIFIESTO</a>
        <a href="/">INICIO</a>
      </div>

      <div className="hbl">
        {/* Header */}
        <div className="hbl-header">
          <div className="hbl-header-left">
            <strong>GRUPO EMPRESARIAL</strong>
            <small>+1 727-598-6802 · info@grupo-empresarial.com</small>
            <div className="hbl-grupo-logos">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/chambatina.png" alt="Chambatina" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/servitravel.png" alt="ServiTravels" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/mdl-travel.png" alt="MDL Travel" />
            </div>
          </div>
          <div className="hbl-header-right">
            <div className="hbl-doc-title">HOUSE BILL OF LADING</div>
            <div className="hbl-doc-num">HBL: {p.hawb}</div>
            <div className="hbl-doc-num">Fecha: {fecha}</div>
          </div>
        </div>

        {/* Partes: Shipper / Consignee / Notify */}
        <div className="hbl-partes">
          <div className="hbl-parte">
            <label>Shipper / Embarcador</label>
            <div className="nombre">{upper(p.remitente)}</div>
            {p.remitenteCarnet && <div className="linea">Doc: {upper(p.remitenteCarnet)}</div>}
            {p.remitenteTel && <div className="linea">Tel: {p.remitenteTel}</div>}
            {p.remitenteDir && <div className="linea">{upper(p.remitenteDir)}</div>}
            <div className="linea">{upper(p.agenciaCiudad)}, {upper(p.agenciaPais)}</div>
          </div>
          <div className="hbl-parte">
            <label>Consignee / Consignatario</label>
            <div className="nombre">{upper(p.destinatario)}</div>
            {p.consignatarioCarnet && <div className="linea">CI/Pas: <b>{upper(p.consignatarioCarnet)}</b></div>}
            {p.consignatarioTel && <div className="linea">Tel: {p.consignatarioTel}</div>}
            <div className="linea">{upper(dirConsign)}</div>
          </div>
          <div className="hbl-parte hbl-parte-full">
            <label>Notify Party / Notificante</label>
            <div className="linea">Mismo consignatario arriba · Tel: {p.consignatarioTel || p.remitenteTel || "—"}</div>
          </div>
        </div>

        {/* Detalles del envío */}
        <div className="hbl-detalles">
          <div className="hbl-detalles-row">
            <div className="hbl-detalle"><label>Vessel / Buque</label><div className="val">—</div></div>
            <div className="hbl-detalle"><label>Voyage / Viaje</label><div className="val">—</div></div>
            <div className="hbl-detalle"><label>Port of Loading</label><div className="val">TAMPA, FL, USA</div></div>
            <div className="hbl-detalle"><label>Port of Discharge</label><div className="val">LA HABANA, CUBA</div></div>
          </div>
          <div className="hbl-detalles-row">
            <div className="hbl-detalle"><label>Place of Delivery</label><div className="val">{upper(p.consignatarioProvincia) || "LA HABANA"}, CUBA</div></div>
            <div className="hbl-detalle"><label>Type of Move</label><div className="val">K · MARÍTIMO</div></div>
            <div className="hbl-detalle"><label>Container</label><div className="val">—</div></div>
            <div className="hbl-detalle"><label>Booking</label><div className="val">—</div></div>
          </div>
        </div>

        {/* Tabla de mercancía */}
        <div className="hbl-mercancia">
          <div className="hbl-mercancia-title">Descripción de mercancía / Description of goods</div>
          <table className="hbl-tabla">
            <thead>
              <tr>
                <th>Marks & Nº</th>
                <th>Description</th>
                <th>Packages</th>
                <th>Gross Weight (kg)</th>
                <th>Volume (m³)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{p.hawb}</td>
                <td>{upper(p.contenido)}{p.categoria ? ` · ${upper(p.categoria)}` : ""}</td>
                <td>{p.piezas}</td>
                <td>{Number(p.pesoKg).toFixed(2)}</td>
                <td>—</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>TOTAL</td>
                <td>{p.piezas}</td>
                <td>{Number(p.pesoKg).toFixed(2)}</td>
                <td>—</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Términos */}
        <div className="hbl-terminos">
          <strong>Terms and Conditions:</strong> Shipped in apparent good order and condition, unless otherwise indicated herein,
          from Tampa, FL, USA to Cuba. The Shipper, Consignee and Owner of the goods, and their respective agents, accept and
          agree to all terms and conditions on this Bill of Lading. Goods are transported at the risk of the owner of the goods.
          Grupo Empresarial acts as Non-Vessel Operating Common Carrier (NVOCC).
        </div>

        {/* Firmas */}
        <div className="hbl-firmas">
          <div className="hbl-firma">
            <div className="hbl-firma-linea"></div>
            <small>Shipper / Embarcador</small>
          </div>
          <div className="hbl-firma">
            <div className="hbl-firma-linea"></div>
            <small>Grupo Empresarial · Carrier</small>
          </div>
          <div className="hbl-firma">
            <div className="hbl-firma-linea"></div>
            <small>Received by / Recibido por</small>
          </div>
        </div>

        <div className="hbl-footer">
          GRUPO EMPRESARIAL · +1 727-598-6802 · info@grupo-empresarial.com
        </div>
      </div>
    </>
  );
}
