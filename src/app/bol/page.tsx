import { db } from "@/lib/db";
import BOLContent from "./bol-content";

// ════════════════════════════════════════════════════════════════════════════
// /bol — Bill of Lading (documento de carga / manifiesto).
// Lista todos los paquetes pendientes de embarque (no entregados) con totales
// de peso y piezas. Imprimible.
// Acceso público (para el chofer / recepción en destino).
//
// Esta página es un Server Component (consulta la BD). La barra de acciones
// (imprimir, navegar) vive en bol-content.tsx (Client Component) porque usa
// onClick / window.print().
// ════════════════════════════════════════════════════════════════════════════
export const dynamic = "force-dynamic";

export default async function BOLPage() {
  let paquetes: any[] = [];
  let dbError: string | null = null;
  try {
    paquetes = await db.paquete.findMany({
      where: { estado: { not: "entregado" } },
      orderBy: { codigo: "asc" },
    });
  } catch (e) {
    dbError = String(e).slice(0, 300);
  }

  const totalLb = paquetes.reduce((s, p) => s + (Number(p.peso) || 0), 0);
  const totalKg = paquetes.reduce((s, p) => s + (Number(p.pesoKg ?? Number(p.peso) * 0.453592) || 0), 0);
  const totalPiezas = paquetes.reduce((s, p) => s + (Number(p.piezas) || 1), 0);
  const fecha = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });

  // Cargar brands activos
  let brands: { nombre: string; logo: string }[] = [];
  try {
    brands = await db.brand.findMany({ where: { activo: true }, orderBy: { orden: "asc" }, select: { nombre: true, logo: true } });
  } catch {}

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Bill of Lading</title>
        <style dangerouslySetInnerHTML={{ __html: BOL_CSS }} />
      </head>
      <body>
        <BOLContent fecha={fecha} dbError={dbError} paquetes={paquetes} totalLb={totalLb} totalKg={totalKg} totalPiezas={totalPiezas} brands={brands} />
      </body>
    </html>
  );
}

const BOL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #e8e8e8; color: #1a1a1a; font-size: 10px; }
  .toolbar { display: flex; gap: 10px; padding: 12px; justify-content: center; background: #fff; border-bottom: 1px solid #ccc; }
  .toolbar button, .toolbar .btn-link { padding: 9px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; text-decoration: none; background: #C23B22; color: #fff; border: none; font-size: .85rem; }
  .toolbar .btn-link { background: #374151; }

  /* Hoja A4 horizontal (landscape) */
  .bol { width: 297mm; min-height: 200mm; margin: 16px auto; padding: 12mm; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.1); }

  /* Header */
  .bol-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #C23B22; padding-bottom: 10px; margin-bottom: 12px; }
  .bol-marca { display: flex; flex-direction: column; gap: 8px; }
  .bol-barco { background: #C23B22; color: #fff; font-weight: 900; font-size: 20px; padding: 4px 12px; border-radius: 4px; letter-spacing: 1px; display: inline-block; width: fit-content; }
  .bol-marca strong { display: block; font-size: 16px; color: #C23B22; letter-spacing: .5px; }
  .bol-marca small { font-size: 9px; color: #666; }
  .bol-grupo-logos { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .bol-titulo { text-align: right; }
  .bol-titulo h1 { font-size: 18px; color: #1f2937; letter-spacing: 1.5px; }
  .bol-fecha { font-size: 10px; color: #666; margin-top: 2px; }
  .bol-k { font-size: 11px; margin-top: 4px; }
  .bol-k span { background: #C23B22; color: #fff; padding: 2px 10px; border-radius: 4px; font-weight: 900; }

  /* Datos del embarque */
  .bol-embarque { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
  .bol-embarque > div { border: 1px solid #ddd; padding: 6px 10px; border-radius: 6px; background: #f9fafb; }
  .bol-embarque label { display: block; font-size: 7px; font-weight: 800; color: #C23B22; text-transform: uppercase; letter-spacing: .5px; }
  .bol-embarque b { font-size: 11px; color: #1f2937; }

  /* Resumen */
  .bol-resumen { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
  .bol-resumen > div { background: #fef3c7; padding: 8px; border-radius: 6px; text-align: center; }
  .bol-resumen b { display: block; font-size: 18px; color: #C23B22; }
  .bol-resumen span { font-size: 9px; color: #666; }

  /* Tabla del manifiesto */
  .bol-tabla { width: 100%; border-collapse: collapse; font-size: 9px; }
  .bol-tabla th { background: #1f2937; color: #fff; padding: 6px 5px; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: .3px; border: 1px solid #1f2937; }
  .bol-tabla td { padding: 4px 5px; border: 1px solid #ddd; vertical-align: top; }
  .bol-tabla .mono { font-family: "Courier New", monospace; font-weight: 700; }
  .bol-tabla .num { text-align: right; font-family: "Courier New", monospace; }
  .bol-tabla tfoot td { border-top: 2px solid #1f2937; background: #f3f4f6; font-weight: 800; }

  /* Anchos de columnas */
  .bol-tabla .col-n { width: 25px; text-align: center; }
  .bol-tabla .col-track { width: 90px; }
  .bol-tabla .col-ci { width: 70px; }
  .bol-tabla .col-tel { width: 70px; }
  .bol-tabla .col-dir { width: 120px; }
  .bol-tabla .col-prov { width: 70px; }
  .bol-tabla .col-cont { width: 80px; }
  .bol-tabla .col-num { width: 45px; }

  /* Firmas */
  .bol-firmas { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 30px; }
  .bol-firma { text-align: center; }
  .bol-linea { border-top: 1px solid #333; margin-bottom: 4px; height: 30px; }
  .bol-firma small { font-size: 8px; color: #6b7280; }

  /* Footer */
  .bol-footer { margin-top: 16px; padding-top: 6px; border-top: 2px solid #C23B22; text-align: center; font-size: 8px; color: #6b7280; }

  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
    .bol { box-shadow: none; margin: 0; width: 100%; min-height: auto; padding: 8mm; }
    /* En B/N: logos en blanco sobre negro */
    .bol-grupo-logos { background: #000; padding: 2px 4px; border-radius: 3px; }
    .bol-grupo-logos img { background: #000 !important; filter: brightness(0) invert(1) !important; }
    @page { size: A4 landscape; margin: 8mm; }
  }
`;
