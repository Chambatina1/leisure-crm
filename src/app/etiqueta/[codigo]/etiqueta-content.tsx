"use client";

// ════════════════════════════════════════════════════════════════════════════
// etiqueta-content — Etiqueta térmica 4×6 Chambatina.
// Template profesional con borde, secciones y barcode absoluto abajo.
// Todas las medidas en pulgadas (in).
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
  const fecha = new Date(p.creado).toLocaleDateString("sv-SE"); // YYYY-MM-DD
  const dirDest = upper(p.consignatarioCalle) + (p.consignatarioMunicipio ? `, MC: ${upper(p.consignatarioMunicipio)}` : "");

  return (
    <>
      <div className="no-print" style={{ textAlign: "center", padding: 14, background: "#fff", borderBottom: "1px solid #ccc" }}>
        <button onClick={() => window.print()} style={{ padding: "12px 28px", borderRadius: 8, background: "#159dac", color: "#fff", border: "none", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>IMPRIMIR ETIQUETA 4×6</button>
        <a href={`/hbl/${cod}`} target="_blank" style={{ marginLeft: 8, padding: "12px 20px", borderRadius: 8, background: "#374151", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>HBL</a>
        <a href="/bol" target="_blank" style={{ marginLeft: 8, padding: "12px 20px", borderRadius: 8, background: "#374151", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>MANIFIESTO</a>
        <a href="/nuevo-paquete" style={{ marginLeft: 8, padding: "12px 20px", borderRadius: 8, background: "#374151", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>NUEVA</a>
        <a href="/" style={{ marginLeft: 8, padding: "12px 20px", borderRadius: 8, background: "#374151", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>INICIO</a>
      </div>

      <div className="label">
        <div className="label-border">

          {/* CABECERA */}
          <div className="header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/chambatina.png" alt="Chambatina" className="etq-brand-logo" />
            <div className="brand">CHAMBATINA</div>
          </div>

          {/* REMITENTE */}
          <div className="from">
            <div>
              <div className="caption">De/From</div>
              <div className="value">{upper(p.remitente)}</div>
            </div>
            <div>
              <div className="caption">Teléfono(s)/Phone(s)</div>
              <div className="value-bold">{p.remitenteTel || "—"}</div>
            </div>
          </div>

          <div className="line"></div>

          {/* DESTINO DEL ENVÍO */}
          <div className="shipping-destination">
            <div className="caption">DESTINO DEL ENVÍO / SHIPPING DESTINATION</div>
            <div className="destination-name">
              Chambatina, Centro de Distribución<br />
              Ciudad Verde, Km 3½, Carretera y Línea del Ferrocarril,<br />
              Cotorro, La Habana, Cuba
            </div>
          </div>

          <div className="line"></div>

          {/* TIPO DE ENVÍO */}
          <div className="shipping-type">
            <div className="caption">Tipo de envío / Shipping type</div>
            <div className="value-bold">CARGA MARÍTIMA</div>
          </div>

          <div className="line"></div>

          {/* DESTINATARIO */}
          <div className="receiver">
            <div>
              <div className="caption">A/To</div>
              <div className="receiver-name">{upper(p.destinatario)}</div>
              <div className="receiver-address">
                {dirDest}<br />
                {upper(p.consignatarioProvincia) || "CUBA"}
              </div>
            </div>
            <div>
              <div className="caption">Teléfono(s)/Phone(s)</div>
              <div className="value-bold">{p.consignatarioTel || "—"}</div>
              <br />
              <div className="caption">Carnet de Identidad/ID</div>
              <div className="value-bold">{upper(p.consignatarioCarnet) || "—"}</div>
            </div>
          </div>

          <div className="line"></div>

          {/* CÓDIGO + QR */}
          <div className="code-area">
            <div>
              <div className="caption">Código del envío / Shipping code</div>
              <div className="shipping-code">{guia}</div>

              <div className="dpa">
                <span>DPA</span>
                <strong>{fecha.slice(5).replace("-", ".")}</strong>
              </div>

              <div className="detail-block">
                <div className="caption">Fecha de despacho / Dispatch date</div>
                <div className="value">{fecha}</div>
              </div>

              <div className="detail-block">
                <div className="caption">Síntesis del contenido / Summary of content</div>
                <div className="contents">{upper(p.contenido)}</div>
              </div>

              <div className="weight-size">
                <div>
                  <div className="caption">Peso/Weight</div>
                  <div className="value">{pesoKg.toFixed(2)} kg</div>
                </div>
                <div>
                  <div className="caption">Tamaño/Size</div>
                  <div className="value">—</div>
                </div>
              </div>

              <div className="value-items">
                <div>
                  <div className="caption">Valor/Value</div>
                  <div className="value">0 USD</div>
                </div>
                <div>
                  <div className="caption">Item(s)/Item(s)</div>
                  <div className="value">{p.piezas} DE {p.piezas}</div>
                </div>
              </div>
            </div>

            {/* QR */}
            <div className="qr-side">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/paquetes/${cod}/qr`} alt="QR" width="225" height="225" style={{ width: "1.17in", height: "1.17in" }} />
            </div>
          </div>

          {/* BARCODE abajo absoluto */}
          <div className="barcode-area">
            <Barcode128 code={cod.replace(/-/g, "")} />
          </div>

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
