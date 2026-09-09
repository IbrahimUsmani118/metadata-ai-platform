#!/bin/bash

set -e

cleanup() {
    echo "Shutting down..."
    kill 0 2>/dev/null || true
}

trap cleanup EXIT

echo "🚀 Starting Metadata AI Platform..."
echo ""

# Check for .env file
if [ ! -f ".env" ] && [ ! -f "api/.env" ]; then
    echo "⚠️  Warning: No .env file found. Copy .env.example to .env and fill in your API keys."
    echo ""
fi

# 1. Client: start frontend dev server
echo "📦 Client: installing dependencies and starting..."
(
    cd client
    if [ ! -d "node_modules" ]; then
        echo "   Installing npm packages..."
        npm install
    fi
    npm run dev
) &

CLIENT_PID=$!
sleep 2

# 2. API: set up Python venv and start backend
echo "📦 API: setting up Python environment and starting..."
(
    cd api
    if [ ! -d "venv" ]; then
        echo "   Creating Python virtual environment..."
        python3 -m venv venv
    fi
    source venv/bin/activate
    echo "   Installing Python dependencies..."
    pip install -q -r requirements.txt
    echo "   Starting FastAPI server on port 8000..."
    uvicorn index:app --reload --host 0.0.0.0 --port 8000
) &

API_PID=$!

echo ""
echo "✅ Services starting..."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services."

wait
