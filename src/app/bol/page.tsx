import { db } from "@/lib/db";

// ════════════════════════════════════════════════════════════════════════════
// /bol — Bill of Lading (documento de carga / manifiesto).
// Lista todos los paquetes pendientes de embarque (no entregados) con totales
// de peso y piezas. Imprimible.
// Acceso público (para el chofer / recepción en destino).
// ════════════════════════════════════════════════════════════════════════════
export const dynamic = "force-dynamic";

export default async function BOLPage() {
  const paquetes = await db.paquete.findMany({
    where: { estado: { not: "entregado" } },
    orderBy: { codigo: "asc" },
    include: { agencia: true },
  });

  const totalLb = paquetes.reduce((s, p) => s + (Number(p.peso) || 0), 0);
  const totalKg = paquetes.reduce((s, p) => s + (Number(p.pesoKg ?? p.peso * 0.453592) || 0), 0);
  const totalPiezas = paquetes.reduce((s, p) => s + (Number(p.piezas) || 0), 0);
  const fecha = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Bill of Lading</title>
        <style dangerouslySetInnerHTML={{ __html: BOL_CSS }} />
      </head>
      <body>
        <div className="no-print toolbar">
          <button onClick={() => window.print()}>🖨️ Imprimir BOL</button>
          <a href="/nuevo-paquete" className="btn-link">➕ Nuevo envío</a>
          <a href="/" className="btn-link">← Inicio</a>
        </div>

        <div className="bol">
          {/* Encabezado */}
          <div className="bol-header">
            <div className="bol-marca">
              <div className="bol-barco">🚢</div>
              <div>
                <strong>LEISURE EXPORTING LLC</strong>
                <small>6800 N Ave, Tampa FL 33604 · +1 727-598-6802</small>
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
            <div className="bol-flecha">✈️ ➡️ 🇨🇺</div>
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
                return (
                  <tr key={p.codigo}>
                    <td>{i + 1}</td>
                    <td className="mono"><b>{p.codigo}</b></td>
                    <td>{p.remitente}</td>
                    <td>{p.destinatario}<br/><small>{p.consignatarioCarnet}</small></td>
                    <td>{dir}<br/><small>{p.consignatarioCalle}</small></td>
                    <td className="num">{p.peso}</td>
                    <td className="num">{(p.pesoKg ?? p.peso * 0.453592).toFixed(2)}</td>
                    <td className="num">{p.piezas}</td>
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
            Leisure Exporting LLC · sales@leisureexportingllc.com · leisureexportingllc.com
          </div>
        </div>
      </body>
    </html>
  );
}

const BOL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #f0f0f0; color: #1f2937; }
  .toolbar { display: flex; gap: 10px; padding: 14px; justify-content: center; background: #fff; border-bottom: 1px solid #ccc; }
  .toolbar button, .toolbar .btn-link { padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; text-decoration: none; background: #C23B22; color: #fff; border: none; font-size: .9rem; }
  .toolbar .btn-link { background: #6b7280; }

  .bol { max-width: 800px; margin: 20px auto; background: #fff; padding: 28px; }
  .bol-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #C23B22; padding-bottom: 12px; margin-bottom: 14px; }
  .bol-marca { display: flex; align-items: center; gap: 10px; }
  .bol-barco { font-size: 30px; }
  .bol-marca strong { display: block; font-size: 16px; color: #C23B22; }
  .bol-marca small { font-size: 10px; color: #666; }
  .bol-titulo { text-align: right; }
  .bol-titulo h1 { font-size: 22px; color: #1f2937; letter-spacing: 1px; }
  .bol-fecha { font-size: 11px; color: #666; }
  .bol-k { font-size: 12px; margin-top: 4px; }
  .bol-k span { background: #C23B22; color: #fff; padding: 2px 10px; border-radius: 4px; font-weight: 900; }

  .bol-ruta { display: flex; justify-content: space-between; align-items: center; background: #f9fafb; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 12px; }
  .bol-ruta small { display: block; color: #6b7280; font-size: 9px; text-transform: uppercase; }
  .bol-flecha { font-size: 18px; }

  .bol-resumen { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
  .bol-resumen > div { background: #fef3c7; padding: 10px; border-radius: 8px; text-align: center; }
  .bol-resumen b { display: block; font-size: 18px; color: #C23B22; }
  .bol-resumen span { font-size: 10px; color: #666; }

  .bol-tabla { width: 100%; border-collapse: collapse; font-size: 11px; }
  .bol-tabla th { background: #1f2937; color: #fff; padding: 8px; text-align: left; font-size: 9px; text-transform: uppercase; }
  .bol-tabla td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  .bol-tabla small { color: #6b7280; font-size: 9px; }
  .bol-tabla .mono { font-family: "Courier New", monospace; }
  .bol-tabla .num { text-align: right; font-family: "Courier New", monospace; }
  .bol-tabla tfoot td { border-top: 2px solid #1f2937; background: #f9fafb; }

  .bol-firmas { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-top: 40px; }
  .bol-firma { text-align: center; }
  .bol-linea { border-top: 1px solid #1f2937; margin-bottom: 6px; height: 30px; }
  .bol-firma small { font-size: 10px; color: #6b7280; }

  .bol-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #6b7280; }

  @media print {
    body { background: #fff; }
    .toolbar { display: none !important; }
    .bol { margin: 0; max-width: 100%; padding: 10px; }
    @page { size: A4; margin: 12mm; }
  }
`;
