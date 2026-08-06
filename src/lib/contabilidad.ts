// ════════════════════════════════════════════════════════════════════════════
// Leisure CRM — Contabilidad (doble entrada)
// Plan de cuentas mínimo + registro de asientos + libro mayor + resumen.
// Reproduce exactamente la lógica del frontend original.
// ════════════════════════════════════════════════════════════════════════════
import { db } from "./db";

export interface Cuenta { codigo: string; nombre: string; tipo: string; }
export interface Linea { cuenta: string; debito: number; credito: number; }

// Plan de cuentas fijo (igual que el modelo original).
export const CUENTAS: Cuenta[] = [
  { codigo: "110", nombre: "Caja / Efectivo",     tipo: "activo" },
  { codigo: "120", nombre: "Bancos",              tipo: "activo" },
  { codigo: "130", nombre: "Cuentas por cobrar",  tipo: "activo" },
  { codigo: "210", nombre: "Cuentas por pagar",   tipo: "pasivo" },
  { codigo: "300", nombre: "Capital",             tipo: "patrimonio" },
  { codigo: "400", nombre: "Ingresos por envío",  tipo: "ingreso" },
  { codigo: "410", nombre: "Otros ingresos",      tipo: "ingreso" },
  { codigo: "500", nombre: "Costo de transporte", tipo: "gasto" },
  { codigo: "510", nombre: "Gastos operativos",   tipo: "gasto" },
  { codigo: "520", nombre: "Combustible",         tipo: "gasto" },
];

const r2 = (n: number) => Math.round(n * 100) / 100;

// ── Registrar asiento (valida cuadre débito = crédito) ────────────────────────
export async function registrarAsiento(opts: {
  agenciaId?: string | null;
  descripcion?: string;
  lineas: Linea[];
  paqueteCodigo?: string | null;
  fecha?: Date;
}): Promise<{ id: string }> {
  const debito = opts.lineas.reduce((s, l) => s + (Number(l.debito) || 0), 0);
  const credito = opts.lineas.reduce((s, l) => s + (Number(l.credito) || 0), 0);
  const diff = r2(debito - credito);
  if (diff !== 0) {
    throw new Error("El asiento no cuadra. Débito y crédito deben ser iguales.");
  }
  const lineas = opts.lineas.map((l) => ({
    cuenta: l.cuenta,
    debito: Number(l.debito) || 0,
    credito: Number(l.credito) || 0,
  }));
  const asiento = await db.asiento.create({
    data: {
      fecha: opts.fecha ?? new Date(),
      agenciaId: opts.agenciaId ?? null,
      paqueteCodigo: opts.paqueteCodigo ?? null,
      descripcion: opts.descripcion ?? "",
      lineas: JSON.stringify(lineas),
      cuadrado: true,
    },
  });
  return { id: asiento.id };
}

// ── Asiento automático de ingreso por envío de un paquete ─────────────────────
// efectivo → 110/400 ; banco → 120/400 ; credito → 130/400
export async function registrarIngresoEnvio(
  paquete: { codigo: string; agenciaId: string; monto: number; destinatario: string },
  formaPago: "efectivo" | "banco" | "credito"
): Promise<void> {
  const cuentaCobro = formaPago === "efectivo" ? "110" : formaPago === "banco" ? "120" : "130";
  const creditoTxt = formaPago === "credito" ? " (a crédito)" : "";
  await registrarAsiento({
    agenciaId: paquete.agenciaId,
    paqueteCodigo: paquete.codigo,
    descripcion: `Ingreso envío ${paquete.codigo} (${paquete.destinatario})${creditoTxt}`,
    lineas: [
      { cuenta: cuentaCobro, debito: paquete.monto, credito: 0 },
      { cuenta: "400", debito: 0, credito: paquete.monto },
    ],
  });
}

// ── Libro mayor (saldos por cuenta) ──────────────────────────────────────────
// agenciaId = null → consolidado (admin).
export async function mayor(agenciaId: string | null) {
  const where = agenciaId ? { agenciaId } : {};
  const asientos = await db.asiento.findMany({ where });
  const saldos: Record<string, Cuenta & { debito: number; credito: number; saldo: number }> = {};
  CUENTAS.forEach((c) => (saldos[c.codigo] = { ...c, debito: 0, credito: 0, saldo: 0 }));

  for (const a of asientos) {
    let lineas: Linea[] = [];
    try { lineas = JSON.parse(a.lineas); } catch { lineas = []; }
    for (const l of lineas) {
      if (saldos[l.cuenta]) {
        saldos[l.cuenta].debito += Number(l.debito) || 0;
        saldos[l.cuenta].credito += Number(l.credito) || 0;
      }
    }
  }
  // Saldo según naturaleza: activo/gasto = Db−Cr ; resto = Cr−Db
  Object.values(saldos).forEach((s) => {
    const nat = s.tipo === "activo" || s.tipo === "gasto" ? 1 : -1;
    s.saldo = r2((s.debito - s.credito) * nat);
  });
  return Object.values(saldos);
}

// ── Resumen ejecutivo ────────────────────────────────────────────────────────
export async function resumen(agenciaId: string | null) {
  const m = await mayor(agenciaId);
  const ingreso = m.filter((c) => c.tipo === "ingreso").reduce((s, c) => s + c.saldo, 0);
  const gasto = m.filter((c) => c.tipo === "gasto").reduce((s, c) => s + c.saldo, 0);
  const caja = m.find((c) => c.codigo === "110")?.saldo || 0;
  const bancos = m.find((c) => c.codigo === "120")?.saldo || 0;
  return {
    ingreso: r2(ingreso),
    gasto: r2(gasto),
    utilidad: r2(ingreso - gasto),
    caja: r2(caja),
    bancos: r2(bancos),
  };
}
