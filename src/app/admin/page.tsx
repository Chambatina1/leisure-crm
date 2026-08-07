"use client";
import { useState, useEffect } from "react";

// ════════════════════════════════════════════════════════════════════════════
// /admin — Back-office del administrador (matriz).
// 4 pilares: CONTABILIDAD · ANÁLISIS · ESTADO DE PAQUETES · RASTREADOR
// Control, soporte y supervisión de todas las agencias.
// ════════════════════════════════════════════════════════════════════════════
type Tab = "contabilidad" | "analisis" | "estados" | "rastreador";

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
      </div>

      {/* Contenido */}
      {tab === "estados" && <EstadosTab agencias={agencias} />}
      {tab === "rastreador" && <RastreadorTab agencias={agencias} />}
      {tab === "contabilidad" && <ContabilidadTab resumen={resumen} />}
      {tab === "analisis" && <AnalisisTab />}
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
