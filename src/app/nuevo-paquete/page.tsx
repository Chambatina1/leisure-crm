"use client";
import { useState, useEffect, useMemo } from "react";

// ════════════════════════════════════════════════════════════════════════════
// /nuevo-paquete — Wizard de 3 pasos (sin emojis, diseño limpio).
//
//   PASO 1 · Paquete   → peso (lb↔kg en vivo) + piezas + dimensiones OPCIONALES
//   PASO 2 · Personas  → remitente + receptor (carnet, dirección Cuba, teléfono)
//   PASO 3 · Revisar   → preview de la etiqueta + contabilidad opcional
//
// Foto de cabecera: barco de contenedores (relacionado con el servicio).
// ════════════════════════════════════════════════════════════════════════════

const HEADER_IMG = "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1200";

import { PROVINCIAS, MUNICIPIOS } from "@/lib/municipios";
// Las categorías se cargan dinámicamente desde /api/categorias
  const [CATEGORIAS, setCategorias] = useState(["Comida","Ropa","Electrodoméstico","Medicina","Documentos","Higiene","Repuestos","Combustible","Vehículo","Miscelánea","Otro"]);

export default function NuevoPaquetePage() {
  const [paso, setPaso] = useState(1);
  const [agenciaId, setAgenciaId] = useState("");
  const [agenciaNombre, setAgenciaNombre] = useState("");
  const [contabilidad, setContabilidad] = useState(false);

  // ── Campos del wizard ──
  const [peso, setPeso] = useState("1");
  const [piezas, setPiezas] = useState("1");
  const [categoria, setCategoria] = useState("Comida");
  const [alto, setAlto] = useState("");
  const [largo, setLargo] = useState("");
  const [ancho, setAncho] = useState("");
  const [contenido, setContenido] = useState("");
  const [notas, setNotas] = useState("");

  const [remitente, setRemitente] = useState("");
  const [remitenteTel, setRemitenteTel] = useState("");
  const [remitenteCarnet, setRemitenteCarnet] = useState("");
  const [remitenteDir, setRemitenteDir] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [consignatarioCarnet, setConsignatarioCarnet] = useState("");
  const [consignatarioTel, setConsignatarioTel] = useState("");
  const [consignatarioCalle, setConsignatarioCalle] = useState("");
  const [consignatarioEntre, setConsignatarioEntre] = useState("");
  const [consignatarioMunicipio, setConsignatarioMunicipio] = useState("");
  const [consignatarioProvincia, setConsignatarioProvincia] = useState("La Habana");

  const [usarConta, setUsarConta] = useState(false);
  const [formaPago, setFormaPago] = useState("efectivo");
  const [tarifa, setTarifa] = useState("");

  const [guardando, setGuardando] = useState(false);
  // Buscador de clientes (remitente/receptor ya existentes)
  const [clientes, setClientes] = useState<any[]>([]);
  const [buscandoRem, setBuscandoRem] = useState(false);
  const [buscandoDes, setBuscandoDes] = useState(false);

  useEffect(() => {
    fetch("/api/clientes").then(r => r.json()).then(d => setClientes(d.clientes || [])).catch(() => {});
  }, []);
  const [guardandoMsg, setGuardandoMsg] = useState("");
  const [error, setError] = useState("");
  const [creado, setCreado] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agencias").then(r => r.json()).then(d => {
      const a = d.agencias?.[0];
      if (a) { setAgenciaId(a.id); setAgenciaNombre(a.nombre); setContabilidad(!!a.contabilidadActiva); }
    }).catch(() => {});
    // Cargar categorías dinámicas
    fetch("/api/categorias").then(r => r.json()).then(d => { if (d.categorias) setCategorias(d.categorias); }).catch(() => {});
  }, []);

  // ── Cálculos en vivo ──
  const pesoNum = parseFloat(peso) || 0;
  const pesoKg = (pesoNum * 0.453592).toFixed(2);
  const vol = useMemo(() => calcVol(alto, largo, ancho), [alto, largo, ancho]);

  // ── Validación por paso ──
  const paso1Ok = pesoNum > 0 && piezas !== "";
  const paso2Ok = remitente.trim() !== "" && destinatario.trim() !== "";

  async function guardar() {
    setError(""); setGuardando(true);

    // Refrescar el agenciaId ANTES de enviar: si el servidor se reinició desde
    // que se cargó la página, los IDs cambiaron (la DB en /tmp no es persistente).
    let agIdActual = agenciaId;
    try {
      const resAg = await fetch("/api/agencias");
      const dAg = await resAg.json();
      const a = dAg.agencias?.[0];
      if (a) {
        agIdActual = a.id;
        setAgenciaId(a.id);
      }
    } catch {}

    const payload: Record<string, unknown> = {
      agenciaId: agIdActual, peso, piezas, categoria, contenido: contenido || "Miscelánea", notas,
      remitente, remitenteTel, remitenteCarnet,
      destinatario, consignatarioCarnet, consignatarioTel,
      consignatarioCalle, consignatarioEntre, consignatarioMunicipio, consignatarioProvincia,
      destino: consignatarioProvincia,
    };
    if (alto && largo && ancho) Object.assign(payload, { alto, largo, ancho });
    if (contabilidad && usarConta) { payload.formaPago = formaPago; payload.tarifa = tarifa; }

    // Reintentos solo para errores de RED (servidor dormido/sin respuesta).
    // Si el servidor responde con un error (400/500), NO reintentar: mostrar el error.
    const MAX_INTENTOS = 4;
    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
      setGuardandoMsg(intento === 1 ? "Generando…" : `El servidor está despertando… reintento ${intento}/${MAX_INTENTOS}`);
      try {
        const res = await fetch("/api/paquetes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(25000),
        });
        const d = await res.json().catch(() => ({}));
        // Éxito
        if (res.ok && d.paquete) {
          setCreado(d.paquete.codigo);
          setGuardandoMsg("");
          return;
        }
        // Error 400 (datos inválidos) — no reintentar, mostrar mensaje claro
        if (res.status >= 400 && res.status < 500) {
          setError(d.error || "Revisá los datos e intentá de nuevo.");
          setGuardando(false);
          setGuardandoMsg("");
          return;
        }
        // Error 500 (problema del servidor) — si incluye "Foreign key" o "table",
        // es un problema de base de datos que no se arregla reintentando.
        const msg = d.error || "";
        if (res.status >= 500 && /foreign key|does not exist|table/i.test(msg)) {
          setError(
            "Hay un problema con la base de datos del servidor. " +
            "Estamos migrando a una base más robusta. Mientras tanto, podés probar en unos minutos."
          );
          setGuardando(false);
          setGuardandoMsg("");
          return;
        }
        // Otro 500 — reintentar (puede ser cold-start)
        if (res.status >= 500) throw new Error("servidor 500");
      } catch (err) {
        // Error de RED (no hubo respuesta) — reintentar tras pausa
        if (intento < MAX_INTENTOS) {
          await new Promise(r => setTimeout(r, intento * 2000));
        } else {
          setError(
            "No se pudo conectar con el servidor tras varios intentos. " +
            "Si la app estaba dormida, esperá 1 minuto y volvé a intentar."
          );
          setGuardando(false);
          setGuardandoMsg("");
        }
      }
    }
  }

  if (creado) return <Exito codigo={creado} peso={peso} pesoKg={pesoKg} />;

  return (
    <div style={wrap}>
      {/* Foto de cabecera */}
      <div style={header}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HEADER_IMG} alt="Servicio de exportación marítima" style={headerImg} />
        <div style={headerOverlay} />
        <div style={headerText}>
          <h1 style={{ margin: 0, color: "#fff", fontSize: 24, fontWeight: 800 }}>Nueva etiqueta de envío</h1>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,.9)", fontSize: 14 }}>3 pasos · Menos de un minuto</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div style={progreso}>
        {[1,2,3].map(n => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div style={{
              ...progDot,
              background: n < paso ? "#1f6b3a" : n === paso ? "#C23B22" : "#e5e7eb",
              color: n <= paso ? "#fff" : "#9ca3af",
            }}>{n < paso ? "✓" : n}</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: n <= paso ? "#1f2937" : "#9ca3af" }}>
              {n === 1 ? "Paquete" : n === 2 ? "Personas" : "Revisar"}
            </span>
            {n < 3 && <div style={{ flex: 1, height: 2, background: n < paso ? "#1f6b3a" : "#e5e7eb" }} />}
          </div>
        ))}
      </div>

      {/* ════ PASO 1 · PAQUETE ════ */}
      {paso === 1 && (
        <div style={card}>
          <div style={pesoBox}>
            <label style={lblUppercase}>Peso</label>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 6 }}>
              <input type="number" min="0" step="0.1" value={peso} onChange={e => setPeso(e.target.value)} required
                style={pesoInput} autoFocus />
              <span style={{ fontSize: 14, color: "#6b7280", fontWeight: 600 }}>lb</span>
              <span style={{ fontSize: 18, color: "#1f6b3a", fontWeight: 800 }}>= {pesoKg} kg</span>
            </div>
          </div>

          <div style={grid2}>
            <Field label="Piezas" value={piezas} onChange={setPiezas} type="number" />
            <SelectField label="Categoría" value={categoria} onChange={(v) => {
              setCategoria(v);
              if (v === "Miscelánea") setContenido("Miscelánea");
              else if (contenido === "Miscelánea") setContenido("");
            }} options={CATEGORIAS} />
          </div>

          <div style={dimBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={lblUppercase}>Dimensiones <span style={{ color: "#9ca3af", fontWeight: 600 }}>(opcional)</span></label>
              {vol && <span style={volBadge}>{vol.ft3} ft³ · {vol.m3} m³</span>}
            </div>
            <div style={{ ...grid3, marginTop: 8 }}>
              <Field label="Alto (in)" value={alto} onChange={setAlto} type="number" placeholder="—" />
              <Field label="Largo (in)" value={largo} onChange={setLargo} type="number" placeholder="—" />
              <Field label="Ancho (in)" value={ancho} onChange={setAncho} type="number" placeholder="—" />
            </div>
          </div>

          <div>
            <label style={lbl}>Descripción del contenido (lo que aparece en la etiqueta)</label>
            <textarea value={contenido} onChange={e => setContenido(e.target.value)}
              placeholder="Describí el artículo a enviar. Ej: Ropa usada, 2 cajas de comida, medicina surtida..."
              style={{ ...inp, minHeight: 60, resize: "vertical", fontFamily: "inherit" }} />
          </div>

          <button onClick={() => setPaso(2)} disabled={!paso1Ok} style={{ ...btnPrim, width: "100%", opacity: paso1Ok ? 1 : 0.5 }}>
            Siguiente
          </button>
        </div>
      )}

      {/* ════ PASO 2 · PERSONAS ════ */}
      {paso === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={card}>
            <div style={sectionHeader}>Remitente <span style={{ color: "#9ca3af", fontWeight: 500, fontSize: 14 }}>(quién envía)</span></div>
            <label style={lbl}>Nombre *</label>
            <BuscadorCliente valor={remitente} onChange={setRemitente} clientes={clientes}
              placeholder="Ana Pérez"
              onSeleccionar={cl => { setRemitente(cl.nombre); setRemitenteTel(cl.telefono || ""); setRemitenteDir(cl.direccion || ""); }} />
            <div style={grid2}>
              <Field label="Carnet / Pasaporte" value={remitenteCarnet} onChange={setRemitenteCarnet} />
              <Field label="Teléfono" value={remitenteTel} onChange={setRemitenteTel} />
            </div>
          </div>

          <div style={card}>
            <div style={sectionHeader}>Receptor <span style={{ color: "#9ca3af", fontWeight: 500, fontSize: 14 }}>(quién recibe en Cuba)</span></div>
            <label style={lbl}>Nombre *</label>
            <BuscadorCliente valor={destinatario} onChange={setDestinatario} clientes={clientes}
              placeholder="José Gómez"
              onSeleccionar={cl => { setDestinatario(cl.nombre); setConsignatarioTel(cl.telefono || ""); setConsignatarioCalle(cl.direccion || ""); }} />
            <div style={grid2}>
              <Field label="Carnet de identidad" value={consignatarioCarnet} onChange={setConsignatarioCarnet} />
              <Field label="Teléfono" value={consignatarioTel} onChange={setConsignatarioTel} />
            </div>
            <div>
              <label style={lbl}>DIRECCIÓN (calle, número, entre calles, reparto)</label>
              <textarea value={consignatarioCalle} onChange={e => setConsignatarioCalle(e.target.value)}
                placeholder="Ej: Calle Loma No. 62, e/ Aspuru y Linea, Poblado Camarioca"
                style={{ ...inp, minHeight: 70, resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div style={grid2}>
              <SelectField label="Municipio" value={consignatarioMunicipio} onChange={(v) => { setConsignatarioMunicipio(v); }}
                options={(MUNICIPIOS[consignatarioProvincia] || []).length > 0 ? MUNICIPIOS[consignatarioProvincia] : ["(Selecciona provincia)"]} />
              <SelectField label="Provincia" value={consignatarioProvincia}
                onChange={(v) => { setConsignatarioProvincia(v); setConsignatarioMunicipio(""); }}
                options={[...PROVINCIAS]} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setPaso(1)} style={{ ...btnOut, flex: 1 }}>Atrás</button>
            <button onClick={() => setPaso(3)} disabled={!paso2Ok} style={{ ...btnPrim, flex: 1, opacity: paso2Ok ? 1 : 0.5 }}>
              Revisar
            </button>
          </div>
        </div>
      )}

      {/* ════ PASO 3 · REVISAR ════ */}
      {paso === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={card}>
            <div style={sectionHeader}>Vista previa de la etiqueta</div>
            <PreviewEtiqueta
              peso={peso} pesoKg={pesoKg} piezas={piezas} vol={vol}
              remitente={remitente} destinatario={destinatario}
              consignatarioCalle={consignatarioCalle} consignatarioMunicipio={consignatarioMunicipio}
              consignatarioProvincia={consignatarioProvincia} contenido={contenido}
            />
          </div>

          {contabilidad && (
            <div style={card}>
              <button onClick={() => setUsarConta(x => !x)} style={toggleBtn}>
                {usarConta ? "▾ Contabilidad (activada)" : "▸ Registrar en contabilidad (opcional)"}
              </button>
              {usarConta && (
                <div style={{ ...grid2, marginTop: 12 }}>
                  <Field label="Tarifa / lb ($)" value={tarifa} onChange={setTarifa} type="number" placeholder="4.50" />
                  <SelectField label="Forma de pago" value={formaPago} onChange={setFormaPago} options={[
                    { v: "efectivo", l: "Efectivo" }, { v: "banco", l: "Banco / Transferencia" }, { v: "credito", l: "A crédito" },
                  ]} />
                </div>
              )}
            </div>
          )}

          <Field label="Notas" value={notas} onChange={setNotas} placeholder="Cualquier observación…" />

          {error && <div style={errBox}>{error}</div>}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setPaso(2)} style={{ ...btnOut, flex: 1 }}>Atrás</button>
            <button onClick={guardar} disabled={guardando} style={{ ...btnPrim, flex: 1, fontSize: 17, opacity: guardando ? 0.75 : 1 }}>
              {guardando ? (guardandoMsg || "Generando…") : "Generar etiqueta"}
            </button>
          </div>
        </div>
      )}

      {agenciaNombre && (
        <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 12, marginTop: 8 }}>
          Agencia: {agenciaNombre}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BuscadorCliente — autocompleta desde la base de datos de clientes.
// Muestra sugerencias mientras se escribe. Al seleccionar, llena los campos.
// ════════════════════════════════════════════════════════════════════════════
function BuscadorCliente({
  valor, onChange, clientes, placeholder, onSeleccionar,
}: {
  valor: string; onChange: (v: string) => void;
  clientes: any[]; placeholder: string;
  onSeleccionar: (c: any) => void;
}) {
  const [mostrar, setMostrar] = useState(false);
  const txt = valor.toLowerCase().trim();
  const sugerencias = txt.length >= 2
    ? clientes.filter(c =>
        (c.nombre || "").toLowerCase().includes(txt) ||
        (c.telefono || "").includes(txt)
      ).slice(0, 5)
    : [];

  return (
    <div style={{ position: "relative" }}>
      <input value={valor} onChange={e => { onChange(e.target.value); setMostrar(true); }}
        onFocus={() => setMostrar(true)} onBlur={() => setTimeout(() => setMostrar(false), 200)}
        placeholder={placeholder} required
        style={{ ...inp, fontSize: 18, padding: "14px 16px" }} />
      {mostrar && sugerencias.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1px solid #d1d5db", borderRadius: "0 0 10px 10px",
          boxShadow: "0 4px 12px rgba(0,0,0,.1)", maxHeight: 200, overflowY: "auto",
        }}>
          <div style={{ fontSize: 10, color: "#9ca3af", padding: "6px 12px", borderBottom: "1px solid #f3f4f6", fontWeight: 700, textTransform: "uppercase" }}>
            Clientes existentes
          </div>
          {sugerencias.map(cl => (
            <div key={cl.id} onMouseDown={() => { onSeleccionar(cl); setMostrar(false); }}
              style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #f9fafb", fontSize: 14 }}
              onMouseEnter={e => (e.currentTarget.style.background = "#fef3c7")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div style={{ fontWeight: 700 }}>{cl.nombre}</div>
              {cl.telefono && <div style={{ fontSize: 11, color: "#6b7280" }}>{cl.telefono}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Vista previa de la etiqueta térmica (miniatura)
// ════════════════════════════════════════════════════════════════════════════
function PreviewEtiqueta({ peso, pesoKg, piezas, vol, remitente, destinatario, consignatarioCalle, consignatarioMunicipio, consignatarioProvincia, contenido }: {
  peso: string; pesoKg: string; piezas: string; vol: { ft3: number; m3: number } | null;
  remitente: string; destinatario: string; consignatarioCalle: string; consignatarioMunicipio: string; consignatarioProvincia: string; contenido: string;
}) {
  const dir = [consignatarioCalle, consignatarioMunicipio, consignatarioProvincia].filter(Boolean).join(", ");
  return (
    <div style={{ border: "2px dashed #d1d5db", borderRadius: 10, padding: 14, background: "#fafafa", fontFamily: "Arial", fontSize: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000", paddingBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#C23B22" }}>GRUPO EMPRESARIAL</div>
          <div style={{ fontSize: 9, color: "#6b7280" }}>Grupo Empresarial</div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#C23B22", border: "3px solid #C23B22", borderRadius: 8, padding: "2px 12px" }}>K</div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={prevLabel}>DE / FROM</div>
          <div style={prevVal}>{remitente || "—"}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={prevLabel}>PARA / TO</div>
          <div style={prevVal}>{destinatario || "—"}</div>
          {dir && <div style={{ fontSize: 11, color: "#6b7280" }}>{dir}</div>}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
        <span><b>Peso:</b> {peso} lb / {pesoKg} kg</span>
        <span><b>Pzs:</b> {piezas}</span>
        {vol && <span><b>Vol:</b> {vol.ft3} ft³</span>}
      </div>
      {contenido && contenido !== "Paquete" && (
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Contenido: {contenido}</div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Pantalla de éxito
// ════════════════════════════════════════════════════════════════════════════
function Exito({ codigo, peso, pesoKg }: { codigo: string; peso: string; pesoKg: string }) {
  return (
    <div style={wrap}>
      <div style={cardOk}>
        <h2 style={{ color: "#1f6b3a", marginTop: 0 }}>Envío registrado</h2>
        <div style={codeBox}>{codigo}</div>
        <p style={{ fontSize: 13, color: "#6b7280" }}>Peso: {peso} lb · {pesoKg} kg</p>

        <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginTop: 24, marginBottom: 12 }}>
          Documentos del envío
        </p>

        {/* 3 documentos como tarjetas grandes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Etiqueta térmica */}
          <a href={`/etiqueta/${codigo}`} target="_blank" rel="noopener" style={docCard}>
            <div style={docIcon}>4×6</div>
            <div style={docInfo}>
              <strong>Etiqueta térmica</strong>
              <small>Para pegar en el bulto · imprime en impresora térmica</small>
            </div>
            <div style={docArrow}>→</div>
          </a>

          {/* HBL */}
          <a href={`/hbl/${codigo}`} target="_blank" rel="noopener" style={docCard}>
            <div style={docIcon}>HBL</div>
            <div style={docInfo}>
              <strong>House Bill of Lading</strong>
              <small>Documento de transporte del envío · A4</small>
            </div>
            <div style={docArrow}>→</div>
          </a>

          {/* Manifiesto */}
          <a href="/bol" target="_blank" rel="noopener" style={docCard}>
            <div style={docIcon}>M</div>
            <div style={docInfo}>
              <strong>Manifiesto de carga</strong>
              <small>Lista de todos los envíos del embarque · A4</small>
            </div>
            <div style={docArrow}>→</div>
          </a>
        </div>

        <button onClick={() => window.location.href = "/nuevo-paquete"} style={{ ...btnOut, width: "100%", marginTop: 20 }}>
          + Crear otro envío
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Cálculo de volumen en vivo (client-side, espejo del servidor)
// ════════════════════════════════════════════════════════════════════════════
function calcVol(alto?: string, largo?: string, ancho?: string): { ft3: number; m3: number } | null {
  const a = Number(alto), l = Number(largo), n = Number(ancho);
  if (!a || !l || !n || a <= 0 || l <= 0 || n <= 0) return null;
  const ft3 = a * l * n / 1728;
  const m3 = ft3 * 0.0283168;
  return { ft3: Math.round(ft3 * 100) / 100, m3: Math.round(m3 * 10000) / 10000 };
}

// ════════════════════════════════════════════════════════════════════════════
// Componentes
// ════════════════════════════════════════════════════════════════════════════
function Field({ label, value, onChange, type="text", placeholder="" }:
  { label: string; value: string; onChange:(v:string)=>void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={inp} />
    </div>
  );
}
function BigField({ label, value, onChange, placeholder, required }:
  { label: string; value: string; onChange:(v:string)=>void; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        style={{ ...inp, fontSize: 18, padding: "14px 16px" }} />
    </div>
  );
}
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange:(v:string)=>void; options: (string|{v:string;l:string})[] }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={inp}>
        {options.map(o => { const v = typeof o==="string"?o:o.v; const l = typeof o==="string"?o:o.l; return <option key={v} value={v}>{l}</option>; })}
      </select>
    </div>
  );
}

// ── Estilos ──
const wrap: React.CSSProperties = { maxWidth: 560, margin: "0 auto", padding: "0 16px 80px", fontFamily: "Arial" };
const header: React.CSSProperties = { position: "relative", height: 140, margin: "0 -16px 20px", overflow: "hidden" };
const headerImg: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", display: "block" };
const headerOverlay: React.CSSProperties = { position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,.6), rgba(0,0,0,.25))" };
const headerText: React.CSSProperties = { position: "absolute", left: 20, bottom: 16 };
const progreso: React.CSSProperties = { display: "flex", alignItems: "center", gap: 4, marginBottom: 20 };
const progDot: React.CSSProperties = { width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 };
const card: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,.06)", display: "flex", flexDirection: "column", gap: 14 };
const pesoBox: React.CSSProperties = { background: "#fef3c7", borderRadius: 12, padding: 16 };
const dimBox: React.CSSProperties = { background: "#eff6ff", borderRadius: 12, padding: 16 };
const volBadge: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: "#1e40af", background: "#dbeafe", padding: "4px 10px", borderRadius: 8 };
const lblUppercase: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: "#374151", textTransform: "uppercase" };
const sectionHeader: React.CSSProperties = { fontSize: 16, fontWeight: 800, color: "#1f2937", display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4 };
const inp: React.CSSProperties = { width: "100%", padding: "11px 13px", border: "1px solid #d1d5db", borderRadius: 9, fontSize: 15, boxSizing: "border-box" };
const pesoInput: React.CSSProperties = { width: 120, fontSize: 32, fontWeight: 800, padding: "8px 12px", border: "2px solid #e0a106", borderRadius: 10 };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const grid3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 };
const toggleBtn: React.CSSProperties = { background: "none", border: "none", color: "#C23B22", cursor: "pointer", fontSize: 13, fontWeight: 700, textAlign: "left", padding: 0 };
const btnPrim: React.CSSProperties = { display: "inline-block", padding: "14px 28px", borderRadius: 12, background: "#C23B22", color: "#fff", textDecoration: "none", fontWeight: 800, border: "none", cursor: "pointer", textAlign: "center", fontSize: 15 };
const btnOut: React.CSSProperties = { ...btnPrim, background: "transparent", color: "#C23B22", border: "2px solid #C23B22" };
const errBox: React.CSSProperties = { color: "#dc2626", padding: 12, background: "#fef2f2", borderRadius: 10, fontSize: 14 };
const cardOk: React.CSSProperties = { background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,.06)" };
const codeBox: React.CSSProperties = { display: "inline-block", fontSize: 28, fontWeight: 900, color: "#C23B22", letterSpacing: 2, background: "#faf5f5", padding: "12px 24px", borderRadius: 12, margin: "16px 0" };
const prevLabel: React.CSSProperties = { fontSize: 9, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase" };
const prevVal: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: "#1f2937" };
const docCard: React.CSSProperties = { display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: "#fff", border: "2px solid #e5e7eb", borderRadius: 12, textDecoration: "none", color: "inherit", transition: ".15s" };
const docIcon: React.CSSProperties = { width: 48, height: 48, flexShrink: 0, background: "#C23B22", color: "#fff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14 };
const docInfo: React.CSSProperties = { flex: 1, display: "flex", flexDirection: "column" };
const docArrow: React.CSSProperties = { fontSize: 20, color: "#9ca3af", fontWeight: 700 };
