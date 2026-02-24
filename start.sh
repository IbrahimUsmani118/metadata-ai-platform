#!/bin/bash

# Function to kill processes on exit (Ctrl+C)
cleanup() {
    echo "Shutting down..."
    kill 0
}

trap cleanup EXIT

echo "🚀 Starting Metadata AI Project..."

# 1. Client: go into client and start frontend (in background)
echo "📦 Client: starting from client/..."
(cd client && npm run dev) &

sleep 1

# 2. Server: go into server, ensure venv + deps, then start backend from there
echo "📦 Server: setting up and starting from server/..."
(
  cd server
  if [ ! -d "venv" ]; then
    echo "   Creating venv in server/..."
    python3 -m venv venv
  fi
  . venv/bin/activate
  echo "   Installing Python deps in server/..."
  pip install -r requirements.txt
  echo "   Starting backend (uvicorn) from server/..."
  uvicorn main:app --reload
) &

wait