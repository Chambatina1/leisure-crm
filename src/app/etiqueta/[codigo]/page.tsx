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

  /* Toolbar */
  .etq-toolbar { display: flex; gap: 10px; padding: 14px; justify-content: center; background: #fff; border-bottom: 1px solid #ccc; flex-wrap: wrap; }
  .etq-toolbar button, .etq-toolbar .etq-link {
    padding: 10px 18px; border-radius: 6px; font-weight: 800; cursor: pointer; text-decoration: none;
    background: #C23B22; color: #fff; border: none; font-size: .85rem; letter-spacing: .5px;
  }
  .etq-toolbar .etq-link { background: #374151; }

  /* Hoja 4×6 (384×576px ≈ 4×6 pulg) */
  .etq {
    width: 384px; margin: 16px auto; padding: 10px;
    background: #fffbef; border: 2px solid #000;
    display: flex; flex-direction: column; gap: 5px;
    font-size: 10px; color: #000; font-family: "Arial Narrow", Arial, sans-serif;
  }

  /* ── Fila 1: Logos del grupo + K ── */
  .etq-top { display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; border-bottom: 2px solid #000; }
  .etq-grupo { display: flex; align-items: center; gap: 6px; }
  .etq-grupo img { height: 30px; width: auto; object-fit: contain; border-radius: 4px; padding: 2px 5px; }
  .etq-logo-chambatina { background: #ff6b00 !important; height: 34px !important; padding: 3px 8px !important; filter: brightness(0) invert(1); }
  .etq-logo-blanco { background: #fff; }
  .etq-chambatina { font-weight: 900; font-size: 11px; color: #ff6b00; background: #fff; border-radius: 3px; padding: 4px 8px; letter-spacing: .5px; }
  .etq-k { background: #C23B22; color: #fff; font-size: 26px; font-weight: 900; padding: 2px 14px; border-radius: 4px; line-height: 1; flex-shrink: 0; }

  /* ── Fila 2: HBL/HAWB ── */
  .etq-hawb { display: flex; justify-content: center; align-items: baseline; gap: 8px; padding: 3px 0; border-bottom: 1px solid #000; }
  .etq-hawb-label { font-size: 9px; color: #555; font-weight: 700; letter-spacing: 1px; }
  .etq-hawb-num { font-size: 18px; font-weight: 900; letter-spacing: 1px; }

  /* ── Grid de campos ── */
  .etq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
  .etq-field { border: 1px solid #000; padding: 3px 5px; background: #fff; }
  .etq-field-wide { grid-column: 1 / -1; }
  .etq-field label { display: block; font-size: 7px; font-weight: 800; color: #C23B22; letter-spacing: .5px; margin-bottom: 1px; text-transform: uppercase; }
  .etq-field-val { font-size: 11px; font-weight: 700; line-height: 1.25; }

  /* ── CONSIGNATARIO destacado (lo más grande de la etiqueta) ── */
  .etq-dest { background: #fff5f5; border: 2.5px solid #C23B22; border-radius: 6px; padding: 8px 10px; text-align: center; }
  .etq-dest-label { font-size: 8px; font-weight: 900; color: #C23B22; letter-spacing: 1.5px; display: block; margin-bottom: 3px; }
  .etq-dest-nombre { font-size: 22px; font-weight: 900; color: #000; line-height: 1.1; letter-spacing: .5px; }
  .etq-dest-loc { margin-top: 4px; display: flex; justify-content: center; align-items: center; gap: 8px; }
  .etq-dest-mun { font-size: 15px; font-weight: 800; color: #C23B22; }
  .etq-dest-sep { font-size: 14px; color: #999; }
  .etq-dest-prov { font-size: 15px; font-weight: 800; color: #C23B22; }

  /* ── Fila 5: Peso / Bultos / QR ── */
  .etq-peso-row { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 3px; }
  .etq-peso-box { border: 1px solid #000; padding: 4px; text-align: center; background: #fff; display: flex; flex-direction: column; justify-content: center; }
  .etq-peso-box label { font-size: 7px; font-weight: 800; color: #C23B22; letter-spacing: .5px; }
  .etq-peso-val { font-size: 17px; font-weight: 900; }
  .etq-qr-box { padding: 2px; align-items: center; }
  .etq-qr-box img { display: block; }

  /* ── Fila 6: Barcode ── */
  .etq-barcode-area { text-align: center; padding: 4px 0 2px; }
  .etq-barcode-bars { height: 48px; overflow: hidden; }
  .etq-barcode-bars svg { height: 48px; width: 100%; }
  .etq-barcode-num { font-size: 13px; font-weight: 800; letter-spacing: 3px; font-family: "Courier New", monospace; margin-top: 2px; }

  /* ── Footer ── */
  .etq-footer { border-top: 2px solid #C23B22; padding-top: 3px; text-align: center; font-size: 7px; color: #555; letter-spacing: .3px; }

  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
    .etq { border: none; margin: 0; width: 4in; padding: 6px; }
    @page { size: 4in 6in; margin: 0; }
  }
`;
