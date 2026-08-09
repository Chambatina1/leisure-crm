import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "node:fs";

const prisma = new PrismaClient();

// Convierte un archivo PNG a data URL base64.
function imgToDataUrl(path: string): string {
  if (!existsSync(path)) return "";
  const buf = readFileSync(path);
  const ext = path.endsWith(".png") ? "png" : "jpeg";
  return `data:image/${ext};base64,${buf.toString("base64")}`;
}

async function main() {
  console.log("🌱 Seed Leisure CRM…");

  // Limpiar (orden por FK)
  await prisma.evento.deleteMany();
  await prisma.asiento.deleteMany();
  await prisma.paquete.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.agencia.deleteMany();
  await prisma.config.deleteMany();
  await prisma.brand.deleteMany();

  // ── 1. Agencias: matriz → agencias → subagencia ──
  const matriz = await prisma.agencia.create({
    data: {
      nombre: "Grupo Empresarial — Matriz",
      tipo: "matriz",
      direccion: "Miami, FL, USA",
      telefono: "+1 305 000 0000",
      ciudad: "Miami",
      pais: "USA",
    },
  });

  const habana = await prisma.agencia.create({
    data: {
      nombre: "Agencia La Habana",
      tipo: "agencia",
      padreId: matriz.id,
      direccion: "La Habana, Cuba",
      ciudad: "La Habana",
      pais: "Cuba",
      // Permiso concedido por el administrador: esta agencia puede crear subagencias.
      puedeCrearSubagencias: true,
    },
  });

  const santiago = await prisma.agencia.create({
    data: {
      nombre: "Agencia Santiago",
      tipo: "agencia",
      padreId: matriz.id,
      direccion: "Santiago de Cuba",
      ciudad: "Santiago",
      pais: "Cuba",
    },
  });

  await prisma.agencia.create({
    data: {
      nombre: "Subagencia Centro Habana",
      tipo: "subagencia",
      padreId: habana.id,
      direccion: "Centro Habana",
      ciudad: "La Habana",
      pais: "Cuba",
    },
  });

  // ── 2. Usuarios (contraseñas hasheadas con bcrypt) ──
  const hash = (p: string) => bcrypt.hashSync(p, 12);
  await prisma.usuario.create({
    data: { usuario: "admin", passwordHash: hash("admin"), nombre: "Administrador", rol: "admin", agenciaId: matriz.id },
  });
  await prisma.usuario.create({
    data: { usuario: "habana", passwordHash: hash("habana"), nombre: "Operador La Habana", rol: "agencia", agenciaId: habana.id },
  });
  await prisma.usuario.create({
    data: { usuario: "camion", passwordHash: hash("camion"), nombre: "Camionero Demo", rol: "camionero", agenciaId: habana.id },
  });

  // ── 3. Clientes demo ──
  await prisma.cliente.create({
    data: { nombre: "Ana Pérez", telefono: "+1 305 111 2222", email: "ana@demo.com", direccion: "Miami, FL", agenciaId: matriz.id },
  });
  await prisma.cliente.create({
    data: { nombre: "José Gómez", telefono: "+53 5 123 4567", direccion: "La Habana, Cuba", agenciaId: habana.id },
  });

  // ── 4. Config ──
  await prisma.config.create({ data: { key: "tarifaPorLb", value: "4.50" } });
  await prisma.config.create({ data: { key: "moneda", value: "USD" } });

  // ── 5. Brands / logos del grupo empresarial ──
  const brandsSeed = [
    { clave: "chambatina", nombre: "Chambatina", orden: 0, archivo: "public/logos/chambatina.png" },
    { clave: "servitravel", nombre: "ServiTravels", orden: 1, archivo: "public/logos/servitravel.png" },
  ];
  for (const b of brandsSeed) {
    const logo = imgToDataUrl(b.archivo);
    await prisma.brand.create({
      data: { clave: b.clave, nombre: b.nombre, logo, orden: b.orden, activo: true },
    });
  }

  console.log("✅ Seed completo.");
  console.log("   Usuarios → admin/admin · habana/habana · camion/camion");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
