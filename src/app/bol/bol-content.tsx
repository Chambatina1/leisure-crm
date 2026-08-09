"use client";

// ════════════════════════════════════════════════════════════════════════════
// bol-content — Client Component para el Bill of Lading.
// Separado de page.tsx (Server Component) porque usa window.print() en onClick.
// Si esto viviera en el Server Component, el build/runtime tira error de
// hidratación (500) porque "window" no existe en el servidor.
// ════════════════════════════════════════════════════════════════════════════

interface PaqueteBOL {
  codigo: string;
  remitente: string;
  destinatario: string;
  consignatarioCarnet?: string | null;
  consignatarioCalle?: string | null;
  consignatarioMunicipio?: string | null;
  consignatarioProvincia?: string | null;
  peso: number;
  pesoKg?: number | null;
  piezas: number;
}

export default function BOLContent({
  fecha, dbError, paquetes, totalLb, totalKg, totalPiezas,
}: {
  fecha: string;
  dbError: string | null;
  paquetes: PaqueteBOL[];
  totalLb: number;
  totalKg: number;
  totalPiezas: number;
}) {
  return (
    <>
      <div className="no-print toolbar">
        <button onClick={() => window.print()}>Imprimir BOL</button>
        <a href="/nuevo-paquete" className="btn-link">Nuevo envío</a>
        <a href="/" className="btn-link">Inicio</a>
      </div>

      {dbError ? (
        <div className="bol">
          <h2 style={{ color: "#C23B22" }}>Cargando el BOL…</h2>
          <p style={{ color: "#6b7280" }}>La base de datos está inicializándose. Recargá la página en unos segundos.</p>
          <p style={{ color: "#999", fontSize: 12 }}>{dbError}</p>
        </div>
      ) : (
        <div className="bol">
          {/* Encabezado */}
          <div className="bol-header">
            <div className="bol-marca">
              <div className="bol-barco">LE</div>
              <div>
                <strong>GRUPO EMPRESARIAL</strong>
                <small>6800 N Ave, Tampa FL 33604 · +1 727-598-6802</small>
                <div className="bol-grupo-logos">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/chambatina.png" alt="Chambatina" style={{ maxHeight: 26, maxWidth: 70, background: "#fff", borderRadius: 4, padding: "2px 6px" }} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/servitravel.png" alt="ServiTravels" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/mdl-travel.png" alt="MDL Travel" />
                </div>
              </div>
            </div>
            <div className="bol-titulo">
              <h1>BILL OF LADING</h1>
              <div className="bol-fecha">Date: {fecha}</div>
              <div className="bol-k">TYPE: <span>K</span></div>
            </div>
          </div>

          {/* Ruta */}
          <div className="bol-ruta">
            <div><small>ORIGIN:</small> Tampa, FL, USA</div>
            <div className="bol-flecha">&rarr;</div>
            <div><small>DESTINATION:</small> Cuba</div>
          </div>

          {/* Resumen */}
          <div className="bol-resumen">
            <div><b>{paquetes.length}</b><span>Packages</span></div>
            <div><b>{totalPiezas}</b><span>Pieces</span></div>
            <div><b>{totalLb.toFixed(1)} lb</b><span>Total weight</span></div>
            <div><b>{totalKg.toFixed(2)} kg</b><span>Peso total</span></div>
          </div>

          {/* Tabla */}
          <table className="bol-tabla">
            <thead>
              <tr>
                <th>#</th>
                <th>Tracking</th>
                <th>Shipper</th>
                <th>Consignee</th>
                <th>Destino (Cuba)</th>
                <th>W (lb)</th>
                <th>Peso (kg)</th>
                <th>Pcs</th>
              </tr>
            </thead>
            <tbody>
              {paquetes.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 30 }}>No hay paquetes pendientes de embarque.</td></tr>
              ) : paquetes.map((p, i) => {
                const dir = [p.consignatarioMunicipio, p.consignatarioProvincia].filter(Boolean).join(", ");
                const pesoNum = Number(p.peso) || 0;
                const kg = p.pesoKg ? Number(p.pesoKg) : pesoNum * 0.453592;
                return (
                  <tr key={p.codigo}>
                    <td>{i + 1}</td>
                    <td className="mono"><b>{p.codigo}</b></td>
                    <td>{p.remitente || "—"}</td>
                    <td>{p.destinatario || "—"}<br /><small>{p.consignatarioCarnet || ""}</small></td>
                    <td>{dir || "Cuba"}<br /><small>{p.consignatarioCalle || ""}</small></td>
                    <td className="num">{pesoNum}</td>
                    <td className="num">{kg.toFixed(2)}</td>
                    <td className="num">{Number(p.piezas) || 1}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} style={{ textAlign: "right" }}><b>TOTALES</b></td>
                <td className="num"><b>{totalLb.toFixed(1)}</b></td>
                <td className="num"><b>{totalKg.toFixed(2)}</b></td>
                <td className="num"><b>{totalPiezas}</b></td>
              </tr>
            </tfoot>
          </table>

          {/* Firmas */}
          <div className="bol-firmas">
            <div className="bol-firma"><div className="bol-linea"></div><small>Shipper / Remitente</small></div>
            <div className="bol-firma"><div className="bol-linea"></div><small>Carrier / Transportista</small></div>
            <div className="bol-firma"><div className="bol-linea"></div><small>Received by / Recibido por</small></div>
          </div>

          <div className="bol-footer">
            Grupo Empresarial · +1 727-598-6802
          </div>

          {/* Aviso de desarrollo — no se imprime */}
          <div className="bol-dev no-print">
            <div className="bol-dev-head">EN DESARROLLO</div>
            <p className="bol-dev-sub">Este documento es una vista previa. La versión final incluirá:</p>
            <ul className="bol-dev-list">
              <li><strong>Sistema contable central</strong> — registro automático de cada envío (ingresos, costos, utilidad) en el libro mayor de la agencia que lo genera.</li>
              <li><strong>Reportes por compañía</strong> — estados financieros y reportes de embarque de cada agencia principal y subagencia, con su logo y totales propios.</li>
              <li><strong>Consolidación matriz</strong> — el administrador verá el BOL consolidado de todas las agencias y el desglose por cada una.</li>
            </ul>
            <p className="bol-dev-foot">Mientras tanto, este manifiesto es funcional y se puede imprimir.</p>
          </div>
        </div>
      )}
    </>
  );
}
