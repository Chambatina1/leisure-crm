import { cupetPost } from '@/lib/cupet-proxy';
import { z } from 'zod';

// POST /api/cupet/orden — registrar venta de combustible en CUPET
const ordenSchema = z.object({
  servicenterId: z.number().int().positive(),
  typeFuelId: z.number().int().positive(),
  amount: z.number().positive().max(2000),        // litros
  identifyProvider: z.string().min(5).max(20),    // CI del beneficiario
  nameProvider: z.string().min(3).max(100),
  phoneProvider: z.string().max(20).optional(),
  mailProvider: z.string().email().optional(),
  amountPaid: z.number().nonnegative().optional(),
  currency: z.string().max(5).optional(),
});

export async function POST(request: Request) {
  try {
    const body = ordenSchema.parse(await request.json());
    return cupetPost('/cupet/orden', body);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json(
        { ok: false, error: 'Datos inválidos', detalles: e.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return Response.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
