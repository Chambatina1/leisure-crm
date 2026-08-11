import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "node:fs";

const prisma = new PrismaClient();

function imgToDataUrl(path: string): string {
  if (!existsSync(path)) return "";
  const buf = readFileSync(path);
  const ext = path.endsWith(".png") ? "png" : "jpeg";
  return `data:image/${ext};base64,${buf.toString("base64")}`;
}

async function main() {
  console.log("Seed Leisure CRM...");

  // ════════════════════════════════════════════════════════════════════════════
  // PROTECCIÓN DE PRODUCCIÓN:
  // Si ya hay agencias, NO hacer nada. Los datos existentes se conservan.
  // El seed SOLO corre en una base de datos completamente nueva.
  // ════════════════════════════════════════════════════════════════════════════
  const agenciasCount = await prisma.agencia.count();
  if (agenciasCount > 0) {
    console.log("PROTECCION: " + agenciasCount + " agencias existentes. NO se borra nada. Seed cancelado.");
    return;
  }

  console.log("BD vacia -> creando datos iniciales...");

  // Solo llegar aquí si la BD está vacía (0 agencias)
  await prisma.evento.deleteMany();
  await prisma.asiento.deleteMany();
  await prisma.paquete.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.agencia.deleteMany();
  await prisma.config.deleteMany();
  await prisma.brand.deleteMany();

  // ── 1. Agencias ──
  const matriz = await prisma.agencia.create({
    data: {
      nombre: "Grupo Empresarial — Matriz",
      tipo: "matriz",
      direccion: "Miami, FL, USA",
      ciudad: "Miami", pais: "USA", telefono: "+1 305 000 0000",
    },
  });
  const habana = await prisma.agencia.create({
    data: { nombre: "Agencia La Habana", tipo: "agencia", padreId: matriz.id, direccion: "La Habana, Cuba", ciudad: "La Habana", pais: "Cuba", puedeCrearSubagencias: true },
  });
  const santiago = await prisma.agencia.create({
    data: { nombre: "Agencia Santiago", tipo: "agencia", padreId: matriz.id, direccion: "Santiago, Cuba", ciudad: "Santiago", pais: "Cuba" },
  });
  await prisma.agencia.create({
    data: { nombre: "Subagencia Centro Habana", tipo: "subagencia", padreId: habana.id, direccion: "Centro Habana, Cuba", ciudad: "La Habana", pais: "Cuba" },
  });

  // ── 2. Usuarios ──
  const pw = await bcrypt.hash("admin", 12);
  const pwHabana = await bcrypt.hash("habana", 12);
  const pwCamion = await bcrypt.hash("camion", 12);
  await prisma.usuario.create({ data: { usuario: "admin", passwordHash: pw, nombre: "Administrador", rol: "admin", agenciaId: matriz.id } });
  await prisma.usuario.create({ data: { usuario: "habana", passwordHash: pwHabana, nombre: "Operador Habana", rol: "agencia", agenciaId: habana.id } });
  await prisma.usuario.create({ data: { usuario: "camion", passwordHash: pwCamion, nombre: "Camionero", rol: "camionero", agenciaId: habana.id } });

  // ── 3. Clientes ──
  await prisma.cliente.create({ data: { nombre: "Ana Pérez", telefono: "+1 305 111 2222", direccion: "Miami, FL", agenciaId: matriz.id } });
  await prisma.cliente.create({ data: { nombre: "José Gómez", telefono: "+53 5 123 4567", direccion: "La Habana, Cuba", agenciaId: habana.id } });

  // ── 4. Config ──
  await prisma.config.create({ data: { key: "tarifaPorLb", value: "4.50" } });
  await prisma.config.create({ data: { key: "moneda", value: "USD" } });

  // ── 5. Brands ──
  const brandsSeed = [
    { clave: "chambatina", nombre: "Chambatina", orden: 0, archivo: "public/logos/chambatina.png" },
    { clave: "servitravel", nombre: "ServiTravels", orden: 1, archivo: "public/logos/servitravel.png" },
  ];
  for (const b of brandsSeed) {
    const logo = imgToDataUrl(b.archivo);
    await prisma.brand.create({ data: { clave: b.clave, nombre: b.nombre, logo, orden: b.orden, activo: true } });
  }

  console.log("Seed completo.");
  console.log("Usuarios -> admin/admin · habana/habana · camion/camion");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
