import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Leisure Exporting LLC · Envíos, exportación y logística",
  description: "Paqueterías persona a persona, exportación de autos, combustible y trámites de pasaporte. EE.UU. → Cuba.",
};

// Video de fondo: barco de contenedores (Pexels, licencia libre, hotlink OK).
const VIDEO_BG = "https://videos.pexels.com/video-files/3840442/3840442-hd_1280_720_30fps.mp4";

const SERVICIOS = [
  {
    ico: "📦",
    titulo: "Envíos de paquetes",
    desc: "Paquetería persona a persona de EE.UU. a Cuba. Etiqueta con QR, rastreo punto a punto y prueba de entrega.",
    color: "#C23B22",
  },
  {
    ico: "🛂",
    titulo: "Trámites de pasaporte",
    desc: "Gestión y asesoría para trámites de pasaporte y documentos de viaje. Te acompañamos en todo el proceso.",
    color: "#1f6b3a",
  },
  {
    ico: "⛽",
    titulo: "Exportación de combustible",
    desc: "Suministro y transporte de petróleo y gasolina con control de cada traslado y punto de control.",
    color: "#e0a106",
  },
  {
    ico: "🚗",
    titulo: "Exportación de autos",
    desc: "Compra y exporta vehículos hacia Cuba con documentación gestionada y seguimiento de la carga.",
    color: "#2563eb",
  },
];

export default async function HomePage() {
  // Si ya hay sesión (cookie válida), ir al CRM.
  const sessionCookie = (await cookies()).get("leisure_session");
  if (sessionCookie) {
    // No validamos aquí para no importar verifyToken en server component pesado;
    // el middleware ya protege /app. Solo redirigimos si hay cookie.
    redirect("/app");
  }

  // KPIs reales desde la BD (solo los públicos, sin exponer datos sensibles).
  let totalPaquetes = 0;
  let totalAgencias = 0;
  try {
    [totalPaquetes, totalAgencias] = await Promise.all([
      db.paquete.count(),
      db.agencia.count(),
    ]);
  } catch {}

  return (
    <main className="landing">
      {/* ===== Video de fondo ===== */}
      <div className="video-bg">
        <video autoPlay muted loop playsInline poster="">
          <source src={VIDEO_BG} type="video/mp4" />
        </video>
        <div className="video-overlay" />
      </div>

      {/* ===== Navbar ===== */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <svg viewBox="0 0 380 120" height="38" role="img" aria-label="Leisure Exporting LLC">
            <g fill="#fff">
              <g>
                <rect x="40" y="26" width="9" height="20" rx="1.5" />
                <rect x="60" y="26" width="9" height="20" rx="1.5" />
                <rect x="34" y="46" width="58" height="20" rx="2" />
                <rect x="36" y="50" width="13" height="12" />
                <rect x="51" y="50" width="13" height="12" />
                <rect x="66" y="50" width="13" height="12" />
                <rect x="81" y="50" width="9" height="12" />
                <path d="M20 70 H106 L96 94 a6 6 0 0 1 -6 4 H36 a6 6 0 0 1 -6 -4 Z" />
              </g>
              <g fontFamily="Arial, Helvetica, sans-serif" fontWeight="900">
                <text x="140" y="50" fontSize="32">LEISURE</text>
                <text x="140" y="76" fontSize="21" letterSpacing="1.2">EXPORTING</text>
                <text x="140" y="100" fontSize="16" letterSpacing="2.5">L L C</text>
              </g>
            </g>
          </svg>
        </div>
        <div className="nav-links">
          <a href="#servicios">Servicios</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#contacto">Contacto</a>
          <a className="btn-agencias" href="/login">Acceso agencias →</a>
        </div>
      </nav>

      {/* ===== Hero ===== */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-pill">🚢 Exportación persona a persona · EE.UU. → Cuba</span>
          <h1>
            Tu carga, tu flota y tus<br />
            trámites, <span className="hl">siempre rastreados</span>
          </h1>
          <p className="hero-sub">
            Paqueterías, exportación de autos, combustible y trámites de pasaporte.
            Logística moderna con etiquetas QR y rastreo GPS en tiempo real.
          </p>
          <div className="hero-cta">
            <a href="#servicios" className="btn-primary">Ver servicios</a>
            <a href="/login" className="btn-outline">Rastrear mi paquete →</a>
          </div>
          <div className="hero-stats">
            <div><strong>{totalAgencias}</strong><span>Agencias</span></div>
            <div><strong>{totalPaquetes}</strong><span>Paquetes gestionados</span></div>
            <div><strong>24/7</strong><span>Rastreo GPS</span></div>
          </div>
        </div>
      </section>

      {/* ===== Carrusel de servicios ===== */}
      <section id="servicios" className="servicios">
        <div className="section-head">
          <h2>Nuestros servicios</h2>
          <p>Todo bajo la marca <strong>Leisure Exporting LLC</strong>.</p>
        </div>

        <div className="carrusel">
          <div className="carrusel-track" id="carruselTrack">
            {SERVICIOS.map((s) => (
              <article className="servicio-card" key={s.titulo} style={{ borderTopColor: s.color }}>
                <div className="servicio-ico" style={{ background: s.color }}>{s.ico}</div>
                <h3>{s.titulo}</h3>
                <p>{s.desc}</p>
                <a href="#contacto" className="servicio-link" style={{ color: s.color }}>Más información →</a>
              </article>
            ))}
          </div>
          <div className="carrusel-controls">
            <button id="carrPrev" aria-label="Anterior">‹</button>
            <div className="carrusel-dots" id="carrDots" />
            <button id="carrNext" aria-label="Siguiente">›</button>
          </div>
        </div>
      </section>

      {/* ===== Nosotros ===== */}
      <section id="nosotros" className="nosotros">
        <div className="nosotros-grid">
          <div>
            <h2>Logística moderna, simple de operar</h2>
            <p>
              En <strong>Leisure Exporting LLC</strong> combinamos la experiencia de años en
              exportación con tecnología de punta. Cada paquete lleva una etiqueta con código QR;
              cada camionero escanea el paquete y su ubicación GPS queda registrada al instante.
            </p>
            <ul className="features">
              <li>🏷️ <span><strong>Etiqueta con QR</strong> lista para imprimir en segundos</span></li>
              <li>📍 <span><strong>Rastreo GPS</strong> en cada escaneo, sin internet</span></li>
              <li>🏢 <span><strong>Red de agencias</strong> y subagencias gestionada desde la matriz</span></li>
              <li>💰 <span><strong>Contabilidad integrada</strong> de doble entrada</span></li>
            </ul>
          </div>
          <div className="nosotros-card">
            <div className="stat-big">🌍</div>
            <h3>Cobertura EE.UU. → Cuba</h3>
            <p>Operaciones en Miami, La Habana, Santiago y más ciudades, con red de agencias en expansión.</p>
          </div>
        </div>
      </section>

      {/* ===== Contacto ===== */}
      <section id="contacto" className="contacto">
        <h2>¿Hacemos tu próximo envío?</h2>
        <p>Ponete en contacto con nuestra matriz y te asesoramos.</p>
        <div className="contacto-grid">
          <a className="contacto-card" href="tel:+1305000000">
            <span className="cc-ico">📞</span>
            <strong>+1 305 000 0000</strong>
            <small>Llamada directa</small>
          </a>
          <a className="contacto-card" href="mailto:info@leisureexportingllc.com">
            <span className="cc-ico">✉️</span>
            <strong>info@leisureexportingllc.com</strong>
            <small>Email corporativo</small>
          </a>
          <a className="contacto-card" href="https://www.leisureexportingllc.com" target="_blank" rel="noopener">
            <span className="cc-ico">🌐</span>
            <strong>leisureexportingllc.com</strong>
            <small>Web oficial</small>
          </a>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="footer-landing">
        <div className="footer-brand">
          <strong>Leisure Exporting LLC</strong> · Envíos, exportación y logística
        </div>
        <small>© {new Date().getFullYear()} Leisure Exporting LLC. Todos los derechos reservados.</small>
        <a className="footer-agencias" href="/login">Acceso agencias →</a>
      </footer>

      {/* Script del carrusel */}
      <script dangerouslySetInnerHTML={{ __html: CARRUSEL_SCRIPT }} />
    </main>
  );
}

// Lógica del carrusel (inline para no agregar dependencias).
const CARRUSEL_SCRIPT = `
(function(){
  var track = document.getElementById('carruselTrack');
  if(!track) return;
  var cards = track.children;
  var idx = 0;
  var dotsWrap = document.getElementById('carrDots');
  var visible = 3;
  function calc(){ visible = window.innerWidth < 768 ? 1 : (window.innerWidth < 1024 ? 2 : 3); }
  function render(){
    calc();
    var max = Math.max(0, cards.length - visible);
    if(idx > max) idx = max;
    var cardW = cards[0].offsetWidth + 20;
    track.style.transform = 'translateX(' + (-idx * cardW) + 'px)';
    dotsWrap.innerHTML = '';
    for(var i=0;i<=max;i++){
      (function(i){
        var d = document.createElement('button');
        d.className = 'dot' + (i===idx?' active':'');
        d.onclick = function(){ idx=i; render(); };
        dotsWrap.appendChild(d);
      })(i);
    }
  }
  document.getElementById('carrPrev').onclick = function(){ idx=Math.max(0,idx-1); render(); };
  document.getElementById('carrNext').onclick = function(){ var max=Math.max(0,cards.length-visible); idx=Math.min(max,idx+1); render(); };
  window.addEventListener('resize', render);
  render();
})();
`;
