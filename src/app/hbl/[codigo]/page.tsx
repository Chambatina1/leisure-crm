import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HblPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cod = codigo.toUpperCase().replace(/[^A-Z0-9-]/g, "");

  let p: any;
  try {
    p = await db.paquete.findUnique({
      where: { codigo: cod },
      include: { agencia: { select: { nombre: true } } },
    });
  } catch { p = null; }

  if (!p) return <html><body style={{padding:40,fontFamily:"Arial"}}><h2>HBL no encontrado</h2><p>{cod}</p></body></html>;

  const fecha = new Date(p.creado).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const pesoKg = p.pesoKg ?? Number(p.peso) * 0.453592;
  const hblNumber = p.hawb || cod;
  const marks = cod.replace(/-/g, "");
  const dirDest = [p.consignatarioCalle, p.consignatarioMunicipio].filter(Boolean).join(", ");
  const cityDest = [p.consignatarioProvincia, "CUBA"].filter(Boolean).join(", ");
  const upper = (s: any) => String(s || "").toUpperCase();

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>HBL ${cod}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Helvetica,Arial,sans-serif;font-size:9pt;color:#111;background:#eee;padding:20px;}
.controls{text-align:center;margin-bottom:15px;}
.controls button,.controls a{padding:10px 20px;border-radius:6px;font-weight:bold;cursor:pointer;text-decoration:none;background:#C23B22;color:#fff;border:none;font-size:14px;margin:0 5px;}
.controls a{background:#374151;}
.doc{width:210mm;max-width:100%;margin:0 auto;background:#fff;padding:15mm;}
table{border-collapse:collapse;width:100%;}
td{vertical-align:top;}
.box{border:1px solid #000;padding:4px;}
.label{font-size:7pt;font-weight:bold;color:#333;}
.value{font-size:9pt;font-weight:bold;}
.center{text-align:center;}
.title{font-size:19pt;font-weight:bold;}
.bignum{font-size:15pt;font-weight:bold;}
.gray{background-color:#eee;}
.small{font-size:7pt;}
.barcode{text-align:center;margin-top:15px;}
@media print{@page{size:LETTER;margin:8mm;}body{background:#fff;padding:0;}.controls{display:none;}.doc{box-shadow:none;margin:0;width:100%;padding:0;}}
</style></head><body>

<div class="controls">
  <button onclick="window.print()">IMPRIMIR HBL</button>
  <a href="/etiqueta/${cod}" target="_blank">ETIQUETA</a>
  <a href="/bol" target="_blank">MANIFIESTO</a>
  <a href="/">INICIO</a>
</div>

<div class="doc">
<table cellpadding="4">
<tr>
<td width="55%" class="box" style="font-size:18pt;font-weight:bold;color:#123d7a;">
  CHAMBATINA<br>
  <span style="font-size:10pt;color:#234979;">INTERNATIONAL</span><br><br>
  <span style="font-size:9pt;font-weight:normal;">Envios y logistica<br>+1 727-598-6802</span>
</td>
<td width="45%" class="box center">
  <div class="title">HOUSE BILL OF LADING</div><br>
  <span class="label">HBL NUMBER</span><br>
  <span class="bignum">${hblNumber}</span>
</td>
</tr>
</table>

<table cellpadding="4">
<tr>
<td width="50%" class="box">
  <span class="label">SHIPPER / EXPORTER</span><br><br>
  <span class="value">${upper(p.remitente)}</span><br>
  TEL: ${p.remitenteTel || "—"}
</td>
<td width="25%" class="box"><span class="label">BOOKING NUMBER</span><br><br><span class="value">BK-${cod.slice(-7)}</span></td>
<td width="25%" class="box"><span class="label">DATE</span><br><br><span class="value">${fecha}</span></td>
</tr>
<tr>
<td width="50%" class="box">
  <span class="label">CONSIGNEE</span><br><br>
  <span class="value">${upper(p.destinatario)}</span><br>
  ID: ${upper(p.consignatarioCarnet) || "—"}<br>
  ${upper(dirDest)}<br>
  ${upper(cityDest)}<br>
  TEL: ${p.consignatarioTel || "—"}
</td>
<td width="50%" class="box" colspan="2">
  <span class="label">NOTIFY PARTY</span><br><br>
  <span class="value">SAME AS CONSIGNEE</span>
</td>
</tr>
</table>

<table cellpadding="4">
<tr>
<td width="25%" class="box center"><span class="label">PLACE OF RECEIPT</span><br><br><span class="value">MIAMI, FLORIDA</span></td>
<td width="25%" class="box center"><span class="label">PORT OF LOADING</span><br><br><span class="value">MIAMI, FL</span></td>
<td width="25%" class="box center"><span class="label">PORT OF DISCHARGE</span><br><br><span class="value">MARIEL / LA HABANA</span></td>
<td width="25%" class="box center"><span class="label">FINAL DESTINATION</span><br><br><span class="value">${upper(p.consignatarioProvincia) || "CUBA"}</span></td>
</tr>
</table>

<br>

<table cellpadding="5">
<tr class="gray">
<td width="14%" class="box center"><b>MARKS &amp; NUMBERS</b></td>
<td width="10%" class="box center"><b>PACKAGES</b></td>
<td width="41%" class="box center"><b>DESCRIPTION OF GOODS</b></td>
<td width="17%" class="box center"><b>GROSS WEIGHT</b></td>
<td width="18%" class="box center"><b>MEASUREMENT</b></td>
</tr>
<tr>
<td class="box center" style="height:100px;"><br><br><b>${marks}</b></td>
<td class="box center"><br><br><b>${p.piezas}</b><br>PACKAGE</td>
<td class="box"><br><b>${upper(p.contenido)}</b><br><br>PERSONAL / COMMERCIAL CARGO<br><br>SAID TO CONTAIN</td>
<td class="box center"><br><br><b>${pesoKg.toFixed(2)} KG</b></td>
<td class="box center"><br><br><b>0.50 CBM</b></td>
</tr>
</table>

<table cellpadding="5">
<tr>
<td width="33%" class="box"><span class="label">FREIGHT TERMS</span><br><br><span class="value">PREPAID</span></td>
<td width="33%" class="box"><span class="label">DECLARED VALUE</span><br><br><span class="value">$0.00</span></td>
<td width="34%" class="box"><span class="label">TOTAL PACKAGES</span><br><br><span class="value">${p.piezas}</span></td>
</tr>
</table>

<br>

<table cellpadding="5">
<tr>
<td width="60%" class="box"><span class="label">CARRIER / FORWARDING AGENT</span><br><br><b>CHAMBATINA</b><br>Operado por Chambatina<br><br>Received the goods described above in apparent good order and condition except as otherwise noted.</td>
<td width="40%" class="box center"><span class="label">AUTHORIZED SIGNATURE</span><br><br><br><br>______________________________<br>Chambatina<br><br>Date: ${fecha}</td>
</tr>
</table>

<br>
<div class="small">This House Bill of Lading is subject to the carrier's terms, conditions, limitations and applicable transportation regulations.</div>

<div class="barcode">
  <svg id="hblbar"></svg>
</div>

</div>

<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script>
JsBarcode("#hblbar","${hblNumber}",{format:"CODE128",width:2,height:30,margin:0,displayValue:true,fontSize:12,background:"#fff",lineColor:"#000"});
</script>

</body></html>`;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
