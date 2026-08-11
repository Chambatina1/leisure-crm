"use client";
import { useState, useEffect } from "react";

// ════════════════════════════════════════════════════════════════════════════
// /admin — Back-office del administrador (matriz).
// 4 pilares: CONTABILIDAD · ANÁLISIS · ESTADO DE PAQUETES · RASTREADOR
// Control, soporte y supervisión de todas las agencias.
// ════════════════════════════════════════════════════════════════════════════
type Tab = "contabilidad" | "analisis" | "estados" | "rastreador" | "brands" | "agencias" | "categorias";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("estados");
  const [resumen, setResumen] = useState<any>(null);
  const [agencias, setAgencias] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/resumen").then(r => r.json()).then(d => {
      setResumen(d);
      setAgencias(d.agencias || []);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: "Arial", maxWidth: 1200, margin: "0 auto", padding: "16px 20px 60px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#C23B22", fontSize: 24, margin: 0 }}>🛡️ Administración de la plataforma</h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: 13 }}>Control, soporte y supervisión de todas las agencias</p>
        </div>
        <a href="/" style={{ ...btn, background: "#6b7280", color: "#fff" }}>← Volver</a>
      </div>

      {/* KPIs rápidos */}
      {resumen && (
        <div style={kpisRow}>
          <Kpi label="Agencias" value={resumen.kpis.totalAgencias} color="#C23B22" />
          <Kpi label="Paquetes" value={resumen.kpis.totalPaquetes} color="#e0a106" />
          <Kpi label="Usuarios" value={resumen.kpis.totalUsuarios} color="#1f6b3a" />
          <Kpi label="Clientes" value={resumen.kpis.totalClientes} color="#2563eb" />
          <Kpi label="Peso total (lb)" value={Math.round(resumen.kpis.pesoTotalLb)} color="#7c3aed" />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "2px solid #e5e7eb" }}>
        <TabBtn active={tab === "estados"} onClick={() => setTab("estados")}>📦 Estado de paquetes</TabBtn>
        <TabBtn active={tab === "rastreador"} onClick={() => setTab("rastreador")}>📍 Rastreador</TabBtn>
        <TabBtn active={tab === "contabilidad"} onClick={() => setTab("contabilidad")}>💰 Contabilidad</TabBtn>
        <TabBtn active={tab === "analisis"} onClick={() => setTab("analisis")}>📊 Análisis</TabBtn>
        <TabBtn active={tab === "brands"} onClick={() => setTab("brands")}>🏷️ Marcas</TabBtn>
        <TabBtn active={tab === "agencias"} onClick={() => setTab("agencias")}>🏢 Agencias</TabBtn>
        <TabBtn active={tab === "categorias"} onClick={() => setTab("categorias")}>📂 Categorías</TabBtn>
      </div>

      {/* Contenido */}
      {tab === "estados" && <EstadosTab agencias={agencias} />}
      {tab === "rastreador" && <RastreadorTab agencias={agencias} />}
      {tab === "contabilidad" && <ContabilidadTab resumen={resumen} />}
      {tab === "analisis" && <AnalisisTab />}
      {tab === "brands" && <BrandsTab />}
      {tab === "agencias" && <AgenciasTab />}
      {tab === "categorias" && <CategoriasTab />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: ESTADO DE PAQUETES — supervisión + soporte (ver/editar/eliminar)
// ════════════════════════════════════════════════════════════════════════════
function EstadosTab({ agencias }: { agencias: any[] }) {
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [filtroAg, setFiltroAg] = useState("");
  const [busca, setBusca] = useState("");
  const [edit, setEdit] = useState<any | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargar(); }, [filtroAg]);
  async function cargar() {
    setCargando(true);
    const q = new URLSearchParams();
    if (filtroAg) q.set("agenciaId", filtroAg);
    if (busca) q.set("buscar", busca);
    const r = await fetch("/api/admin/envios?" + q.toString());
    const d = await r.json();
    setPaquetes(d.paquetes || []);
    setCargando(false);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const campos: Record<string, unknown> = {};
    fd.forEach((v, k) => { campos[k] = v; });
    await fetch("/api/admin/envios", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo: edit.codigo, ...campos }),
    });
    setEdit(null); cargar();
  }
  async function eliminar(codigo: string) {
    if (!confirm("¿Eliminar el envío " + codigo + "?")) return;
    await fetch("/api/admin/envios?codigo=" + codigo, { method: "DELETE" });
    cargar();
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select value={filtroAg} onChange={e => setFiltroAg(e.target.value)} style={inp}>
          <option value="">Todas las agencias</option>
          {agencias.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Buscar código, nombre, carnet…" style={{ ...inp, flex: 1 }} />
        <button onClick={cargar} style={btnPrim}>Buscar</button>
      </div>

      {edit && (
        <div style={modalBg} onClick={() => setEdit(null)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: "#C23B22" }}>✏️ Editar envío {edit.codigo}</h3>
            <form onSubmit={guardar} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Inp label="Remitente" name="remitente" val={edit.remitente} />
              <Inp label="Destinatario" name="destinatario" val={edit.destinatario} />
              <Inp label="Carnet receptor" name="consignatarioCarnet" val={edit.consignatarioCarnet} />
              <Inp label="Teléfono receptor" name="consignatarioTel" val={edit.consignatarioTel} />
              <Inp label="Calle" name="consignatarioCalle" val={edit.consignatarioCalle} />
              <Inp label="Municipio" name="consignatarioMunicipio" val={edit.consignatarioMunicipio} />
              <Inp label="Peso (lb)" name="peso" type="number" val={edit.peso} />
              <Inp label="Piezas" name="piezas" type="number" val={edit.piezas} />
              <Inp label="Volumen m³" name="volumenM3" type="number" val={edit.volumenM3} />
              <Inp label="HAWB" name="hawb" val={edit.hawb} />
              <Inp label="Tarifa/lb" name="tarifa" type="number" val={edit.tarifa} />
              <Inp label="Valor declarado" name="valor" type="number" val={edit.valor} />
              <div>
                <label style={lbl}>Estado</label>
                <select name="estado" defaultValue={edit.estado} style={inp}>
                  <option value="en_origen">En origen</option>
                  <option value="en_transito">En tránsito</option>
                  <option value="en_almacen">En almacén</option>
                  <option value="entregado">Entregado</option>
                </select>
              </div>
              <Inp label="Observaciones" name="observaciones" val={edit.observaciones} />
              <div style={{ gridColumn: "1/3", display: "flex", gap: 8 }}>
                <button type="submit" style={{ ...btn, background: "#1f6b3a", color: "#fff" }}>💾 Guardar cambios</button>
                <button type="button" onClick={() => setEdit(null)} style={btn}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>{["Código","Agencia","Remitente","Destinatario","Carnet","Peso lb","Kg","Estado","Acciones"].map(h =>
              <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {cargando ? <tr><td colSpan={9} style={{ textAlign:"center", padding:30, color:"#6b7280" }}>Cargando…</td></tr>
            : paquetes.length === 0 ? <tr><td colSpan={9} style={{ textAlign:"center", padding:30, color:"#6b7280" }}>Sin envíos.</td></tr>
            : paquetes.map(p => (
              <tr key={p.codigo} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={td}><b>{p.codigo}</b></td>
                <td style={td}>{p.agencia?.nombre}</td>
                <td style={td}>{p.remitente}</td>
                <td style={td}>{p.destinatario}</td>
                <td style={td}>{p.consignatarioCarnet || "—"}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: "monospace" }}>{p.peso}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: "monospace" }}>{(p.pesoKg ?? p.peso * 0.453592).toFixed(2)}</td>
                <td style={td}><EstadoPill estado={p.estado} /></td>
                <td style={td}>
                  <button onClick={() => setEdit(p)} style={{ ...miniBtn, background:"#e0a106", color:"#fff" }}>✏️</button>
                  <button onClick={() => eliminar(p.codigo)} style={{ ...miniBtn, background:"#dc2626", color:"#fff" }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>{paquetes.length} envío(s)</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: RASTREADOR — mapa de todos los GPS + paquetes en tránsito
// ════════════════════════════════════════════════════════════════════════════
function RastreadorTab({ agencias }: { agencias: any[] }) {
  const [enTransito, setEnTransito] = useState<any[]>([]);
  const [eventosGps, setEventosGps] = useState<any[]>([]);
  const [filtroAg, setFiltroAg] = useState("");

  useEffect(() => { cargar(); }, [filtroAg]);
  async function cargar() {
    const q = filtroAg ? "?agenciaId=" + filtroAg : "";
    const r = await fetch("/api/admin/rastreador" + q);
    const d = await r.json();
    setEnTransito(d.enTransito || []);
    setEventosGps(d.eventosGps || []);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <select value={filtroAg} onChange={e => setFiltroAg(e.target.value)} style={inp}>
          <option value="">Todas las agencias</option>
          {agencias.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        <button onClick={cargar} style={btnPrim}>🔄 Actualizar</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Paquetes en tránsito */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
          <h3 style={{ color: "#e0a106", marginTop: 0 }}>🚚 En tránsito ({enTransito.length})</h3>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {enTransito.length === 0 ? <p style={{ color:"#6b7280" }}>Sin paquetes en tránsito.</p> :
            enTransito.map(p => (
              <div key={p.codigo} style={{ padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
                <b>{p.codigo}</b> · <EstadoPill estado={p.estado} /><br/>
                <small style={{ color:"#6b7280" }}>{p.destinatario} → {p.destino} · {p.agencia?.nombre}</small><br/>
                <small style={{ color:"#6b7280" }}>Último: {p.eventos?.[0] ? new Date(p.eventos[0].ts).toLocaleString("es") : "—"}</small>
                {p.eventos?.[0]?.lat && <small> · 📍 {Number(p.eventos[0].lat).toFixed(4)}, {Number(p.eventos[0].lng).toFixed(4)}</small>}
              </div>
            ))}
          </div>
        </div>

        {/* Huella GPS */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
          <h3 style={{ color: "#2563eb", marginTop: 0 }}>📍 Última huella GPS ({eventosGps.length})</h3>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {eventosGps.length === 0 ? <p style={{ color:"#6b7280" }}>Sin registros GPS.</p> :
            eventosGps.slice(0, 50).map((ev, i) => (
              <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: 12 }}>
                <b>{ev.paquete?.codigo}</b> · {ev.paquete?.destinatario}<br/>
                <small style={{ color:"#6b7280" }}>
                  📍 {Number(ev.lat).toFixed(5)}, {Number(ev.lng).toFixed(5)} · {new Date(ev.ts).toLocaleString("es")} · {ev.paquete?.agencia?.nombre}
                </small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: CONTABILIDAD — consolidado global + por agencia
// ════════════════════════════════════════════════════════════════════════════
function ContabilidadTab({ resumen }: { resumen: any }) {
  const c = resumen?.contabilidad;
  return (
    <div>
      <h3 style={{ color: "#1f6b3a", marginTop: 0 }}>💰 Contabilidad consolidada (todas las agencias)</h3>
      {c ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
          <KpiBox label="Ingresos" value={"$" + c.ingreso.toFixed(2)} color="#1f6b3a" />
          <KpiBox label="Gastos" value={"$" + c.gasto.toFixed(2)} color="#dc2626" />
          <KpiBox label="Utilidad" value={"$" + c.utilidad.toFixed(2)} color="#e0a106" />
          <KpiBox label="Caja" value={"$" + c.caja.toFixed(2)} color="#C23B22" />
          <KpiBox label="Bancos" value={"$" + c.bancos.toFixed(2)} color="#2563eb" />
        </div>
      ) : <p style={{ color:"#6b7280" }}>Cargando contabilidad…</p>}

      <h3 style={{ color: "#C23B22" }}>🏢 Contabilidad por agencia</h3>
      <p style={{ color: "#6b7280", fontSize: 13 }}>Activa o desactiva la contabilidad de cada agencia.</p>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>{["Agencia","Tipo","Paquetes","Usuarios","Contabilidad","Acciones"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {(resumen?.agencias || []).map((a:any) => (
              <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={td}><b>{a.nombre}</b></td>
                <td style={td}>{a.tipo}</td>
                <td style={td}>{a.paquetes}</td>
                <td style={td}>{a.usuarios}</td>
                <td style={td}>{a.contabilidadActiva ? "✅ Activa" : "⚪ Inactiva"}</td>
                <td style={td}>
                  <button onClick={() => toggleConta(a.id, !a.contabilidadActiva)} style={miniBtn}>
                    {a.contabilidadActiva ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  async function toggleConta(id: string, val: boolean) {
    await fetch("/api/agencias/" + id, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ contabilidadActiva: val }) });
    location.reload();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: ANÁLISIS — gráficos y tendencias
// ════════════════════════════════════════════════════════════════════════════
function AnalisisTab() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/admin/analisis").then(r => r.json()).then(setData).catch(()=>{}); }, []);
  if (!data) return <p style={{ color: "#6b7280" }}>Cargando análisis…</p>;

  const maxDia = Math.max(...data.serieDias.map((d:any) => d.count), 1);
  const maxAg = Math.max(...data.porAgencia.map((a:any) => a.paquetes), 1);

  return (
    <div>
      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <KpiBox label="Total envíos" value={data.metricas.total} color="#C23B22" />
        <KpiBox label="Entregados" value={data.metricas.entregados} color="#1f6b3a" />
        <KpiBox label="En tránsito" value={data.metricas.enTransito} color="#e0a106" />
        <KpiBox label="% Entrega" value={data.metricas.tasaEntrega + "%"} color="#2563eb" />
      </div>

      {/* Gráfico de barras: envíos por día */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb", marginBottom: 16 }}>
        <h3 style={{ color: "#C23B22", marginTop: 0 }}>📈 Envíos por día (últimos 30 días)</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120, marginTop: 12 }}>
          {data.serieDias.length === 0 ? <p style={{ color:"#6b7280" }}>Sin datos.</p> :
          data.serieDias.map((d:any) => (
            <div key={d.fecha} title={`${d.fecha}: ${d.count} envíos`} style={{
              flex: 1, minWidth: 6, height: (d.count / maxDia) * 100 + "%",
              background: "#C23B22", borderRadius: "3px 3px 0 0", minHeight: 2,
            }} />
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Por agencia */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
          <h3 style={{ marginTop: 0 }}>🏢 Volumen por agencia</h3>
          {data.porAgencia.length === 0 ? <p style={{ color:"#6b7280" }}>Sin datos.</p> :
          data.porAgencia.map((a:any) => (
            <div key={a.nombre} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{a.nombre}</span><b>{a.paquetes}</b>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 4, height: 8, marginTop: 3 }}>
                <div style={{ width: (a.paquetes / maxAg * 100) + "%", height: "100%", background: "#1f6b3a", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Por estado */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
          <h3 style={{ marginTop: 0 }}>📦 Distribución por estado</h3>
          {data.porEstado.map((e:any) => (
            <div key={e.estado} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
              <span><EstadoPill estado={e.estado} /></span>
              <span><b>{e.count}</b> · {e.peso?.toFixed(1) || 0} lb · ${(e.monto || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Leer cualquier imagen y convertirla a base64. Simple y directo.
async function leerImagen(file: File, maxDim: number = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject("No se pudo leer el archivo");
    reader.readAsDataURL(file);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// BrandsTab — gestión de logos/marcas del vuela cargo.
// Subir logo nuevo, activar/desactivar, reordenar (↑↓), editar, eliminar.
// ════════════════════════════════════════════════════════════════════════════
function BrandsTab() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | { id?: string; clave: string; nombre: string; logo: string; orden: number; activo: boolean }>(null);

  function cargar() {
    fetch("/api/admin/brands").then(r => r.json()).then(d => {
      setBrands(d.brands || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }
  useEffect(cargar, []);

  async function toggleActivo(b: any) {
    await fetch("/api/admin/brands", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, activo: !b.activo }),
    });
    cargar();
  }

  async function cambiarOrden(b: any, delta: number) {
    const nuevoOrden = (b.orden || 0) + delta;
    await fetch("/api/admin/brands", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, orden: nuevoOrden }),
    });
    cargar();
  }

  async function eliminar(b: any) {
    if (!confirm(`¿Eliminar "${b.nombre}"?`)) return;
    await fetch(`/api/admin/brands?id=${b.id}`, { method: "DELETE" });
    cargar();
  }

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = {
      clave: (fd.get("clave") as string)?.trim(),
      nombre: (fd.get("nombre") as string)?.trim(),
      logo: modal?.logo,
      orden: Number(fd.get("orden")) || 0,
    };
    if (!data.nombre || !data.logo) { alert("Nombre y logo son obligatorios"); return; }

    if (modal?.id) {
      await fetch("/api/admin/brands", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: modal.id, nombre: data.nombre, logo: data.logo, orden: data.orden }),
      });
    } else {
      await fetch("/api/admin/brands", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setModal(null);
    cargar();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = await leerImagen(f, 300);
      setModal(m => m ? { ...m, logo: data } : m);
    } catch { alert("No se pudo leer la imagen"); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: "#1f2937", fontSize: 18 }}>Marcas del vuela cargo</h2>
        <button onClick={() => setModal({ clave: "", nombre: "", logo: "", orden: brands.length, activo: true })} style={btnPrim}>
          + Nueva marca
        </button>
      </div>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
        Estos logos aparecen en el navbar, footer, etiquetas, HBL y manifiesto. Activá o desactivá los que quieras mostrar.
      </p>

      {loading ? (
        <p style={{ color: "#6b7280" }}>Cargando...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {brands.map((b, i) => (
            <div key={b.id} style={{
              display: "flex", alignItems: "center", gap: 16, background: "#fff",
              border: "1px solid #e5e7eb", borderRadius: 12, padding: 14,
              opacity: b.activo ? 1 : 0.5,
            }}>
              {/* Preview del logo */}
              <div style={{ width: 64, height: 64, background: "#f9fafb", borderRadius: 8, display: "grid", placeItems: "center", overflow: "hidden", flexShrink: 0, border: "1px solid #e5e7eb" }}>
                {b.logo ? <img src={b.logo} alt={b.nombre} style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} /> : <span style={{ color: "#9ca3af", fontSize: 10 }}>Sin logo</span>}
              </div>
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1f2937" }}>{b.nombre}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>clave: {b.clave} · orden: {b.orden}</div>
                <div style={{ marginTop: 4 }}>
                  <EstadoPill estado={b.activo ? "entregado" : "en_origen"} />
                  {!b.activo && <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 6 }}>oculta</span>}
                </div>
              </div>
              {/* Acciones */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => cambiarOrden(b, -1)} disabled={i === 0} style={{ ...miniBtn, opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                  <button onClick={() => cambiarOrden(b, 1)} disabled={i === brands.length - 1} style={{ ...miniBtn, opacity: i === brands.length - 1 ? 0.3 : 1 }}>↓</button>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => toggleActivo(b)} style={miniBtn}>{b.activo ? "Ocultar" : "Mostrar"}</button>
                  <button onClick={() => setModal(b)} style={miniBtn}>Editar</button>
                  <button onClick={() => eliminar(b)} style={{ ...miniBtn, color: "#dc2626" }}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva/editar */}
      {modal && (
        <div style={modalBg} onClick={() => setModal(null)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: "#C23B22" }}>{modal.id ? "Editar marca" : "Nueva marca"}</h3>
            <form onSubmit={guardar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {!modal.id && (
                <div>
                  <label style={lbl}>Clave (identificador único)</label>
                  <input name="clave" defaultValue={modal.clave} placeholder="ej: nueva-marca" style={inp} required={!modal.id} />
                </div>
              )}
              <div>
                <label style={lbl}>Nombre</label>
                <input name="nombre" defaultValue={modal.nombre} placeholder="Nombre de la marca" style={inp} required />
              </div>
              <div>
                <label style={lbl}>Orden (posición: 0=izquierda)</label>
                <input name="orden" type="number" defaultValue={modal.orden} style={inp} />
              </div>
              <div>
                <label style={lbl}>Logo</label>
                {modal.logo && (
                  <div style={{ marginBottom: 8, padding: 10, background: "#f9fafb", borderRadius: 8, display: "inline-block" }}>
                    <img src={modal.logo} alt="preview" style={{ maxHeight: 60, maxWidth: 120, objectFit: "contain" }} />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={onFileChange} style={{ fontSize: 13 }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setModal(null)} style={btn}>Cancelar</button>
                <button type="submit" style={btnPrim}>{modal.id ? "Guardar" : "Crear"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// AgenciasTab — gestionar agencias y usuarios del multi-agencia.
// Crear agencias, crear usuarios con login/contraseña, conceder permisos.
// ════════════════════════════════════════════════════════════════════════════
function AgenciasTab() {
  const [agencias, setAgencias] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "agencia" | "usuario">(null);
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState<string>("");
  const [credNueva, setCredNueva] = useState<null | { usuario: string; password: string; nombre: string }>(null);
  const [editandoAgencia, setEditandoAgencia] = useState<any>(null);

  function cargar() {
    Promise.all([
      fetch("/api/agencias").then(r => r.json()),
      fetch("/api/usuarios").then(r => r.json()),
    ]).then(([a, u]) => {
      setAgencias(a.agencias || []);
      setUsuarios(u.usuarios || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }
  useEffect(cargar, []);

  async function crearAgencia(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      nombre: fd.get("nombre"), tipo: fd.get("tipo"), padreId: fd.get("padreId") || null,
      direccion: fd.get("direccion"), ciudad: fd.get("ciudad"), pais: fd.get("pais"),
      telefono: fd.get("telefono"), logo: fd.get("logoData") || null,
      puedeCrearSubagencias: fd.get("puedeCrearSubagencias") === "on",
    };
    const usuarioLogin = fd.get("usuarioLogin") as string;
    const passwordLogin = fd.get("passwordLogin") as string;
    const nombreUsuario = fd.get("nombreUsuario") as string;
    if (!body.nombre) return;
    if (!usuarioLogin || !passwordLogin) { alert("Debe crear un usuario y contraseña para la agencia"); return; }

    // 1. Crear la agencia
    const r = await fetch("/api/agencias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) { const d = await r.json(); alert(d.error || "Error al crear agencia"); return; }
    const ag = await r.json();

    // 2. Crear el usuario para esa agencia
    const r2 = await fetch("/api/usuarios", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: usuarioLogin, password: passwordLogin, nombre: nombreUsuario || body.nombre, rol: "agencia", agenciaId: ag.agencia.id }),
    });
    if (!r2.ok) { const d = await r2.json(); alert("Agencia creada pero error al crear usuario: " + (d.error || "")); }

    // 3. Mostrar credenciales
    setModal(null);
    setCredNueva({ usuario: usuarioLogin, password: passwordLogin, nombre: String(nombreUsuario || body.nombre) });
    cargar();
  }

  async function crearUsuario(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      usuario: fd.get("usuario"), password: fd.get("password"), nombre: fd.get("nombre"),
      rol: fd.get("rol"), agenciaId: fd.get("agenciaId"),
    };
    if (!body.usuario || !body.password || !body.nombre) { alert("Usuario, contraseña y nombre son obligatorios"); return; }
    const r = await fetch("/api/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) { const d = await r.json(); alert(d.error || "Error"); return; }
    setModal(null);
    setCredNueva({ usuario: String(body.usuario), password: String(body.password), nombre: String(body.nombre) });
    cargar();
  }

  async function resetPassword(u: any) {
    const nueva = prompt(`Nueva contraseña para ${u.nombre} (${u.usuario}):`);
    if (!nueva) return;
    const r = await fetch(`/api/usuarios/${u.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: nueva }) });
    if (!r.ok) { alert("Error al cambiar contraseña"); return; }
    setCredNueva({ usuario: u.usuario, password: nueva, nombre: u.nombre });
  }

  async function eliminarAgencia(a: any) {
    if (!confirm(`¿Eliminar la agencia "${a.nombre}"? Se eliminarán también sus envíos y usuarios.`)) return;
    try {
      const r = await fetch(`/api/agencias/${a.id}`, { method: "DELETE" });
      if (!r.ok) { const d = await r.json(); alert(d.error || "No se pudo eliminar"); return; }
      cargar();
    } catch { alert("No se pudo conectar"); }
  }

  async function guardarEdicionAgencia(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const logoData = fd.get("logoData") as string;
    const body: Record<string, unknown> = {
      nombre: fd.get("nombre"),
      direccion: fd.get("direccion"),
      ciudad: fd.get("ciudad"),
      pais: fd.get("pais"),
      telefono: fd.get("telefono"),
    };
    if (logoData) body.logo = logoData;
    const r = await fetch(`/api/agencias/${editandoAgencia.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!r.ok) { const d = await r.json(); alert(d.error || "Error"); return; }
    setEditandoAgencia(null);
    cargar();
  }

  async function subirLogo(a: any, file: File) {
    if (!file) return;
    alert("Subiendo logo de " + a.nombre + "...");
    try {
      const logo = await leerImagen(file);
      const r = await fetch(`/api/agencias/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logo }) });
      if (r.ok) { cargar(); alert("Logo guardado correctamente."); }
      else { const d = await r.json().catch(()=>({})); alert("Error: " + (d.error || "no se pudo guardar")); }
    } catch (e: any) { alert("No se pudo leer: " + (e?.message || e)); }
  }

  async function togglePermiso(a: any) {
    await fetch(`/api/agencias/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ puedeCrearSubagencias: !a.puedeCrearSubagencias }) });
    cargar();
  }

  if (loading) return <p style={{ color: "#6b7280" }}>Cargando...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: "#1f2937", fontSize: 18 }}>Agencias y usuarios</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setModal("agencia")} style={btnPrim}>+ Nueva agencia</button>
          <button onClick={() => setModal("usuario")} style={btnPrim}>+ Nuevo usuario</button>
        </div>
      </div>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
        Cada agencia tiene su propio acceso con usuario y contraseña. Solo ven sus propios envíos y clientes. La matriz (admin) ve todo.
      </p>

      {/* Lista de agencias */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {agencias.map(a => {
          const users = usuarios.filter((u: any) => u.agenciaId === a.id);
          return (
            <div key={a.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 16 }}>{a.nombre}</strong>
                    <span style={{ fontSize: 10, background: a.tipo === "matriz" ? "#C23B22" : a.tipo === "subagencia" ? "#e0a106" : "#1f6b3a", color: "#fff", padding: "2px 8px", borderRadius: 999, fontWeight: 700, textTransform: "uppercase" }}>{a.tipo}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                    {[a.ciudad, a.pais].filter(Boolean).join(", ") || "Sin ubicación"}
                    {a.telefono && ` · ${a.telefono}`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {a.logo && <img src={a.logo} alt={a.nombre} style={{ height: 32, width: "auto", objectFit: "contain", background: "#fff", borderRadius: 4, padding: "2px 4px" }} />}
                  {a.tipo !== "matriz" && (
                    <button onClick={() => togglePermiso(a)} style={{ ...miniBtn, background: a.puedeCrearSubagencias ? "#d1fae5" : "#f3f4f6", color: a.puedeCrearSubagencias ? "#065f46" : "#6b7280" }}>
                      {a.puedeCrearSubagencias ? "Subagencias ✓" : "Sin subagencias"}
                    </button>
                  )}
                  <label style={{ ...miniBtn, background: "#dbeafe", color: "#1e40af", cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
                    📷 Logo
                    <input type="file" onChange={e => { const f = e.target.files?.[0]; if (f) subirLogo(a, f); }} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                  </label>
                  <button onClick={() => setEditandoAgencia(a)} style={{ ...miniBtn, background: "#fef3c7", color: "#92400e" }}>Editar</button>
                  <a href={`/portal/${a.id}`} style={{ ...miniBtn, background: "#1f6b3a", color: "#fff", textDecoration: "none" }}>Entrar</a>
                  {a.tipo !== "matriz" && (
                    <button onClick={() => eliminarAgencia(a)} style={{ ...miniBtn, background: "#fef2f2", color: "#dc2626" }}>Eliminar</button>
                  )}
                </div>
              </div>
              {/* Usuarios de esta agencia */}
              {users.length > 0 && (
                <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "3px solid #e5e7eb" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>Usuarios ({users.length})</div>
                  {users.map((u: any) => (
                    <div key={u.id} style={{ display: "flex", gap: 8, fontSize: 13, padding: "4px 0", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700 }}>{u.nombre}</span>
                      <span style={{ color: "#6b7280" }}>@{u.usuario}</span>
                      <span style={{ fontSize: 10, background: u.rol === "admin" ? "#C23B22" : "#374151", color: "#fff", padding: "1px 6px", borderRadius: 999 }}>{u.rol}</span>
                      {!u.activo && <span style={{ fontSize: 10, color: "#dc2626" }}>inactivo</span>}
                      <button onClick={() => resetPassword(u)} style={{ fontSize: 9, padding: "2px 8px", background: "#e0a106", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700 }}>Resetear clave</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal crear agencia */}
      {modal === "agencia" && (
        <div style={modalBg} onClick={() => setModal(null)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: "#C23B22" }}>Nueva agencia</h3>
            <form onSubmit={crearAgencia} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={lbl}>Nombre *</label><input name="nombre" placeholder="Ej: Agencia Miami" style={inp} required /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={lbl}>Tipo</label>
                  <select name="tipo" style={inp}>
                    <option value="agencia">Agencia</option>
                    <option value="subagencia">Subagencia</option>
                  </select>
                </div>
                <div><label style={lbl}>Depende de (padre)</label>
                  <select name="padreId" style={inp}>
                    <option value="">— Matriz (sin padre) —</option>
                    {agencias.filter(a => a.tipo !== "subagencia").map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={lbl}>Ciudad</label><input name="ciudad" placeholder="Miami" style={inp} /></div>
                <div><label style={lbl}>País</label><input name="pais" placeholder="USA" style={inp} /></div>
              </div>
              <div><label style={lbl}>Dirección</label><input name="direccion" style={inp} /></div>
              <div><label style={lbl}>Teléfono</label><input name="telefono" style={inp} /></div>
              <div>
                  <label style={lbl}>Logo de la agencia</label>
                  <input type="file" name="logoFile" accept="image/*" style={{ fontSize: 13 }} onChange={e => {
                    const f = e.currentTarget.files?.[0];
                    if (f) { const r = new FileReader(); r.onload = () => { (e.currentTarget.parentElement?.querySelector('input[name="logoData"]') as HTMLInputElement).value = r.result as string; }; r.readAsDataURL(f); }
                  }} />
                  <input type="hidden" name="logoData" />
                </div>
                <div style={{ background: "#fef3c7", border: "1px solid #e0a106", borderRadius: 8, padding: 12, marginTop: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#92400e", textTransform: "uppercase", marginBottom: 8 }}>Acceso de la agencia (usuario y contraseña)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><label style={lbl}>Nombre del responsable</label><input name="nombreUsuario" placeholder="Ej: Carlos Perez" style={inp} /></div>
                    <div><label style={lbl}>Usuario (login) *</label><input name="usuarioLogin" placeholder="Ej: miami" style={inp} required /></div>
                  </div>
                  <div style={{ marginTop: 8 }}><label style={lbl}>Contraseña *</label><input name="passwordLogin" type="text" placeholder="Ej: miami2026" style={inp} required /></div>
                </div>
                <div><label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, cursor: "pointer" }}><input type="checkbox" name="puedeCrearSubagencias" /> Puede crear subagencias</label></div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setModal(null)} style={btn}>Cancelar</button>
                <button type="submit" style={btnPrim}>Crear agencia</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal crear usuario */}
      {modal === "usuario" && (
        <div style={modalBg} onClick={() => setModal(null)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: "#C23B22" }}>Nuevo usuario</h3>
            <form onSubmit={crearUsuario} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={lbl}>Nombre completo *</label><input name="nombre" placeholder="Juan Pérez" style={inp} required /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={lbl}>Usuario (login) *</label><input name="usuario" placeholder="juan" style={inp} required /></div>
                <div><label style={lbl}>Contraseña *</label><input name="password" type="text" placeholder="contraseña" style={inp} required /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={lbl}>Rol</label>
                  <select name="rol" style={inp}>
                    <option value="agencia">Agencia (opera su agencia)</option>
                    <option value="operario">Operario</option>
                    <option value="camionero">Camionero (escanea)</option>
                    <option value="admin">Admin (ve todo)</option>
                  </select>
                </div>
                <div><label style={lbl}>Agencia *</label>
                  <select name="agenciaId" style={inp} required>
                    <option value="">— Seleccionar —</option>
                    {agencias.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ background: "#fef3c7", padding: 10, borderRadius: 8, fontSize: 12, color: "#92400e" }}>
                Este usuario podrá entrar con su usuario/contraseña y solo verá los datos de su agencia.
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setModal(null)} style={btn}>Cancelar</button>
                <button type="submit" style={btnPrim}>Crear usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: editar agencia */}
      {editandoAgencia && (
        <div style={modalBg} onClick={() => setEditandoAgencia(null)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: "#C23B22" }}>Editar agencia</h3>
            <form onSubmit={guardarEdicionAgencia} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={lbl}>Nombre</label><input name="nombre" defaultValue={editandoAgencia.nombre} style={inp} required /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={lbl}>Ciudad</label><input name="ciudad" defaultValue={editandoAgencia.ciudad || ""} style={inp} /></div>
                <div><label style={lbl}>País</label><input name="pais" defaultValue={editandoAgencia.pais || ""} style={inp} /></div>
              </div>
              <div><label style={lbl}>Dirección</label><input name="direccion" defaultValue={editandoAgencia.direccion || ""} style={inp} /></div>
              <div><label style={lbl}>Teléfono</label><input name="telefono" defaultValue={editandoAgencia.telefono || ""} style={inp} /></div>
              <div>
                <label style={lbl}>Logo actual</label>
                {editandoAgencia.logo && <img src={editandoAgencia.logo} alt="logo" style={{ maxHeight: 50, marginBottom: 8, background: "#f9fafb", borderRadius: 6, padding: 4 }} />}
                <label style={{ fontSize: 13, color: "#1e40af", cursor: "pointer", fontWeight: 700 }}>Cambiar logo (cualquier foto)
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    try {
                      const data = await leerImagen(f);
                      (e.target?.closest("form")?.querySelector('input[name="logoData"]') as HTMLInputElement).value = data;
                    } catch { alert("No se pudo leer la imagen"); }
                  }} />
                </label>
                <input type="hidden" name="logoData" />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setEditandoAgencia(null)} style={btn}>Cancelar</button>
                <button type="submit" style={btnPrim}>Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: credenciales recién creadas */}
      {credNueva && (
        <div style={modalBg} onClick={() => setCredNueva(null)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: "#1f6b3a" }}>Credenciales creadas</h3>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Anotá estos datos. La contraseña no se volverá a mostrar.</p>
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, fontSize: 15, fontFamily: "monospace" }}>
              <div style={{ marginBottom: 8 }}><span style={{ color: "#6b7280", fontSize: 11 }}>USUARIO</span><br /><b>{credNueva.usuario}</b></div>
              <div style={{ marginBottom: 8 }}><span style={{ color: "#6b7280", fontSize: 11 }}>CONTRASEÑA</span><br /><b>{credNueva.password}</b></div>
              <div><span style={{ color: "#6b7280", fontSize: 11 }}>NOMBRE</span><br /><b>{credNueva.nombre}</b></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => setCredNueva(null)} style={btn}>Cerrar</button>
              <a href="/login" style={btnPrim}>Probar login</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CategoriasTab — gestionar categorías de etiquetas.
// ════════════════════════════════════════════════════════════════════════════
function CategoriasTab() {
  const [cats, setCats] = useState<string[]>([]);
  const [nueva, setNueva] = useState("");

  function cargar() {
    fetch("/api/categorias").then(r => r.json()).then(d => setCats(d.categorias || [])).catch(() => {});
  }
  useEffect(cargar, []);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!nueva.trim()) return;
    const r = await fetch("/api/categorias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: nueva.trim() }) });
    if (r.ok) { setNueva(""); cargar(); }
  }

  async function eliminar(cat: string) {
    if (!confirm("¿Eliminar la categoría '" + cat + "'?")) return;
    await fetch(`/api/categorias?nombre=${encodeURIComponent(cat)}`, { method: "DELETE" });
    cargar();
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 8px", color: "#1f2937", fontSize: 18 }}>Categorías de etiquetas</h2>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>Estas categorías aparecen en el formulario al crear etiquetas. Añadí o eliminá las que necesites.</p>

      <form onSubmit={agregar} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={nueva} onChange={e => setNueva(e.target.value)} placeholder="Nueva categoría..." style={{ ...inp, flex: 1 }} />
        <button type="submit" style={btnPrim}>+ Añadir</button>
      </form>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {cats.map(cat => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 999, padding: "6px 8px 6px 14px" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{cat}</span>
            <button onClick={() => eliminar(cat)} style={{ background: "#fef2f2", border: "none", borderRadius: 999, width: 22, height: 22, cursor: "pointer", color: "#dc2626", fontWeight: 700, fontSize: 12 }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Componentes reutilizables ──
function Kpi({ label, value, color }: { label: string; value: any; color: string }) {
  return <div style={{ background:"#fff", border:`3px solid ${color}`, borderRadius:12, padding:"14px 18px", flex:1, minWidth:120 }}>
    <div style={{ fontSize: 11, color:"#6b7280", textTransform:"uppercase" }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
  </div>;
}
function KpiBox({ label, value, color }: { label: string; value: any; color: string }) {
  return <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderLeft:`4px solid ${color}`, borderRadius:10, padding:14 }}>
    <div style={{ fontSize: 11, color:"#6b7280", textTransform:"uppercase" }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
  </div>;
}
function TabBtn({ active, onClick, children }: { active: boolean; onClick: ()=>void; children: React.ReactNode }) {
  return <button onClick={onClick} style={{
    padding: "10px 18px", border: "none", borderBottom: active ? "3px solid #C23B22" : "3px solid transparent",
    background: "transparent", cursor: "pointer", fontWeight: 700, fontSize: 14, color: active ? "#C23B22" : "#6b7280",
  }}>{children}</button>;
}
function EstadoPill({ estado }: { estado: string }) {
  const c: Record<string,string> = { en_origen:"#dbeafe", en_transito:"#fef3c7", en_almacen:"#ede9fe", entregado:"#d1fae5" };
  const t: Record<string,string> = { en_origen:"#1e40af", en_transito:"#92400e", en_almacen:"#5b21b6", entregado:"#065f46" };
  const l: Record<string,string> = { en_origen:"Origen", en_transito:"Tránsito", en_almacen:"Almacén", entregado:"Entregado" };
  return <span style={{ background: c[estado], color: t[estado], padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{l[estado]}</span>;
}
function Inp({ label, name, val, type="text" }: { label: string; name: string; val: any; type?: string }) {
  return <div><label style={lbl}>{label}</label><input name={name} type={type} defaultValue={val ?? ""} style={inp} /></div>;
}

// ── Estilos constantes ──
const btn: React.CSSProperties = { padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, textDecoration: "none", display: "inline-block" };
const btnPrim: React.CSSProperties = { ...btn, background: "#C23B22", color: "#fff", border: "none" };
const inp: React.CSSProperties = { padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box", width: "100%" };
const lbl: React.CSSProperties = { display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:4 };
const th: React.CSSProperties = { background:"#f3f4f6", padding:"8px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:"#374151", textTransform:"uppercase", borderBottom:"2px solid #d1d5db", whiteSpace:"nowrap" };
const td: React.CSSProperties = { padding:"8px 10px", borderBottom:"1px solid #f3f4f6", whiteSpace:"nowrap" };
const kpisRow: React.CSSProperties = { display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" };
const miniBtn: React.CSSProperties = { padding:"4px 8px", borderRadius:6, border:"1px solid #d1d5db", background:"#fff", cursor:"pointer", fontSize:11, fontWeight:700, marginRight:4 };
const modalBg: React.CSSProperties = { position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"grid", placeItems:"center", zIndex:1000, padding:16 };
const modalCard: React.CSSProperties = { background:"#fff", borderRadius:14, padding:24, maxWidth:600, width:"100%", maxHeight:"90vh", overflowY:"auto" };
