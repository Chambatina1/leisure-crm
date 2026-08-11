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
        <BOLContent fecha={fecha} dbError={dbError} paquetes={paquetes} brands={brands} />
      </body>
    </html>
  );
}

const BOL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; background: #f3f3f3; color: #222; }

  .manifest-controls { width: 1780px; margin: 20px auto; display: flex; gap: 10px; }
  .manifest-controls button { padding: 12px 24px; border: 0; border-radius: 6px; font-size: 17px; font-weight: bold; cursor: pointer; background: #222; color: white; }
  .manifest-controls a { padding: 12px 24px; border-radius: 6px; font-size: 17px; font-weight: bold; text-decoration: none; background: #6b7280; color: white; }

  .manifest { width: 1780px; min-height: 760px; margin: auto; background: white; border: 2px solid #222; }

  .title-area { position: relative; min-height: 390px; padding-top: 5px; }
  .main-title { text-align: center; font-size: 44px; font-weight: 900; margin: 0; }
  .subtitle { text-align: center; font-size: 36px; font-weight: 900; margin-top: 14px; }

  .logo-box { position: absolute; left: 10px; top: 120px; width: 275px; height: 275px; border: 1px solid #aaa; display: flex; align-items: center; justify-content: center; }
  .logo-box img { max-width: 90%; max-height: 90%; object-fit: contain; }

  .company-info { position: absolute; left: 300px; right: 20px; top: 172px; text-align: center; font-size: 31px; line-height: 1.08; font-weight: 500; }
  .company-name { font-size: 32px; font-weight: 800; }

  .table-wrapper { width: 100%; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 1px solid #222; text-align: center; vertical-align: middle; padding: 5px; }
  th { background: #d1d1d1; font-size: 23px; line-height: 1.05; font-weight: 900; }
  td { font-size: 24px; line-height: 1.1; }

  .col-no { width: 42px; }
  .col-invoice { width: 250px; }
  .col-delivery { width: 175px; }
  .col-shipper { width: 105px; }
  .col-consignee { width: 145px; }
  .col-id { width: 160px; }
  .col-address { width: 160px; }
  .col-phone { width: 132px; }
  .col-boxes { width: 75px; }
  .col-weight { width: 115px; }
  .col-description { width: 178px; }
  .col-date { width: 130px; }
  .col-pallet { width: 115px; }

  .invoice-number { font-size: 29px; font-weight: 900; }
  .row-number { font-size: 28px; font-weight: 900; }
  .shipper, .consignee, .address, .description { text-transform: uppercase; }

  tbody tr { height: 80px; }

  .summary { display: flex; justify-content: flex-end; gap: 40px; padding: 15px 25px; font-size: 22px; font-weight: 700; }

  @media print {
    @page { size: landscape; margin: 5mm; }
    body { background: white; padding: 0; }
    .no-print, .manifest-controls { display: none !important; }
    .manifest { width: 100%; border: 1px solid black; }
  }
`;
