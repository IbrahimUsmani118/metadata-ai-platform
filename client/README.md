# Metadata AI Platform - Frontend

React frontend built with Vite for the Metadata AI Platform.

## Development

```bash
# Install dependencies
npm install

# Start dev server (with API proxy to localhost:8000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Structure

```
src/
├── App.jsx      # Main application component
├── App.css      # App-specific styles
├── main.jsx     # Entry point
└── index.css    # Global styles
```

## Features

- Schema comparison form with AI analysis
- Analysis history table with detail view
- Real-time backend health status
- Responsive design

## Configuration

The Vite dev server proxies `/api/*` requests to `http://localhost:8000`. This is configured in `vite.config.js`.

For production, the API is served from the same origin via Vercel rewrites (see `vercel.json` in root).
