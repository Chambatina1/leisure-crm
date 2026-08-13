"use client";

// ════════════════════════════════════════════════════════════════════════════
// bol-content — Manifiesto de Carga. Réplica EXACTA de solvecargo.
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
  creado: string | Date;
}

const upper = (s?: string | null) => (s || "").toUpperCase();

export default function BOLContent({
  fecha, dbError, paquetes, brands = [],
}: {
  fecha: string;
  dbError: string | null;
  paquetes: PaqueteBOL[];
  brands?: { nombre: string; logo: string }[];
}) {
  const totalBultos = paquetes.reduce((s, p) => s + (Number(p.piezas) || 0), 0);
  const totalPeso = paquetes.reduce((s, p) => s + (Number(p.pesoKg ?? Number(p.peso) * 0.453592) || 0), 0);

  return (
    <>
      <div className="no-print manifest-controls">
        <button onClick={() => window.print()}>Imprimir manifiesto</button>
        <a href="/nuevo-paquete">Nuevo envío</a>
        <a href="/">Inicio</a>
      </div>

      {dbError ? (
        <div className="manifest">
          <h2>Cargando el manifiesto…</h2>
          <p>Recargá la página en unos segundos.</p>
        </div>
      ) : (
        <div className="manifest">
          {/* CABECERA */}
          <section className="title-area">
            <h1 className="main-title">RESUMEN DE MERCANCIAS</h1>
            <div className="subtitle">MANIFIESTO: ENVIOS FACTURADOS</div>

            {/* LOGO */}
            <div className="logo-box">
              {brands.length > 0 ? (
                brands.map(b => (
                  <img key={b.nombre} src={b.logo} alt={b.nombre} />
                ))
              ) : (
                <strong>LOGO</strong>
              )}
            </div>

            {/* EMPRESA */}
            <div className="company-info">
              <div className="company-name">CHAMBATINA</div>
              <div>Envíos, exportación y logística</div>
              <div>+1 727-598-6802 · info@chambatina.com</div>
              <div>Fecha: {fecha}</div>
            </div>
          </section>

          {/* TABLA */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th className="col-no">No</th>
                  <th className="col-invoice">Número de Factura</th>
                  <th className="col-delivery">Tipo de Entrega</th>
                  <th className="col-shipper">Shipper</th>
                  <th className="col-consignee">Consignee</th>
                  <th className="col-id">ID</th>
                  <th className="col-address">Consignee Address</th>
                  <th className="col-phone">Teléfono</th>
                  <th className="col-boxes"># Bultos</th>
                  <th className="col-weight">Peso (Kgs)</th>
                  <th className="col-description">Descripción</th>
                  <th className="col-date">Fecha reserva</th>
                  <th className="col-pallet">Pallet</th>
                </tr>
              </thead>
              <tbody>
                {paquetes.length === 0 ? (
                  <tr><td colSpan={13} style={{ textAlign: "center", padding: 40 }}>No hay envíos pendientes de embarque.</td></tr>
                ) : paquetes.map((p, i) => {
                  const pesoKg = p.pesoKg ? Number(p.pesoKg) : Number(p.peso) * 0.453592;
                  const dir = [p.consignatarioCalle, p.consignatarioMunicipio, p.consignatarioProvincia].filter(Boolean).join(", ");
                  const fechaCorta = new Date(p.creado).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
                  return (
                    <tr key={p.codigo}>
                      <td className="row-number">{i + 1}</td>
                      <td className="invoice-number">{p.codigo}</td>
                      <td>ENVIO</td>
                      <td className="shipper">{upper(p.remitente)}</td>
                      <td className="consignee">{upper(p.destinatario)}</td>
                      <td>{upper(p.consignatarioCarnet) || "—"}</td>
                      <td className="address">{upper(dir)}</td>
                      <td>{p.consignatarioTel || "—"}</td>
                      <td>{Number(p.piezas) || 1}</td>
                      <td>{pesoKg.toFixed(2)}</td>
                      <td className="description">{upper(p.contenido)}</td>
                      <td>{fechaCorta}</td>
                      <td>—</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* RESUMEN */}
          <div className="summary">
            <div>TOTAL BULTOS: {totalBultos}</div>
            <div>PESO TOTAL: {totalPeso.toFixed(2)} Kg</div>
          </div>
        </div>
      )}
    </>
  );
}
