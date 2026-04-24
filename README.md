# StartupEvents

A Node.js event discovery app that fetches startup and AI events from Apify, caches them locally, serves a static frontend, and broadcasts updates in real time with Socket.IO.

## Features

- Express server for the web app and API routes
- Apify actor integration for fetching event data
- Apify webhook endpoint for automatic event updates
- Local JSON cache for fetched events
- Socket.IO updates for connected clients
- Gemini-powered assistant endpoint for event discovery help
- Vercel-compatible API entrypoints

## Requirements

- Node.js 18 or newer
- npm
- Apify API token
- Gemini API key, if you want to use the assistant endpoint

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `.env` with your own values:

```env
PORT=3000
APIFY_API_TOKEN=your_apify_api_token_here
APIFY_WEBHOOK_SECRET=choose_a_long_random_secret
APIFY_ACTOR_ID=9dardaZ3akeIhRfs3
EVENTS_CACHE_DIR=./data
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

## Run Locally

Start the development server:

```bash
npm run dev
```

Open the app:

```text
http://localhost:3000
```

For production-style local startup:

```bash
npm start
```

## API Routes

### Fetch Events From Apify

```http
POST /api/apify/fetch
```

Runs the configured Apify actor, maps the dataset items into app event objects, saves them to the local cache, and broadcasts the update.

### Apify Webhook

```http
POST /api/webhooks/apify?secret=YOUR_WEBHOOK_SECRET
```

Receives an Apify webhook payload, reads the completed run dataset, updates the local cache, and broadcasts the latest events.

### Get Cached Events

```http
GET /api/events
```

Returns the currently cached events and cache metadata.

### Download Event Cache

```http
GET /api/events/download
```

Downloads the local `events-cache.json` file when a cache exists.

### Assistant

```http
POST /api/assistant
```

Uses Gemini to answer short, practical questions based on the provided event data and filter context.

## Data Persistence

Fetched events are saved as JSON using `EVENTS_CACHE_DIR`.

For local development, this can be:

```env
EVENTS_CACHE_DIR=./data
```

On hosts with ephemeral filesystems, the cache may not persist between restarts or function invocations. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for hosting notes.

## Project Structure

```text
api/                 Vercel API entrypoints
lib/event-store.js   Local event cache helpers
public/              Static frontend assets
server.js            Express and Socket.IO server
vercel.json          Vercel routing config
```

## Scripts

```bash
npm run dev     # Start server with node --watch
npm start       # Start server
npm run build   # Placeholder build command
```

## Deployment

The app can run on Vercel, Render, Railway, or another Node.js host. If you need durable JSON cache storage, prefer a host with persistent disks or volumes.

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for deployment details.
