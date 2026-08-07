#!/bin/sh
# start.sh — arranque tolerante para producción (Render).
# 1. Aplica el esquema de Prisma a la base PostgreSQL.
# 2. Genera el cliente Prisma.
# 3. Corre el seed SOLO si la BD está vacía (no duplica datos en redeploy).
# 4. Arranca Next.js (standalone).
set -e

echo "▶ Aplicando esquema de base de datos (prisma db push)…"
npx prisma db push --accept-data-loss || echo "⚠ prisma db push falló, continuando…"

echo "▶ Generando cliente Prisma…"
npx prisma generate || echo "⚠ prisma generate falló, continuando…"

echo "▶ Verificando si hay datos (seed solo si BD vacía)…"
# El seed es seguro (usa deleteMany primero) así que podemos correrlo siempre
# sin duplicar datos.
node -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.usuario.count().then(n => {
  db.\$disconnect();
  if (n === 0) {
    console.log('▶ BD vacía → corriendo seed…');
    const { execSync } = require('child_process');
    try { execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' }); }
    catch(e){ console.log('⚠ seed falló:', e.message); }
  } else {
    console.log('▶ BD ya tiene ' + n + ' usuarios, saltando seed.');
  }
}).catch(e => { console.log('⚠ no se pudo verificar seed:', e.message); });
" || echo "⚠ verificación de seed falló (no crítico)"

echo "▶ Iniciando Next.js (standalone)…"
exec node .next/standalone/server.js
