#!/usr/bin/env bash
set -e

PORT=${1:-3001}
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Pick the best available static server
if command -v python3 &>/dev/null; then
  echo "Serving on http://localhost:$PORT"
  echo "Press Ctrl+C to stop."
  # Open browser after a short delay (macOS)
  (sleep 0.8 && open "http://localhost:$PORT" 2>/dev/null || true) &
  cd "$ROOT" && python3 -m http.server "$PORT" --bind 127.0.0.1
elif command -v npx &>/dev/null; then
  echo "Serving on http://localhost:$PORT"
  echo "Press Ctrl+C to stop."
  cd "$ROOT" && npx --yes serve -l "$PORT"
else
  echo "Error: need python3 or npx to serve the project." >&2
  exit 1
fi
