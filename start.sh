#!/bin/bash

# Function to kill processes on exit (Ctrl+C)
cleanup() {
    echo "Shutting down..."
    kill 0
}

# Trap the exit signal
trap cleanup EXIT

echo "🚀 Starting Metadata AI Project..."

concurrently "cd server && source venv/bin/activate && uvicorn main:app --reload" "cd client && npm run dev"

# 1. Start Backend (in background)
# We navigate in a subshell so we don't lose our place
(cd server && source venv/bin/activate && uvicorn main:app --reload) &

# 2. Wait a second for the backend to initialize
sleep 2

# 3. Start Frontend (in background)
(cd client && npm run dev) &

# 4. Keep script running to show logs
wait