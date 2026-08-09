// ════════════════════════════════════════════════════════════════════════════
// /servicios/pasaporte — Trámites de pasaporte cubano.
// Requisitos oficiales del consulado/embajada, plantilla, precios, tiempos.
// Servicio de foto digital que el usuario sube online.
// ════════════════════════════════════════════════════════════════════════════
import { FotoHeader } from "../_components/foto-header";
import FotoPasaporte from "../_components/foto-pasaporte";

const IMG = "https://upload.wikimedia.org/wikipedia/commons/a/a1/Current_cover_Cuban_passport.JPG";

export const metadata = { title: "Trámites de pasaporte · Grupo Empresarial" };

// Precios referenciales del trámite (en USD). Editables.
const COSTOS = [
  { concepto: "Pasaporte por primera vez", precio: "$220" },
  { concepto: "Renovación de pasaporte", precio: "$140" },
  { concepto: "Prórroga (24 meses)", precio: "$40" },
  { concepto: "Foto digital (nuestro servicio)", precio: "$10" },
];

export default function ServicioPasaportePage() {
  return (
    <>
      <FotoHeader img={IMG} titulo="Trámites de pasaporte" subtitulo="Asesoría y gestión completa · Consulado de Cuba en EE.UU." />
      <div className="srv-wrap">
        {/* AVISO IMPORTANTE — plantilla oficial */}
        <section className="srv-section srv-alerta">
          <h2>Plantilla oficial (Planilla de solicitud)</h2>
          <p>
            El consulado de Cuba exige el <strong>modelo/planilla oficial</strong> de solicitud de pasaporte.
            Te lo entregamos pre-cargado y revisado para que solo lo firmes. <strong>No</strong> se aceptan
            formatos alternativos — debe ser el emitido por la misión consular cubana.
          </p>
          <div className="srv-alerta-tags">
            <span>Dos (2) planillas completadas</span>
            <span>Firmadas a mano por el titular</span>
            <span>Datos en mayúsculas</span>
          </div>
        </section>

        {/* REQUISITOS */}
        <section className="srv-section">
          <h2>Requisitos (primera vez)</h2>
          <ul className="srv-doc-list">
            <li><strong>Certificación de Nacimiento cubana</strong> (original o fotocopia legible). Se devuelve.</li>
            <li><strong>Identificación con foto</strong> — licencia de conducir, ID estatal o Green Card.</li>
            <li><strong>Dos (2) planillas de solicitud</strong> completadas y firmadas.</li>
            <li><strong>Dos (2) fotos tipo pasaporte</strong> (5×5 cm / 2×2 pulg., fondo blanco, sin lentes).</li>
            <li><strong>Fotocopia del pasaporte anterior</strong> si fue emitido antes del 1° de enero de 2010.</li>
            <li><strong>Giro postal (money order)</strong> con el monto del trámite.</li>
          </ul>

          <h3 style={{ marginTop: 24 }}>Si es renovación</h3>
          <ul className="srv-doc-list">
            <li>Pasaporte anterior (original).</li>
            <li>Dos (2) planillas de solicitud.</li>
            <li>Dos (2) fotos tipo pasaporte.</li>
            <li>Giro postal (money order).</li>
          </ul>
        </section>

        {/* FOTO DIGITAL ONLINE */}
        <section className="srv-section srv-highlight">
          <h2>Servicio de foto digital (online)</h2>
          <p>
            Subí tu foto desde el celular y la adaptamos al formato oficial del pasaporte cubano
            (recorte, fondo blanco, tamaño). Te llega lista para imprimir y adjuntar al trámite.
          </p>
          <div className="srv-foto-grid">
            <div className="srv-foto-spec">
              <div className="srv-foto-spec-num">5×5 cm</div>
              <div className="srv-foto-spec-lbl">2×2 pulgadas</div>
            </div>
            <div className="srv-foto-spec">
              <div className="srv-foto-spec-num">Fondo blanco</div>
              <div className="srv-foto-spec-lbl">Sin patrones</div>
            </div>
            <div className="srv-foto-spec">
              <div className="srv-foto-spec-num">Sin lentes</div>
              <div className="srv-foto-spec-lbl">Cara descubierta</div>
            </div>
          </div>
          {/* Widget de captura de foto (cámara o subida) */}
          <FotoPasaporte />
          <p className="srv-muted" style={{ marginTop: 12 }}>
            Te llega por email en 24 h, lista para imprimir en cualquier farmacia o estudio.
          </p>
        </section>

        {/* COSTOS */}
        <section className="srv-section">
          <h2>Costos</h2>
          <div className="srv-precios-table">
            {COSTOS.map((c) => (
              <div className="srv-precio-row" key={c.concepto}>
                <span>{c.concepto}</span>
                <strong>{c.precio}</strong>
              </div>
            ))}
          </div>
          <p className="srv-muted">Los aranceles consulares se pagan con giro postal (money order) a nombre del consulado.</p>
        </section>

        {/* TIEMPOS */}
        <section className="srv-section">
          <h2>Tiempos de espera</h2>
          <div className="srv-tiempos-grid">
            <div className="srv-tiempo-card">
              <div className="srv-tiempo-num">6–8 semanas</div>
              <div className="srv-tiempo-lbl">Entrega del pasaporte</div>
            </div>
            <div className="srv-tiempo-card">
              <div className="srv-tiempo-num">2–3 semanas</div>
              <div className="srv-tiempo-lbl">Prórroga</div>
            </div>
            <div className="srv-tiempo-card">
              <div className="srv-tiempo-num">24 h</div>
              <div className="srv-tiempo-lbl">Foto digital (vía email)</div>
            </div>
          </div>
        </section>

        <section className="srv-section srv-cta">
          <h2>Iniciar trámite</h2>
          <p>Te acompañamos en todo el proceso: planilla, fotos y envío al consulado.</p>
          <a href="#contacto" className="srv-btn">Solicitar asesoría</a>
        </section>
      </div>
    </>
  );
}
