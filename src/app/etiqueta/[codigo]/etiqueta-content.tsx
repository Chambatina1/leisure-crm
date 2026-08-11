"use client";

// ════════════════════════════════════════════════════════════════════════════
// etiqueta-content — Réplica EXACTA de la etiqueta de solvecargo.
// Estructura:
//   1. Header: logo centrado-izquierda + QR derecha (150px)
//   2. Número de guía centrado gigante
//   3. EMBARC. (fila con título + valor)
//   4. CONSIGNATARIO título + nombre grande
//   5. CARNET (fila)
//   6. DIRECCION
//   7. PROVINCIA centrada
//   8. TELEF. (fila)
//   9. PRODUCTO centrado
//   10. ENVIO / PESO / BULTO (3 columnas)
//   11. Barcode Code128 + texto
//   12. DESTINO final gigante
// ════════════════════════════════════════════════════════════════════════════

interface EtiquetaData {
  codigo: string;
  remitente: string;
  destinatario: string;
  consignatarioCarnet?: string | null;
  consignatarioTel?: string | null;
  consignatarioCalle?: string | null;
  consignatarioMunicipio?: string | null;
  consignatarioProvincia?: string | null;
  peso: number;
  pesoKg?: number | null;
  piezas: number;
  contenido: string;
  creado: string | Date;
  hawb?: string | null;
}

const upper = (s?: string | null) => (s || "").toUpperCase();

export default function EtiquetaContent({ p, brands = [] }: { p: EtiquetaData; brands?: { nombre: string; logo: string }[] }) {
  const cod = p.codigo;
  const guia = p.hawb || cod;
  const pesoKg = p.pesoKg ?? (Number(p.peso) * 0.453592);
  const pesoLb = Number(p.peso) || 0;
  const bulto = `${p.piezas} / ${p.piezas}`;
  const barcodeText = cod.replace(/-/g, "");

  return (
    <>
      <div className="no-print etq-toolbar">
        <button onClick={() => window.print()}>IMPRIMIR ETIQUETA</button>
        <a href={`/hbl/${cod}`} target="_blank" className="etq-link">VER HBL</a>
        <a href="/bol" target="_blank" className="etq-link">MANIFIESTO</a>
        <a href="/nuevo-paquete" className="etq-link">NUEVA</a>
        <a href="/" className="etq-link">INICIO</a>
      </div>

      <div className="label">
        {/* CABECERA: logo + QR */}
        <div className="header">
          <div className="logo-area">
            {brands.length > 0 ? (
              brands.map(b => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={b.nombre} src={b.logo} alt={b.nombre} />
              ))
            ) : (
              <div className="fake-logo">
                <div><span className="cargo">GRUPO</span> <span className="pack">EMPRESARIAL</span></div>
                <div className="international">INTERNATIONAL</div>
              </div>
            )}
          </div>
          <div className="qr-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/paquetes/${cod}/qr`} alt="QR" width="150" height="150" />
          </div>
        </div>

        {/* NÚMERO DE GUÍA */}
        <div className="guide-number">{guia}</div>

        {/* EMBARCADOR */}
        <div className="row">
          <div className="title">EMBARC.:</div>
          <div className="value">{upper(p.remitente)}</div>
        </div>

        {/* CONSIGNATARIO */}
        <div className="consig-title">CONSIGNATARIO:</div>
        <div className="consig-name">{upper(p.destinatario)}</div>

        {/* CARNET */}
        <div className="row">
          <div className="title">CARNET:</div>
          <div>{upper(p.consignatarioCarnet) || "—"}</div>
        </div>

        {/* DIRECCION */}
        <div className="address">{upper(p.consignatarioCalle)}</div>

        {/* PROVINCIA (primera mención) */}
        <div className="province">{upper(p.consignatarioProvincia) || "CUBA"}</div>

        {/* TELEFONO */}
        <div className="phone-row">
          <div className="title">TELEF.:</div>
          <div>{p.consignatarioTel || "—"}</div>
        </div>

        {/* PRODUCTO */}
        <div className="product">{upper(p.contenido)}</div>

        {/* ENVIO / PESO / BULTO */}
        <div className="shipping-info">
          <div>ENVIO</div>
          <div>PESO: {pesoKg.toFixed(2)} KG</div>
          <div>BULTO: {bulto}</div>
        </div>

        {/* BARCODE */}
        <div className="barcode-area">
          <div className="barcode-bars">
            <Barcode128 code={barcodeText} />
          </div>
          <div className="barcode-text">{barcodeText}</div>
        </div>

        {/* DESTINO FINAL */}
        <div className="destination">{upper(p.consignatarioProvincia) || "CUBA"}</div>
      </div>
    </>
  );
}

// Barcode Code128 real
import { useEffect, useRef } from "react";
function Barcode128({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      const JsBarcode = require("jsbarcode");
      JsBarcode(canvasRef.current, code, {
        format: "CODE128", width: 2, height: 90, displayValue: false, margin: 0,
        background: "#ffffff", lineColor: "#000000",
      });
    } catch (e) { console.error("jsbarcode", e); }
  }, [code]);
  return <canvas ref={canvasRef} style={{ width: 540, height: 90 }} />;
}
