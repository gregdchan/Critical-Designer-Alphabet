# System Architecture

```
┌──────────────┐     HTTP/WS      ┌──────────────────┐
│  SvelteKit   │ <──────────────> │  Supabase (Postgres│
│  Frontend    │                  │  + Realtime)       │
└────┬─────────┘                  └────────┬──────────┘
     │ REST / WS                                │
     │                                           │
     │ Static assets                             │
┌────▼─────────┐                        ┌────────▼─────────┐
│ Sanity Studio│ -- GROQ --> Frontend  │ Docker / Railway │
│ (Content)    │                        │ (Deployment)     │
└──────────────┘                        └──────────────────┘
```

## Components

### Frontend (`designeralphabet/`)
- SvelteKit 2 + Vite build pipeline (`designeralphabet/package.json:5`).
- Tailwind CSS with Skeleton plugin for rapid UI components (`tailwind.config.cjs`, `designeralphabet/src/app.css`).
- D3-driven charts for roadmap, heatmap, and bubble visualizations (`designeralphabet/src/lib/components/charts`).
- Runs on Node 20; Docker image exposes port 5173 (`designeralphabet/Dockerfile:1`).

### Backend Services
- **REST endpoints** under `designeralphabet/src/routes/api` implemented as SvelteKit server routes.
- **WebSocket gateway** at `/session/ws` for realtime collaboration; handles HELLO, responses, votes, timeline, chat, timers, and scoring (`designeralphabet/src/routes/ws/+server.ts:17`).
- **Supabase SDK** wrappers in `designeralphabet/src/lib/server/workshop.ts` manage CRUD operations and fan-out via `broadcast`.
- **Reusable realtime helpers** in `designeralphabet/src/lib/realtime.ts` (polling, profile persistence, API convenience).

### Supabase (Postgres + Realtime)
- Tables: `sessions`, `participants`, `questions`, `responses`, `timeline`, `chat` (`designeralphabet/database/schema.sql:7`).
- Columns capture facilitator emails, active rounds, and challenge statements.
- Row Level Security policies allow open read/write for session participants.
- Migrations stored in `designeralphabet/supabase/migrations/` keep production schema current.

### Sanity Content Studio (`content/`)
- `sanity.config.ts` ties together document schemas for cards, workshop templates, themes, and events.
- Workshop templates deliver breakout configuration, facilitation guidance, and resource lists consumed by the facilitator console (`content/schemaTypes/WorkshopTemplate.ts:34`).
- Studio is built into static assets served on port 3333 via the Docker image (`content/Dockerfile:1`).

### Deployment
- Docker Compose builds independent `web` and `studio` services (`docker-compose.yml:4`).
- Railway deployment runs these containers; environment variables are supplied through `.env` files or Railway configuration.
- `start-all.sh` handles local production-like startup with log redirection and process monitoring.

## Data Flow

1. Facilitator creates a session from the console. REST API writes to Supabase, seeding breakout questions based on the Sanity template.
2. Participants discover active sessions via `/api/session/list` or by direct code entry.
3. Clients call `/api/participants/join` (participants) or `/api/session/facilitator` (facilitators) to persist presence, then connect to `/session/ws` for realtime updates.
4. Responses, votes, timeline entries, and chat messages hit REST endpoints that write to Supabase. WebSocket broadcast notifies connected clients.
5. Session dashboards render data through stores in `designeralphabet/src/lib/realtime.ts`, refreshing via polling + WebSocket messages.
6. Presentation view consumes the same REST endpoints for read-only display, enabling large-screen mode.

## Key Dependencies

| Area | Tooling |
| --- | --- |
| UI | SvelteKit, Tailwind, Skeleton UI, D3 |
| Backend | Supabase (PostgREST + Realtime), SvelteKit API routes |
| Content | Sanity Studio, GROQ |
| DevOps | Docker (Node 20), Docker Compose, Railway |
| Testing | Playwright, Vitest |

Consult the remaining docs for deeper dives into each segment of the architecture.
