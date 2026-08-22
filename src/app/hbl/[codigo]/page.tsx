import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HblPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cod = codigo.toUpperCase().replace(/[^A-Z0-9-]/g, "");

  let p: any;
  try {
    p = await db.paquete.findUnique({ where: { codigo: cod } });
  } catch { p = null; }

  if (!p) return <html><body style={{padding:40}}><h2>No encontrado: {cod}</h2></body></html>;

  const fecha = new Date(p.creado).toISOString().slice(0,10);
  const pesoKg = p.pesoKg ?? Number(p.peso) * 0.453592;
  const blNumber = p.hawb || cod;
  const upper = (s:any) => String(s||"").toUpperCase();
  const marks = cod.replace(/-/g,"");

  // Funcion para generar una copia del HBL
  function hblCopy(copyNum: string) {
    return `
    <div class="hbl-copy">
    <div class="copy-tag">${copyNum}</div>
    <div class="hbl-header">
      <div class="company">
        
        <div class="company-name">CHAMBATINA</div>
      </div>
      <div class="document-title">COMBINED TRANSPORT<br>BILL OF LADING</div>
    </div>

    <table class="hbl-table">
      <tr>
        <td colspan="2" class="box">
          <div class="lbl">BOOKING NUMBER</div>
          <div class="val">${blNumber}</div>
        </td>
        <td colspan="2" class="box">
          <div class="lbl">B/L NUMBER</div>
          <div class="val">${blNumber}</div>
        </td>
        <td colspan="2" class="box">
          <div class="lbl">EXPORT REFERENCES</div>
          <div class="val">${fecha}</div>
        </td>
      </tr>
      <tr>
        <td colspan="3" class="box">
          <div class="lbl">SHIPPER</div>
          <div class="val">${upper(p.remitente)}</div>
          <div class="small">TEL: ${p.remitenteTel||"—"}</div>
        </td>
        <td colspan="3" class="box">
          <div class="lbl">FORWARDING AGENT</div>
          <div class="val">CHAMBATINA</div>
          <div class="small">MIAMI, FL, USA</div>
        </td>
      </tr>
      <tr>
        <td colspan="3" class="box">
          <div class="lbl">CONSIGNEE / CONIGNED TO</div>
          <div class="val">${upper(p.destinatario)}</div>
          <div class="small">CARNET/ID: ${upper(p.consignatarioCarnet)||"—"}</div>
          <div class="small">TEL: ${p.consignatarioTel||"—"}</div>
          <div class="small">${upper(p.consignatarioCalle)}</div>
          <div class="small">${upper(p.consignatarioMunicipio)}, ${upper(p.consignatarioProvincia)}</div>
        </td>
        <td colspan="3" class="box">
          <div class="lbl">NOTIFY PARTY / INTERMEDIATE CONSIGNEE</div>
          <div class="val">SAME AS CONSIGNEE</div>
        </td>
      </tr>
      <tr>
        <td colspan="2" class="box">
          <div class="lbl">POINT AND COUNTRY OF ORIGIN</div>
          <div class="val">EVERGLADES, U.S.A</div>
        </td>
        <td colspan="2" class="box">
          <div class="lbl">FOR DELIVERY APPLY TO</div>
          <div class="val">CHAMBATINA</div>
        </td>
        <td colspan="2" class="box">
          <div class="lbl">PRE-CARRIAGE BY</div>
          <div class="val">—</div>
        </td>
      </tr>
      <tr>
        <td colspan="2" class="box">
          <div class="lbl">PLACE OF RECEIPT BY PRECARRIER</div>
          <div class="val">EVERGLADES, U.S.A</div>
        </td>
        <td colspan="2" class="box">
          <div class="lbl">PORT OF LOADING</div>
          <div class="val">EVERGLADES, U.S.A</div>
        </td>
        <td colspan="2" class="box">
          <div class="lbl">LOADING PIER / TERMINAL</div>
          <div class="val">EVERGLADES</div>
        </td>
      </tr>
      <tr>
        <td colspan="3" class="box">
          <div class="lbl">VESSEL / VOYAGE</div>
          <div class="val">—</div>
        </td>
        <td colspan="3" class="box">
          <div class="lbl">PORT OF DISCHARGE / PLACE OF DELIVERY</div>
          <div class="val">MARIEL / LA HABANA, CUBA</div>
        </td>
      </tr>
    </table>

    <table class="hbl-table">
      <tr class="gray-row">
        <td class="box center"><b>MARKS AND<br>NUMBERS</b></td>
        <td class="box center"><b>NO. OF<br>PACKS</b></td>
        <td class="box center"><b>DESCRIPTION OF<br>COMMODITIES</b></td>
        <td class="box center"><b>GROSS<br>WEIGHT (kg)</b></td>
        <td class="box center"><b>CUBICAJE<br>(m3)</b></td>
        <td class="box center"><b>VALOR<br>(USD)</b></td>
      </tr>
      <tr>
        <td class="box center"><b>${marks}</b></td>
        <td class="box center">${p.piezas||1}</td>
        <td class="box">${upper(p.contenido)}</td>
        <td class="box center">${pesoKg.toFixed(2)}</td>
        <td class="box center">—</td>
        <td class="box center">NVD</td>
      </tr>
    </table>

    <table class="hbl-table">
      <tr>
        <td class="box" colspan="2">
          <div class="lbl">FREIGHT AND CHARGES</div>
          <div class="val">PREPAID</div>
        </td>
        <td class="box">
          <div class="lbl">PREPAID</div>
          <div class="val">YES</div>
        </td>
        <td class="box">
          <div class="lbl">COLLECT</div>
          <div class="val">NO</div>
        </td>
        <td class="box" colspan="2">
          <div class="lbl">DECLARED VALUE</div>
          <div class="val">NVD</div>
        </td>
      </tr>
    </table>

    <table class="hbl-table">
      <tr>
        <td class="box" colspan="4">
          <div class="lbl">DATE ISSUED</div>
          <div class="val">${fecha}</div>
        </td>
        <td class="box" colspan="2">
          <div class="lbl">SIGNED AS AGENT FOR THE CARRIER: CHAMBATINA</div>
          <div class="sig-line">__________________________</div>
        </td>
      </tr>
    </table>

    <div class="manifest-line">MANIFESTO: ${cod}</div>

    </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<title>HBL ${cod}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,Helvetica,sans-serif;font-size:8pt;color:#000;background:#eee;padding:10px;}
.no-print{text-align:center;margin-bottom:10px;}
.no-print button{padding:10px 20px;border-radius:6px;background:#C23B22;color:#fff;border:none;font-weight:bold;cursor:pointer;font-size:14px;margin:0 5px;}
.no-print a{padding:10px 20px;border-radius:6px;background:#374151;color:#fff;text-decoration:none;font-weight:bold;font-size:14px;margin:0 5px;}
.hbl-copy{width:50%;float:left;padding:5px;position:relative;}
.copy-tag{position:absolute;top:0;right:5px;background:#C23B22;color:#fff;font-size:7px;font-weight:900;padding:1px 6px;border-radius:3px;z-index:10;}
.hbl-page{width:297mm;min-height:210mm;margin:0 auto;background:#fff;overflow:hidden;}
.hbl-header{display:grid;grid-template-columns:55% 45%;min-height:70px;border-bottom:1px solid #000;}
.company{padding:4px 6px;display:flex;align-items:center;gap:8px;}
.chambatina-logo{width:80px;max-height:50px;object-fit:contain;}
.company-name{font-size:18px;font-weight:900;}
.document-title{border-left:1px solid #000;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:10px;text-align:center;}
.hbl-table{width:100%;border-collapse:collapse;}
.box{border:1px solid #000;padding:3px 4px;vertical-align:top;}
.lbl{font-size:6pt;font-weight:900;color:#444;text-transform:uppercase;}
.val{font-size:8pt;font-weight:700;}
.small{font-size:7pt;color:#333;}
.center{text-align:center;}
.gray-row{background:#eee;}
.sig-line{margin-top:15px;font-size:7pt;}
.manifest-line{text-align:center;font-size:7pt;font-weight:900;margin-top:3px;}
@media print{
@page{size:landscape;margin:5mm;}
body{background:#fff;padding:0;margin:0;}
.no-print{display:none;}
.copy-tag{display:none;}
.hbl-page{width:100%;min-height:auto;}
}
@media screen{.hbl-page{box-shadow:0 2px 12px rgba(0,0,0,.15);}}
</style></head><body>

<div class="no-print">
  <button onclick="window.print()">IMPRIMIR HBL</button>
  <a href="/etiqueta/${cod}" target="_blank">ETIQUETA</a>
  <a href="/bol" target="_blank">MANIFIESTO</a>
  <a href="/">INICIO</a>
</div>

<div class="hbl-page">
  ${hblCopy("COPIA 1")}
  ${hblCopy("COPIA 2")}
  <div style="clear:both;"></div>
</div>

</body></html>`;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
