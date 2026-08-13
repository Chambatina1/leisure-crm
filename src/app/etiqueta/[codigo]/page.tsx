import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EtiquetaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cod = codigo.toUpperCase().replace(/[^A-Z0-9-]/g, "");

  let p: any;
  try {
    p = await db.paquete.findUnique({ where: { codigo: cod } });
  } catch (e: any) {
    return <html><body style={{padding:40}}><h2>Error</h2></body></html>;
  }

  if (!p) return <html><body style={{padding:40}}><h2>No encontrado: {cod}</h2></body></html>;

  const guia = p.hawb || cod;
  const pesoKg = p.pesoKg ?? Number(p.peso) * 0.453592;
  const fecha = new Date(p.creado).toLocaleDateString("es-ES");
  const upper = (s: any) => String(s || "").toUpperCase();

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Etiqueta ${cod}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
html,body{margin:0;padding:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#000;}
.label{width:4in;height:6in;background:#fff;padding:0.12in;overflow:hidden;}
.inner{width:100%;height:100%;border:1.5px solid #000;padding:0.10in;position:relative;overflow:hidden;}
.header{display:grid;grid-template-columns:0.72in 1fr 1.15in;gap:0.08in;align-items:center;min-height:0.72in;}
.logo{width:0.68in;height:0.68in;object-fit:contain;}
.brand{font-size:0.22in;font-weight:900;white-space:nowrap;}
.invoice{text-align:right;}
.invoice .small{font-size:0.09in;font-weight:800;}
.invoice .number{font-size:0.25in;font-weight:900;}
.separator{border-top:1px solid #000;margin:0.04in 0;}
.row{display:grid;grid-template-columns:1fr 1fr;gap:0.08in;}
.label-title{font-size:0.10in;font-weight:900;}
.label-value{font-size:0.12in;font-weight:700;line-height:1.08;}
.big-title{font-size:0.12in;font-weight:900;}
.recipient{font-size:0.13in;font-weight:900;margin-top:0.02in;}
.address{font-size:0.105in;line-height:1.07;margin-top:0.025in;}
.destination-highlight{font-size:0.14in;font-weight:900;}
.goods-grid{display:grid;grid-template-columns:1.25fr 0.85fr;gap:0.08in;}
.goods-left{border-right:1px solid #000;padding-right:0.07in;}
.goods-right{padding-left:0.02in;}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);margin-top:0.06in;font-size:0.11in;font-weight:800;}
.metrics div{border-right:1px solid #000;text-align:center;}
.metrics div:last-child{border-right:none;}
.qr-section{display:grid;grid-template-columns:1fr 1.08in;gap:0.08in;align-items:start;margin-top:0.04in;}
.tracking{font-size:0.115in;font-weight:900;line-height:1.08;}
.qr-help{font-size:0.10in;line-height:1.15;margin-top:0.05in;}
.instructions{font-size:0.10in;line-height:1.12;margin-top:0.05in;}
#qrcode{width:1.04in;height:1.04in;}
#qrcode img,#qrcode canvas{width:1.04in !important;height:1.04in !important;}
.barcode-wrap{position:absolute;left:0.18in;right:0.18in;bottom:0.12in;text-align:center;}
#barcode{width:3.25in;height:0.44in;}
.footer-text{font-size:0.085in;font-weight:800;margin-top:0.02in;}
.print-btn{display:block;margin:20px auto;padding:12px 28px;border-radius:8px;background:#C23B22;color:#fff;border:none;font-weight:800;font-size:16px;cursor:pointer;}
@media print{
@page{size:4in 6in;margin:0;}
html,body{width:4in !important;height:6in !important;margin:0 !important;padding:0 !important;overflow:hidden !important;background:#fff !important;}
.no-print{display:none !important;}
.label{width:4in !important;height:6in !important;margin:0 !important;page-break-after:avoid !important;overflow:hidden !important;}
img,svg,canvas{max-width:100% !important;}
}
@media screen{body{background:#ddd;display:flex;flex-direction:column;align-items:center;padding:20px;}.label{box-shadow:0 2px 12px rgba(0,0,0,.18);}}
</style>
</head>
<body>

<button class="print-btn no-print" onclick="window.print()">IMPRIMIR ETIQUETA 4x6</button>
<div class="no-print" style="text-align:center;margin-bottom:10px;">
  <a href="/hbl/${cod}" target="_blank" style="color:#C23B22;font-weight:700;margin:0 8px;">HBL</a>
  <a href="/bol" target="_blank" style="color:#374151;font-weight:700;margin:0 8px;">MANIFIESTO</a>
  <a href="/nuevo-paquete" style="color:#374151;font-weight:700;margin:0 8px;">NUEVA</a>
</div>

<div class="label">
<div class="inner">

  <div class="header">
    <img src="/logos/chambatina.png" class="logo" alt="Chambatina">
    <div class="brand">VUELACARGO</div>
    <div class="invoice">
      <div class="small">FACTURA / GUIA #</div>
      <div class="number">${guia}</div>
    </div>
  </div>

  <div class="separator"></div>

  <div class="row">
    <div>
      <div class="label-title">Remitente:</div>
      <div class="label-value">${upper(p.remitente)}</div>
    </div>
    <div>
      <div class="label-title">Telefono:</div>
      <div class="label-value">${p.remitenteTel || "—"}</div>
      <div class="label-value">MIAMI, USA</div>
    </div>
  </div>

  <div class="separator"></div>

  <div class="big-title">DESTINATARIO / CONSIGNATARIO:</div>
  <div class="recipient">${upper(p.destinatario)} (${upper(p.consignatarioCarnet) || "—"})</div>
  <div class="address">
    <strong>Telefono:</strong> ${p.consignatarioTel || "—"}<br>
    <strong>Direccion:</strong> ${upper(p.consignatarioCalle)}<br>
    <strong>Municipio:</strong> ${upper(p.consignatarioMunicipio)}<br>
    <strong>Provincia:</strong> ${upper(p.consignatarioProvincia)}
  </div>

  <div class="separator"></div>

  <div class="goods-grid">
    <div class="goods-left">
      <div class="label-title">Descripcion de la Mercancia:</div>
      <div class="label-value">${upper(p.contenido)}</div>
      <div class="metrics">
        <div>Bultos: ${p.piezas}</div>
        <div>Peso: ${pesoKg.toFixed(2)}</div>
        <div>Vol: —</div>
      </div>
    </div>
    <div class="goods-right">
      <div class="label-title">Referencia (Cliente):</div>
      <div class="label-value">${fecha}</div>
      <div style="margin-top:0.05in;" class="label-title">Enviar a:</div>
      <div class="destination-highlight">${upper(p.consignatarioProvincia) || "CUBA"}</div>
    </div>
  </div>

  <div class="separator"></div>

  <div class="qr-section">
    <div>
      <div class="tracking">Codigo de Operacion / Tracking: <span id="trackingText">${guia}</span></div>
      <div class="qr-help">Escanea el codigo QR para rastrear tu envio en nuestra plataforma.</div>
      <div class="instructions"><strong>Instrucciones Especiales:</strong><br>Manejar con cuidado.<br>Verificar antes de entregar.</div>
      <div class="instructions"><strong>Fecha de Emision:</strong> ${fecha}</div>
    </div>
    <div id="qrcode"></div>
  </div>

  <div class="barcode-wrap">
    <svg id="barcode"></svg>
    <div class="footer-text">GRACIAS POR CONFIAR EN CHAMBATINA - VUELACARGO</div>
  </div>

</div>
</div>

<script>
new QRCode(document.getElementById("qrcode"),{
  text:"${guia}",width:220,height:220,
  colorDark:"#000000",colorLight:"#ffffff",
  correctLevel:QRCode.CorrectLevel.M
});
JsBarcode("#barcode","${guia}",{
  format:"CODE128",width:2,height:48,
  displayValue:false,margin:0,
  lineColor:"#000000",background:"#ffffff"
});
<\/script>

</body>
</html>`;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
