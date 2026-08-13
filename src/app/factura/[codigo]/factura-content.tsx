"use client";

interface FacturaData {
  codigo: string;
  facturaNum: string;
  remitente: string;
  remitenteTel?: string | null;
  destinatario: string;
  consignatarioCarnet?: string | null;
  consignatarioTel?: string | null;
  consignatarioCalle?: string | null;
  consignatarioMunicipio?: string | null;
  consignatarioProvincia?: string | null;
  peso: number;
  pesoKg: number;
  piezas: number;
  contenido: string;
  tarifa: number;
  monto: number;
  creado: string | Date;
  agenciaNombre?: string;
  agenciaLogo?: string | null;
  agenciaTel?: string | null;
}

const upper = (s?: string | null) => (s || "").toUpperCase();

export default function FacturaContent({ p }: { p: FacturaData }) {
  const fecha = new Date(p.creado).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const dirDest = [p.consignatarioCalle, p.consignatarioMunicipio, p.consignatarioProvincia].filter(Boolean).join(", ");

  return (
    <>
      <div className="no-print fac-controls">
        <button onClick={() => window.print()}>IMPRIMIR FACTURA</button>
        <a href={`/etiqueta/${p.codigo}`}>VER ETIQUETA</a>
        <a href={`/hbl/${p.codigo}`}>VER HBL</a>
        <a href="/">INICIO</a>
      </div>

      <div className="factura">
        {/* Header */}
        <div className="fac-header">
          <div className="fac-logo">
            {p.agenciaLogo && <img src={p.agenciaLogo} alt="logo" />}
            <div className="fac-empresa">
              <strong>{upper(p.agenciaNombre) || "CHAMBATINA"}</strong>
              <small>Envíos, exportación y logística<br />{p.agenciaTel || "+1 727-598-6802"}</small>
            </div>
          </div>
          <div className="fac-titulo">
            <h1>FACTURA</h1>
            <div className="fac-num">Nº {p.facturaNum}</div>
            <div className="fac-num">Fecha: {fecha}</div>
          </div>
        </div>

        {/* Datos */}
        <div className="fac-grid">
          <div className="fac-bloque">
            <label>FACTURAR A / SHIPPER</label>
            <div className="nombre">{upper(p.remitente)}</div>
            {p.remitenteTel && <div className="linea">Tel: {p.remitenteTel}</div>}
          </div>
          <div className="fac-bloque">
            <label>CONSIGNATARIO</label>
            <div className="nombre">{upper(p.destinatario)}</div>
            {p.consignatarioCarnet && <div className="linea">CI: {upper(p.consignatarioCarnet)}</div>}
            {p.consignatarioTel && <div className="linea">Tel: {p.consignatarioTel}</div>}
            <div className="linea">{upper(dirDest)}</div>
          </div>
        </div>

        {/* Tabla */}
        <table className="fac-tabla">
          <thead>
            <tr>
              <th>Descripción</th>
              <th style={{ textAlign: "center" }}>Bultos</th>
              <th style={{ textAlign: "center" }}>Peso (kg)</th>
              <th style={{ textAlign: "right" }}>Tarifa/lb</th>
              <th style={{ textAlign: "right" }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{upper(p.contenido)} · Envío {p.codigo}</td>
              <td style={{ textAlign: "center" }}>{p.piezas}</td>
              <td style={{ textAlign: "center" }}>{p.pesoKg.toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>${p.tarifa.toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>${p.monto.toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: "right" }}>TOTAL</td>
              <td style={{ textAlign: "right" }}>${p.monto.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Total destacado */}
        <div className="fac-totales">
          <div className="fac-total-box">
            <label>TOTAL A PAGAR</label>
            <div className="monto">${p.monto.toFixed(2)} USD</div>
          </div>
        </div>

        {/* Firmas */}
        <div className="fac-footer">
          <div className="fac-firma">
            <div className="fac-firma-linea"></div>
            <small>Cliente / Shipper</small>
          </div>
          <div className="fac-firma">
            <div className="fac-firma-linea"></div>
            <small>{upper(p.agenciaNombre) || "Agencia"}</small>
          </div>
          <div className="fac-firma">
            <div className="fac-firma-linea"></div>
            <small>Recibido</small>
          </div>
        </div>
      </div>
    </>
  );
}
