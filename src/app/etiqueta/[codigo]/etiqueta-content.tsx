"use client";

// ════════════════════════════════════════════════════════════════════════════
// etiqueta-content — Etiqueta térmica 4×6 Chambatina.
// Template exacto con logo centrado arriba, campos y municipio/provincia.
// ════════════════════════════════════════════════════════════════════════════

interface EtiquetaData {
  codigo: string;
  remitente: string;
  remitenteTel?: string | null;
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
        <button onClick={() => window.print()} style={{ padding: "12px 28px", borderRadius: 8, background: "#C23B22", color: "#fff", border: "none", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>IMPRIMIR ETIQUETA 4×6</button>
        <a href={`/hbl/${cod}`} target="_blank" style={{ marginLeft: 8, padding: "12px 20px", borderRadius: 8, background: "#374151", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>HBL</a>
        <a href="/bol" target="_blank" style={{ marginLeft: 8, padding: "12px 20px", borderRadius: 8, background: "#374151", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>MANIFIESTO</a>
        <a href="/nuevo-paquete" style={{ marginLeft: 8, padding: "12px 20px", borderRadius: 8, background: "#374151", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>NUEVA</a>
        <a href="/" style={{ marginLeft: 8, padding: "12px 20px", borderRadius: 8, background: "#374151", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>INICIO</a>
      </div>

      <div className="label">

        {/* LOGO CHAMBATINA centrado */}
        <div className="label-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/chambatina.png" alt="Chambatina" />
        </div>

        {/* GUÍA */}
        <div className="guide">{guia}</div>

        {/* EMBARCADOR */}
        <div className="field">
          <div className="field-title">EMBARC.:</div>
          <div className="field-value">{upper(p.remitente)}</div>
        </div>

        {/* CONSIGNATARIO */}
        <div className="field">
          <div className="field-title">CONSIGNATARIO:</div>
          <div className="field-value">{upper(p.destinatario)}</div>
        </div>

        {/* CARNET */}
        <div className="field">
          <div className="field-title">CARNET:</div>
          <div className="field-value">{upper(p.consignatarioCarnet) || "—"}</div>
        </div>

        {/* TELÉFONO */}
        <div className="field">
          <div className="field-title">TELEF.:</div>
          <div className="field-value">{p.consignatarioTel || "—"}</div>
        </div>

        {/* DIRECCIÓN */}
        <div className="field">
          <div className="field-value">{upper(p.consignatarioCalle)}</div>
        </div>

        {/* MUNICIPIO */}
        <div className="destination">{upper(p.consignatarioMunicipio) || "—"}</div>

        {/* PROVINCIA */}
        <div className="destination">{upper(p.consignatarioProvincia) || "CUBA"}</div>

        {/* ENVIO / PESO / BULTO */}
        <div className="field" style={{ display: "flex", justifyContent: "space-between", marginTop: "0.06in" }}>
          <div className="field-value">ENVIO</div>
          <div className="field-value">PESO: {pesoKg.toFixed(2)} KG</div>
          <div className="field-value">BULTO: {bulto}</div>
        </div>

        {/* BARCODE */}
        <div className="barcode-area">
          <div className="barcode-bars">
            <Barcode128 code={cod.replace(/-/g, "")} />
          </div>
          <div className="barcode-number">{cod.replace(/-/g, "")}</div>
        </div>
      </div>
    </>
  );
}

import { useEffect, useRef } from "react";
function Barcode128({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      const JsBarcode = require("jsbarcode");
      JsBarcode(canvasRef.current, code, {
        format: "CODE128", width: 2, height: 48, margin: 0, displayValue: false,
        background: "#ffffff", lineColor: "#000000",
      });
    } catch (e) { console.error("jsbarcode", e); }
  }, [code]);
  return <canvas ref={canvasRef} style={{ width: "3.25in", height: "0.43in" }} />;
}
