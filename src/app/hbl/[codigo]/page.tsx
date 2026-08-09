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
  body { font-family: Arial, sans-serif; background: #e8e8e8; color: #1a1a1a; font-size: 10px; }
  .hbl-toolbar { display: flex; gap: 10px; padding: 12px; justify-content: center; background: #fff; border-bottom: 1px solid #ccc; }
  .hbl-toolbar button, .hbl-toolbar a { padding: 9px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; text-decoration: none; background: #C23B22; color: #fff; border: none; font-size: .85rem; }
  .hbl-toolbar a { background: #374151; }

  .hbl { width: 210mm; min-height: 297mm; margin: 16px auto; padding: 15mm 14mm; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.1); }

  /* Header */
  .hbl-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #C23B22; padding-bottom: 8px; margin-bottom: 10px; }
  .hbl-header-left strong { font-size: 16px; color: #C23B22; display: block; letter-spacing: .5px; }
  .hbl-header-left small { font-size: 9px; color: #555; }
  .hbl-grupo-logos { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
  .hbl-grupo-logos img { max-height: 32px; max-width: 90px; width: auto; height: auto; object-fit: contain; }
  .hbl-header-right { text-align: right; }
  .hbl-doc-title { font-size: 14px; font-weight: 900; letter-spacing: 1px; }
  .hbl-doc-num { font-size: 12px; font-weight: 700; margin-top: 2px; }

  /* Sección Shipper / Consignee / Notify */
  .hbl-partes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
  .hbl-parte { border: 1px solid #999; padding: 8px; }
  .hbl-parte-full { grid-column: 1 / -1; }
  .hbl-parte label { font-size: 8px; font-weight: 800; color: #C23B22; text-transform: uppercase; letter-spacing: .5px; display: block; margin-bottom: 3px; border-bottom: 1px solid #ddd; padding-bottom: 2px; }
  .hbl-parte .nombre { font-size: 11px; font-weight: 800; margin-bottom: 2px; }
  .hbl-parte .linea { font-size: 9px; line-height: 1.5; color: #333; }

  /* Detalles del envío */
  .hbl-detalles { border: 1px solid #999; margin-bottom: 10px; }
  .hbl-detalles-row { display: grid; grid-template-columns: repeat(4, 1fr); }
  .hbl-detalle { padding: 6px 8px; border-right: 1px solid #ddd; border-bottom: 1px solid #ddd; }
  .hbl-detalle:nth-child(4n) { border-right: none; }
  .hbl-detalle label { font-size: 7px; font-weight: 800; color: #C23B22; text-transform: uppercase; display: block; }
  .hbl-detalle .val { font-size: 10px; font-weight: 700; }

  /* Tabla de mercancía */
  .hbl-mercancia { margin-bottom: 12px; }
  .hbl-mercancia-title { font-size: 9px; font-weight: 800; color: #C23B22; text-transform: uppercase; margin-bottom: 4px; }
  .hbl-tabla { width: 100%; border-collapse: collapse; }
  .hbl-tabla th { background: #1a1a1a; color: #fff; font-size: 8px; padding: 5px; text-align: left; text-transform: uppercase; letter-spacing: .5px; }
  .hbl-tabla td { border: 1px solid #ccc; padding: 5px; font-size: 9px; }
  .hbl-tabla tfoot td { background: #f5f5f5; font-weight: 800; border-top: 2px solid #1a1a1a; }

  /* Términos */
  .hbl-terminos { font-size: 8px; color: #666; line-height: 1.6; border: 1px solid #ddd; padding: 8px; margin-bottom: 12px; }

  /* Firmas */
  .hbl-firmas { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-top: 30px; }
  .hbl-firma { text-align: center; }
  .hbl-firma-linea { border-top: 1px solid #333; margin-bottom: 4px; height: 35px; }
  .hbl-firma small { font-size: 8px; color: #555; }

  /* Footer */
  .hbl-footer { margin-top: 16px; padding-top: 6px; border-top: 2px solid #C23B22; text-align: center; font-size: 8px; color: #666; }

  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
    .hbl { box-shadow: none; margin: 0; width: 100%; min-height: auto; padding: 10mm; }
    @page { size: A4; margin: 8mm; }
  }
`;
