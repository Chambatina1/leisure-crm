import { NextRequest, NextResponse } from "next/server";

// POST /api/almacen/contar — Contar cajas con OpenAI GPT-4 Vision
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const imagenBase64 = body.imagen;
    if (!imagenBase64) return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Analiza esta foto de almacen. Cuenta TODAS las cajas, bultos, paquetes y sacos visibles (incluyendo las apiladas). Devuelve SOLO un JSON: {\"total\": numero, \"confianza\": \"alta|media|baja\", \"descripcion\": \"breve\", \"tipo\": \"carton|plastico|mixto\"}" },
            { type: "image_url", image_url: { url: imagenBase64 } },
          ],
        }],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `OpenAI: ${response.status}`, detalle: err.slice(0, 200) }, { status: 502 });
    }

    const data = await response.json();
    const contenido = data.choices?.[0]?.message?.content || "";

    let resultado;
    try {
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      resultado = jsonMatch ? JSON.parse(jsonMatch[0]) : { total: 0, descripcion: contenido };
    } catch {
      resultado = { total: 0, descripcion: "No se pudo parsear" };
    }

    return NextResponse.json({
      success: true,
      total: resultado.total || 0,
      confianza: resultado.confianza || "media",
      descripcion: resultado.descripcion || "",
      tipo: resultado.tipo || "",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
