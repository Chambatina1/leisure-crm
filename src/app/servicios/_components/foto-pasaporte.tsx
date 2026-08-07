"use client";
import { useRef, useState, useEffect } from "react";

// ════════════════════════════════════════════════════════════════════════════
// FotoPasaporte — captura de foto para trámite de pasaporte cubano.
// Dos modos:
//   1. Subir foto (file picker — galería/archivos)
//   2. Tomar foto (cámara en vivo vía getUserMedia, con guía de encuadre)
//
// Formato oficial: 5×5 cm (2×2 pulg.), fondo blanco, sin lentes, cara centrada.
// Muestra guía visual superpuesta para encuadrar la cara correctamente.
// ════════════════════════════════════════════════════════════════════════════

export default function FotoPasaporte() {
  const [modo, setModo] = useState<"idle" | "subir" | "camara">("idle");
  const [foto, setFoto] = useState<string | null>(null); // dataURL de la foto capturada
  const [streaming, setStreaming] = useState(false);
  const [errorCam, setErrorCam] = useState("");
  const [enviado, setEnviado] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Limpiar la cámara al desmontar o cambiar de modo.
  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }
  useEffect(() => () => stopCamera(), []);

  async function iniciarCamara() {
    setErrorCam("");
    setFoto(null);
    setModo("camara");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 600 }, height: { ideal: 600 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch (e: any) {
      setErrorCam(
        e?.name === "NotAllowedError"
          ? "Permiso de cámara denegado. Habilitá la cámara en el navegador."
          : "No se pudo acceder a la cámara. Probá subir una foto desde tus archivos."
      );
      setModo("idle");
    }
  }

  function capturar() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    // Recorte cuadrado centrado (formato pasaporte 1:1).
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Espejo: la cámara frontal se ve invertida, la invertimos para que coincida.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
    setFoto(canvas.toDataURL("image/jpeg", 0.92));
    stopCamera();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setFoto(reader.result as string);
    reader.readAsDataURL(f);
  }

  function reiniciar() {
    setFoto(null);
    setEnviado(false);
    setModo("idle");
  }

  async function enviar() {
    if (!foto) return;
    setEnviado(true);
    // Aquí iría el POST al backend para procesar/adaptar la foto.
    // Por ahora simulamos el envío.
  }

  // ═══ Pantalla: foto ya tomada/subida ═══
  if (foto) {
    return (
      <div style={wrap}>
        <div style={previewBox}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={foto} alt="Foto capturada" style={previewImg} />
        </div>
        {!enviado ? (
          <>
            <p style={okText}>¿La foto salió bien? Verificá: fondo claro, sin lentes, cara centrada.</p>
            <div style={botones}>
              <button onClick={reiniciar} style={btnOut}>Volver a tomar</button>
              <button onClick={enviar} style={btnPrim}>Enviar foto ($10)</button>
            </div>
          </>
        ) : (
          <div style={enviadoBox}>
            <strong>Foto enviada</strong>
            <p>La adaptamos al formato oficial del pasaporte cubano y te llega por email en 24 h.</p>
            <button onClick={reiniciar} style={btnOut}>Subir otra foto</button>
          </div>
        )}
      </div>
    );
  }

  // ═══ Pantalla: cámara en vivo ═══
  if (modo === "camara") {
    return (
      <div style={wrap}>
        <div style={camBox}>
          <video ref={videoRef} playsInline muted style={videoStyle} />
          {/* Guía de encuadre: óvalo para la cara + marco */}
          <div style={guiaOvalo} />
          <div style={guiaMarco} />
          {errorCam && <div style={errBox}>{errorCam}</div>}
        </div>
        <p style={hint}>Centrá tu cara en el óvalo. Fondo blanco, sin lentes, buena luz.</p>
        <div style={botones}>
          <button onClick={() => { stopCamera(); setModo("idle"); }} style={btnOut}>Cancelar</button>
          <button onClick={capturar} disabled={!streaming} style={{ ...btnPrim, opacity: streaming ? 1 : 0.5 }}>Capturar foto</button>
        </div>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    );
  }

  // ═══ Pantalla: selección inicial ═══
  return (
    <div style={wrap}>
      <div style={opcionesGrid}>
        <button onClick={iniciarCamara} style={opcionCard}>
          <div style={opcionIcon}>📷</div>
          <strong>Tomar foto</strong>
          <span style={opcionSub}>Usa la cámara ahora (celular o webcam)</span>
        </button>
        <button onClick={() => { setModo("subir"); fileRef.current?.click(); }} style={opcionCard}>
          <div style={opcionIcon}>📁</div>
          <strong>Subir foto</strong>
          <span style={opcionSub}>Desde galería o archivos del dispositivo</span>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />

      <div style={requisitosBox}>
        <strong style={requisitosTitle}>Requisitos de la foto</strong>
        <ul style={requisitosList}>
          <li>Tamaño: <strong>5×5 cm</strong> (2×2 pulgadas), cuadrada</li>
          <li>Fondo <strong>blanco</strong> o claro, liso (sin patrones)</li>
          <li><strong>Sin lentes</strong>, cara descubierta</li>
          <li>Expresión neutra, boca cerrada, mirada al frente</li>
          <li>Buena iluminación, sin sombras en la cara</li>
        </ul>
      </div>
    </div>
  );
}

// ── Estilos ──
const wrap: React.CSSProperties = { marginTop: 16 };
const opcionesGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };
const opcionCard: React.CSSProperties = { background: "#fff", border: "2px solid #1e40af", borderRadius: 14, padding: "24px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "#1e40af", fontFamily: "inherit", transition: ".15s" };
const opcionIcon: React.CSSProperties = { fontSize: 36 };
const opcionSub: React.CSSProperties = { fontSize: 12, color: "#6b7280", textAlign: "center", lineHeight: 1.4 };

const requisitosBox: React.CSSProperties = { marginTop: 20, background: "#f9fafb", borderRadius: 12, padding: 18, border: "1px solid #e5e7eb" };
const requisitosTitle: React.CSSProperties = { color: "#374151", fontSize: 14, display: "block", marginBottom: 10 };
const requisitosList: React.CSSProperties = { margin: 0, paddingLeft: 18, color: "#6b7280", fontSize: 13, lineHeight: 1.8 };

const camBox: React.CSSProperties = { position: "relative", width: "100%", maxWidth: 400, aspectRatio: "1 / 1", margin: "0 auto", background: "#000", borderRadius: 14, overflow: "hidden" };
const videoStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" };
const guiaOvalo: React.CSSProperties = { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "55%", height: "70%", border: "3px dashed rgba(255,255,255,.7)", borderRadius: "50%", pointerEvents: "none", boxShadow: "0 0 0 9999px rgba(0,0,0,.25)" };
const guiaMarco: React.CSSProperties = { position: "absolute", inset: 8, border: "2px solid rgba(255,255,255,.3)", borderRadius: 10, pointerEvents: "none" };

const hint: React.CSSProperties = { textAlign: "center", color: "#6b7280", fontSize: 13, margin: "12px 0" };
const botones: React.CSSProperties = { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" };
const btnPrim: React.CSSProperties = { padding: "13px 24px", background: "#C23B22", color: "#fff", border: "none", borderRadius: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", fontSize: 14 };
const btnOut: React.CSSProperties = { ...btnPrim, background: "transparent", color: "#374151", border: "2px solid #d1d5db" };

const previewBox: React.CSSProperties = { width: "100%", maxWidth: 300, margin: "0 auto", aspectRatio: "1 / 1", borderRadius: 14, overflow: "hidden", border: "3px solid #1f6b3a", background: "#f3f4f6" };
const previewImg: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
const okText: React.CSSProperties = { textAlign: "center", color: "#374151", fontSize: 14, margin: "14px 0" };
const enviadoBox: React.CSSProperties = { textAlign: "center", background: "#ecfdf5", border: "1px solid #1f6b3a", borderRadius: 12, padding: 20, color: "#065f46" };
const errBox: React.CSSProperties = { position: "absolute", bottom: 10, left: 10, right: 10, background: "rgba(220,38,38,.95)", color: "#fff", padding: 10, borderRadius: 8, fontSize: 13 };
