// ════════════════════════════════════════════════════════════════════════════
// /servicios/autos — Exportación de vehículos a Cuba.
// Documentación requerida, precios, tiempos de espera.
// Basado en política vigente (Decreto 163/2026) y aduana cubana.
// ════════════════════════════════════════════════════════════════════════════
import { FotoHeader } from "../_components/foto-header";

const IMG = "https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=1200";

export const metadata = { title: "Exportación de autos · Leisure Exporting LLC" };

export default function ServicioAutosPage() {
  return (
    <>
      <FotoHeader img={IMG} titulo="Exportación de autos" subtitulo="Compra, documentación y envío marítimo · EE.UU. → Cuba" />
      <div className="srv-wrap">
        {/* DOCUMENTACIÓN */}
        <section className="srv-section">
          <h2>Documentación requerida</h2>
          <p className="srv-muted">Según la nueva política de vehículos de Cuba (Decreto 163/2026) y la Aduana.</p>

          <h3>Para el exportador (vos, desde EE.UU.)</h3>
          <ul className="srv-doc-list">
            <li><strong>Título de propiedad (Title)</strong> del vehículo, endosado a nombre del destinatario.</li>
            <li><strong>Factura de compra</strong> (Bill of Sale) con precio declarado.</li>
            <li><strong>Reporte del historial</strong> del vehículo (Carfax o equivalente).</li>
            <li><strong>Certificado de emisiones</strong> si lo exige el puerto de salida.</li>
            <li><strong>Documento de transporte</strong> (Bill of Lading marítimo) — lo gestionamos nosotros.</li>
          </ul>

          <h3>Para el destinatario (en Cuba)</h3>
          <ul className="srv-doc-list">
            <li><strong>Carnet de identidad</strong> o pasaporte cubano vigente.</li>
            <li><strong>Declaración del valor</strong> del vehículo en pesos cubanos (CUP).</li>
            <li><strong>Inscripción en el Registro</strong> del Ministerio del Interior (MININT).</li>
            <li><strong>Comprobante de pago</strong> de aranceles aduanales.</li>
            <li>Autorización de importación (si aplica, según la categoría del beneficiario).</li>
          </ul>
        </section>

        {/* PRECIOS */}
        <section className="srv-section">
          <h2>Precios</h2>
          <div className="srv-precios-table">
            <div className="srv-precio-row">
              <span>Envío marítimo (sedán / automóvil)</span>
              <strong>desde $2.500</strong>
            </div>
            <div className="srv-precio-row">
              <span>Envío marítimo (SUV / camioneta)</span>
              <strong>desde $3.200</strong>
            </div>
            <div className="srv-precio-row">
              <span>Gestión documental + aduana EE.UU.</span>
              <strong>$450</strong>
            </div>
            <div className="srv-precio-row">
              <span>Honorarios Leisure Exporting</span>
              <strong>$600</strong>
            </div>
            <div className="srv-precio-row srv-precio-total">
              <span>Servicio completo (auto + envío + gestión)</span>
              <strong>desde $28.500</strong>
            </div>
          </div>
          <p className="srv-muted">
            Los <strong>aranceles de importación de Cuba</strong> se calculan aparte (dependen del valor y cilindrada)
            y se pagan en CUP. El precio del vehículo no está incluido en "servicio completo" salvo que se indique.
          </p>
        </section>

        {/* TIEMPOS */}
        <section className="srv-section">
          <h2>Tiempos de espera</h2>
          <div className="srv-tiempos-grid">
            <div className="srv-tiempo-card">
              <div className="srv-tiempo-num">2–4 semanas</div>
              <div className="srv-tiempo-lbl">Documentación + embarque</div>
            </div>
            <div className="srv-tiempo-card">
              <div className="srv-tiempo-num">3–6 semanas</div>
              <div className="srv-tiempo-lbl">Tránsito marítimo</div>
            </div>
            <div className="srv-tiempo-card">
              <div className="srv-tiempo-num">4–8 semanas</div>
              <div className="srv-tiempo-lbl">Despacho de aduana Cuba + registro MININT</div>
            </div>
            <div className="srv-tiempo-card">
              <div className="srv-tiempo-num">2–4 meses</div>
              <div className="srv-tiempo-lbl">Total estimado de punta a punta</div>
            </div>
          </div>
        </section>

        {/* TIP */}
        <section className="srv-section srv-tip">
          <h2>Recomendaciones</h2>
          <ul className="srv-tip-list">
            <li><strong>Verificá el título</strong> — el vehículo debe estar libre de gravámenes (lien).</li>
            <li><strong>El valor se declara en CUP</strong> — te asesoramos con la conversión oficial.</li>
            <li><strong>Categoría de beneficiario</strong>: hay reglas distintas según si el destinatario es residente permanente, temporal, o empresa.</li>
            <li><strong>Revisión técnica</strong>: el vehículo debe cumplir con la inspección en Cuba al recibirlo.</li>
            <li><strong>Retirá objetos de valor</strong> del auto antes del embarque (no nos hacemos responsables).</li>
          </ul>
        </section>

        <section className="srv-section srv-cta">
          <h2>Exportar mi vehículo</h2>
          <p>Te guiamos en cada paso, desde el título hasta la entrega en Cuba.</p>
          <a href="#contacto" className="srv-btn">Solicitar cotización</a>
        </section>
      </div>
    </>
  );
}
