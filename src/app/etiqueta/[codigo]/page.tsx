import { db } from "@/lib/db";
import EtiquetaContent from "./etiqueta-content";

// ════════════════════════════════════════════════════════════════════════════
// /etiqueta/[codigo] — Etiqueta térmica 4×6 (101×152mm) lista para imprimir.
// Formato estilo ikomsoft: todo en mayúsculas, QR + barcode, secciones
// REMITENTE/CONSIGNATARIO, peso lb+kg, letra K.
//
// Esta página es un Server Component (consulta la BD). El contenido interactivo
// (botón imprimir) vive en etiqueta-content.tsx (Client Component).
// ════════════════════════════════════════════════════════════════════════════
export const dynamic = "force-dynamic";

export default async function EtiquetaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cod = codigo.toUpperCase().replace(/[^A-Z0-9-]/g, "");

  let p;
  try {
    p = await db.paquete.findUnique({
      where: { codigo: cod },
      include: { agencia: { select: { nombre: true } } },
    });
  } catch (e: any) {
    return (
      <html>
        <body style={{ padding: 40, fontFamily: "Arial", textAlign: "center" }}>
          <h2>Error cargando etiqueta</h2>
          <p>Error: {String(e?.message || e).slice(0, 300)}</p>
          <p style={{ color: "#999", fontSize: 12 }}>Código: {cod}</p>
          <a href="/">Volver</a>
        </body>
      </html>
    );
  }

  if (!p) {
    return (
      <html>
        <body style={{ padding: 40, fontFamily: "Arial", textAlign: "center" }}>
          <h2>Etiqueta no encontrada</h2>
          <p>El código <b>{cod}</b> no existe.</p>
          <a href="/">Volver</a>
        </body>
      </html>
    );
  }

  const data = {
    codigo: p.codigo,
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
    pesoKg: p.pesoKg,
    piezas: p.piezas,
    contenido: p.contenido,
    categoria: p.categoria,
    notas: p.notas,
    creado: p.creado,
    agenciaNombre: p.agencia?.nombre,
    destino: p.destino,
  };

  // Cargar brands activos para mostrar logos dinámicos
  let brands: { nombre: string; logo: string }[] = [];
  try {
    brands = await db.brand.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
      select: { nombre: true, logo: true },
    });
  } catch {}

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Etiqueta {cod}</title>
        <style dangerouslySetInnerHTML={{ __html: ETIQUETA_CSS }} />
      </head>
      <body>
        <EtiquetaContent p={data} brands={brands} />
      </body>
    </html>
  );
}

const ETIQUETA_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Arial Narrow", Arial, sans-serif; background: #e8e8e8; }

  .etq-toolbar { display: flex; gap: 10px; padding: 14px; justify-content: center; background: #fff; border-bottom: 1px solid #ccc; flex-wrap: wrap; }
  .etq-toolbar button, .etq-toolbar .etq-link {
    padding: 10px 18px; border-radius: 6px; font-weight: 800; cursor: pointer; text-decoration: none;
    background: #C23B22; color: #fff; border: none; font-size: .85rem; letter-spacing: .5px;
  }
  .etq-toolbar .etq-link { background: #374151; }

  /* Hoja 4×6 */
  .etq {
    width: 384px; margin: 16px auto; padding: 10px;
    background: #fff; border: 2px solid #000;
    display: flex; flex-direction: column; gap: 6px;
    font-size: 11px; color: #000; font-family: "Arial Narrow", Arial, sans-serif;
  }

  /* Fila 1: Logo izq + QR der */
  .etq-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .etq-logos { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .etq-logo { max-height: 36px; max-width: 90px; width: auto; height: auto; object-fit: contain; background: #f9fafb; border-radius: 4px; padding: 2px 5px; }
  .etq-qr img { border: 1px solid #000; }

  /* Fila 2: Tracking centrado */
  .etq-tracking { text-align: center; padding: 4px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; }
  .etq-tracking-num { font-size: 22px; font-weight: 900; letter-spacing: 2px; font-family: "Courier New", monospace; }

  /* Fila 3: Dos columnas */
  .etq-main { display: grid; grid-template-columns: auto 1fr; gap: 8px; }

  /* Columna izquierda: peso/piezas/fecha */
  .etq-izq { display: flex; flex-direction: column; gap: 4px; }
  .etq-dato-box { border: 1.5px solid #000; padding: 4px 8px; text-align: center; min-width: 70px; }
  .etq-dato-box small { font-size: 7px; font-weight: 800; color: #C23B22; display: block; text-transform: uppercase; }
  .etq-dato-box b { font-size: 15px; font-weight: 900; }

  /* Columna derecha: EMBARC, CONSIGNATARIO, CARNET, DIRECCION, DESCRIPCION */
  .etq-der { display: flex; flex-direction: column; gap: 3px; }
  .etq-campo { border-bottom: 1px solid #ddd; padding: 2px 0; }
  .etq-campo label { font-size: 8px; font-weight: 800; color: #C23B22; text-transform: uppercase; }
  .etq-campo-val { font-size: 13px; font-weight: 800; color: #000; line-height: 1.2; }
  .etq-campo-inline { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .etq-campo-inline b { font-size: 12px; font-weight: 800; }

  /* Fila 4: MUNICIPIO gigante + TEL al lado */
  .etq-dest-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .etq-destino {
    flex: 1; text-align: center; font-size: 26px; font-weight: 900; color: #C23B22;
    letter-spacing: 0; line-height: 1; text-transform: uppercase;
    padding: 6px 4px; background: #fff5f5; border: 2px solid #C23B22; border-radius: 4px;
  }
  .etq-dest-tel { border: 1.5px solid #000; padding: 4px 8px; text-align: center; }
  .etq-dest-tel small { font-size: 7px; font-weight: 800; color: #C23B22; display: block; }
  .etq-dest-tel b { font-size: 13px; font-weight: 800; }

  /* Fila 5: Barcode abajo */
  .etq-barcode-area { text-align: center; padding: 4px 0 2px; }
  .etq-barcode-bars { height: 48px; overflow: hidden; }
  .etq-barcode-bars canvas { height: 48px !important; width: 100% !important; }
  .etq-barcode-num { font-size: 13px; font-weight: 800; letter-spacing: 3px; font-family: "Courier New", monospace; margin-top: 2px; }

  @media print {
    body { background: #fff; margin: 0; padding: 0; }
    .no-print { display: none !important; }
    .etq {
      border: none; margin: 0; padding: 5px;
      width: 4in; height: 6in; overflow: hidden; box-sizing: border-box;
    }
    .etq-grupo { background: #000; padding: 3px 6px; border-radius: 3px; }
    .etq-grupo img, .etq-logo { background: #000 !important; filter: brightness(0) invert(1) !important; }
    @page { size: 4in 6in; margin: 0; }
  }
`;
