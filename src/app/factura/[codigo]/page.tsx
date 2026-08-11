import { db } from "@/lib/db";
import FacturaContent from "./factura-content";

export const dynamic = "force-dynamic";

export default async function FacturaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cod = codigo.toUpperCase().replace(/[^A-Z0-9-]/g, "");

  let p;
  try {
    p = await db.paquete.findUnique({
      where: { codigo: cod },
      include: { agencia: { select: { nombre: true, direccion: true, ciudad: true, pais: true, telefono: true, logo: true } } },
    });
  } catch (e: any) {
    return <html><body style={{padding:40,fontFamily:"Arial",textAlign:"center"}}><h2>Error</h2><p>{String(e?.message||e).slice(0,200)}</p></body></html>;
  }

  if (!p) {
    return <html><body style={{padding:40,fontFamily:"Arial",textAlign:"center"}}><h2>Factura no encontrada</h2><p>Código: {cod}</p><a href="/">Volver</a></body></html>;
  }

  const data = {
    codigo: p.codigo,
    facturaNum: "INV-" + p.codigo.slice(-7),
    remitente: p.remitente,
    remitenteTel: p.remitenteTel,
    destinatario: p.destinatario,
    consignatarioCarnet: p.consignatarioCarnet,
    consignatarioTel: p.consignatarioTel,
    consignatarioCalle: p.consignatarioCalle,
    consignatarioMunicipio: p.consignatarioMunicipio,
    consignatarioProvincia: p.consignatarioProvincia,
    peso: p.peso,
    pesoKg: p.pesoKg ?? Number(p.peso) * 0.453592,
    piezas: p.piezas,
    contenido: p.contenido,
    tarifa: p.tarifa,
    monto: p.monto,
    creado: p.creado,
    agenciaNombre: p.agencia?.nombre,
    agenciaLogo: p.agencia?.logo,
    agenciaTel: p.agencia?.telefono,
  };

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Factura {cod}</title>
        <style dangerouslySetInnerHTML={{ __html: FACTURA_CSS }} />
      </head>
      <body>
        <FacturaContent p={data} />
      </body>
    </html>
  );
}

const FACTURA_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; background: #eee; color: #111; font-size: 12px; }
  .fac-controls { display: flex; gap: 10px; padding: 14px; justify-content: center; background: #fff; }
  .fac-controls button, .fac-controls a { padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; text-decoration: none; background: #C23B22; color: #fff; border: none; font-size: 14px; }
  .fac-controls a { background: #374151; }
  .factura { width: 210mm; max-width: 100%; margin: 16px auto; padding: 15mm; background: #fff; }
  .fac-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #C23B22; padding-bottom: 12px; margin-bottom: 16px; }
  .fac-logo { display: flex; align-items: center; gap: 10px; }
  .fac-logo img { max-height: 60px; max-width: 150px; object-fit: contain; }
  .fac-empresa strong { font-size: 18px; color: #C23B22; display: block; }
  .fac-empresa small { font-size: 10px; color: #555; }
  .fac-titulo { text-align: right; }
  .fac-titulo h1 { font-size: 22px; color: #1f2937; }
  .fac-num { font-size: 14px; font-weight: 700; margin-top: 4px; }
  .fac-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .fac-bloque { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
  .fac-bloque label { font-size: 9px; font-weight: 800; color: #C23B22; text-transform: uppercase; display: block; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  .fac-bloque .nombre { font-size: 14px; font-weight: 700; }
  .fac-bloque .linea { font-size: 11px; color: #333; margin-top: 2px; }
  .fac-tabla { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .fac-tabla th { background: #1f2937; color: #fff; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
  .fac-tabla td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
  .fac-tabla tfoot td { background: #f9fafb; font-weight: 800; border-top: 2px solid #1f2937; }
  .fac-totales { display: flex; justify-content: flex-end; margin-bottom: 20px; }
  .fac-total-box { border: 2px solid #C23B22; border-radius: 8px; padding: 12px 20px; text-align: right; }
  .fac-total-box label { font-size: 10px; font-weight: 800; color: #C23B22; }
  .fac-total-box .monto { font-size: 22px; font-weight: 900; color: #1f2937; }
  .fac-footer { margin-top: 24px; padding-top: 12px; border-top: 2px solid #C23B22; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; }
  .fac-firma { text-align: center; }
  .fac-firma-linea { border-top: 1px solid #333; margin-bottom: 4px; height: 30px; }
  .fac-firma small { font-size: 10px; color: #6b7280; }
  @media print { @page { size: A4; margin: 10mm; } body { background: #fff; } .no-print { display: none !important; } .factura { box-shadow: none; margin: 0; width: 100%; padding: 0; } }
`;
