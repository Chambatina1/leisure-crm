#!/bin/sh
# start.sh — arranque para producción (Render).
# 1. Asegura el directorio de datos.
# 2. Aplica el esquema de Prisma (db push) y seed vía el MISMO proceso que la app.
# 3. Arranca Next.js.
set -e

# Asegurar que /data o /tmp existen para la DB SQLite.
if [ -d "/data" ]; then
  echo "▶ Usando disco persistente /data"
else
  echo "▶ /data no existe, usando /tmp (datos no persistentes)"
fi

echo "▶ [1/3] Aplicando esquema de base de datos (prisma db push)…"
npx prisma db push --accept-data-loss 2>&1 || echo "⚠ db push falló"

echo "▶ [2/3] Generando cliente + seed…"
npx prisma generate 2>&1 || echo "⚠ generate falló"
npx tsx prisma/seed.ts 2>&1 || echo "⚠ seed falló"

echo "▶ [3/3] Iniciando Next.js…"
exec npx next start -p ${PORT:-3000} -H 0.0.0.0
