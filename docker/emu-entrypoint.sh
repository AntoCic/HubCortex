#!/bin/sh
set -eu

cd /workspace

echo "[emu-entrypoint] Checking root dependencies..."
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null || true)" ]; then
  npm install
fi

echo "[emu-entrypoint] Checking functions dependencies..."
if [ ! -d functions/node_modules ] || [ -z "$(ls -A functions/node_modules 2>/dev/null || true)" ]; then
  npm --prefix functions install
fi

echo "[emu-entrypoint] Building functions..."
npm --prefix functions run build

echo "[emu-entrypoint] Starting emulators and Vite..."
if [ -n "${EMU_STATE:-}" ]; then
  exec npm run emu:start -- "${EMU_STATE}"
fi

exec npm run emu:start
