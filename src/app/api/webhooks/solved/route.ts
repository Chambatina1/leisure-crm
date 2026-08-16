import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ════════════════════════════════════════════════════════════════════════════
// POST /api/webhooks/solved
// Endpoint para que SOLVED notifique cambios a nuestra web.
// 
// Solved hace POST aquí cuando un envío cambia de estado, se borra, etc.
// 
// FORMATO esperado (flexible, acepta varias estructuras):
// {
//   "event": "status_changed" | "deleted" | "updated" | "created",
//   "code": "CM100053006VO",
//   "status": "En tránsito",
//   "data": { ... }
// }
// ════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    console.log("Webhook Solved recibido:", JSON.stringify(body));

    const event = body.event || body.type || body.action || "";
    const code = body.code || body.number || body.hbl || body.tracking || "";
    const status = body.status || body.estado || "";

    if (!code) {
      return NextResponse.json({ ok: true, message: "Sin código, ignorado" });
    }

    // Buscar el paquete en nuestra BD
    const paquete = await db.paquete.findUnique({ where: { codigo: code } });

    switch (event) {
      case "status_changed":
      case "status":
      case "updated":
        if (paquete) {
          // Mapear estados de Solved a nuestros estados
          const estadoMap: Record<string, string> = {
            "en proceso": "en_origen",
            "proceso de aduana": "en_almacen",
            "en transito": "en_transito",
            "en tránsito": "en_transito",
            "transito": "en_transito",
            "almacen": "en_almacen",
            "almacén": "en_almacen",
            "entregado": "entregado",
            "entrega": "entregado",
            "delivered": "entregado",
          };
          const nuevoEstado = estadoMap[status.toLowerCase()] || status;
          
          await db.paquete.update({
            where: { codigo: code },
            data: { estado: nuevoEstado },
          });
          
          await db.evento.create({
            data: {
              paqueteCodigo: code,
              estado: nuevoEstado,
              nota: `Sincronizado desde Solved: ${status}`,
            },
          });
        }
        break;

      case "deleted":
      case "delete":
      case "removed":
        if (paquete) {
          await db.evento.deleteMany({ where: { paqueteCodigo: code } });
          await db.paquete.delete({ where: { codigo: code } });
        }
        break;

      case "created":
      case "create":
        // Si Solved crea un envío directamente, lo importamos
        if (!paquete) {
          // Buscar la agencia por defecto (matriz)
          const agencia = await db.agencia.findFirst({ where: { tipo: "matriz" } });
          if (agencia) {
            await db.paquete.create({
              data: {
                codigo: code,
                agenciaId: agencia.id,
                remitente: body.data?.sender?.name || "—",
                destinatario: body.data?.consignee?.name || "—",
                consignatarioCarnet: body.data?.consignee?.identity || null,
                consignatarioTel: body.data?.consignee?.phone || null,
                consignatarioCalle: body.data?.consignee?.address || null,
                consignatarioMunicipio: body.data?.consignee?.municipality || null,
                consignatarioProvincia: body.data?.consignee?.province || null,
                destino: body.data?.consignee?.province || "Cuba",
                peso: Number(body.data?.weight) || 0,
                pesoKg: Number(body.data?.weight) ? Number(body.data.weight) * 2.20462 : 0,
                piezas: Number(body.data?.packages) || 1,
                contenido: body.data?.description || "—",
                estado: "en_origen",
                hawb: code,
                eventos: { create: { estado: "en_origen", nota: "Importado desde Solved via webhook" } },
              },
            });
          }
        }
        break;

      default:
        // Si no hay event específico pero hay status, actualizar
        if (status && paquete) {
          await db.paquete.update({
            where: { codigo: code },
            data: { estado: status },
          });
        }
    }

    return NextResponse.json({ ok: true, received: true, code, event });
  } catch (e: any) {
    console.error("Webhook error:", e);
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

// GET para verificar que el webhook está activo
export async function GET() {
  return NextResponse.json({ ok: true, message: "Webhook Solved activo. Envía POST para notificar cambios." });
}
