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
  html,body{margin:0;padding:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#000;}

  .label{width:4in;height:6in;padding:0.12in;background:#fff;color:#000;overflow:hidden;position:relative;}

  /* LOGO */
  .label-logo{width:100%;height:1.0in;display:flex;justify-content:center;align-items:center;gap:0.12in;margin-bottom:0.06in;}
  .logo-main{width:1.0in;height:1.0in;object-fit:contain;}
  .logo-small-ch{width:0.45in;height:0.45in;object-fit:contain;}

  /* NUMERO DE GUIA */
  .guide{text-align:center;font-size:0.32in;font-weight:900;margin-bottom:0.08in;}

  /* CAMPOS */
  .field{margin-bottom:0.07in;}
  .field-title{font-size:0.14in;font-weight:900;}
  .field-value{font-size:0.18in;font-weight:700;}

  /* DESTINO (municipio y provincia) */
  .destination{text-align:center;font-size:0.28in;font-weight:900;border-top:2px solid #000;border-bottom:2px solid #000;padding:0.05in;margin:0.08in 0;}

  /* BARCODE */
  .barcode-area{text-align:center;width:100%;margin-top:0.10in;}
  .barcode-bars{display:flex;justify-content:center;}
  .barcode-bars canvas{width:3.25in !important;height:0.43in !important;}
  .barcode-number{font-size:0.14in;font-weight:900;margin-top:0.02in;}

  /* PESO / BULTO */
  .shipping{display:flex;justify-content:space-between;width:100%;font-size:0.16in;font-weight:900;margin-top:0.06in;}

  @media screen{body{background:#ddd;display:flex;justify-content:center;padding:30px;}.label{box-shadow:0 3px 12px rgba(0,0,0,.25);}}

  @media print{
    @page{size:4in 6in;margin:0;}
    html,body{width:4in !important;height:6in !important;margin:0 !important;padding:0 !important;overflow:hidden !important;}
    .no-print{display:none !important;}
    .label{width:4in !important;height:6in !important;margin:0 !important;break-inside:avoid;page-break-inside:avoid;overflow:hidden !important;}
    .label-logo img{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    img,svg,canvas{max-width:100% !important;}
  }
`;
