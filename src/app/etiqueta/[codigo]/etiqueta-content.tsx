"use client";

// ════════════════════════════════════════════════════════════════════════════
// etiqueta-content — Etiqueta térmica 4×6 EXACTA.
// Todas las medidas en pulgadas (in) para impresión térmica precisa.
// Template basado en el código de referencia de Vuela Cargo.
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

export default function EtiquetaContent({ p }: { p: EtiquetaData; brands?: any[] }) {
  const cod = p.codigo;
  const guia = p.hawb || cod;
  const pesoKg = p.pesoKg ?? (Number(p.peso) * 0.453592);
  const bulto = `${p.piezas} / ${p.piezas}`;

  return (
    <>
      <div className="no-print" style={{ textAlign: "center", padding: 14, background: "#fff", borderBottom: "1px solid #ccc" }}>
        <button onClick={() => window.print()} style={{ padding: "12px 28px", borderRadius: 8, background: "#159dac", color: "#fff", border: "none", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>IMPRIMIR ETIQUETA 4×6</button>
        <a href={`/hbl/${cod}`} target="_blank" style={{ marginLeft: 10, padding: "12px 20px", borderRadius: 8, background: "#374151", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>HBL</a>
        <a href="/bol" target="_blank" style={{ marginLeft: 10, padding: "12px 20px", borderRadius: 8, background: "#374151", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>MANIFIESTO</a>
        <a href="/nuevo-paquete" style={{ marginLeft: 10, padding: "12px 20px", borderRadius: 8, background: "#374151", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>NUEVA</a>
        <a href="/" style={{ marginLeft: 10, padding: "12px 20px", borderRadius: 8, background: "#374151", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>INICIO</a>
      </div>

      <div className="label">
        {/* CABECERA: Logo izq + QR der */}
        <div className="header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/vuela-cargo-logo.svg" className="logo" alt="Vuela Cargo" />
          <div className="qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/paquetes/${cod}/qr`} alt="QR" width="180" height="180" />
          </div>
        </div>

        {/* NÚMERO DE GUÍA */}
        <div className="guide">{guia}</div>

        {/* EMBARCADOR */}
        <div className="row">
          <div className="label-title">EMBARC.:</div>
          <div className="label-value">{upper(p.remitente)}</div>
        </div>

        {/* CONSIGNATARIO */}
        <div className="section-title">CONSIGNATARIO:</div>
        <div className="consignee">{upper(p.destinatario)}</div>

        {/* CARNET */}
        <div className="row">
          <div className="label-title">CARNET:</div>
          <div className="label-value">{upper(p.consignatarioCarnet) || "—"}</div>
        </div>

        {/* DIRECCIÓN */}
        <div className="address">{upper(p.consignatarioCalle)}</div>

        {/* MUNICIPIO */}
        <div className="municipality">{upper(p.consignatarioMunicipio) || "—"}</div>

        {/* PROVINCIA */}
        <div className="province">{upper(p.consignatarioProvincia) || "CUBA"}</div>

        {/* TELÉFONO */}
        <div className="row">
          <div className="label-title">TELEF.:</div>
          <div className="label-value">{p.consignatarioTel || "—"}</div>
        </div>

        {/* PRODUCTO */}
        <div className="product">{upper(p.contenido)}</div>

        {/* ENVIO / PESO / BULTO */}
        <div className="shipping">
          <span>ENVIO</span>
          <span>PESO: {pesoKg.toFixed(2)} KG</span>
          <span>BULTO: {bulto}</span>
        </div>

        {/* BARCODE */}
        <div className="barcode-container">
          <div className="barcode-bars">
            <Barcode128 code={cod.replace(/-/g, "")} />
          </div>
          <div className="barcode-number">{cod.replace(/-/g, "")}</div>
        </div>

        {/* DESTINO FINAL */}
        <div className="destination">{upper(p.consignatarioProvincia) || "CUBA"}</div>
      </div>
    </>
  );
}

// Barcode Code128
import { useEffect, useRef } from "react";
function Barcode128({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      const JsBarcode = require("jsbarcode");
      JsBarcode(canvasRef.current, code, {
        format: "CODE128", width: 2, height: 55, displayValue: false, margin: 0,
        background: "#ffffff", lineColor: "#000000",
      });
    } catch (e) { console.error("jsbarcode", e); }
  }, [code]);
  return <canvas ref={canvasRef} style={{ width: "3.25in", height: "0.48in" }} />;
}
