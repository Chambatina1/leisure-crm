import { db } from "@/lib/db";
import HblContent from "./hbl-content";

// ════════════════════════════════════════════════════════════════════════════
// /hbl/[codigo] — House Bill of Lading (HBL) por paquete.
// Documento A4 estilo solvecargo: encabezado del transportista, shipper,
// consignee, notify, vessel/port, descripción de mercancía, firmas.
// ════════════════════════════════════════════════════════════════════════════
export const dynamic = "force-dynamic";

export default async function HblPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cod = codigo.toUpperCase().replace(/[^A-Z0-9-]/g, "");

  let p;
  try {
    p = await db.paquete.findUnique({
      where: { codigo: cod },
      include: { agencia: { select: { nombre: true, direccion: true, ciudad: true, pais: true } } },
    });
  } catch {
    p = null;
  }

  if (!p) {
    return (
      <html>
        <body style={{ padding: 40, fontFamily: "Arial", textAlign: "center" }}>
          <h2>HBL no encontrado</h2>
          <p>El código <b>{cod}</b> no existe.</p>
          <a href="/">Volver</a>
        </body>
      </html>
    );
  }

  const data = {
    codigo: p.codigo,
    hawb: p.hawb || p.codigo,
    remitente: p.remitente,
    remitenteCarnet: p.remitenteCarnet,
    remitenteTel: p.remitenteTel,
    remitenteDir: p.remitenteDir,
    destinatario: p.destinatario,
    consignatarioCarnet: p.consignatarioCarnet,
    consignatarioTel: p.consignatarioTel,
    consignatarioCalle: p.consignatarioCalle,
    consignatarioEntre: p.consignatarioEntre,
    consignatarioMunicipio: p.consignatarioMunicipio,
    consignatarioProvincia: p.consignatarioProvincia,
    peso: p.peso,
    pesoKg: p.pesoKg ?? Number(p.peso) * 0.453592,
    piezas: p.piezas,
    contenido: p.contenido,
    categoria: p.categoria,
    creado: p.creado,
    agenciaNombre: p.agencia?.nombre ?? undefined,
    agenciaDir: p.agencia?.direccion ?? undefined,
    agenciaCiudad: p.agencia?.ciudad ?? undefined,
    agenciaPais: p.agencia?.pais ?? undefined,
  };

  // Cargar brands activos
  let brands: { nombre: string; logo: string }[] = [];
  try {
    brands = await db.brand.findMany({ where: { activo: true }, orderBy: { orden: "asc" }, select: { nombre: true, logo: true } });
  } catch {}

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>HBL {cod}</title>
        <style dangerouslySetInnerHTML={{ __html: HBL_CSS }} />
      </head>
      <body>
        <HblContent p={data} brands={brands} />
      </body>
    </html>
  );
}

const HBL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Helvetica, Arial, sans-serif; font-size: 9pt; color: #111; background: #eee; }

  .hbl-toolbar { display: flex; gap: 10px; padding: 12px; justify-content: center; background: #fff; border-bottom: 1px solid #ccc; }
  .hbl-toolbar button, .hbl-toolbar a { padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; text-decoration: none; background: #C23B22; color: #fff; border: none; font-size: 14px; }
  .hbl-toolbar a { background: #374151; }

  .hbl-doc { width: 210mm; max-width: 100%; margin: 16px auto; padding: 8mm; background: #fff; }

  .hbl-table { border-collapse: collapse; width: 100%; margin-bottom: 0; }
  .hbl-table td { vertical-align: top; }

  .hbl-box { border: 1px solid #000; padding: 4px; }
  .hbl-label { font-size: 7pt; font-weight: bold; color: #333; }
  .hbl-value { font-size: 9pt; font-weight: bold; }
  .hbl-center { text-align: center; }
  .hbl-gray { background-color: #eee; }

  .hbl-title { font-size: 19pt; font-weight: bold; }
  .hbl-big-num { font-size: 15pt; font-weight: bold; }
  .hbl-small { font-size: 7pt; color: #555; }

  .hbl-logos { display: flex; gap: 8px; flex-wrap: wrap; }
  .hbl-logos img { max-height: 50px; max-width: 120px; object-fit: contain; }
  .hbl-fake-logo { font-weight: bold; }
  .hbl-brand { font-size: 18pt; color: #123d7a; }
  .hbl-intl { font-size: 10pt; color: #234979; }

  .hbl-company { line-height: 1.4; font-size: 9pt; }

  .hbl-barcode { text-align: center; margin-top: 10px; }
  .hbl-barcode-canvas { display: inline-block; }
  .hbl-barcode-canvas canvas { width: 300px !important; height: 40px !important; }

  @media print {
    @page { size: LETTER; margin: 8mm; }
    body { background: white; padding: 0; }
    .no-print, .hbl-toolbar { display: none !important; }
    .hbl-doc { box-shadow: none; margin: 0; width: 100%; padding: 0; }
  }
`;
