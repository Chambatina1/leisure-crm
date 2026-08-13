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
  const fecha = new Date(p.creado).toISOString().slice(0, 10);
  const piezas = p.piezas || 1;
  const upper = (s: any) => String(s || "").toUpperCase();

  // HTML EXACTO del template del usuario - datos inyectados
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Etiqueta ${cod}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
html,body{margin:0;padding:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#000;}
.shipping-label{width:4in;height:6in;padding:0.25in 0.32in;background:#fff;overflow:hidden;}
.label-frame{width:100%;height:100%;border-left:1px solid #000;border-right:1px solid #000;border-bottom:1px solid #000;padding:0.06in;position:relative;overflow:hidden;}
.header{height:0.52in;display:grid;grid-template-columns:1fr 0.72in;align-items:start;}
.brand{font-size:0.17in;font-weight:900;letter-spacing:-0.01in;padding-top:0.03in;}
.agency-logo{width:0.65in;height:0.50in;object-fit:contain;justify-self:end;filter:grayscale(1) contrast(2);}
.section{padding:0.04in 0;}
.border-bottom{border-bottom:1px solid #000;}
.small-title{font-size:0.085in;line-height:1;font-weight:900;}
.normal{font-size:0.095in;line-height:1.10;}
.bold{font-weight:900;}
.from-grid{display:grid;grid-template-columns:1.35fr 1fr;gap:0.08in;}
.sender-name{margin-top:0.015in;}
.shipping-destination-title{font-size:0.085in;font-weight:900;}
.shipping-destination{margin-top:0.02in;font-size:0.084in;line-height:1.08;}
.shipping-type{font-size:0.10in;font-weight:900;margin-top:0.015in;}
.recipient-grid{display:grid;grid-template-columns:1.50fr 0.78fr;gap:0.07in;}
.recipient-name{font-size:0.10in;font-weight:900;margin:0.015in 0;}
.address{font-size:0.083in;line-height:1.08;}
.phone-id{font-size:0.085in;line-height:1.08;}
.code-qr{display:grid;grid-template-columns:1.18fr 1fr;gap:0.04in;padding-top:0.04in;}
.shipping-code{font-size:0.135in;font-weight:900;margin-top:0.015in;}
.dpa-row{display:grid;grid-template-columns:1fr 0.42in;margin-top:0.015in;font-size:0.085in;}
#qrcode{width:1.13in;height:1.13in;justify-self:end;}
#qrcode img,#qrcode canvas{width:1.13in !important;height:1.13in !important;}
.detail{margin-top:0.045in;}
.detail-title{font-size:0.077in;line-height:1.02;}
.detail-value{margin-top:0.012in;font-size:0.092in;line-height:1.07;}
.content-value{font-size:0.095in;font-weight:900;}
.measure-grid{display:grid;grid-template-columns:0.78fr 1.35fr;gap:0.04in;margin-top:0.035in;}
.value-grid{display:grid;grid-template-columns:0.78fr 1.35fr;gap:0.04in;margin-top:0.025in;}
.barcode-area{position:absolute;left:0.10in;right:0.10in;bottom:0.40in;text-align:center;}
#barcode{width:2.85in;height:0.38in;}
.print-btn{display:block;margin:20px auto;padding:12px 28px;border-radius:8px;background:#C23B22;color:#fff;border:none;font-weight:800;font-size:16px;cursor:pointer;}
@media print{
@page{size:4in 6in;margin:0;}
html,body{width:4in !important;height:6in !important;margin:0 !important;padding:0 !important;overflow:hidden !important;background:#fff !important;}
.no-print{display:none !important;}
.shipping-label{width:4in !important;height:6in !important;margin:0 !important;overflow:hidden !important;page-break-inside:avoid !important;break-inside:avoid !important;}
img,canvas,svg{max-width:100% !important;}
}
@media screen{body{background:#ddd;display:flex;flex-direction:column;align-items:center;padding:30px;}.shipping-label{box-shadow:0 3px 15px rgba(0,0,0,.25);}}
</style>
</head>
<body>

<button class="print-btn no-print" onclick="window.print()">IMPRIMIR ETIQUETA 4x6</button>
<div class="no-print" style="text-align:center;margin-bottom:10px;">
<a href="/hbl/${cod}" target="_blank" style="color:#C23B22;font-weight:700;margin:0 8px;">HBL</a>
<a href="/bol" target="_blank" style="color:#374151;font-weight:700;margin:0 8px;">MANIFIESTO</a>
<a href="/nuevo-paquete" style="color:#374151;font-weight:700;margin:0 8px;">NUEVA</a>
</div>

<div class="shipping-label">
<div class="label-frame">

  <div class="header">
    <div class="brand">VUELACARGO</div>
    <img class="agency-logo" src="/logos/chambatina.png" alt="Chambatina">
  </div>

  <div class="section border-bottom">
    <div class="from-grid">
      <div>
        <div class="small-title">De/From</div>
        <div class="normal sender-name">${upper(p.remitente)}</div>
      </div>
      <div>
        <div class="small-title">Telefono(s)/Phone(s)</div>
        <div class="normal bold">${p.remitenteTel || "—"}</div>
      </div>
    </div>
  </div>

  <div class="section border-bottom">
    <div class="shipping-destination-title">DESTINO DEL ENVIO/SHIPPING DESTINATION</div>
    <div class="shipping-destination">VuelaCargo, Centro de Distribucion, Cotorro, La Habana, Cuba</div>
  </div>

  <div class="section border-bottom">
    <div class="small-title">Tipo de envio/Shipping type</div>
    <div class="shipping-type">CARGA MARITIMA</div>
  </div>

  <div class="section border-bottom">
    <div class="recipient-grid">
      <div>
        <div class="small-title">A/To</div>
        <div class="recipient-name">${upper(p.destinatario)}</div>
        <div class="address">${upper(p.consignatarioCalle)}<br>Mc: ${upper(p.consignatarioMunicipio)}<br>${upper(p.consignatarioProvincia)}</div>
      </div>
      <div class="phone-id">
        <div class="small-title">Telefono(s)/Phone(s)</div>
        <div class="bold">${p.consignatarioTel || "—"}</div>
        <div style="height:.05in"></div>
        <div class="small-title">Carnet de Identidad/ID</div>
        <div class="bold">${upper(p.consignatarioCarnet) || "—"}</div>
      </div>
    </div>
  </div>

  <div class="code-qr">
    <div>
      <div class="small-title">Codigo del envio/Shipping code</div>
      <div class="shipping-code">${guia}</div>
      <div class="dpa-row">
        <div class="small-title">DPA</div>
        <div class="normal">${fecha.slice(5,7)}.${fecha.slice(2,4)}</div>
      </div>
      <div class="detail">
        <div class="detail-title">Fecha de despacho/Dispatch date</div>
        <div class="detail-value">${fecha}</div>
      </div>
      <div class="detail">
        <div class="detail-title">Sintesis del contenido/Summary of content</div>
        <div class="detail-value content-value">${upper(p.contenido)}</div>
      </div>
      <div class="measure-grid">
        <div>
          <div class="detail-title">Peso/Weight</div>
          <div class="detail-value">${pesoKg.toFixed(2)} kg</div>
        </div>
        <div>
          <div class="detail-title">Tamano/Size</div>
          <div class="detail-value">—</div>
        </div>
      </div>
      <div class="value-grid">
        <div>
          <div class="detail-title">Valor/Value</div>
          <div class="detail-value">0 USD</div>
        </div>
        <div>
          <div class="detail-title">Item(s)/Item(s)</div>
          <div class="detail-value bold">${piezas} DE ${piezas}</div>
        </div>
      </div>
    </div>
    <div id="qrcode"></div>
  </div>

  <div class="barcode-area">
    <svg id="barcode"></svg>
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
  format:"CODE128",width:2,height:44,
  displayValue:false,margin:0,
  background:"#ffffff",lineColor:"#000000"
});
<\/script>

</body>
</html>`;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
