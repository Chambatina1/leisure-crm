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
  body { font-family: Arial, sans-serif; background: #e8e8e8; color: #000; font-size: 9px; }
  .hbl-toolbar { display: flex; gap: 10px; padding: 12px; justify-content: center; background: #fff; border-bottom: 1px solid #ccc; }
  .hbl-toolbar button, .hbl-toolbar a { padding: 9px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; text-decoration: none; background: #C23B22; color: #fff; border: none; font-size: .85rem; }
  .hbl-toolbar a { background: #374151; }

  /* Página A4 con 3 copias del HBL */
  .hbl-pagina { width: 210mm; margin: 16px auto; padding: 8mm; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.1); }

  /* Cada bloque HBL (1/3 de la hoja) */
  .hbl-bloque { border: 1px solid #000; padding: 6px 8px; position: relative; }
  .hbl-copia-tag { position: absolute; top: -8px; right: 8px; background: #C23B22; color: #fff; font-size: 7px; font-weight: 800; padding: 2px 8px; border-radius: 3px; letter-spacing: .5px; }

  /* Línea de corte entre copias */
  .hbl-corte { text-align: center; color: #999; font-size: 10px; margin: 8px 0; letter-spacing: 2px; border-top: 1px dashed #999; border-bottom: 1px dashed #999; padding: 4px 0; }

  /* Fila superior */
  .hbl-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; }
  .hbl-forwarding { flex: 1; }
  .hbl-forwarding label, .hbl-block-field label, .hbl-dato label, .hbl-foot-box label { font-size: 6px; font-weight: 800; color: #C23B22; text-transform: uppercase; letter-spacing: .3px; }
  .hbl-agent-name { font-size: 10px; font-weight: 800; margin-top: 1px; }
  .hbl-grupo-logos { display: flex; align-items: center; gap: 4px; margin-top: 4px; flex-wrap: wrap; }
  .hbl-grupo-logos img { max-height: 20px; max-width: 60px; width: auto; height: auto; object-fit: contain; background: #fff; border-radius: 2px; padding: 1px 3px; }

  .hbl-title-area { text-align: right; }
  .hbl-title { font-size: 10px; font-weight: 900; letter-spacing: .5px; border-bottom: 2px solid #000; padding-bottom: 2px; }
  .hbl-num { margin-top: 3px; font-size: 9px; }
  .hbl-num label { font-size: 8px; color: #C23B22; font-weight: 800; }
  .hbl-num b { font-size: 11px; font-family: "Courier New", monospace; }

  /* Bloques de 2 columnas */
  .hbl-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 4px; }
  .hbl-block-field { border: 1px solid #000; padding: 4px 6px; }
  .hbl-block-field label { display: block; margin-bottom: 1px; border-bottom: 1px solid #ddd; padding-bottom: 1px; }
  .hbl-val { font-size: 10px; font-weight: 700; }
  .hbl-sub { font-size: 8px; color: #333; line-height: 1.3; margin-top: 1px; }

  /* Datos consignatario */
  .hbl-datos { display: grid; grid-template-columns: auto 2fr 1fr 1fr; gap: 3px; margin-bottom: 4px; }
  .hbl-dato { border: 1px solid #000; padding: 3px 6px; }
  .hbl-dato label { margin-right: 3px; }
  .hbl-dato span { font-size: 9px; }

  /* Tabla */
  .hbl-tabla { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  .hbl-tabla th { background: #1f2937; color: #fff; font-size: 7px; padding: 3px; text-align: left; text-transform: uppercase; border: 1px solid #1f2937; }
  .hbl-tabla td { border: 1px solid #000; padding: 3px; font-size: 9px; vertical-align: top; }
  .hbl-tabla .mono { font-family: "Courier New", monospace; font-weight: 700; }
  .hbl-tabla .num { text-align: right; font-family: "Courier New", monospace; }
  .col-marks { width: 90px; }
  .col-pack { width: 40px; text-align: center; }
  .col-gw { width: 55px; }
  .col-m3 { width: 50px; }

  /* Casillas inferiores */
  .hbl-footer-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; margin-top: 5px; }
  .hbl-foot-box { border: 1px solid #000; padding: 4px; text-align: center; min-height: 28px; display: flex; flex-direction: column; justify-content: center; }
  .hbl-foot-val { font-size: 9px; font-weight: 700; margin-top: 1px; }
  .hbl-foot-line { border-top: 1px solid #000; margin-top: 8px; }

  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
    .hbl-pagina { box-shadow: none; margin: 0; width: 100%; padding: 5mm; }
    @page { size: A4; margin: 5mm; }
  }
`;
