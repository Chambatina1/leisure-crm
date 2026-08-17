"use client";
import { useState, useRef } from "react";

// ════════════════════════════════════════════════════════════════════════════
// /almacen — Contador de bultos por foto.
// Subís/tomás foto panorámica del almacén → tocás cada bulto →
// cuenta automática → peso promedio → total calculado.
// ════════════════════════════════════════════════════════════════════════════

interface Marcado { x: number; y: number; w?: number; h?: number }

export default function AlmacenPage() {
  const [foto, setFoto] = useState<string | null>(null);
  const [marcados, setMarcados] = useState<Marcado[]>([]);
  const [analizando, setAnalizando] = useState(false);
  const [iaResultado, setIaResultado] = useState<null | { total: number; confianza: string; descripcion: string }>(null);
  const [pesoProm, setPesoProm] = useState("25");
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const total = marcados.length;
  const pesoNum = parseFloat(pesoProm) || 0;
  const pesoTotalLb = total * pesoNum;
  const pesoTotalKg = pesoTotalLb * 0.453592;

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { setFoto(r.result as string); setMarcados([]); };
    r.readAsDataURL(f);
  }

  function marcar(e: React.MouseEvent<HTMLDivElement>) {
    if (!foto || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMarcados(prev => [...prev, { x, y }]);
  }

  function deshacerUltimo() { setMarcados(prev => prev.slice(0, -1)); }
  function limpiar() { setMarcados([]); }

  // AUTO-DETECCIÓN MEJORADA: especializada en CAJAS
  // Detecta cajas por color (cartón) + forma rectangular + tamaño
  // Contar con IA (OpenAI GPT-4 Vision)
  async function contarConIA() {
    if (!foto || analizando) return;
    setAnalizando(true);
    setIaResultado(null);
    try {
      const res = await fetch("/api/almacen/contar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen: foto, pesoProm: pesoNum }),
      });
      const d = await res.json();
      if (!res.ok) { alert("Error: " + (d.detalle || d.error)); setAnalizando(false); return; }
      setIaResultado({
        total: d.total || 0,
        confianza: d.confianza || "media",
        descripcion: d.descripcion || "",
      });
      // Si la IA devolvió coordenadas, usarlas para dibujar los recuadros
      if (d.cajas && Array.isArray(d.cajas) && d.cajas.length > 0) {
        setMarcados(d.cajas.map((caja: any) => ({
          x: caja.x || 50,
          y: caja.y || 50,
          w: caja.w || 8,
          h: caja.h || 8,
        })));
      } else {
        // Fallback: solo actualizar el número
        const totalIA = d.total || 0;
        setMarcados([]);
      }
    } catch (e: any) {
      alert("No se pudo analizar: " + e.message);
    }
    setAnalizando(false);
  }

  function autoDetectar() {
    if (!foto || !imgRef.current) return;
    const img = imgRef.current.querySelector("img");
    if (!img) return;

    const canvas = document.createElement("canvas");
    const maxW = 900;
    const scale = Math.min(1, maxW / img.naturalWidth);
    canvas.width = Math.floor(img.naturalWidth * scale);
    canvas.height = Math.floor(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const w = canvas.width, h = canvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data;

    // ═══ PASO 1: Detectar píxeles que parecen CAJA ═══
    // Cajas de cartón: marrón, beige, tan, kraft
    // También detectar bordes fuertes (cajas apiladas)
    const isBoxPixel = new Uint8Array(w * h);
    
    for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      
      // Cartón: r > g > b, tonos cálidos
      const isCardboard = (
        r > 100 && r < 230 &&
        g > 70 && g < 200 &&
        b > 40 && b < 160 &&
        r > g && g > b &&
        (r - b) > 30 && (r - b) < 130
      );
      
      // Cajas de colores comunes en almacenes (azul, blanco, gris claro)
      const isLightBox = (
        r > 180 && g > 180 && b > 180 &&  // blanco/gris claro
        Math.abs(r - g) < 30 && Math.abs(g - b) < 30
      );
      
      if (isCardboard || isLightBox) {
        isBoxPixel[p] = 1;
      }
    }

    // ═══ PASO 2: Encontrar regiones conectadas de cajas ═══
    const visited = new Uint8Array(w * h);
    const candidates: { x: number; y: number; size: number; w: number; h: number; fill: number }[] = [];
    const stack: number[] = [];
    const minArea = w * h * 0.0005;   // mínimo 0.05% de la imagen
    const maxArea = w * h * 0.15;     // máximo 15% de la imagen

    for (let start = 0; start < w * h; start++) {
      if (visited[start] || !isBoxPixel[start]) continue;
      
      stack.length = 0;
      stack.push(start);
      visited[start] = 1;
      let count = 0, minX = w, maxX = 0, minY = h, maxY = 0;
      
      while (stack.length > 0) {
        const cur = stack.pop()!;
        const cy = Math.floor(cur / w);
        const cx = cur % w;
        count++;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        
        const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
        for (const [dx, dy] of dirs) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const nidx = ny * w + nx;
          if (!visited[nidx] && isBoxPixel[nidx]) {
            visited[nidx] = 1;
            stack.push(nidx);
          }
        }
      }
      
      // ═══ PASO 3: Filtrar por forma de CAJA ═══
      if (count < minArea || count > maxArea) continue;
      
      const bw = maxX - minX + 1;
      const bh = maxY - minY + 1;
      const bboxArea = bw * bh;
      const fillRatio = count / bboxArea;  // qué tan llena está la bounding box
      
      // Cajas son rectangulares: fill ratio alto (> 0.5)
      // Aspect ratio: entre 0.3 y 3 (no muy alargadas ni muy cuadradas)
      const aspectRatio = bw / bh;
      
      if (fillRatio > 0.45 && aspectRatio > 0.25 && aspectRatio < 4.0) {
        candidates.push({
          x: ((minX + maxX) / 2 / w) * 100,
          y: ((minY + maxY) / 2 / h) * 100,
          size: count,
          w: bw, h: bh,
          fill: fillRatio,
        });
      }
    }

    // ═══ PASO 4: Eliminar detecciones que se solapan ═══
    candidates.sort((a, b) => b.size - a.size);
    const finalBoxes: typeof candidates = [];
    
    for (const c of candidates) {
      const overlaps = finalBoxes.some(f => {
        const dx = Math.abs(f.x - c.x);
        const dy = Math.abs(f.y - c.y);
        return dx < 3.5 && dy < 3.5; // dentro de 3.5% de distancia
      });
      if (!overlaps) finalBoxes.push(c);
    }

    // ═══ PASO 5: Limitar y marcar ═══
    const result = finalBoxes.slice(0, 300);
    setMarcados(result.map(b => ({ x: b.x, y: b.y })));

    return result.length;
  }

  function exportarReporte() {
    const texto = `REPORTE DE ALMACÉN
Fecha: ${new Date().toLocaleString()}
Bultos contados: ${total}
Peso promedio: ${pesoNum} lb
Peso total: ${pesoTotalLb.toFixed(1)} lb / ${pesoTotalKg.toFixed(2)} kg`;
    const blob = new Blob([texto], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `almacen-${Date.now()}.txt`; a.click();
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 12px 60px", fontFamily: "Arial" }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ color: "#C23B22", fontSize: 24, margin: "0 0 4px" }}>Contador de Almacén</h1>
        <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Tomá una foto panorámica del almacén y tocá cada bulto para contar</p>
      </div>

      {/* Upload / Camera */}
      {!foto && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", padding: 40, background: "#fff", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
          <button onClick={() => fileRef.current?.click()} style={{ padding: "16px 32px", borderRadius: 12, background: "#C23B22", color: "#fff", border: "none", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
            Tomar / Subir foto del almacén
          </button>
          <small style={{ color: "#9ca3af", fontSize: 12 }}>Podés tomar foto o subir una imagen existente</small>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} style={{ display: "none" }} />
        </div>
      )}

      {/* Foto + Marcas */}
      {foto && (
        <>
          {/* Controles */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <div style={{ ...statBox, borderLeft: "4px solid #C23B22" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#C23B22" }}>{total}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>BULTOS</div>
            </div>
            <div style={{ ...statBox, borderLeft: "4px solid #e0a106" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#92400e" }}>{pesoTotalLb.toFixed(0)}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>TOTAL LB</div>
            </div>
            <div style={{ ...statBox, borderLeft: "4px solid #1f6b3a" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#1f6b3a" }}>{pesoTotalKg.toFixed(1)}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>TOTAL KG</div>
            </div>
            {iaResultado && (
              <div style={{ ...statBox, borderLeft: "4px solid #10a37f", background: "#f0fdf9" }}>
                <div style={{ fontSize: 12, color: "#065f46" }}>
                  <b>IA:</b> {iaResultado.total} cajas<br />
                  <small>Confianza: {iaResultado.confianza}</small><br />
                  <small>{iaResultado.descripcion}</small>
                </div>
              </div>
            )}
          </div>

          {/* Foto con marcas */}
          <div ref={imgRef} onClick={marcar} style={{ position: "relative", background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.08)", cursor: "crosshair" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto} alt="almacén" style={{ width: "100%", display: "block" }} />
            
            {/* Grilla */}
            <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gridTemplateRows: "repeat(6, 1fr)", pointerEvents: "none" }}>
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} style={{ border: "1px solid rgba(255,255,255,.15)" }} />
              ))}
            </div>

            {/* Marcas */}
            {marcados.map((m, i) => m.w ? (
              <div key={i} style={{
                position: "absolute",
                left: `${m.x - (m.w || 8) / 2}%`, top: `${m.y - (m.h || 8) / 2}%`,
                width: `${m.w || 8}%`, height: `${m.h || 8}%`,
                border: "2.5px solid #C23B22",
                borderRadius: 3,
                background: "rgba(194,59,34,.12)",
                pointerEvents: "none", zIndex: 5,
                display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
              }}>
                <span style={{
                  background: "#C23B22", color: "#fff",
                  fontSize: 9, fontWeight: 800, padding: "1px 5px",
                  borderRadius: 2, margin: -1,
                }}>{i + 1}</span>
              </div>
            ) : (
              <div key={i} style={{
                position: "absolute", left: `${m.x}%`, top: `${m.y}%`,
                transform: "translate(-50%, -50%)",
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(194,59,34,.85)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 11, border: "2px solid #fff",
                pointerEvents: "none", zIndex: 5,
              }}>{i + 1}</div>
            ))}
          </div>

          {/* Peso promedio */}
          <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Peso promedio por bulto (lb)</label>
              <input type="number" value={pesoProm} onChange={e => setPesoProm(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 16, boxSizing: "border-box" }} />
            </div>
            <button onClick={deshacerUltimo} disabled={total === 0} style={{ ...btn, opacity: total ? 1 : 0.5 }}>↩ Deshacer</button>
            <button onClick={limpiar} disabled={total === 0} style={{ ...btn, background: "#dc2626", opacity: total ? 1 : 0.5 }}>🗑 Limpiar</button>
          </div>

          {/* Botones finales */}
          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={contarConIA} disabled={analizando} style={{ ...btn, background: "#10a37f", fontSize: 15, padding: "14px 24px", opacity: analizando ? 0.6 : 1 }}>
            {analizando ? "🤖 Analizando con IA..." : "🤖 Contar con IA"}
          </button>
            <button onClick={() => { setFoto(null); setMarcados([]); }} style={{ ...btn, background: "#374151" }}>📷 Nueva foto</button>
            <button onClick={exportarReporte} disabled={total === 0} style={{ ...btn, background: "#1f6b3a", opacity: total ? 1 : 0.5 }}>📄 Exportar reporte</button>
          </div>

          <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 12, marginTop: 12 }}>
            Tocá '🔍 Auto-detectar' para conteo automático, o toca cada bulto manualmente.
          </p>
        </>
      )}
    </div>
  );
}

const statBox: React.CSSProperties = { background: "#fff", borderRadius: 10, padding: "10px 18px", textAlign: "center", minWidth: 90, boxShadow: "0 2px 8px rgba(0,0,0,.05)" };
const btn: React.CSSProperties = { padding: "12px 20px", borderRadius: 10, background: "#C23B22", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" };
