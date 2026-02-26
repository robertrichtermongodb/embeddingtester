#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BE_PID $FE_PID 2>/dev/null || true
  wait $BE_PID $FE_PID 2>/dev/null || true
  echo "Done."
}
trap cleanup EXIT INT TERM

# --- Install dependencies (only when node_modules is missing or outdated) ---

install_if_needed() {
  local dir="$1"
  local name="$2"
  if [ ! -d "$dir/node_modules" ] || [ "$dir/package.json" -nt "$dir/node_modules" ]; then
    echo "[$name] Installing dependencies..."
    (cd "$dir" && npm install)
  else
    echo "[$name] Dependencies up to date."
  fi
}

install_if_needed "$DIR/backend"  "backend"
install_if_needed "$DIR/frontend" "frontend"

# --- Start backend ---

echo "[backend]  Starting on http://localhost:3001"
(cd "$DIR/backend" && npm run dev) &
BE_PID=$!

# --- Start frontend ---

echo "[frontend] Starting on http://localhost:5173"
(cd "$DIR/frontend" && npm run dev) &
FE_PID=$!

echo ""
echo ">>> Open http://localhost:5173 in your browser <<<"
echo "    Press Ctrl-C to stop both servers."
echo ""

wait
