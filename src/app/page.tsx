"use client";
import { useState, useEffect } from "react";

// ════════════════════════════════════════════════════════════════════════════
// Landing pública bilingue (EN/ES) — Vuela Cargo
// Datos del grupo empresarial
// Fotos reales por servicio (sin emojis).
// ════════════════════════════════════════════════════════════════════════════
type Lang = "en" | "es";

const VIDEO_BG = "https://videos.pexels.com/video-files/3840442/3840442-hd_1280_720_30fps.mp4";

const T = {
  en: {
    navServicios: "Services", navNosotros: "About", navContacto: "Contact", navAgencias: "Agency access",
    navEtiqueta: "Create label",
    ctaEtiqueta: "Create shipping label",
    pill: "Person-to-person exporting · U.S. → Cuba",
    h1a: "Your cargo, your fleet and your",
    h1b: "paperwork, always tracked",
    sub: "Package shipping, car exports, fuel and passport processing. Modern logistics with QR labels and real-time GPS tracking.",
    ctaServicios: "View services", ctaRastrear: "Track my package",
    statAgencias: "Agencies", statPaquetes: "Packages handled", statGps: "GPS tracking",
    secServiciosH: "Our services", secServiciosP: "Shipping, exports, travel and logistics.",
    s1t: "Package shipping", s1d: "Person-to-person packages from the U.S. to Cuba. QR label, point-to-point tracking and proof of delivery.",
    s2t: "Passport processing", s2d: "Management and advisory for passport and travel document procedures. We guide you through the whole process.",
    s3t: "Fuel export", s3d: "Supply and transport of oil and gasoline with control of every shipment and checkpoint.",
    s4t: "Car export", s4d: "Buy and export vehicles to Cuba with managed paperwork and shipment tracking.",
    sMas: "More information",
    nosH: "Modern logistics, simple to operate", 
    nosP: "We combine years of export experience with cutting-edge technology. Every package carries a QR-code label; every driver scans the package and its GPS location is recorded instantly.",
    f1: "QR label", f1b: " ready to print in seconds",
    f2: "GPS tracking", f2b: " on every scan, even offline",
    f3: "Agency network", f3b: " and subagencies managed from HQ",
    f4: "Integrated accounting", f4b: " double-entry bookkeeping",
    nosCardH: "U.S. → Cuba coverage", nosCardP: "Operations in Tampa, Florida and more, with an expanding network of agencies.",
    conH: "Ready for your next shipment?", conP: "Get in touch with our team and we'll guide you.",
    conTel: "Direct call", conEmail: "Corporate email", conWeb: "Official website",
    footBrand: "Shipping, exports and logistics",
    footRights: "All rights reserved.",
  },
  es: {
    navServicios: "Servicios", navNosotros: "Nosotros", navContacto: "Contacto", navAgencias: "Acceso agencias",
    navEtiqueta: "Crear etiqueta",
    ctaEtiqueta: "Crear etiqueta de envío",
    pill: "Exportación persona a persona · EE.UU. → Cuba",
    h1a: "Tu carga, tu flota y tus",
    h1b: "trámites, siempre rastreados",
    sub: "Envíos de paquetes, exportación de autos, combustible y trámites de pasaporte. Logística moderna con etiquetas QR y rastreo GPS en tiempo real.",
    ctaServicios: "Ver servicios", ctaRastrear: "Rastrear mi paquete",
    statAgencias: "Agencias", statPaquetes: "Paquetes gestionados", statGps: "Rastreo GPS",
    secServiciosH: "Nuestros servicios", secServiciosP: "Envíos, exportación, viajes y logística.",
    s1t: "Envíos de paquetes", s1d: "Paquetería persona a persona de EE.UU. a Cuba. Etiqueta con QR, rastreo punto a punto y prueba de entrega.",
    s2t: "Trámites de pasaporte", s2d: "Gestión y asesoría para trámites de pasaporte y documentos de viaje. Te acompañamos en todo el proceso.",
    s3t: "Exportación de combustible", s3d: "Suministro y transporte de petróleo y gasolina con control de cada traslado y punto de control.",
    s4t: "Exportación de autos", s4d: "Compra y exporta vehículos hacia Cuba con documentación gestionada y seguimiento de la carga.",
    sMas: "Más información",
    nosH: "Logística moderna, simple de operar",
    nosP: "Combinamos la experiencia de años en exportación con tecnología de punta. Cada paquete lleva una etiqueta con código QR; cada camionero escanea el paquete y su ubicación GPS queda registrada al instante.",
    f1: "Etiqueta con QR", f1b: " lista para imprimir en segundos",
    f2: "Rastreo GPS", f2b: " en cada escaneo, sin internet",
    f3: "Red de agencias", f3b: " y subagencias gestionada desde la matriz",
    f4: "Contabilidad integrada", f4b: " de doble entrada",
    nosCardH: "Cobertura EE.UU. → Cuba", nosCardP: "Operaciones en Tampa, Florida y más, con red de agencias en expansión.",
    conH: "¿Hacemos tu próximo envío?", conP: "Ponete en contacto con nuestro equipo y te asesoramos.",
    conTel: "Llamada directa", conEmail: "Email corporativo", conWeb: "Web oficial",
    footBrand: "Envíos, exportación y logística",
    footRights: "Todos los derechos reservados.",
  },
};

// Fotos reales por servicio (sin emojis — visual profesional)
const SERVICIOS = [
  { img: "https://images.pexels.com/photos/616404/pexels-photo-616404.jpeg?auto=compress&cs=tinysrgb&w=800", color: "#C23B22", tKey: "s1t", dKey: "s1d", href: "/servicios/paquetes" },
  { img: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Current_cover_Cuban_passport.JPG", color: "#1f6b3a", tKey: "s2t", dKey: "s2d", href: "/servicios/pasaporte" },
  { img: "https://images.pexels.com/photos/5804986/pexels-photo-5804986.jpeg?auto=compress&cs=tinysrgb&w=800", color: "#e0a106", tKey: "s3t", dKey: "s3d", href: "/servicios/combustible" },
  { img: "https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=800", color: "#2563eb", tKey: "s4t", dKey: "s4d", href: "/servicios/autos" },
] as const;

// Datos del grupo empresarial
const CONTACTO = {
  tel: "+1 727-598-6802",
  telHref: "tel:+17275986802",
  whatsapp: "https://wa.me/17275986802?text=Hello%2C%20I%20need%20help",
  whatsappEs: "https://wa.me/17275986802?text=Hola%2C%20necesito%20ayuda",
  email: "info@grupo-empresarial.com",
  web: "grupo-empresarial.com",
  webHref: "https://grupo-empresarial.com",
  dir1: "6800 N Ave, Florida FL 33604",
  dir2: "6800 N Ave, Tampa Florida FL 33604",
  horarioEn: "Mon–Fri: 8:00 AM – 5:00 PM",
  horarioEs: "Lun–Vie: 8:00 AM – 5:00 PM",
};

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("es");
  const [brands, setBrands] = useState<{ nombre: string; logo: string }[]>([]);
  const t = T[lang];

  useEffect(() => {
    fetch("/api/brands").then(r => r.json()).then(d => setBrands(d.brands || [])).catch(() => {});
  }, []);

  return (
    <main className="landing">
      {/* Video de fondo */}
      <div className="video-bg">
        <video autoPlay muted loop playsInline>
          <source src={VIDEO_BG} type="video/mp4" />
        </video>
        <div className="video-overlay" />
      </div>

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="nav-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/vuela-cargo-logo.svg" alt="Vuela Cargo" style={{ width: 50, height: 50, objectFit: "contain", background: "#fff", borderRadius: 10, padding: 4 }} />
          <strong style={{ color: "#fff", fontSize: 20, fontWeight: 900, letterSpacing: "-.5px" }}>Vuela Cargo</strong>
        </div>
        <div className="nav-links">
          <a href="#servicios">{t.navServicios}</a>
          <a href="#nosotros">{t.navNosotros}</a>
          <a href="#contacto">{t.navContacto}</a>
          {/* Selector de idioma */}
          <div className="lang-switch">
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
            <button className={lang === "es" ? "active" : ""} onClick={() => setLang("es")}>ES</button>
          </div>
          <a className="btn-agencias" href="/nuevo-paquete">{t.navEtiqueta}</a>
          <a className="btn-agencias2" href="/envios">Mis envíos</a>
          <a className="btn-agencias2" href="/login">Acceso</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-pill">{t.pill}</span>
          <h1>{t.h1a}<br /><span className="hl">{t.h1b}</span></h1>
          <p className="hero-sub">{t.sub}</p>
          <div className="hero-cta">
            <a href="/nuevo-paquete" className="btn-primary">{t.ctaEtiqueta}</a>
            <a href="/bol" className="btn-outline">Bill of Lading</a>
          </div>
        </div>
      </section>

      {/* Servicios (con foto real por servicio) */}
      <section id="servicios" className="servicios">
        <div className="section-head">
          <h2>{t.secServiciosH}</h2>
          <p>{t.secServiciosP}</p>
        </div>
        <div className="servicios-grid">
          {SERVICIOS.map((s) => (
            <a className="servicio-card" key={s.tKey} href={s.href}>
              <div className="servicio-foto" style={{ borderTopColor: s.color }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={t[s.tKey as keyof typeof t] as string} loading="lazy" />
              </div>
              <div className="servicio-body">
                <h3 style={{ color: s.color }}>{t[s.tKey as keyof typeof t]}</h3>
                <p>{t[s.dKey as keyof typeof t]}</p>
                <span className="servicio-link" style={{ color: s.color }}>{t.sMas} →</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Nosotros */}
      <section id="nosotros" className="nosotros">
        <div className="nosotros-grid">
          <div>
            <h2>{t.nosH}</h2>
            <p>{t.nosP}</p>
            <ul className="features">
              <li><span><strong>{t.f1}</strong>{t.f1b}</span></li>
              <li><span><strong>{t.f2}</strong>{t.f2b}</span></li>
              <li><span><strong>{t.f3}</strong>{t.f3b}</span></li>
              <li><span><strong>{t.f4}</strong>{t.f4b}</span></li>
            </ul>
          </div>
          <div className="nosotros-card">
            <h3>{t.nosCardH}</h3>
            <p>{t.nosCardP}</p>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="contacto">
        <h2>{t.conH}</h2>
        <p>{t.conP}</p>
        <div className="contacto-grid">
          <a className="contacto-card" href={CONTACTO.telHref}>
            <strong>{CONTACTO.tel}</strong>
            <small>{t.conTel}</small>
          </a>
          <a className="contacto-card" href={lang === "es" ? CONTACTO.whatsappEs : CONTACTO.whatsapp} target="_blank" rel="noopener">
            <strong>WhatsApp</strong>
            <small>{CONTACTO.tel}</small>
          </a>
          <a className="contacto-card" href={`mailto:${CONTACTO.email}`}>
            <strong>{CONTACTO.email}</strong>
            <small>{t.conEmail}</small>
          </a>
        </div>
        <div className="contacto-info">
          <div>{CONTACTO.dir2}</div>
          <div>{lang === "es" ? CONTACTO.horarioEs : CONTACTO.horarioEn}</div>
          <div><a href={CONTACTO.webHref} target="_blank" rel="noopener">{CONTACTO.web}</a></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-landing">
        {/* Logos del grupo empresarial */}
        <div className="footer-grupo">
          <div className="footer-grupo-label">VUELA CARGO</div>
          <div className="footer-grupo-logos">
            {brands.map((b, i) => (
              <div key={b.nombre} style={{ display: "contents" }}>
                {i > 0 && <div className="footer-grupo-divider"></div>}
                <div className="footer-grupo-logo">
                  <img src={b.logo} alt={b.nombre} style={{ background: "#fff", borderRadius: 8, padding: "4px 10px", maxHeight: 56, maxWidth: 140, objectFit: "contain" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="footer-brand"><strong>Vuela Cargo</strong> · {t.footBrand}</div>
        <small>© {new Date().getFullYear()} Vuela Cargo. {t.footRights}</small>
        <a className="footer-agencias" href="/login">Acceso al sistema</a>
      </footer>
    </main>
  );
}
