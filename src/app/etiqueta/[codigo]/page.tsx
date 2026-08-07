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

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Etiqueta {cod}</title>
        <style dangerouslySetInnerHTML={{ __html: ETIQUETA_CSS }} />
      </head>
      <body>
        <EtiquetaContent p={data} />
      </body>
    </html>
  );
}

const ETIQUETA_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Arial Narrow", Arial, sans-serif; background: #f0f0f0; }
  .toolbar { display: flex; gap: 12px; padding: 14px; justify-content: center; background: #fff; border-bottom: 1px solid #ccc; }
  .toolbar button, .toolbar .btn-link {
    padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; text-decoration: none;
    background: #C23B22; color: #fff; border: none; font-size: 1rem; letter-spacing: .5px;
  }
  .toolbar .btn-link { background: #6b7280; }

  /* Hoja 4×6 (101×152 mm) */
  .etiqueta {
    width: 384px; height: 576px; margin: 20px auto; padding: 12px;
    background: #fff; border: 2px solid #000;
    display: flex; flex-direction: column; gap: 6px;
    font-size: 11px; color: #000;
  }

  /* Header */
  .etq-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #C23B22; padding-bottom: 4px; }
  .etq-logo strong { font-size: 13px; color: #C23B22; display: block; letter-spacing: .5px; }
  .etq-logo small { font-size: 8px; color: #666; letter-spacing: .5px; }
  .etq-k { background: #C23B22; color: #fff; font-size: 28px; font-weight: 900; padding: 2px 14px; border-radius: 4px; }

  /* Tracking + QR */
  .etq-tracking { display: flex; align-items: center; gap: 10px; }
  .etq-qr img { border: 1px solid #000; }
  .etq-tracking-num { flex: 1; }
  .etq-tracking-num small { font-size: 9px; color: #666; display: block; letter-spacing: 1px; }
  .etq-code { font-size: 22px; font-weight: 900; letter-spacing: 1.5px; }

  /* Barcode */
  .etq-barcode { margin: 2px 0; }
  .etq-barcode-text { text-align: center; font-size: 13px; font-weight: 700; letter-spacing: 4px; font-family: "Courier New", monospace; }

  /* Personas */
  .etq-personas { display: flex; gap: 4px; margin-top: 2px; }
  .etq-persona { flex: 1; border: 1.5px solid #000; padding: 5px 6px; }
  .etq-persona-to { background: #fff5f5; }
  .etq-persona-title { font-size: 8px; font-weight: 900; color: #C23B22; border-bottom: 1px solid #C23B22; margin-bottom: 3px; padding-bottom: 1px; letter-spacing: 1px; }
  .etq-persona-nombre { font-size: 13px; font-weight: 800; line-height: 1.2; margin-bottom: 2px; }
  .etq-persona-line { font-size: 10px; line-height: 1.4; }
  .etq-persona-line.muted { color: #666; font-size: 9px; }

  /* Datos (peso/piezas/fecha) */
  .etq-datos { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 4px; }
  .etq-dato { border: 1.5px solid #000; padding: 4px; text-align: center; }
  .etq-dato small { font-size: 7px; color: #666; display: block; letter-spacing: .5px; }
  .etq-dato b { font-size: 16px; font-weight: 900; }
  .etq-dato-fecha { font-size: 11px !important; }

  /* Contenido */
  .etq-contenido { border: 1.5px solid #000; padding: 5px 6px; }
  .etq-contenido small { font-size: 8px; color: #666; letter-spacing: 1px; display: block; margin-bottom: 2px; }
  .etq-contenido > div { font-size: 11px; font-weight: 700; }
  .etq-notas { font-size: 9px; color: #444; font-weight: 400; margin-top: 2px; }

  /* Footer */
  .etq-footer { border-top: 2px solid #C23B22; padding-top: 3px; text-align: center; font-size: 8px; color: #666; letter-spacing: .3px; }

  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
    .etiqueta { border: none; margin: 0; width: 4in; height: 6in; padding: 8px; }
    @page { size: 4in 6in; margin: 0; }
  }
`;
