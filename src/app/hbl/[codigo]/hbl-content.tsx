"use client";

// ════════════════════════════════════════════════════════════════════════════
// hbl-content — House Bill of Lading. Réplica EXACTA de solvecargo.
// Estructura del PHP original traducida a React.
// ════════════════════════════════════════════════════════════════════════════

interface HblData {
  codigo: string;
  hawb: string;
  remitente: string;
  remitenteTel?: string | null;
  remitenteDir?: string | null;
  destinatario: string;
  consignatarioCarnet?: string | null;
  consignatarioTel?: string | null;
  consignatarioCalle?: string | null;
  consignatarioMunicipio?: string | null;
  consignatarioProvincia?: string | null;
  peso: number;
  pesoKg: number;
  piezas: number;
  contenido: string;
  creado: string | Date;
  agenciaNombre?: string;
}

const upper = (s?: string | null) => (s || "").toUpperCase();

export default function HblContent({ p, brands = [] }: { p: HblData; brands?: { nombre: string; logo: string }[] }) {
  const fecha = new Date(p.creado).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const pesoKg = p.pesoKg ?? Number(p.peso) * 0.453592;
  const hblNumber = p.hawb || p.codigo;
  const marks = p.codigo.replace(/-/g, "");
  const cityDest = [p.consignatarioMunicipio, p.consignatarioProvincia, "CUBA"].filter(Boolean).join(", ");
  const dirDest = upper(p.consignatarioCalle);

  return (
    <>
      <div className="no-print hbl-toolbar">
        <button onClick={() => window.print()}>IMPRIMIR HBL</button>
        <a href={`/etiqueta/${p.codigo}`}>ETIQUETA</a>
        <a href="/bol">MANIFIESTO</a>
        <a href="/">INICIO</a>
      </div>

      <div className="hbl-doc">
        {/* FILA 1: Empresa + Título HBL */}
        <table className="hbl-table">
          <tbody>
            <tr>
              <td className="hbl-box hbl-company" style={{ width: "55%" }}>
                {brands.length > 0 ? (
                  <div className="hbl-logos">
                    {brands.map(b => <img key={b.nombre} src={b.logo} alt={b.nombre} />)}
                  </div>
                ) : (
                  <div className="hbl-fake-logo">
                    <div className="hbl-brand">VUELA CARGO</div>
                    <div className="hbl-intl">INTERNATIONAL</div>
                  </div>
                )}
                <br />
                Envíos, exportación y logística<br />
                +1 727-598-6802<br />
                info@vuela-cargo.com
              </td>
              <td className="hbl-box hbl-center" style={{ width: "45%" }}>
                <div className="hbl-title">HOUSE BILL OF LADING</div>
                <br />
                <span className="hbl-label">HBL NUMBER</span><br />
                <span className="hbl-big-num">{hblNumber}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* FILA 2: Shipper + Booking + Date */}
        <table className="hbl-table">
          <tbody>
            <tr>
              <td className="hbl-box" style={{ width: "50%" }}>
                <span className="hbl-label">SHIPPER / EXPORTER</span><br /><br />
                <span className="hbl-value">{upper(p.remitente)}</span><br />
                {upper(p.remitenteDir) || "MIAMI, FLORIDA, USA"}<br />
                TEL: {p.remitenteTel || "—"}
              </td>
              <td className="hbl-box" style={{ width: "25%" }}>
                <span className="hbl-label">BOOKING NUMBER</span><br /><br />
                <span className="hbl-value">BK-{p.codigo.slice(-7)}</span>
              </td>
              <td className="hbl-box" style={{ width: "25%" }}>
                <span className="hbl-label">DATE</span><br /><br />
                <span className="hbl-value">{fecha}</span>
              </td>
            </tr>

            {/* FILA 3: Consignee + Notify */}
            <tr>
              <td className="hbl-box" style={{ width: "50%" }}>
                <span className="hbl-label">CONSIGNEE</span><br /><br />
                <span className="hbl-value">{upper(p.destinatario)}</span><br />
                ID: {upper(p.consignatarioCarnet) || "—"}<br />
                {dirDest}<br />
                {upper(cityDest)}<br />
                TEL: {p.consignatarioTel || "—"}
              </td>
              <td className="hbl-box" colSpan={2}>
                <span className="hbl-label">NOTIFY PARTY</span><br /><br />
                <span className="hbl-value">SAME AS CONSIGNEE</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* FILA 4: Puertos */}
        <table className="hbl-table">
          <tbody>
            <tr>
              <td className="hbl-box hbl-center" style={{ width: "25%" }}>
                <span className="hbl-label">PLACE OF RECEIPT</span><br /><br />
                <span className="hbl-value">MIAMI, FLORIDA</span>
              </td>
              <td className="hbl-box hbl-center" style={{ width: "25%" }}>
                <span className="hbl-label">PORT OF LOADING</span><br /><br />
                <span className="hbl-value">MIAMI, FL</span>
              </td>
              <td className="hbl-box hbl-center" style={{ width: "25%" }}>
                <span className="hbl-label">PORT OF DISCHARGE</span><br /><br />
                <span className="hbl-value">MARIEL / LA HABANA</span>
              </td>
              <td className="hbl-box hbl-center" style={{ width: "25%" }}>
                <span className="hbl-label">FINAL DESTINATION</span><br /><br />
                <span className="hbl-value">{upper(p.consignatarioProvincia) || "CUBA"}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <br />

        {/* TABLA DE MERCANCÍA */}
        <table className="hbl-table">
          <tbody>
            <tr className="hbl-gray">
              <td className="hbl-box hbl-center" style={{ width: "14%" }}><b>MARKS & NUMBERS</b></td>
              <td className="hbl-box hbl-center" style={{ width: "10%" }}><b>PACKAGES</b></td>
              <td className="hbl-box hbl-center" style={{ width: "41%" }}><b>DESCRIPTION OF GOODS</b></td>
              <td className="hbl-box hbl-center" style={{ width: "17%" }}><b>GROSS WEIGHT</b></td>
              <td className="hbl-box hbl-center" style={{ width: "18%" }}><b>MEASUREMENT</b></td>
            </tr>
            <tr>
              <td className="hbl-box hbl-center" style={{ height: 100 }}>
                <br /><br /><b>{marks}</b>
              </td>
              <td className="hbl-box hbl-center">
                <br /><br /><b>{p.piezas}</b><br />PACKAGE
              </td>
              <td className="hbl-box">
                <br /><b>{upper(p.contenido)}</b>
                <br /><br />PERSONAL / COMMERCIAL CARGO<br /><br />SAID TO CONTAIN
              </td>
              <td className="hbl-box hbl-center">
                <br /><br /><b>{pesoKg.toFixed(2)} KG</b>
              </td>
              <td className="hbl-box hbl-center">
                <br /><br /><b>0.50 CBM</b>
              </td>
            </tr>
          </tbody>
        </table>

        {/* FREIGHT TERMS */}
        <table className="hbl-table">
          <tbody>
            <tr>
              <td className="hbl-box" style={{ width: "33%" }}>
                <span className="hbl-label">FREIGHT TERMS</span><br /><br />
                <span className="hbl-value">PREPAID</span>
              </td>
              <td className="hbl-box" style={{ width: "33%" }}>
                <span className="hbl-label">DECLARED VALUE</span><br /><br />
                <span className="hbl-value">$0.00</span>
              </td>
              <td className="hbl-box" style={{ width: "34%" }}>
                <span className="hbl-label">TOTAL PACKAGES</span><br /><br />
                <span className="hbl-value">{p.piezas}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <br />

        {/* CARRIER + FIRMA */}
        <table className="hbl-table">
          <tbody>
            <tr>
              <td className="hbl-box" style={{ width: "60%" }}>
                <span className="hbl-label">CARRIER / FORWARDING AGENT</span><br /><br />
                <b>VUELA CARGO</b><br />
                Operado por Vuela Cargo<br /><br />
                Received the goods described above in apparent good order and condition except as otherwise noted.
              </td>
              <td className="hbl-box hbl-center" style={{ width: "40%" }}>
                <span className="hbl-label">AUTHORIZED SIGNATURE</span><br /><br /><br /><br />
                ______________________________<br />
                Vuela Cargo<br /><br />
                Date: {fecha}
              </td>
            </tr>
          </tbody>
        </table>

        <br />

        {/* TÉRMINOS */}
        <div className="hbl-small">
          This House Bill of Lading is subject to the carrier&apos;s terms, conditions, limitations and applicable transportation regulations.
        </div>

        {/* BARCODE */}
        <div className="hbl-barcode">
          <div className="hbl-barcode-canvas">
            <Barcode128 code={hblNumber} />
          </div>
        </div>
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
        format: "CODE128", width: 2, height: 30, displayValue: true, margin: 0,
        background: "#ffffff", lineColor: "#000000", fontSize: 12, textMargin: 2,
      });
    } catch (e) { console.error("jsbarcode", e); }
  }, [code]);
  return <canvas ref={canvasRef} style={{ width: 300, height: 40 }} />;
}
