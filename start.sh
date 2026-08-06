#!/bin/sh
# start.sh — arranque tolerante para producción (Render).
# Aplica el esquema de Prisma y arranca Next.js aunque db push falle.
set -e
echo "▶ Aplicando esquema de base de datos (prisma db push)…"
npx prisma db push --accept-data-loss || echo "⚠ prisma db push falló, continuando…"

echo "▶ Generando cliente Prisma…"
npx prisma generate || echo "⚠ prisma generate falló, continuando…"

echo "▶ Iniciando Next.js…"
exec node .next/standalone/server.js
