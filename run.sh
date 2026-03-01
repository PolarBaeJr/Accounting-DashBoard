#!/usr/bin/env bash
set -e

PORT=${1:-3001}
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# ── PM2 (preferred) ────────────────────────────────────────────────────────────
if command -v pm2 &>/dev/null; then
  echo "Starting with PM2 on http://localhost:$PORT"
  pm2 start ecosystem.config.js
  pm2 save
  (sleep 1 && open "http://localhost:$PORT" 2>/dev/null || true) &
  pm2 logs abc-logistics

# ── Python fallback ────────────────────────────────────────────────────────────
elif command -v python3 &>/dev/null; then
  echo "Serving on http://localhost:$PORT  (Ctrl+C to stop)"
  (sleep 0.8 && open "http://localhost:$PORT" 2>/dev/null || true) &
  python3 -m http.server "$PORT" --bind 127.0.0.1

# ── npx fallback ───────────────────────────────────────────────────────────────
elif command -v npx &>/dev/null; then
  echo "Serving on http://localhost:$PORT  (Ctrl+C to stop)"
  npx --yes serve -l "$PORT"

else
  echo "Error: install pm2, python3, or npx to run this project." >&2
  exit 1
fi
