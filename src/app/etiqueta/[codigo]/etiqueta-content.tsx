"use client";

// ════════════════════════════════════════════════════════════════════════════
// etiqueta-content — Client Component. Etiqueta térmica 4×6 replica exacta
// del formato de referencia: grid de campos compacto, todo mayúsculas,
// logo arriba, barcode + tracking abajo, QR lateral.
// ════════════════════════════════════════════════════════════════════════════

interface EtiquetaData {
  codigo: string;
  remitente: string;
  remitenteCarnet?: string | null;
  remitenteTel?: string | null;
  remitenteDir?: string | null;
  destinatario: string;
  consignatarioCarnet?: string | null;
  consignatarioTel?: string | null;
  consignatarioCalle?: string | null;
  consignatarioEntre?: string | null;
  consignatarioMunicipio?: string | null;
  consignatarioProvincia?: string | null;
  peso: number;
  pesoKg?: number | null;
  piezas: number;
  contenido: string;
  categoria?: string | null;
  notas?: string;
  creado: string | Date;
  agenciaNombre?: string;
  destino?: string;
  hawb?: string | null;
}

export default function EtiquetaContent({ p, brands = [] }: { p: EtiquetaData; brands?: { nombre: string; logo: string }[] }) {
  const cod = p.codigo;
  const fecha = new Date(p.creado).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const pesoKg = p.pesoKg ?? (Number(p.peso) * 0.453592);
  // Direccion completa: calle + entre calles + municipio + provincia (todo en una linea)
  const direccionCompleta = [
    upper(p.consignatarioCalle),
    p.consignatarioEntre ? `E/ ${upper(p.consignatarioEntre)}` : null,
    upper(p.consignatarioMunicipio),
    upper(p.consignatarioProvincia),
  ].filter(Boolean).join(", ");
  const hawb = p.hawb || cod;

  const upper = (s?: string | null) => (s || "").toUpperCase();

  return (
    <>
      <div className="no-print etq-toolbar">
        <button onClick={() => window.print()}>IMPRIMIR ETIQUETA</button>
        <a href="/nuevo-paquete" className="etq-link">NUEVA ETIQUETA</a>
        <a href="/bol" className="etq-link">MANIFIESTO</a>
        <a href="/" className="etq-link">INICIO</a>
      </div>

      <div className="etq">
        {/* ── FILA 1: Logos del grupo + K ── */}
        <div className="etq-top">
          <div className="etq-grupo">
            {brands.map(b => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={b.nombre} src={b.logo} alt={b.nombre} className="etq-logo-blanco" />
            ))}
          </div>
          <div className="etq-k">K</div>
        </div>

        {/* ── FILA 2: Tracking (HAWB) grande ── */}
        <div className="etq-hawb">
          <span className="etq-hawb-label">HBL / HAWB</span>
          <span className="etq-hawb-num">{hawb}</span>
        </div>

        {/* ── FILA 3: EMBARCADOR (chico) + datos secundarios ── */}
        <div className="etq-grid">
          <div className="etq-field etq-field-wide">
            <label>EMBARCADOR</label>
            <div className="etq-field-val">{upper(p.remitente)}</div>
          </div>
          <div className="etq-field">
            <label>CARNET / ID</label>
            <div className="etq-field-val">{upper(p.consignatarioCarnet) || "—"}</div>
          </div>
          <div className="etq-field">
            <label>TELEFONO</label>
            <div className="etq-field-val">{p.consignatarioTel || "—"}</div>
          </div>
          <div className="etq-field etq-field-wide">
            <label>DIRECCION</label>
            <div className="etq-field-val">{direccionCompleta}</div>
          </div>
        </div>

        {/* ── CONSIGNATARIO DESTACADO — lo más grande de la etiqueta ── */}
        <div className="etq-dest">
          <label className="etq-dest-label">CONSIGNATARIO</label>
          <div className="etq-dest-nombre">{upper(p.destinatario)}</div>
          <div className="etq-dest-loc">
            <span className="etq-dest-mun">{upper(p.consignatarioMunicipio) || "—"}</span>
            <span className="etq-dest-sep">·</span>
            <span className="etq-dest-prov">{upper(p.consignatarioProvincia) || "LA HABANA"}</span>
          </div>
        </div>

        {/* ── FILA 4: Descripción + Envío ── */}
        <div className="etq-grid">
          <div className="etq-field etq-field-wide">
            <label>DESCRIPCION</label>
            <div className="etq-field-val">{upper(p.contenido)}{p.categoria ? ` · ${upper(p.categoria)}` : ""}</div>
          </div>
          <div className="etq-field">
            <label>FECHA ENVIO</label>
            <div className="etq-field-val">{fecha}</div>
          </div>
        </div>

        {/* ── FILA 5: Peso / Bultos / Piezas — cajas grandes ── */}
        <div className="etq-peso-row">
          <div className="etq-peso-box">
            <label>PESO LB</label>
            <div className="etq-peso-val">{Number(p.peso).toFixed(1)}</div>
          </div>
          <div className="etq-peso-box">
            <label>PESO KG</label>
            <div className="etq-peso-val">{Number(pesoKg).toFixed(2)}</div>
          </div>
          <div className="etq-peso-box">
            <label>BULTOS</label>
            <div className="etq-peso-val">{p.piezas}</div>
          </div>
          <div className="etq-peso-box etq-qr-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/paquetes/${cod}/qr`} alt="QR" width="88" height="88" />
          </div>
        </div>

        {/* ── FILA 6: Barcode + número ── */}
        <div className="etq-barcode-area">
          <div className="etq-barcode-bars">
            <Barcode128 code={cod} />
          </div>
          <div className="etq-barcode-num">*{cod}*</div>
        </div>

        {/* ── FILA 7: Footer ── */}
        <div className="etq-footer">
          GRUPO EMPRESARIAL · +1 727-598-6802
        </div>
      </div>
    </>
  );
}

// Barcode Code128 REAL — escaneable por lectores de código de barras físicos.
// Usa jsbarcode para generar el patrón correcto sobre un <canvas>.
import { useEffect, useRef } from "react";
function Barcode128({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      const JsBarcode = require("jsbarcode");
      JsBarcode(canvasRef.current, code, {
        format: "CODE128",
        width: 2,           // ancho de barra fina
        height: 50,         // altura
        displayValue: false, // el número se muestra abajo aparte
        margin: 0,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch (e) { console.error("jsbarcode error", e); }
  }, [code]);
  return <canvas ref={canvasRef} style={{ width: "100%", height: 50 }} />;
}
