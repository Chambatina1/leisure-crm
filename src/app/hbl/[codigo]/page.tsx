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
  body { font-family: Arial, sans-serif; background: #e8e8e8; color: #000; font-size: 10px; }
  .hbl-toolbar { display: flex; gap: 10px; padding: 12px; justify-content: center; background: #fff; border-bottom: 1px solid #ccc; }
  .hbl-toolbar button, .hbl-toolbar a { padding: 9px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; text-decoration: none; background: #C23B22; color: #fff; border: none; font-size: .85rem; }
  .hbl-toolbar a { background: #374151; }

  .hbl { width: 210mm; min-height: 120mm; margin: 16px auto; padding: 10mm; background: #fff; border: 1px solid #000; box-shadow: 0 2px 12px rgba(0,0,0,.1); }

  /* Fila superior: Forwarding Agent + Título */
  .hbl-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .hbl-forwarding { flex: 1; }
  .hbl-forwarding label { font-size: 7px; font-weight: 800; color: #C23B22; text-transform: uppercase; letter-spacing: .5px; }
  .hbl-agent-name { font-size: 12px; font-weight: 800; color: #000; margin-top: 2px; }
  .hbl-grupo-logos { display: flex; align-items: center; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
  .hbl-grupo-logos img { max-height: 28px; max-width: 80px; width: auto; height: auto; object-fit: contain; background: #fff; border-radius: 3px; padding: 1px 4px; }

  .hbl-title-area { text-align: right; }
  .hbl-title { font-size: 13px; font-weight: 900; letter-spacing: .8px; border-bottom: 2px solid #000; padding-bottom: 3px; }
  .hbl-num { margin-top: 4px; font-size: 11px; }
  .hbl-num label { font-size: 9px; color: #C23B22; font-weight: 800; }
  .hbl-num b { font-size: 13px; font-family: "Courier New", monospace; }

  /* Bloques de 2 columnas */
  .hbl-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px; }
  .hbl-block { border: 1px solid #000; padding: 6px 8px; }
  .hbl-block label { font-size: 7px; font-weight: 800; color: #C23B22; text-transform: uppercase; letter-spacing: .5px; display: block; margin-bottom: 2px; border-bottom: 1px solid #ddd; padding-bottom: 2px; }
  .hbl-val { font-size: 11px; font-weight: 700; }
  .hbl-sub { font-size: 9px; color: #333; line-height: 1.4; margin-top: 2px; }

  /* Datos del consignatario (CI, direccion, municipio, provincia) */
  .hbl-datos { display: grid; grid-template-columns: auto 2fr 1fr 1fr; gap: 4px; margin-bottom: 8px; }
  .hbl-dato { border: 1px solid #000; padding: 5px 8px; }
  .hbl-dato-wide { grid-column: span 1; }
  .hbl-dato label { font-size: 7px; font-weight: 800; color: #C23B22; text-transform: uppercase; margin-right: 4px; }
  .hbl-dato span { font-size: 10px; }

  /* Tabla de mercancía */
  .hbl-tabla { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  .hbl-tabla th { background: #1f2937; color: #fff; font-size: 8px; padding: 5px; text-align: left; text-transform: uppercase; letter-spacing: .3px; border: 1px solid #1f2937; }
  .hbl-tabla td { border: 1px solid #000; padding: 5px; font-size: 10px; vertical-align: top; }
  .hbl-tabla .mono { font-family: "Courier New", monospace; font-weight: 700; }
  .hbl-tabla .num { text-align: right; font-family: "Courier New", monospace; }
  .hbl-tabla .col-marks { width: 110px; }
  .hbl-tabla .col-pack { width: 50px; text-align: center; }
  .hbl-tabla .col-gw { width: 70px; }
  .hbl-tabla .col-m3 { width: 60px; }

  /* Casillas inferiores */
  .hbl-footer-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-top: 10px; }
  .hbl-foot-box { border: 1px solid #000; padding: 5px; text-align: center; min-height: 36px; display: flex; flex-direction: column; justify-content: center; }
  .hbl-foot-box label { font-size: 7px; font-weight: 800; color: #C23B22; text-transform: uppercase; letter-spacing: .3px; }
  .hbl-foot-val { font-size: 11px; font-weight: 700; margin-top: 2px; }
  .hbl-foot-line { border-top: 1px solid #000; margin-top: 12px; }

  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
    .hbl { box-shadow: none; margin: 0; width: 100%; min-height: auto; border: none; padding: 6mm; }
    @page { size: A4; margin: 8mm; }
  }
`;
