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
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{margin:0;padding:0;width:100%;background:#fff;font-family:Arial,Helvetica,sans-serif;}

  /* ETIQUETA EXACTA 4 x 6 PULGADAS */
  .label{
    width:4in;height:6in;margin:0;padding:0.12in;
    overflow:hidden;background:#fff;color:#000;border:none;
  }

  /* CABECERA */
  .header{height:1.05in;position:relative;}
  .logo{position:absolute;left:0.12in;top:0.05in;width:0.85in;height:0.85in;object-fit:contain;}
  .qr{position:absolute;right:0.05in;top:0.02in;width:0.95in;height:0.95in;}
  .qr img{width:100%;height:100%;object-fit:contain;}

  /* NÚMERO GUÍA */
  .guide{width:100%;text-align:center;font-size:0.38in;line-height:1;font-weight:900;white-space:nowrap;margin:0.03in 0 0.08in 0;}

  /* FILAS */
  .row{display:flex;width:100%;margin-bottom:0.06in;font-size:0.20in;line-height:1.05;}
  .label-title{width:1.55in;font-weight:900;flex-shrink:0;}
  .label-value{flex:1;font-weight:700;overflow-wrap:anywhere;}

  /* CONSIGNATARIO */
  .section-title{font-size:0.20in;font-weight:900;margin:0.06in 0 0.04in;}
  .consignee{font-size:0.23in;line-height:1.05;font-weight:900;margin-bottom:0.07in;}

  /* DIRECCIÓN */
  .address{font-size:0.18in;line-height:1.05;font-weight:700;margin-bottom:0.07in;}

  /* MUNICIPIO */
  .municipality{width:100%;text-align:center;font-size:0.25in;font-weight:900;border-top:2px solid #000;border-bottom:2px solid #000;padding:0.05in 0;margin:0.05in 0;}

  /* PROVINCIA */
  .province{width:100%;text-align:center;font-size:0.34in;line-height:1;font-weight:900;margin:0.06in 0;}

  /* PRODUCTO */
  .product{width:100%;text-align:center;font-size:0.18in;line-height:1.05;font-weight:900;margin:0.07in 0;}

  /* PESO / BULTO */
  .shipping{display:flex;justify-content:space-between;align-items:center;width:100%;font-size:0.19in;font-weight:900;margin-top:0.05in;}

  /* BARCODE */
  .barcode-container{text-align:center;width:100%;margin-top:0.10in;}
  .barcode-bars{display:flex;justify-content:center;}
  .barcode-bars canvas{width:3.25in !important;height:0.48in !important;}
  .barcode-number{font-size:0.17in;font-weight:900;margin-top:0.02in;}

  /* DESTINO FINAL */
  .destination{width:100%;text-align:center;font-size:0.31in;line-height:1;font-weight:900;margin-top:0.08in;}

  /* IMPRESIÓN */
  @media print{
    @page{size:4in 6in;margin:0;}
    html,body{width:4in;height:6in;margin:0 !important;padding:0 !important;overflow:hidden !important;background:#fff !important;}
    .no-print{display:none !important;}
    .label{
      width:4in !important;height:6in !important;margin:0 !important;
      page-break-before:avoid;page-break-after:avoid;page-break-inside:avoid;
      break-before:avoid;break-after:avoid;break-inside:avoid;
      overflow:hidden !important;
    }
    img,svg,canvas{max-width:100% !important;}
  }
`;
