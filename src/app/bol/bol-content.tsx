"use client";

// ════════════════════════════════════════════════════════════════════════════
// bol-content — Client Component para el Manifiesto de Carga.
// Formato profesional estilo solvecargo: tabla completa con todas las columnas
// del sector, orientación A4 horizontal (landscape), firmas, totales.
// ════════════════════════════════════════════════════════════════════════════

interface PaqueteBOL {
  codigo: string;
  remitente: string;
  destinatario: string;
  consignatarioCarnet?: string | null;
  consignatarioTel?: string | null;
  consignatarioCalle?: string | null;
  consignatarioMunicipio?: string | null;
  consignatarioProvincia?: string | null;
  peso: number;
  pesoKg?: number | null;
  piezas: number;
  contenido?: string | null;
  categoria?: string | null;
  valor?: number | null;
  estado?: string | null;
}

export default function BOLContent({
  fecha, dbError, paquetes, totalLb, totalKg, totalPiezas, brands = [],
}: {
  fecha: string;
  dbError: string | null;
  paquetes: PaqueteBOL[];
  totalLb: number;
  totalKg: number;
  totalPiezas: number;
  brands?: { nombre: string; logo: string }[];
}) {
  return (
    <>
      <div className="no-print toolbar">
        <button onClick={() => window.print()}>Imprimir manifiesto</button>
        <a href="/nuevo-paquete" className="btn-link">Nuevo envío</a>
        <a href="/" className="btn-link">Inicio</a>
      </div>

      {dbError ? (
        <div className="bol">
          <h2 style={{ color: "#C23B22" }}>Cargando el manifiesto…</h2>
          <p style={{ color: "#6b7280" }}>La base de datos está inicializándose. Recargá la página en unos segundos.</p>
        </div>
      ) : (
        <div className="bol">
          {/* Encabezado */}
          <div className="bol-header">
            <div className="bol-marca">
              {brands.length > 0 ? (
                <div className="bol-grupo-logos">
                  {brands.map(b => (
                    <img key={b.nombre} src={b.logo} alt={b.nombre} style={{ maxHeight: 36, maxWidth: 100, background: "#fff", borderRadius: 4, padding: "3px 8px", objectFit: "contain" }} />
                  ))}
                </div>
              ) : (
                <div className="bol-barco">GE</div>
              )}
              <div>
                <strong>GRUPO EMPRESARIAL</strong>
                <small>Envíos, exportación y logística · +1 727-598-6802</small>
              </div>
            </div>
            <div className="bol-titulo">
              <h1>MANIFIESTO DE CARGA</h1>
              <div className="bol-fecha">Fecha: {fecha}</div>
              <div className="bol-k">TIPO: <span>K</span></div>
            </div>
          </div>

          {/* Datos del embarque */}
          <div className="bol-embarque">
            <div><label>ORIGEN</label><b>Tampa, FL, USA</b></div>
            <div><label>DESTINO</label><b>La Habana, Cuba</b></div>
            <div><label>TIPO DE ENVÍO</label><b>Marítimo · Contenedor</b></div>
            <div><label>MANIFIESTO Nº</label><b>MAN-{new Date().getFullYear()}-{String(Date.now()).slice(-4)}</b></div>
          </div>

          {/* Resumen */}
          <div className="bol-resumen">
            <div><b>{paquetes.length}</b><span>Bultos</span></div>
            <div><b>{totalPiezas}</b><span>Piezas</span></div>
            <div><b>{totalLb.toFixed(1)}</b><span>Total lb</span></div>
            <div><b>{totalKg.toFixed(2)}</b><span>Total kg</span></div>
          </div>

          {/* Tabla principal del manifiesto */}
          <table className="bol-tabla">
            <thead>
              <tr>
                <th className="col-n">Nº</th>
                <th className="col-track">TRACKING</th>
                <th>EMBARCADOR</th>
                <th>CONSIGNATARIO</th>
                <th className="col-ci">CI / CARNE</th>
                <th className="col-tel">TELÉFONO</th>
                <th className="col-dir">DIRECCIÓN DESTINO</th>
                <th className="col-prov">PROVINCIA</th>
                <th className="col-cont">CONTENIDO</th>
                <th className="col-num">PCS</th>
                <th className="col-num">PESO LB</th>
                <th className="col-num">PESO KG</th>
              </tr>
            </thead>
            <tbody>
              {paquetes.length === 0 ? (
                <tr><td colSpan={12} style={{ textAlign: "center", padding: 30 }}>No hay paquetes pendientes de embarque.</td></tr>
              ) : paquetes.map((p, i) => {
                const dir = [p.consignatarioCalle, p.consignatarioMunicipio].filter(Boolean).join(", ");
                const pesoNum = Number(p.peso) || 0;
                const kg = p.pesoKg ? Number(p.pesoKg) : pesoNum * 0.453592;
                const contenido = [p.contenido, p.categoria].filter(Boolean).join(" · ");
                return (
                  <tr key={p.codigo}>
                    <td className="col-n">{i + 1}</td>
                    <td className="mono col-track"><b>{p.codigo}</b></td>
                    <td>{(p.remitente || "—").toUpperCase()}</td>
                    <td>{(p.destinatario || "—").toUpperCase()}</td>
                    <td className="col-ci">{p.consignatarioCarnet || "—"}</td>
                    <td className="col-tel">{p.consignatarioTel || "—"}</td>
                    <td className="col-dir">{dir ? dir.toUpperCase() : "—"}</td>
                    <td className="col-prov">{(p.consignatarioProvincia || "—").toUpperCase()}</td>
                    <td className="col-cont">{contenido ? contenido.toUpperCase() : "—"}</td>
                    <td className="num col-num">{Number(p.piezas) || 1}</td>
                    <td className="num col-num">{pesoNum.toFixed(1)}</td>
                    <td className="num col-num">{kg.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={9} style={{ textAlign: "right" }}><b>TOTALES</b></td>
                <td className="num"><b>{totalPiezas}</b></td>
                <td className="num"><b>{totalLb.toFixed(1)}</b></td>
                <td className="num"><b>{totalKg.toFixed(2)}</b></td>
              </tr>
            </tfoot>
          </table>

          {/* Firmas */}
          <div className="bol-firmas">
            <div className="bol-firma"><div className="bol-linea"></div><small>Embarcador / Shipper</small></div>
            <div className="bol-firma"><div className="bol-linea"></div><small>Transportista / Carrier</small></div>
            <div className="bol-firma"><div className="bol-linea"></div><small>Aduana / Customs</small></div>
            <div className="bol-firma"><div className="bol-linea"></div><small>Recibido por</small></div>
          </div>

          <div className="bol-footer">
            Grupo Empresarial · +1 727-598-6802 · info@grupo-empresarial.com
          </div>
        </div>
      )}
    </>
  );
}
