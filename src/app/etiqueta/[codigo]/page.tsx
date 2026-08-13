import { db } from "@/lib/db";

// ════════════════════════════════════════════════════════════════════════════
// /etiqueta/[codigo] — Etiqueta térmica 4×6.
// HTML EXACTO sin React. El servidor inyecta los datos del paquete.
// ════════════════════════════════════════════════════════════════════════════
export const dynamic = "force-dynamic";

export default async function EtiquetaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cod = codigo.toUpperCase().replace(/[^A-Z0-9-]/g, "");

  let p;
  let brands: any[] = [];
  try {
    p = await db.paquete.findUnique({
      where: { codigo: cod },
      include: { agencia: { select: { nombre: true } } },
    });
    brands = await db.brand.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
      select: { nombre: true, logo: true },
    });
  } catch (e: any) {
    return <html><body style={{ padding: 40, fontFamily: "Arial" }}><h2>Error</h2><p>{String(e?.message || e).slice(0, 200)}</p></body></html>;
  }

  if (!p) {
    return <html><body style={{ padding: 40, fontFamily: "Arial" }}><h2>Etiqueta no encontrada</h2><p>Código: {cod}</p><a href="/">Volver</a></body></html>;
  }

  const guia = (p as any).hawb || cod;
  const pesoKg = (p as any).pesoKg ?? Number((p as any).peso) * 0.453592;
  const upper = (s: any) => String(s || "").toUpperCase();
  const fecha = new Date((p as any).creado).toLocaleDateString("sv-SE");
  const barcodeNum = cod.replace(/-/g, "");
  const bulto = `${(p as any).piezas} / ${(p as any).piezas}`;
  const logoBrand = brands[0]?.logo ? brands[0].logo : "/logos/chambatina.png";

  // HTML EXACTO - template del usuario con datos inyectados
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Etiqueta ${cod}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
html,body{margin:0;padding:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#000;}

.label{
  width:4in;height:6in;padding:0.12in;
  background:#fff;color:#000;overflow:hidden;position:relative;
}

/* LOGO */
.label-logo{
  width:100%;height:0.85in;
  display:flex;justify-content:center;align-items:center;
  margin-bottom:0.04in;gap:0.10in;
}
.label-logo .logo-main{width:0.82in;height:0.82in;object-fit:contain;}
.label-logo .logo-small{width:0.40in;height:0.40in;object-fit:contain;}

/* GUIA */
.guide{text-align:center;font-size:0.32in;font-weight:900;margin-bottom:0.08in;}

/* CAMPOS */
.field{margin-bottom:0.07in;}
.field-title{font-size:0.14in;font-weight:900;}
.field-value{font-size:0.18in;font-weight:700;}

/* DESTINO */
.destination{
  text-align:center;font-size:0.28in;font-weight:900;
  border-top:2px solid #000;border-bottom:2px solid #000;
  padding:0.05in;margin:0.08in 0;
}

/* SHIPPING */
.shipping{
  display:flex;justify-content:space-between;
  width:100%;font-size:0.16in;font-weight:900;margin-top:0.06in;
}

/* BARCODE */
.barcode-area{text-align:center;width:100%;margin-top:0.10in;}

/* BOTON (no imprime) */
.print-btn{
  display:block;margin:20px auto;padding:12px 28px;
  border-radius:8px;background:#C23B22;color:#fff;
  border:none;font-weight:800;font-size:16px;cursor:pointer;
}

@media print{
  @page{size:4in 6in;margin:0;}
  html,body{width:4in !important;height:6in !important;margin:0 !important;padding:0 !important;overflow:hidden !important;}
  .no-print{display:none !important;}
  .label{width:4in !important;height:6in !important;margin:0 !important;break-inside:avoid;page-break-inside:avoid;overflow:hidden !important;}
  .label-logo img{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
}
@media screen{body{background:#ddd;display:flex;flex-direction:column;align-items:center;padding:30px;}.label{box-shadow:0 3px 12px rgba(0,0,0,.25);}}
</style>
</head>
<body>

<button class="print-btn no-print" onclick="window.print()">IMPRIMIR ETIQUETA 4x6</button>
<a href="/hbl/${cod}" target="_blank" class="no-print" style="display:block;text-align:center;margin-bottom:10px;color:#C23B22;font-weight:700;">VER HBL</a>
<a href="/bol" target="_blank" class="no-print" style="display:block;text-align:center;margin-bottom:10px;color:#374151;font-weight:700;">VER MANIFIESTO</a>
<a href="/nuevo-paquete" class="no-print" style="display:block;text-align:center;margin-bottom:10px;color:#374151;font-weight:700;">NUEVA ETIQUETA</a>

<div class="label">

  <!-- LOGO -->
  <div class="label-logo">
    <img src="${logoBrand}" alt="Logo" class="logo-main" />
    <img src="/logos/chambatina.png" alt="Chambatina" class="logo-small" />
  </div>

  <!-- GUIA -->
  <div class="guide">${guia}</div>

  <!-- EMBARCADOR -->
  <div class="field">
    <div class="field-title">EMBARC.:</div>
    <div class="field-value">${upper((p as any).remitente)}</div>
  </div>

  <!-- CONSIGNATARIO -->
  <div class="field">
    <div class="field-title">CONSIGNATARIO:</div>
    <div class="field-value">${upper((p as any).destinatario)}</div>
  </div>

  <!-- CARNET -->
  <div class="field">
    <div class="field-title">CARNET:</div>
    <div class="field-value">${upper((p as any).consignatarioCarnet) || "—"}</div>
  </div>

  <!-- TELEFONO -->
  <div class="field">
    <div class="field-title">TELEF.:</div>
    <div class="field-value">${(p as any).consignatarioTel || "—"}</div>
  </div>

  <!-- DIRECCION -->
  <div class="field">
    <div class="field-value">${upper((p as any).consignatarioCalle)}</div>
  </div>

  <!-- MUNICIPIO -->
  <div class="destination">${upper((p as any).consignatarioMunicipio) || "—"}</div>

  <!-- PROVINCIA -->
  <div class="destination">${upper((p as any).consignatarioProvincia) || "CUBA"}</div>

  <!-- ENVIO / PESO / BULTO -->
  <div class="shipping">
    <span>ENVIO</span>
    <span>PESO: ${pesoKg.toFixed(2)} KG</span>
    <span>BULTO: ${bulto}</span>
  </div>

  <!-- BARCODE -->
  <div class="barcode-area">
    <svg id="barcode"></svg>
  </div>

</div>

<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script>
JsBarcode("#barcode", "${barcodeNum}", {
  format:"CODE128",
  width:2,
  height:48,
  margin:0,
  displayValue:true,
  fontSize:14,
  background:"#ffffff",
  lineColor:"#000000"
});
</script>

</body>
</html>`;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
