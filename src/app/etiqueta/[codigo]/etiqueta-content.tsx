"use client";

// ════════════════════════════════════════════════════════════════════════════
// etiqueta-content — Etiqueta térmica 4×6.
// Disposición estilo referencia (ikomsoft):
//   - LOGO arriba izquierda + QR arriba derecha
//   - TRACKING (código) centrado grande
//   - Lateral derecho: EMBARC, CONSIGNATARIO, CARNET, DIRECCION
//   - Centro: MUNICIPIO/ISLA en letra gigante mayúscula
//   - Barcode Code128 abajo centrado
// ════════════════════════════════════════════════════════════════════════════

interface EtiquetaData {
  codigo: string;
  remitente: string;
  remitenteCarnet?: string | null;
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
  agenciaNombre?: string;
  hawb?: string | null;
}

const upper = (s?: string | null) => (s || "").toUpperCase();

export default function EtiquetaContent({ p, brands = [] }: { p: EtiquetaData; brands?: { nombre: string; logo: string }[] }) {
  const cod = p.codigo;
  const fecha = new Date(p.creado).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const pesoKg = p.pesoKg ?? (Number(p.peso) * 0.453592);
  const hawb = p.hawb || cod;

  return (
    <>
      <div className="no-print etq-toolbar">
        <button onClick={() => window.print()}>IMPRIMIR ETIQUETA</button>
        <a href={`/hbl/${cod}`} target="_blank" className="etq-link">VER HBL</a>
        <a href="/bol" target="_blank" className="etq-link">MANIFIESTO</a>
        <a href="/nuevo-paquete" className="etq-link">NUEVA ETIQUETA</a>
        <a href="/" className="etq-link">INICIO</a>
      </div>

      <div className="etq">
        {/* ── FILA 1: LOGO izquierda + QR derecha ── */}
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

        {/* ── FILA 2: TRACKING centrado grande ── */}
        <div className="etq-tracking">
          <div className="etq-tracking-num">{hawb}</div>
        </div>

        {/* ── FILA 3: DOS COLUMNAS — peso/fecha izq + datos lateral der ── */}
        <div className="etq-main">
          {/* Columna izquierda: peso, piezas, fecha */}
          <div className="etq-izq">
            <div className="etq-dato-box">
              <small>PESO LB</small>
              <b>{Number(p.peso).toFixed(1)}</b>
            </div>
            <div className="etq-dato-box">
              <small>PESO KG</small>
              <b>{pesoKg.toFixed(2)}</b>
            </div>
            <div className="etq-dato-box">
              <small>PIEZAS</small>
              <b>{p.piezas}</b>
            </div>
            <div className="etq-dato-box">
              <small>FECHA</small>
              <b style={{ fontSize: 12 }}>{fecha}</b>
            </div>
          </div>

          {/* Columna derecha: EMBARC, CONSIGNATARIO, CARNET, DIRECCION, DESCRIPCION */}
          <div className="etq-der">
            <div className="etq-campo">
              <label>EMBARC:</label>
              <div className="etq-campo-val">{upper(p.remitente)}</div>
            </div>
            <div className="etq-campo">
              <label>CONSIGNATARIO:</label>
              <div className="etq-campo-val">{upper(p.destinatario)}</div>
            </div>
            <div className="etq-campo">
              <label>CARNET:</label>
              <div className="etq-campo-val">{upper(p.consignatarioCarnet) || "—"}</div>
            </div>
            <div className="etq-campo">
              <label>DIRECCION:</label>
              <div className="etq-campo-val">{upper(p.consignatarioCalle)}</div>
            </div>
            <div className="etq-campo">
              <label>DESCRIPCION:</label>
              <div className="etq-campo-val">{upper(p.contenido)}</div>
            </div>
            <div className="etq-campo etq-campo-inline">
              <label>ENVIO:</label>
              <b>MARITIMO</b>
              <label style={{ marginLeft: 12 }}>PESO:</label>
              <b>{pesoKg.toFixed(2)} KG</b>
            </div>
          </div>
        </div>

        {/* ── FILA 4: MUNICIPIO/ISLA — letra GIGANTE centrada + TEL derecha ── */}
        <div className="etq-dest-row">
          <div className="etq-destino">
            {upper(p.consignatarioMunicipio) || "—"}
          </div>
          {p.consignatarioTel && (
            <div className="etq-dest-tel">
              <small>TEL:</small>
              <b>{p.consignatarioTel}</b>
            </div>
          )}
        </div>

        {/* ── FILA 5: Barcode Code128 abajo centrado ── */}
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

// Barcode Code128 real — escaneable por lectores físicos
import { useEffect, useRef } from "react";
function Barcode128({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      const JsBarcode = require("jsbarcode");
      JsBarcode(canvasRef.current, code, {
        format: "CODE128",
        width: 2, height: 50, displayValue: false, margin: 0,
        background: "#ffffff", lineColor: "#000000",
      });
    } catch (e) { console.error("jsbarcode error", e); }
  }, [code]);
  return <canvas ref={canvasRef} style={{ width: "100%", height: 50 }} />;
}
