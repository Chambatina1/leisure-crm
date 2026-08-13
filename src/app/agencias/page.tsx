"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const VIDEO_BG = "https://videos.pexels.com/video-files/3840442/3840442-hd_1280_720_30fps.mp4";

export default function AgenciasPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.usuario) {
        if (d.usuario.agenciaId) router.push(`/portal/${d.usuario.agenciaId}`);
        else router.push("/portal");
      }
    }).catch(() => {});
  }, [router]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Credenciales incorrectas"); setCargando(false); return; }
      if (d.usuario.rol === "admin") router.push("/admin");
      else if (d.usuario.agenciaId) router.push(`/portal/${d.usuario.agenciaId}`);
      else router.push("/admin");
      router.refresh();
    } catch { setError("No se pudo conectar"); setCargando(false); }
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", fontFamily: "Arial" }}>
      {/* Video de fondo */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <video autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }}>
          <source src={VIDEO_BG} type="video/mp4" />
        </video>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,30,45,.75), rgba(11,30,45,.9))" }} />
      </div>

      {/* Contenido */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/chambatina.png" alt="Chambatina" style={{ width: 60, height: 60, objectFit: "contain", marginBottom: 16 }} />

        <div style={{
          background: "rgba(255,255,255,.95)", borderRadius: 20, padding: 32,
          maxWidth: 380, width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,.3)",
        }}>
          <h1 style={{ color: "#C23B22", fontSize: 22, textAlign: "center", margin: "0 0 4px" }}>VUELACARGO</h1>
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: 13, marginBottom: 24 }}>Portal de Agencias</p>

          <form onSubmit={login} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4, display: "block" }}>Usuario</label>
              <input value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="tu usuario" required autoFocus
                style={{ width: "100%", padding: "12px 14px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 15, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4, display: "block" }}>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="tu contraseña" required
                style={{ width: "100%", padding: "12px 14px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 15, boxSizing: "border-box" }} />
            </div>
            {error && <div style={{ color: "#dc2626", padding: 10, background: "#fef2f2", borderRadius: 8, fontSize: 13, textAlign: "center" }}>{error}</div>}
            <button type="submit" disabled={cargando}
              style={{ padding: 14, borderRadius: 10, background: "#C23B22", color: "#fff", border: "none", fontWeight: 800, fontSize: 16, cursor: "pointer", opacity: cargando ? 0.6 : 1 }}>
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#9ca3af" }}>¿No tenés acceso? Contactá al administrador.</p>
          <p style={{ textAlign: "center", marginTop: 8 }}>
            <a href="/" style={{ fontSize: 12, color: "#C23B22", textDecoration: "none" }}>← Volver al inicio</a>
          </p>
        </div>
      </div>
    </div>
  );
}
