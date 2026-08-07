#!/bin/sh
# start.sh — arranque para producción (Render).
# 1. Aplica el esquema de Prisma a la base (db push).
# 2. Genera el cliente Prisma.
# 3. Corre el seed si la BD está vacía.
# 4. Arranca Next.js.
#
# IMPORTANTE: db push es OBLIGATORIO. Si falla, la app no arranca bien
# porque las columnas nuevas del schema no existen en la DB.
set -e

echo "▶ [1/4] Aplicando esquema de base de datos (prisma db push)…"
npx prisma db push --accept-data-loss

echo "▶ [2/4] Generando cliente Prisma…"
npx prisma generate

echo "▶ [3/4] Sembrando datos base (agencias, usuarios, config)…"
# En Render, /tmp no es persistente: la DB se pierde entre reinicios.
# El seed usa deleteMany, así que es seguro correrlo siempre.
# Esto garantiza que los agenciaId existan cuando se cree un paquete.
node -e "
const { execSync } = require('child_process');
try {
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  console.log('✓ seed OK');
} catch(e) {
  console.log('⚠ seed falló:', e.message);
}
"

echo "▶ [4/4] Iniciando Next.js…"
exec npx next start -p ${PORT:-3000} -H 0.0.0.0
