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

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Bill of Lading</title>
        <style dangerouslySetInnerHTML={{ __html: BOL_CSS }} />
      </head>
      <body>
        <BOLContent fecha={fecha} dbError={dbError} paquetes={paquetes} totalLb={totalLb} totalKg={totalKg} totalPiezas={totalPiezas} />
      </body>
    </html>
  );
}

const BOL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #f0f0f0; color: #1f2937; }
  .toolbar { display: flex; gap: 10px; padding: 14px; justify-content: center; background: #fff; border-bottom: 1px solid #ccc; }
  .toolbar button, .toolbar .btn-link { padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; text-decoration: none; background: #C23B22; color: #fff; border: none; font-size: .9rem; }
  .toolbar .btn-link { background: #6b7280; }

  .bol { max-width: 800px; margin: 20px auto; background: #fff; padding: 28px; }
  .bol-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #C23B22; padding-bottom: 12px; margin-bottom: 14px; }
  .bol-marca { display: flex; align-items: center; gap: 10px; }
  .bol-barco { font-size: 30px; }
  .bol-marca strong { display: block; font-size: 16px; color: #C23B22; }
  .bol-marca small { font-size: 10px; color: #666; }
  .bol-grupo-logos { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
  .bol-grupo-logos img { max-height: 26px; max-width: 70px; width: auto; height: auto; object-fit: contain; }
  .bol-titulo { text-align: right; }
  .bol-titulo h1 { font-size: 22px; color: #1f2937; letter-spacing: 1px; }
  .bol-fecha { font-size: 11px; color: #666; }
  .bol-k { font-size: 12px; margin-top: 4px; }
  .bol-k span { background: #C23B22; color: #fff; padding: 2px 10px; border-radius: 4px; font-weight: 900; }

  .bol-ruta { display: flex; justify-content: space-between; align-items: center; background: #f9fafb; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 12px; }
  .bol-ruta small { display: block; color: #6b7280; font-size: 9px; text-transform: uppercase; }
  .bol-flecha { font-size: 18px; }

  .bol-resumen { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
  .bol-resumen > div { background: #fef3c7; padding: 10px; border-radius: 8px; text-align: center; }
  .bol-resumen b { display: block; font-size: 18px; color: #C23B22; }
  .bol-resumen span { font-size: 10px; color: #666; }

  .bol-tabla { width: 100%; border-collapse: collapse; font-size: 11px; }
  .bol-tabla th { background: #1f2937; color: #fff; padding: 8px; text-align: left; font-size: 9px; text-transform: uppercase; }
  .bol-tabla td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  .bol-tabla small { color: #6b7280; font-size: 9px; }
  .bol-tabla .mono { font-family: "Courier New", monospace; }
  .bol-tabla .num { text-align: right; font-family: "Courier New", monospace; }
  .bol-tabla tfoot td { border-top: 2px solid #1f2937; background: #f9fafb; }

  .bol-firmas { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-top: 40px; }
  .bol-firma { text-align: center; }
  .bol-linea { border-top: 1px solid #1f2937; margin-bottom: 6px; height: 30px; }
  .bol-firma small { font-size: 10px; color: #6b7280; }

  .bol-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #6b7280; }

  .bol-dev { margin-top: 28px; padding: 20px; background: #fffbeb; border: 2px dashed #e0a106; border-radius: 12px; }
  .bol-dev-head { display: inline-block; background: #e0a106; color: #fff; font-size: 11px; font-weight: 900; letter-spacing: 1.5px; padding: 3px 12px; border-radius: 5px; }
  .bol-dev-sub { font-size: 13px; font-weight: 700; color: #92400e; margin: 10px 0 8px; }
  .bol-dev-list { list-style: none; padding: 0; margin: 0 0 10px; display: flex; flex-direction: column; gap: 6px; }
  .bol-dev-list li { font-size: 12px; color: #78350f; padding-left: 16px; position: relative; line-height: 1.5; }
  .bol-dev-list li::before { content: ""; position: absolute; left: 0; top: 7px; width: 6px; height: 6px; border-radius: 50%; background: #e0a106; }
  .bol-dev-foot { font-size: 11px; color: #92400e; font-style: italic; margin: 0; }

  @media print {
    body { background: #fff; }
    .toolbar, .no-print { display: none !important; }
    .bol { margin: 0; max-width: 100%; padding: 10px; }
    @page { size: A4; margin: 12mm; }
  }
`;
