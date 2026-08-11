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
  body { font-family: Arial, Helvetica, sans-serif; background: #eee; color: #222; }

  .etq-toolbar { display: flex; gap: 10px; padding: 14px; justify-content: center; background: #fff; border-bottom: 1px solid #ccc; flex-wrap: wrap; }
  .etq-toolbar button, .etq-toolbar .etq-link {
    padding: 10px 18px; border-radius: 6px; font-weight: 800; cursor: pointer; text-decoration: none;
    background: #C23B22; color: #fff; border: none; font-size: .85rem;
  }
  .etq-toolbar .etq-link { background: #374151; }

  /* ETIQUETA — misma escala que solvecargo (790px de ancho) */
  .label {
    width: 790px; min-height: 1170px; margin: 20px auto;
    background: #fff; border: 4px solid #111; padding: 32px 18px 30px 18px;
  }

  /* CABECERA */
  .header { position: relative; height: 175px; }
  .logo-area { position: absolute; left: 175px; top: 15px; width: 290px; text-align: center; }
  .logo-area img { max-width: 260px; max-height: 115px; object-fit: contain; }
  .fake-logo { font-weight: bold; font-size: 29px; line-height: 30px; }
  .fake-logo .cargo { color: #a9164c; }
  .fake-logo .pack { color: #063c82; }
  .fake-logo .international { font-size: 22px; font-weight: normal; letter-spacing: 2px; color: #234979; }
  .qr-box { position: absolute; right: 20px; top: 0; width: 150px; height: 150px; }
  .qr-box img { width: 150px !important; height: 150px !important; }

  /* NÚMERO DE GUÍA */
  .guide-number { text-align: center; font-size: 57px; font-weight: 800; margin: 6px 0 12px 0; letter-spacing: -1px; }

  /* FILAS (EMBARC, CARNET) */
  .row { display: grid; grid-template-columns: 300px 1fr; align-items: start; margin: 7px 0; font-size: 35px; line-height: 1.08; }
  .row .title { font-weight: 800; }

  /* CONSIGNATARIO */
  .consig-title { font-size: 35px; font-weight: 800; margin-top: 10px; }
  .consig-name { font-size: 38px; line-height: 1.08; font-weight: 800; margin: 12px 0 14px; }

  /* DIRECCION */
  .address { font-size: 34px; line-height: 1.08; margin: 10px 0; font-weight: 700; }

  /* PROVINCIA */
  .province { font-size: 41px; line-height: 1; font-weight: 800; text-align: center; margin: 16px 0; }

  /* TELEFONO */
  .phone-row { display: grid; grid-template-columns: 310px 1fr; font-size: 38px; margin: 10px 0 20px; }
  .phone-row .title { font-weight: 800; }

  /* PRODUCTO */
  .product { font-size: 29px; font-weight: 800; text-align: center; margin: 17px 0; white-space: nowrap; }

  /* ENVIO / PESO / BULTO */
  .shipping-info { display: grid; grid-template-columns: 1fr 1.15fr 1fr; align-items: center; gap: 10px; margin-top: 15px; }
  .shipping-info div { font-size: 40px; font-weight: 800; white-space: nowrap; }
  .shipping-info div:nth-child(2) { text-align: center; }
  .shipping-info div:nth-child(3) { text-align: right; }

  /* BARCODE */
  .barcode-area { text-align: center; margin-top: 22px; }
  .barcode-bars { display: flex; justify-content: center; }
  .barcode-bars canvas { width: 540px !important; height: 90px !important; }
  .barcode-text { font-size: 34px; font-weight: 800; margin-top: 4px; }

  /* DESTINO FINAL */
  .destination { text-align: center; font-size: 69px; line-height: 1.15; font-weight: 900; margin-top: 20px; }

  @media print {
    @page { margin: 0; }
    body { background: white; padding: 0; }
    .no-print { display: none !important; }
    .label { margin: 0; page-break-after: always; border: 4px solid #111; }
  }
`;
