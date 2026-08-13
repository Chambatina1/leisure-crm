"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ════════════════════════════════════════════════════════════════════════════
// /login — Login real multi-agencia.
// Usuario y contraseña. Cada agencia entra con sus credenciales.
// Admin ve todo, agencia solo ve lo suyo.
// ════════════════════════════════════════════════════════════════════════════
export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    // Si ya hay sesión, redirigir al lugar correcto
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.usuario) {
        if (d.usuario.rol === "admin") router.push("/admin");
        else if (d.usuario.agenciaId) router.push(`/portal/${d.usuario.agenciaId}`);
        else router.push("/admin");
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
      // Redirigir según el rol
      if (d.usuario.rol === "admin") {
        router.push("/admin");
      } else if (d.usuario.agenciaId) {
        router.push(`/portal/${d.usuario.agenciaId}`);
      } else {
        router.push("/admin");
      }
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
      setCargando(false);
    }
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={logoArea}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/chambatina-logo.svg" alt="Chambatina" style={{ width: 56, height: 56, objectFit: "contain" }} />
          <img src="/logos/chambatina.png" alt="Chambatina" style={{ height: 40, background: "#fff", borderRadius: 6, padding: "3px 8px" }} />
        </div>
        <h1 style={{ fontSize: 22, color: "#C23B22", margin: "16px 0 4px", textAlign: "center" }}>Acceso al sistema</h1>
        <p style={{ textAlign: "center", color: "#6b7280", fontSize: 13, marginBottom: 24 }}>Ingresá tu usuario y contraseña</p>

        <form onSubmit={login} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Usuario</label>
            <input value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="tu usuario" required autoFocus style={inp} />
          </div>
          <div>
            <label style={lbl}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="tu contraseña" required style={inp} />
          </div>
          {error && <div style={errBox}>{error}</div>}
          <button type="submit" disabled={cargando} style={{ ...btn, opacity: cargando ? 0.6 : 1 }}>
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#9ca3af" }}>
          ¿No tenés acceso? Contactá al administrador.
        </p>
        <p style={{ textAlign: "center", marginTop: 8 }}>
          <a href="/" style={{ fontSize: 12, color: "#C23B22" }}>← Volver al inicio</a>
        </p>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(135deg, #0b1e2d, #1a3a5c)", padding: 16 };
const card: React.CSSProperties = { background: "#fff", borderRadius: 20, padding: 32, maxWidth: 380, width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,.2)" };
const logoArea: React.CSSProperties = { display: "flex", gap: 10, justifyContent: "center" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4 };
const inp: React.CSSProperties = { width: "100%", padding: "12px 14px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 15, boxSizing: "border-box" };
const btn: React.CSSProperties = { padding: "14px", borderRadius: 10, background: "#C23B22", color: "#fff", border: "none", fontWeight: 800, cursor: "pointer", fontSize: 16, marginTop: 4 };
const errBox: React.CSSProperties = { color: "#dc2626", padding: 10, background: "#fef2f2", borderRadius: 8, fontSize: 13, textAlign: "center" };
