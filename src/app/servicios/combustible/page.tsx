// ════════════════════════════════════════════════════════════════════════════
// /servicios/combustible — Exportación de combustible a Cuba.
// Precios por galón/litro, tipos, tiempos de entrega.
// ════════════════════════════════════════════════════════════════════════════
import { FotoHeader } from "../_components/foto-header";

const IMG = "https://images.pexels.com/photos/5804986/pexels-photo-5804986.jpeg?auto=compress&cs=tinysrgb&w=1200";

export const metadata = { title: "Exportación de combustible · Chambatina" };

// Precios referenciales (USD), basados en plataformas de envío a Cuba.
const COMBUSTIBLES = [
  { tipo: "Gasolina especial", porLitro: 1.39, uso: "Vehículos particulares, motos", color: "#e0a106" },
  { tipo: "Gasolina regular", porLitro: 1.55, uso: "Uso general, motor de combustión", color: "#C23B22" },
  { tipo: "Diésel", porLitro: 1.64, uso: "Camiones, maquinaria, generadores", color: "#1f6b3a" },
  { tipo: "Petróleo", porLitro: 2.00, uso: "Calefacción, cocinas, industrias", color: "#374151" },
];

const LITROS_POR_GALON = 3.78541;

export default function ServicioCombustiblePage() {
  return (
    <>
      <FotoHeader img={IMG} titulo="Exportación de combustible" subtitulo="Suministro y transporte · EE.UU. → Cuba" />
      <div className="srv-wrap">
        <section className="srv-section">
          <h2>Precios por tipo</h2>
          <p className="srv-muted">Precios en USD. Entrega en La Habana y Mariel.</p>
          <div className="srv-comb-grid">
            {COMBUSTIBLES.map((c) => (
              <div className="srv-comb-card" key={c.tipo} style={{ borderTopColor: c.color }}>
                <div className="srv-comb-tipo" style={{ color: c.color }}>{c.tipo}</div>
                <div className="srv-comb-precios">
                  <div><span className="srv-comb-num">${c.porLitro.toFixed(2)}</span><span className="srv-comb-unit">/ litro</span></div>
                  <div><span className="srv-comb-num">${(c.porLitro * LITROS_POR_GALON).toFixed(2)}</span><span className="srv-comb-unit">/ galón</span></div>
                </div>
                <div className="srv-comb-uso">{c.uso}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="srv-section">
          <h2>Tiempos de entrega</h2>
          <div className="srv-tiempos-grid">
            <div className="srv-tiempo-card">
              <div className="srv-tiempo-num">Semanal</div>
              <div className="srv-tiempo-lbl">Frecuencia de carga (isotanque)</div>
            </div>
            <div className="srv-tiempo-card">
              <div className="srv-tiempo-num">7–14 días</div>
              <div className="srv-tiempo-lbl">Entrega desde confirmación</div>
            </div>
            <div className="srv-tiempo-card">
              <div className="srv-tiempo-num">Mariel · La Habana</div>
              <div className="srv-tiempo-lbl">Puntos de entrega</div>
            </div>
          </div>
        </section>

        <section className="srv-section srv-tip">
          <h2>Cómo funciona</h2>
          <ol className="srv-pasos">
            <li><strong>Solicitás</strong> el tipo de combustible, la cantidad (litros/galones) y el destinatario en Cuba.</li>
            <li><strong>Confirmamos</strong> disponibilidad y precio del carga (los precios del combustible fluctúan semanalmente).</li>
            <li><strong>Pagás</strong> el monto por transferencia o tarjeta.</li>
            <li><strong>Despachamos</strong> en el siguiente isotanque con tracking.</li>
            <li><strong>El destinatario retira</strong> en el punto de entrega con su identificación.</li>
          </ol>
        </section>

        <section className="srv-section srv-alerta">
          <h2>Importante</h2>
          <ul className="srv-doc-list">
            <li>Los precios del combustible <strong>fluctúan</strong> — se confirman al momento de la orden.</li>
            <li>Mínimo de orden: <strong>50 galones</strong> (≈ 189 litros).</li>
            <li>El destinatario en Cuba debe tener cuenta o autorización del punto de entrega.</li>
            <li>Operamos conforme a las regulaciones de exportación de EE.UU. hacia Cuba.</li>
          </ul>
        </section>

        <section className="srv-section srv-cta">
          <h2>Solicitar combustible</h2>
          <p>Coordinamos la carga y la entrega.</p>
          <a href="#contacto" className="srv-btn">Pedir cotización</a>
        </section>
      </div>
    </>
  );
}
