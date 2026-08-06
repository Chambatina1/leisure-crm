"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        setCargando(false);
        return;
      }
      // Sesión válida → ir a la raíz (el middleware sirve /app).
      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
      setCargando(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo"><Logo height={64} /></div>
        <h1>Leisure Exporting LLC</h1>
        <p className="sub">Sistema CRM · agencias, paquetería y contabilidad</p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="u">Usuario</label>
            <input id="u" value={usuario} onChange={(e) => setUsuario(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="p">Contraseña</label>
            <input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={cargando}>
            {cargando ? "Entrando…" : "Iniciar sesión"}
          </button>
          {error && <p className="err">{error}</p>}
        </form>
        <div className="demo-creds">
          Demo → <b>admin</b>/<b>admin</b> · <b>habana</b>/<b>habana</b> · <b>camion</b>/<b>camion</b>
        </div>
      </div>
    </div>
  );
}
