// ════════════════════════════════════════════════════════════════════════════
// /servicios/paquetes — Envíos de paquetes a Cuba.
// Precios por libra, cajas prepagadas (14x14 y 16x16), tip de embalaje.
// ════════════════════════════════════════════════════════════════════════════
import { FotoHeader } from "../_components/foto-header";

const IMG = "https://images.pexels.com/photos/616404/pexels-photo-616404.jpeg?auto=compress&cs=tinysrgb&w=1200";

export const metadata = { title: "Envíos de paquetes · Chambatina" };

// Tarifas y precios reales (en USD). Editables desde aquí.
const TARIFA_POR_LB = 4.5;            // tarifa estándar por libra
const CAJAS = [
  { tamano: '14" × 14"', uso: "Caja mediana — ropa, comida seca, medicinas", precio: 30 },
  { tamano: '16" × 16"', uso: "Caja grande — electrodomésticos, bultos pesados", precio: 45 },
  { tamano: '20" × 20"', uso: "Caja extra grande — envíos voluminosos", precio: 70 },
];
const TIEMPO_ENTREGA = "30 a 45 días (vía marítima)";

export default function ServicioPaquetesPage() {
  return (
    <>
      <FotoHeader img={IMG} titulo="Envíos de paquetes" subtitulo="Persona a persona · EE.UU. → Cuba" />
      <div className="srv-wrap">
        <section className="srv-section">
          <h2>Tarifa por peso</h2>
          <div className="srv-tarifa-hero">
            <div className="srv-tarifa-num">${TARIFA_POR_LB.toFixed(2)}</div>
            <div className="srv-tarifa-unit">por libra (lb)</div>
            <div className="srv-tarifa-eq">≈ ${(TARIFA_POR_LB * 2.20462).toFixed(2)} / kg</div>
          </div>
          <p className="srv-muted">
            El peso se cobra en libras. En la etiqueta se muestra automáticamente en kg.
            Mínimo de cobro: 1 lb.
          </p>
        </section>

        <section className="srv-section">
          <h2>Cajas prepagadas</h2>
          <p className="srv-muted">Cajas resistentes listas para usar. El precio incluye la caja — el envío se cobra por peso.</p>
          <div className="srv-cajas-grid">
            {CAJAS.map((c) => (
              <div className="srv-caja-card" key={c.tamano}>
                <div className="srv-caja-tam">{c.tamano}</div>
                <div className="srv-caja-precio">${c.precio}</div>
                <div className="srv-caja-uso">{c.uso}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="srv-section">
          <h2>Tiempo de entrega</h2>
          <div className="srv-badge-big">{TIEMPO_ENTREGA}</div>
          <p className="srv-muted">Rastreo punto a punto con QR. Recibís prueba de entrega con firma.</p>
        </section>

        <section className="srv-section srv-tip">
          <h2>Tip de embalaje</h2>
          <ul className="srv-tip-list">
            <li><strong>Sellá bien las cajas</strong> con cinta de embalar en todas las uniones (forma de H).</li>
            <li><strong>Envolvé frágiles</strong> (loza, electrónica) con plástico de burbujas o ropa gruesa.</li>
            <li><strong>No excedas los 66 lb (30 kg)</strong> por bulto — límite de manejo marítimo.</li>
            <li><strong>Separá comida y medicamentos</strong> en bolsas con cierre, por si hay revisión.</li>
            <li><strong>Etiquetá con claridad</strong>: remitente y receptor con carnet y teléfono. Nosotros generamos la etiqueta térmica.</li>
            <li><strong>Líquidos</strong>: sellá con cinta y ponelos verticales en doble bolsa.</li>
            <li><strong>Electrodomésticos</strong>: declaralos como equipo duradero (máx. 2 por tipo según aduana cubana).</li>
          </ul>
        </section>

        <section className="srv-section srv-cta">
          <h2>¿Listo para enviar?</h2>
          <p>Generá la etiqueta en menos de un minuto.</p>
          <a href="/nuevo-paquete" className="srv-btn">Crear etiqueta de envío</a>
          <a href="/bol" className="srv-btn-out">Ver Bill of Lading</a>
        </section>
      </div>
    </>
  );
}
