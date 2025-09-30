# DevOps & Deployment

## Repository Layout

| Path | Description |
| --- | --- |
| `designeralphabet/` | SvelteKit web application |
| `content/` | Sanity content studio |
| `docs/` | Documentation set (this directory) |
| `docker-compose.yml` | Multi-service orchestration for local/prod builds |
| `run-all.sh` / `start-all.sh` | Helper scripts for dev/prod environments |
| `supabase/` | Supabase CLI metadata (config + migrations) |

## Environment Variables

Set the following in `.env` files for local dev and in Railway project settings for prod:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE=

VITE_SANITY_PROJECT_ID=
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-09-01

OPENAI_API_KEY= (optional, for future features)
```

Production builds also expect `HOST=0.0.0.0` and appropriate `PORT` values (5173 for web, 3333 for studio).

## Local Development

### Option 1: Combined Script

```bash
./run-all.sh
```

This installs dependencies if missing, loads `.env` files, and launches:
- SvelteKit dev server on `http://localhost:5173`
- Sanity Studio on `http://localhost:3333`

### Option 2: Manual

```bash
cd designeralphabet
npm install
npm run dev -- --host 0.0.0.0 --port 5173

cd ../content
npm install
npm run dev -- --host 0.0.0.0 --port 3333
```

## Testing & QA

```bash
npm run lint          # Prettier + ESLint
npm run check         # svelte-check for TS
npm run test:unit     # Vitest
npm run test:integration # Playwright
```

CI pipelines should execute at least `npm run lint` and `npm run build`.

## Docker Builds

- **Web**: `designeralphabet/Dockerfile` (Node 20 Alpine, multi-stage build with `npm ci` + `npm run build`).
- **Studio**: `content/Dockerfile` (Node 20 Alpine, builds Sanity static assets, serves with `serve`).

To build locally:

```bash
docker compose build
```

To run locally:

```bash
docker compose up --build
```

## Supabase Migrations

Apply migrations whenever schema changes occur:

```bash
cd designeralphabet
supabase db push          # Requires Supabase CLI
```

Recent migrations include adding session challenges, active round columns, and facilitator emails (`designeralphabet/supabase/migrations`). For manual SQL execution (e.g., Railway dashboard), run the corresponding `ALTER TABLE` statements.

## Railway Deployment

1. Build Docker images locally or rely on Railway to build from Dockerfiles.
2. Configure two services:
   - **Web**: Uses `designeralphabet/Dockerfile`, exposes port 5173.
   - **Studio**: Uses `content/Dockerfile`, exposes port 3333.
3. Provide environment variables in Railway’s settings (match `.env` values).
4. Apply Supabase migrations before deploying new backend features.
5. After deployment, test:
   - Session creation (facilitator console)
   - Participant join flow
   - Facilitator rejoin via email
   - Breakout timers and end-session controls

## Production Operations

- **End Session**: Facilitators set status to `done` or use the End Session button in the control panel (`designeralphabet/src/routes/session/[code]/+page.svelte:484`).
- **Emergency Exit**: Header button clears local profile and redirects home (`designeralphabet/src/routes/header.svelte:81`).
- **Monitoring**: Tail logs via Railway (web and studio) for error diagnostics.
- **Backups**: Supabase provides point-in-time restore; schedule snapshots if required.

## Common Issues

| Symptom | Resolution |
| --- | --- |
| 500 on `/api/session/create` with missing column error | Apply the latest Supabase migrations so new columns exist. |
| Facilitator cannot rejoin | Ensure stored email matches; check `/api/session/facilitator` logs. |
| Active sessions list empty | Verify `/api/session/list` returns data and session status is `planned` or `live`. |
| Docker build fails at `npm ci` | Ensure lockfiles are up to date (run `npm install` locally first). |

For further reference, see [Architecture](architecture.md) and [Backend & APIs](backend.md).
