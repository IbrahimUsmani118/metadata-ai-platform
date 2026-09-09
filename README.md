# Metadata AI Platform

An AI-powered metadata schema analyzer that uses **Google Gemini AI** to compare JSON schemas and detect breaking changes. Results are stored in **Supabase** for persistent history.

## Features

- **Schema Comparison**: Compare old and new JSON schemas to detect changes
- **AI-Powered Analysis**: Uses Google Gemini AI to understand schema differences
- **Breaking Change Detection**: Automatically flags potentially breaking changes
- **History Tracking**: All analyses are stored in Supabase for future reference
- **Clean UI**: Modern React frontend with real-time status indicators

## Architecture

```
├── client/           # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx   # Main application component
│   │   └── main.jsx  # Entry point
│   └── package.json
├── api/              # FastAPI backend (Python)
│   ├── index.py      # API endpoints
│   └── requirements.txt
├── start.sh          # Development startup script
└── vercel.json       # Vercel deployment config
```

## Prerequisites

- **Node.js** >= 18.0.0
- **Python** >= 3.9
- **Google Gemini API Key** (get one at [Google AI Studio](https://aistudio.google.com/app/apikey))
- **Supabase Account** (free tier works, sign up at [supabase.com](https://supabase.com))

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd metadata-ai-platform
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here
```

### 3. Set Up Supabase Database

Create a table in your Supabase project:

```sql
CREATE TABLE metadata_analyses (
  id BIGSERIAL PRIMARY KEY,
  old_schema TEXT NOT NULL,
  new_schema TEXT NOT NULL,
  is_breaking BOOLEAN DEFAULT false,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Enable Row Level Security
ALTER TABLE metadata_analyses ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write (for development)
CREATE POLICY "Allow all" ON metadata_analyses FOR ALL USING (true);
```

### 4. Install Dependencies

```bash
# Install client dependencies
cd client && npm install && cd ..

# Install API dependencies (using venv)
cd api
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 5. Run the Application

**Option A: Using the startup script (recommended)**

```bash
./start.sh
```

**Option B: Run services separately**

Terminal 1 (Frontend):
```bash
cd client && npm run dev
```

Terminal 2 (Backend):
```bash
cd api
source venv/bin/activate
uvicorn index:app --reload --port 8000
```

### 6. Access the App

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check with service status |
| GET | `/api/analyses` | Fetch recent analyses from database |
| POST | `/api/analyze` | Analyze two schemas and store result |

### Example: Analyze Schemas

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "old_schema": "{\"name\": \"string\", \"age\": \"number\"}",
    "new_schema": "{\"name\": \"string\", \"email\": \"string\"}"
  }'
```

## Deployment

### Vercel (Recommended)

The app is configured for Vercel deployment:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
4. Deploy

The `vercel.json` handles routing the API to the Python serverless function.

### Other Platforms

The API can be deployed to any platform supporting Python (Render, Railway, Fly.io, etc.). The client builds to static files via `npm run build` in the `client/` directory.

## Development

### Linting

```bash
cd client && npm run lint
```

### Building for Production

```bash
cd client && npm run build
```

The build output will be in `client/dist/`.

## Troubleshooting

### "Backend unreachable" error
- Ensure the API is running on port 8000
- Check that `.env` is in the `api/` directory or project root
- Verify CORS isn't blocking requests

### "Gemini missing" status
- Verify `GEMINI_API_KEY` is set correctly in `.env`
- Test your key at [Google AI Studio](https://aistudio.google.com/)

### "Supabase missing" status
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are set
- Ensure the `metadata_analyses` table exists
- Check Supabase project is active (free tier pauses after inactivity)

## License

MIT
