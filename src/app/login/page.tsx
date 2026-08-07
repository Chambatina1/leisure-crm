"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function login(user: string, pass: string) {
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: user, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        setCargando(false);
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
      setCargando(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    login(usuario, password);
  }

  // Acceso rápido: entra directo como cada rol (demo, sin escribir nada).
  function rapido(rol: "admin" | "agencia" | "camionero") {
    const creds = {
      admin: ["admin", "admin"],
      agencia: ["habana", "habana"],
      camionero: ["camion", "camion"],
    } as const;
    login(creds[rol][0], creds[rol][1]);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo"><Logo height={64} /></div>
        <h1>Leisure Exporting LLC</h1>
        <p className="sub">Acceso a agencias · CRM y rastreo</p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="u">Usuario</label>
            <input id="u" value={usuario} onChange={(e) => setUsuario(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="p">Contraseña</label>
            <input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary-l btn-block" disabled={cargando}>
            {cargando ? "Entrando…" : "Iniciar sesión"}
          </button>
          {error && <p className="err">{error}</p>}
        </form>

        <div style={{ marginTop: 20 }}>
          <p className="sub" style={{ marginBottom: 10 }}>⚡ Acceso rápido de prueba</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <button className="btn btn-primary-l" style={{ fontSize: ".82rem", padding: "10px 6px" }}
              onClick={() => rapido("admin")} disabled={cargando}>👑 Admin</button>
            <button className="btn btn-primary-l" style={{ fontSize: ".82rem", padding: "10px 6px" }}
              onClick={() => rapido("agencia")} disabled={cargando}>🏢 Agencia</button>
            <button className="btn btn-primary-l" style={{ fontSize: ".82rem", padding: "10px 6px" }}
              onClick={() => rapido("camionero")} disabled={cargando}>🚚 Camionero</button>
          </div>
        </div>

        <div className="demo-creds">
          Demo → <b>admin</b>/<b>admin</b> · <b>habana</b>/<b>habana</b> · <b>camion</b>/<b>camion</b>
        </div>
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <a href="/" style={{ color: "var(--gris)", fontSize: ".82rem", textDecoration: "none" }}>← Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}
