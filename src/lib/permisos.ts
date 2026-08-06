// ════════════════════════════════════════════════════════════════════════════
// Leisure CRM — Permisos y aislamiento por agencia (SERVIDOR)
// ════════════════════════════════════════════════════════════════════════════
// Reglas de negocio (aislamiento estricto):
//   • admin (matriz)  → ve TODAS las agencias y el consolidado. Único que crea
//                       agencias y concede el permiso "puede crear subagencias".
//   • agencia         → ve SOLO su propia información. NO ve a otras agencias,
//                       ni a la matriz, ni el consolidado.
//   • agencia con permiso (puedeCrearSubagencias) → además puede crear y
//                       gestionar SUS PROPIAS subagencias (no las de otras).
//   • subagencia/operario/camionero → solo su propia agencia.
//
// Todas las consultas del backend filtran por agenciaId ∈ alcanceAgencias().
// El admin usa null/undefined como agenciaId para significar "consolidado".
// ════════════════════════════════════════════════════════════════════════════
import type { Agencia } from "@prisma/client";
import { db } from "./db";
import type { SessionUser } from "./auth";

export function esAdmin(s: SessionUser | null): boolean {
  return !!s && s.rol === "admin";
}

/** IDs de agencia que la sesión puede ver. */
export async function alcanceAgencias(s: SessionUser | null): Promise<Agencia[]> {
  if (!s) return [];
  if (esAdmin(s)) return db.agencia.findMany();
  if (!s.agenciaId) return [];
  // ¿Tiene permiso de crear subagencias? Entonces ve también sus subagencias.
  const mia = await db.agencia.findUnique({ where: { id: s.agenciaId } });
  if (!mia) return [];
  if (mia.puedeCrearSubagencias) {
    const subs = await db.agencia.findMany({ where: { padreId: s.agenciaId } });
    return [mia, ...subs];
  }
  return [mia];
}

export async function idsAlcance(s: SessionUser | null): Promise<string[]> {
  const ags = await alcanceAgencias(s);
  return ags.map((a) => a.id);
}

/** ¿La sesión puede ver datos de esta agencia? */
export async function puedeVerAgencia(s: SessionUser | null, agenciaId: string): Promise<boolean> {
  if (esAdmin(s)) return true;
  const ids = await idsAlcance(s);
  return ids.includes(agenciaId);
}

/** ¿La agencia del usuario tiene permiso para crear subagencias? */
export async function tengoPermisoSubagencias(s: SessionUser | null): Promise<boolean> {
  if (!s || !s.agenciaId) return false;
  const mia = await db.agencia.findUnique({ where: { id: s.agenciaId } });
  return !!mia?.puedeCrearSubagencias;
}

/** ¿Quién puede crear una subagencia debajo de `padreId`? */
export async function puedeCrearSubagenciaEn(s: SessionUser | null, padreId: string): Promise<boolean> {
  if (esAdmin(s)) return true;
  if (!s?.agenciaId) return false;
  const permiso = await tengoPermisoSubagencias(s);
  return permiso && s.agenciaId === padreId;
}

/** Cláusula WHERE de Prisma para filtrar registros por agencia según alcance. */
export async function whereAlcance(s: SessionUser | null): Promise<{ agenciaId: { in: string[] } }> {
  const ids = await idsAlcance(s);
  return { agenciaId: { in: ids } };
}
