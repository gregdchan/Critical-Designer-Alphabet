# Critical Designer Alphabet Web App

SvelteKit application for running live CDA workshops.

## Key Routes

- `/` landing page
- `/facilitator` create and launch sessions
- `/join` participant/facilitator join flow
- `/session/[code]` live collaboration room
- `/presentation?code=ABC123` large-screen display mode
- `/dashboard` session analytics overview

## Scripts

```bash
npm run dev
npm run check
npm run lint
npm run test:unit -- --run
npm run test:integration
npm run build
```

## Realtime

Realtime updates use Supabase Postgres changes subscriptions (`src/lib/realtime.ts`).
The legacy WebSocket endpoint is intentionally disabled (`src/routes/ws/+server.ts` returns HTTP 410).
