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

  .label{width:4in;height:6in;margin:0;padding:0.16in;background:#fff;overflow:hidden;position:relative;}
  .label-border{width:100%;height:100%;border:1.5px solid #000;padding:0.10in;position:relative;overflow:hidden;}

  .header{height:0.56in;display:flex;align-items:flex-start;justify-content:space-between;}
  .brand{font-size:0.21in;font-weight:900;letter-spacing:-0.01in;padding-top:0.02in;}
  .logo-small{width:0.58in;height:0.58in;border:1.5px solid #000;border-radius:2px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.13in;line-height:0.90;text-align:center;}

  .line{border-top:1px solid #000;width:100%;}

  .caption{font-size:0.105in;font-weight:700;line-height:1.05;}
  .value{font-size:0.12in;line-height:1.05;margin-top:0.015in;}
  .value-bold{font-size:0.125in;font-weight:900;}

  .from{height:0.58in;display:grid;grid-template-columns:1.55fr 1fr;gap:0.08in;padding:0.05in 0;}
  .shipping-destination{padding:0.05in 0;}
  .destination-name{font-size:0.10in;line-height:1.12;margin-top:0.025in;}
  .shipping-type{padding:0.05in 0;}
  .receiver{display:grid;grid-template-columns:1.62fr 1fr;gap:0.08in;padding:0.045in 0;}
  .receiver-name{font-size:0.12in;font-weight:900;margin-top:0.02in;}
  .receiver-address{font-size:0.10in;line-height:1.1;margin-top:0.02in;}

  .code-area{display:grid;grid-template-columns:1.30fr 0.95fr;gap:0.05in;min-height:1.35in;padding-top:0.05in;}
  .shipping-code{font-size:0.17in;font-weight:900;margin-top:0.02in;}
  .dpa{display:flex;justify-content:space-between;margin-top:0.02in;font-size:0.10in;}
  .detail-block{margin-bottom:0.045in;}
  .contents{font-size:0.115in;font-weight:900;margin-top:0.02in;}
  .weight-size{display:grid;grid-template-columns:1fr 1.4fr;gap:0.04in;}
  .value-items{display:grid;grid-template-columns:1fr 1.4fr;gap:0.04in;margin-top:0.04in;}

  .qr-side{display:flex;justify-content:flex-end;align-items:flex-start;}

  .barcode-area{position:absolute;left:0.18in;right:0.18in;bottom:0.18in;text-align:center;}
  .barcode-area canvas{width:3.25in !important;height:0.43in !important;}

  @media screen{body{background:#ddd;display:flex;justify-content:center;padding:30px;}.label{box-shadow:0 3px 12px rgba(0,0,0,.25);}}

  @media print{
    @page{size:4in 6in;margin:0;}
    html,body{width:4in !important;height:6in !important;margin:0 !important;padding:0 !important;overflow:hidden !important;background:#fff !important;}
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .no-print{display:none !important;}
    .label{width:4in !important;height:6in !important;margin:0 !important;padding:0.16in !important;overflow:hidden !important;page-break-before:avoid !important;page-break-after:avoid !important;page-break-inside:avoid !important;break-before:avoid !important;break-after:avoid !important;break-inside:avoid !important;}
    img,svg,canvas{max-width:100% !important;}
  }
`;
