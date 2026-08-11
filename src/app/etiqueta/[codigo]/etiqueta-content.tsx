"use client";

// ════════════════════════════════════════════════════════════════════════════
// etiqueta-content — Etiqueta térmica 4×6 estilo solvecargo.
//
// Campos (orden exacto):
//   1. LOGO izquierda + QR derecha (arriba)
//   2. GUÍA/HAWB centrado grande
//   3. Lateral derecho: EMBARC, CONSIGNATARIO, CARNET, DIRECCION
//   4. DESCRIPCION del producto
//   5. ENVIO + PESO (kg) + BULTO (extremo derecho)
//   6. PROVINCIA/ISLA gigante centrada (mayúscula cerrada)
//   7. TEL al costado
//   8. Barcode Code128 abajo centrado
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
  const bulto = `${p.piezas} / ${p.piezas}`;

  return (
    <>
      <div className="no-print etq-toolbar">
        <button onClick={() => window.print()}>IMPRIMIR ETIQUETA</button>
        <a href={`/hbl/${cod}`} target="_blank" className="etq-link">VER HBL</a>
        <a href="/bol" target="_blank" className="etq-link">MANIFIESTO</a>
        <a href="/nuevo-paquete" className="etq-link">NUEVA</a>
        <a href="/" className="etq-link">INICIO</a>
      </div>

      <div className="etq">
        {/* ── 1. LOGO izquierda + QR derecha ── */}
        <div className="etq-top">
          <div className="etq-logos">
            {brands.map(b => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={b.nombre} src={b.logo} alt={b.nombre} className="etq-logo" />
            ))}
          </div>
          <div className="etq-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/paquetes/${cod}/qr`} alt="QR" width="90" height="90" />
          </div>
        </div>

        {/* ── 2. GUÍA centrado grande ── */}
        <div className="etq-guia">{guia}</div>

        {/* ── 3. Cuerpo principal: datos lateral derecho ── */}
        <div className="etq-cuerpo">
          <div className="etq-campos">
            <div className="etq-campo">
              <label>EMBARC:</label>
              <div className="etq-val">{upper(p.remitente)}</div>
            </div>
            <div className="etq-campo">
              <label>CONSIGNATARIO:</label>
              <div className="etq-val">{upper(p.destinatario)}</div>
            </div>
            <div className="etq-campo">
              <label>CARNET:</label>
              <div className="etq-val">{upper(p.consignatarioCarnet) || "—"}</div>
            </div>
            <div className="etq-campo">
              <label>DIRECCION:</label>
              <div className="etq-val">{upper(p.consignatarioCalle)}</div>
            </div>
            <div className="etq-campo">
              <label>DESCRIPCION:</label>
              <div className="etq-val">{upper(p.contenido)}</div>
            </div>
          </div>
        </div>

        {/* ── 5. ENVIO + PESO + BULTO (extremo derecho) ── */}
        <div className="etq-extra">
          <div className="etq-extra-item"><label>ENVIO:</label><b>MARITIMO</b></div>
          <div className="etq-extra-item"><label>PESO:</label><b>{pesoKg.toFixed(2)} KG</b></div>
          <div className="etq-extra-item"><label>BULTO:</label><b>{bulto}</b></div>
          <div className="etq-extra-item etq-tel-item"><label>TEL:</label><b>{p.consignatarioTel || "—"}</b></div>
        </div>

        {/* ── 6. PROVINCIA/ISLA gigante centrada ── */}
        <div className="etq-provincia">
          {upper(p.consignatarioProvincia) || "CUBA"}
        </div>

        {/* ── 8. Barcode Code128 abajo ── */}
        <div className="etq-barcode-area">
          <div className="etq-barcode-bars">
            <Barcode128 code={cod} />
          </div>
          <div className="etq-barcode-num">*{cod}*</div>
        </div>
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
        format: "CODE128", width: 2, height: 50, displayValue: false, margin: 0,
        background: "#ffffff", lineColor: "#000000",
      });
    } catch (e) { console.error("jsbarcode", e); }
  }, [code]);
  return <canvas ref={canvasRef} style={{ width: "100%", height: 50 }} />;
}
