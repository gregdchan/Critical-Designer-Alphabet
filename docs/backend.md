# Backend & APIs

## Overview

The backend is implemented entirely through SvelteKit server routes and Supabase Admin SDK helpers. It exposes REST endpoints, while realtime fan-out is handled by Supabase Postgres change subscriptions in the client.

## Supabase Data Model

| Table | Purpose | Key Columns |
| --- | --- | --- |
| `sessions` | Root entity for workshops | `code`, `title`, `template_slug`, `facilitator_email`, `challenge`, `active_round`, `round_expires_at`, `status` |
| `participants` | Facilitators & attendees | `room_code`, `name`, `role`, `color`, `points`, `badges` |
| `questions` | Prompt inventory seeded from templates | `room_code`, `section`, `text` |
| `responses` | Participant answers & linked cards | `room_code`, `question_id`, `participant_id`, `text`, `cards`, `votes` |
| `timeline` | Now/Next/Later roadmap items | `room_code`, `label`, `item_text`, `owner`, `metric`, `risk_note` |
| `chat` | In-session chat feed | `room_code`, `participant_id`, `message` |

Schema evolution is managed in `designeralphabet/supabase/migrations`.

## Core Modules

### `src/lib/server/workshop.ts`
- Wraps Supabase Admin client operations with type-safe helpers.
- Provides session lifecycle management: create session, update status, set active round, fetch lists, add participants/questions/responses/timeline/chat, and scoring updates.
- Broadcast helpers remain in code for legacy compatibility, but active clients use Supabase Realtime subscriptions.

### `src/lib/realtime.ts`
- Client-side store fetches session bundles via `/api/session/[code]` and polls every five seconds.
- Provides wrappers for adding responses, voting, timeline entries, and chat messages through REST endpoints.
- Stores participant profiles in localStorage/sessionStorage/cookies to support reconnection.

## REST Endpoints (`src/routes/api`)

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/session/create` | POST | Creates a session (code, title, template slug, facilitator email, challenge). |
| `/api/session/status` | POST | Updates session status (`planned`, `live`, `done`). |
| `/api/session/round` | POST | Starts or clears an active breakout round with optional duration. |
| `/api/session/list` | GET | Returns planned/live sessions; accepts `status` query parameter. |
| `/api/session/facilitator` | POST | Validates facilitator email and joins them to a session. |
| `/api/session/[code]` | GET | Returns full session bundle (session + participants + questions + responses + timeline + chat). |
| `/api/participants/join` | POST | Adds a participant with colour and role. |
| `/api/questions/add` | POST | Seeds additional prompts. |
| `/api/responses/add` | POST | Adds a response with optional cards. |
| `/api/responses/vote` | POST | Increments/decrements response votes. |
| `/api/timeline/add` | POST | Appends timeline entries. |
| `/api/chat/send` | POST | Adds chat messages. |
| `/api/export/[code]` | GET | Generates markdown summary report (see `workshop.ts:430`). |

Each endpoint interacts with Supabase via helper functions and returns JSON with `success` flags and payloads.

## Realtime Behavior

- `src/lib/realtime.ts` subscribes to Supabase Postgres changes for `sessions`, `participants`, `questions`, `responses`, `timeline`, `chat`, and `session_phases`.
- Realtime subscriptions are active when a session is `live`; planned/done sessions use slower polling.
- The legacy endpoint at `src/routes/ws/+server.ts` is intentionally disabled and returns HTTP 410.

## Authentication & Authorization

- Facilitator identity is tied to email stored on the session. `/api/session/facilitator` verifies this before allowing rejoin (`designeralphabet/src/routes/api/session/facilitator/+server.ts:8`).
- Participant role is provided by the join request (defaults to `participant`).
- Supabase RLS policies allow universal read/write but rely on app-layer checks to restrict facilitator actions.

## Error Handling

- REST endpoints wrap Supabase operations with try/catch and return `{ success: false, error }` on failure.
- Client-side flows surface fetch errors to the UI and continue polling/realtime retries where possible.

## Adding New API Endpoints

1. Create a SvelteKit `+server.ts` under `src/routes/api/...`.
2. Import helper functions from `src/lib/server/workshop.ts` or add new ones as needed.
3. Use `json` from `@sveltejs/kit` for responses.
4. Update tests and documentation (this folder) to reflect the new behaviour.

See [DevOps & Deployment](devops.md) for guidance on migrating database changes and deploying to Railway.
