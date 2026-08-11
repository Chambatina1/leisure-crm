"use client";
import { useState } from "react";

// ════════════════════════════════════════════════════════════════════════════
// Landing Vuela Cargo — envíos y logística.
// Rastreo conectado a /r/[codigo] de nuestra API.
// ════════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  const [tracking, setTracking] = useState("");
  const [resultado, setResultado] = useState<null | { estado: string; remitente: string; destinatario: string }>(null);
  const [buscando, setBuscando] = useState(false);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!tracking.trim()) return;
    setBuscando(true);
    setResultado(null);
    try {
      const res = await fetch(`/api/paquetes/${encodeURIComponent(tracking.trim().toUpperCase())}`);
      if (!res.ok) { setResultado({ estado: "No encontrado", remitente: "", destinatario: "" }); setBuscando(false); return; }
      const d = await res.json();
      const p = d.paquete;
      const labels: Record<string, string> = { en_origen: "En origen", en_transito: "En tránsito", en_almacen: "En almacén", entregado: "Entregado" };
      setResultado({
        estado: labels[p.estado] || p.estado,
        remitente: p.remitente || "",
        destinatario: p.destinatario || "",
      });
    } catch {
      setResultado({ estado: "Error de conexión", remitente: "", destinatario: "" });
    }
    setBuscando(false);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: VUELA_CSS }} />
      <header className="v-header">
        <nav className="v-navbar">
          <a href="#" className="v-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/vuela-cargo-logo.svg" alt="Vuela Cargo" />
            <div className="v-brand-text">Vuela Cargo</div>
          </a>
          <div className="v-nav-links">
            <a href="#inicio">Inicio</a>
            <a href="#servicios">Servicios</a>
            <a href="#proceso">Cómo funciona</a>
            <a href="#rastreo">Rastreo</a>
            <a href="/login">Acceso</a>
          </div>
          <a href="#rastreo" className="v-btn v-btn-primary">Rastrear envío</a>
        </nav>
      </header>

      <main>
        {/* VIDEO DE FONDO */}
        <div className="v-video-bg">
          <video autoPlay muted loop playsInline>
            <source src="https://videos.pexels.com/video-files/3840442/3840442-hd_1280_720_30fps.mp4" type="video/mp4" />
          </video>
          <div className="v-video-overlay" />
        </div>

        {/* HERO + RASTREO */}
        <section className="v-hero" id="inicio">
          <div className="v-hero-container">
            <div>
              <div className="v-hero-badge">Logística simple, rápida y confiable</div>
              <h1 className="v-hero-title">Tus envíos, <span>siempre bajo control.</span></h1>
              <p className="v-hero-desc">Gestiona tus cargas, consulta el estado de tus paquetes y mantente informado durante todo el proceso de entrega.</p>
              <div className="v-hero-actions">
                <a href="#rastreo" className="v-btn v-btn-primary">Rastrear paquete</a>
                <a href="#servicios" className="v-btn v-btn-outline">Conocer servicios</a>
              </div>
            </div>

            {/* TRACKING CARD */}
            <div className="v-hero-card" id="rastreo">
              <div className="v-tracking-title">Rastrea tu envío</div>
              <div className="v-tracking-desc">Introduce tu número de guía para consultar el estado de tu carga.</div>
              <form onSubmit={buscar} className="v-tracking-box">
                <input type="text" value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Ej. LXE0000000001" />
                <button type="submit" className="v-btn v-btn-primary" disabled={buscando}>{buscando ? "Buscando..." : "Buscar"}</button>
              </form>
              {resultado && (
                <div className="v-tracking-result">
                  <div className="v-tracking-status">{resultado.estado}</div>
                  {resultado.remitente && <p style={{ marginTop: 7, color: "#5c6b73" }}>De: {resultado.remitente} → Para: {resultado.destinatario}</p>}
                  {resultado.estado === "No encontrado" && <p style={{ marginTop: 7, color: "#dc2626" }}>El código no existe en el sistema.</p>}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="v-stats">
          <div className="v-stats-container">
            <div className="v-stat"><strong>24/7</strong><span>Consulta de rastreo</span></div>
            <div className="v-stat"><strong>100%</strong><span>Gestión digital</span></div>
            <div className="v-stat"><strong>QR</strong><span>Identificación de cargas</span></div>
            <div className="v-stat"><strong>PDF</strong><span>Documentación automática</span></div>
          </div>
        </section>

        {/* SERVICIOS */}
        <section className="v-section v-services" id="servicios">
          <div className="v-container">
            <div className="v-section-head">
              <div className="v-eyebrow">Nuestros servicios</div>
              <h2 className="v-section-title">Todo tu proceso logístico en un solo lugar</h2>
              <p className="v-section-text">Una plataforma preparada para gestionar envíos, documentación, rastreo y operaciones de agencias.</p>
            </div>
            <div className="v-services-grid">
              <div className="v-service-card"><div className="v-service-icon">📦</div><h3>Gestión de envíos</h3><p>Registra remitentes, destinatarios, bultos, pesos y mercancías desde una misma operación.</p></div>
              <div className="v-service-card"><div className="v-service-icon">🏷️</div><h3>Etiquetas inteligentes</h3><p>Genera etiquetas profesionales con QR, códigos de barras y toda la información necesaria.</p></div>
              <div className="v-service-card"><div className="v-service-icon">📄</div><h3>Facturación</h3><p>Cada agencia puede generar facturas directamente desde el proceso de creación del envío.</p></div>
              <div className="v-service-card"><div className="v-service-icon">🚚</div><h3>Manifiestos</h3><p>Agrupa múltiples facturas y envíos para generar manifiestos completos por carga.</p></div>
              <div className="v-service-card"><div className="v-service-icon">📍</div><h3>Seguimiento</h3><p>Permite a clientes y agencias consultar las diferentes etapas del envío.</p></div>
              <div className="v-service-card"><div className="v-service-icon">🧾</div><h3>HBL automático</h3><p>Genera House Bills of Lading asociados directamente a los envíos registrados.</p></div>
            </div>
          </div>
        </section>

        {/* PROCESO */}
        <section className="v-section" id="proceso">
          <div className="v-container">
            <div className="v-section-head">
              <div className="v-eyebrow">Cómo funciona</div>
              <h2 className="v-section-title">De la agencia al destino</h2>
            </div>
            <div className="v-process-grid">
              <div className="v-process-card"><div className="v-process-number">1</div><h3>Registrar envío</h3><p>Introduce los datos del remitente, destinatario y mercancía.</p></div>
              <div className="v-process-card"><div className="v-process-number">2</div><h3>Crear documentos</h3><p>Genera etiqueta, factura y HBL según corresponda.</p></div>
              <div className="v-process-card"><div className="v-process-number">3</div><h3>Agrupar carga</h3><p>Organiza los envíos dentro de manifiestos y pallets.</p></div>
              <div className="v-process-card"><div className="v-process-number">4</div><h3>Entregar</h3><p>Actualiza el estado hasta completar la entrega al destinatario.</p></div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="v-cta">
          <div className="v-cta-box">
            <div>
              <h2>¿Tienes un envío pendiente?</h2>
              <p>Consulta el estado utilizando tu número de guía.</p>
            </div>
            <a href="#rastreo" className="v-btn" style={{ background: "#fff", color: "#087580" }}>Rastrear ahora</a>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="v-footer" id="contacto">
        <div className="v-footer-grid">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/vuela-cargo-logo.svg" className="v-footer-logo" alt="Vuela Cargo" />
            <p>Soluciones digitales para envíos, logística y gestión de carga.</p>
          </div>
          <div><h4>Empresa</h4><p><a href="#">Inicio</a></p><p><a href="#servicios">Servicios</a></p><p><a href="/login">Acceso</a></p></div>
          <div><h4>Envíos</h4><p><a href="#rastreo">Rastreo</a></p><p><a href="/login">Agencias</a></p></div>
          <div><h4>Ayuda</h4><p>Servicio al cliente</p><p>Información de envíos</p></div>
        </div>
        <div className="v-footer-bottom">© 2026 Vuela Cargo. Todos los derechos reservados.</div>
      </footer>
    </>
  );
}

const VUELA_CSS = `
:root{--primary:#159dac;--primary-dark:#087580;--dark:#12212a;--text:#43515a;--light:#f5f8f9;--border:#e4eaed;}
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:Inter,Arial,Helvetica,sans-serif;background:#fff;color:var(--dark);}
a{text-decoration:none;color:inherit;}
.v-header{position:sticky;top:0;z-index:1000;background:rgba(18,33,42,.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.1);}
.v-navbar{max-width:1240px;margin:auto;height:78px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;}
.v-brand{display:flex;align-items:center;gap:14px;}
.v-brand img{width:58px;height:58px;object-fit:contain;}
.v-brand-text{font-size:20px;font-weight:900;letter-spacing:-.5px;color:#fff;}
.v-nav-links{display:flex;align-items:center;gap:28px;}
.v-nav-links a{font-size:14px;font-weight:700;color:rgba(255,255,255,.85);}
.v-nav-links a:hover{color:var(--primary);}
.v-btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 22px;border-radius:10px;font-weight:800;border:0;cursor:pointer;transition:.2s;font-size:14px;text-decoration:none;}
.v-btn-primary{background:var(--primary);color:#fff;}
.v-btn-primary:hover{background:var(--primary-dark);transform:translateY(-1px);}
.v-btn-outline{border:1px solid var(--border);background:#fff;color:var(--dark);}
.v-btn-outline:hover{border-color:var(--primary);color:var(--primary);}
.v-video-bg{position:fixed;top:0;left:0;width:100%;height:100vh;z-index:-1;overflow:hidden;}
.v-video-bg video{width:100%;height:100%;object-fit:cover;}
.v-video-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,33,42,.55) 0%,rgba(18,33,42,.75) 100%);}
.v-hero{min-height:650px;background:transparent;}
.v-hero-title{color:#fff !important;}
.v-hero-title span{color:#159dac !important;}
.v-hero-desc{color:rgba(255,255,255,.85) !important;}
.v-hero-badge{background:rgba(21,157,172,.3) !important;color:#fff !important;}
.v-hero-container{max-width:1240px;min-height:650px;margin:auto;padding:70px 24px;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:60px;}
.v-hero-badge{display:inline-flex;padding:8px 14px;border-radius:30px;background:#e7f7f8;color:var(--primary-dark);font-size:13px;font-weight:800;margin-bottom:22px;}
.v-hero-title{font-size:62px;line-height:1.02;letter-spacing:-2.5px;max-width:670px;}
.v-hero-title span{color:var(--primary);}
.v-hero-desc{margin-top:24px;max-width:610px;color:var(--text);font-size:19px;line-height:1.6;}
.v-hero-actions{display:flex;gap:14px;margin-top:32px;}
.v-hero-card{background:#fff;border:1px solid var(--border);border-radius:26px;box-shadow:0 28px 70px rgba(24,50,60,.12);padding:28px;}
.v-tracking-title{font-size:22px;font-weight:900;margin-bottom:8px;}
.v-tracking-desc{color:var(--text);font-size:14px;margin-bottom:22px;}
.v-tracking-box{display:flex;gap:10px;}
.v-tracking-box input{flex:1;min-width:0;height:52px;padding:0 16px;border:1px solid var(--border);border-radius:10px;font-size:15px;outline:none;}
.v-tracking-box input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(21,157,172,.12);}
.v-tracking-result{margin-top:20px;padding:18px;border-radius:12px;background:#f4fafb;}
.v-tracking-status{font-weight:900;color:var(--primary-dark);}
.v-stats{border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.v-stats-container{max-width:1240px;margin:auto;display:grid;grid-template-columns:repeat(4,1fr);}
.v-stat{padding:30px;text-align:center;border-right:1px solid var(--border);}
.v-stat:last-child{border-right:0;}
.v-stat strong{display:block;font-size:30px;color:var(--dark);}
.v-stat span{display:block;margin-top:6px;font-size:13px;color:#718089;}
.v-section{padding:90px 24px;}
.v-container{max-width:1240px;margin:auto;}
.v-section-head{max-width:700px;margin-bottom:45px;}
.v-eyebrow{font-size:13px;font-weight:900;color:var(--primary);text-transform:uppercase;letter-spacing:1px;}
.v-section-title{margin-top:10px;font-size:42px;letter-spacing:-1.4px;}
.v-section-text{margin-top:14px;color:var(--text);line-height:1.7;}
.v-services{background:var(--light);}
.v-services-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
.v-service-card{background:#fff;padding:30px;border-radius:18px;border:1px solid var(--border);transition:.25s;}
.v-service-card:hover{transform:translateY(-5px);box-shadow:0 20px 45px rgba(26,55,65,.09);}
.v-service-icon{width:52px;height:52px;border-radius:14px;background:#e8f7f8;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:22px;}
.v-service-card h3{font-size:20px;margin-bottom:10px;}
.v-service-card p{color:var(--text);line-height:1.6;font-size:14px;}
.v-process-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;}
.v-process-card{border:1px solid var(--border);border-radius:16px;padding:24px;}
.v-process-number{width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--dark);color:#fff;font-weight:900;margin-bottom:18px;}
.v-process-card h3{font-size:17px;margin-bottom:8px;}
.v-process-card p{font-size:13px;line-height:1.55;color:var(--text);}
.v-cta{padding:80px 24px;}
.v-cta-box{max-width:1240px;margin:auto;border-radius:28px;background:linear-gradient(135deg,#0b7781,#169dac);padding:60px;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:40px;}
.v-cta-box h2{font-size:40px;max-width:650px;}
.v-cta-box p{margin-top:12px;opacity:.9;}
.v-footer{background:#101a20;color:#fff;padding:65px 24px 25px;}
.v-footer-grid{max-width:1240px;margin:auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:45px;}
.v-footer-logo{width:72px;margin-bottom:18px;}
.v-footer p,.v-footer a{color:#aebbc1;line-height:1.8;font-size:14px;}
.v-footer h4{margin-bottom:15px;}
.v-footer-bottom{max-width:1240px;margin:45px auto 0;padding-top:20px;border-top:1px solid #26343b;color:#88979e;font-size:13px;}
@media(max-width:900px){.v-nav-links{display:none;}.v-hero-container{grid-template-columns:1fr;padding-top:45px;}.v-hero{min-height:auto;}.v-hero-title{font-size:44px;}.v-stats-container{grid-template-columns:1fr 1fr;}.v-services-grid,.v-process-grid{grid-template-columns:1fr 1fr;}.v-footer-grid{grid-template-columns:1fr 1fr;}.v-cta-box{flex-direction:column;align-items:flex-start;}}
@media(max-width:600px){.v-hero-title{font-size:38px;}.v-hero-actions,.v-tracking-box{flex-direction:column;}.v-services-grid,.v-process-grid,.v-stats-container,.v-footer-grid{grid-template-columns:1fr;}.v-stat{border-right:0;border-bottom:1px solid var(--border);}.v-section{padding:65px 20px;}.v-cta-box{padding:35px 25px;}.v-cta-box h2{font-size:30px;}}
`;
