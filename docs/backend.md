# Backend & APIs

## Overview

The backend is implemented entirely through SvelteKit server routes and Supabase Admin SDK helpers. It exposes REST endpoints and a WebSocket gateway that coordinate session data, participants, and live collaboration.

## Supabase Data Model

| Table | Purpose | Key Columns |
| --- | --- | --- |
| `sessions` | Root entity for workshops | `code`, `title`, `template_slug`, `facilitator_email`, `challenge`, `active_round`, `round_expires_at`, `status` |
| `participants` | Facilitators & attendees | `room_code`, `name`, `role`, `color`, `points`, `badges` |
| `questions` | Prompt inventory seeded from templates | `room_code`, `section`, `text` |
| `responses` | Participant answers & linked cards | `room_code`, `question_id`, `participant_id`, `text`, `cards`, `votes` |
| `timeline` | Now/Next/Later roadmap items | `room_code`, `label`, `item_text`, `owner`, `metric`, `risk_note` |
| `chat` | In-session chat feed | `room_code`, `participant_id`, `message` |

Policies in `designeralphabet/database/schema.sql` and migrations in `designeralphabet/supabase/migrations` keep the schema synchronized with production.

## Core Modules

### `src/lib/server/workshop.ts`
- Wraps Supabase Admin client operations with type-safe helpers.
- Provides session lifecycle management: create session, update status, set active round, fetch lists, add participants/questions/responses/timeline/chat, and scoring updates.
- Broadcasts significant events via `broadcast` so websocket clients refresh.

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

## WebSocket Gateway (`/session/ws`)

- Uses `WebSocketPair` within SvelteKit’s server to handle upgrade requests (`designeralphabet/src/routes/ws/+server.ts:17`).
- After a `HELLO` handshake, clients receive presence membership and can send the following messages:

| Type | Payload | Description |
| --- | --- | --- |
| `ADD_RESPONSE` | `{ code, questionId, participantId, text, cards[] }` | Adds a new response. |
| `CAST_VOTE` | `{ responseId, delta }` | Updates votes on a response. |
| `ADD_TIMELINE` | `{ code, label, itemText, owner?, metric?, riskNote? }` | Adds a timeline item. |
| `ADD_QUESTION` | `{ code, section, text }` | Adds a new question. |
| `SEND_CHAT` | `{ code, participantId?, message }` | Sends a chat message. |
| `CHANGE_STEP` | `{ code, status }` | Moves session between planned/live/done. |
| `SYNC_TIMER` | `{ code, remaining, state }` | Pushes timer synchronization messages. |
| `SCORE_UPDATE` | `{ participantId, delta, badge? }` | Adjusts participant scores/badges. |

- Server responds with targeted broadcasts (e.g., `RESPONSE_ADDED`, `TIMELINE_ADDED`, `ROUND_UPDATE`) using `broadcast` from `src/lib/server/realtime.ts`.

## Authentication & Authorization

- Facilitator identity is tied to email stored on the session. `/api/session/facilitator` verifies this before allowing rejoin (`designeralphabet/src/routes/api/session/facilitator/+server.ts:8`).
- Participant role is provided by the join request (defaults to `participant`).
- Supabase RLS policies allow universal read/write but rely on app-layer checks to restrict facilitator actions.

## Error Handling

- REST endpoints wrap Supabase operations with try/catch and return `{ success: false, error }` on failure.
- WebSocket handler sends `ERROR` messages back to clients when exceptions occur.
- Client-side join screen bubbles up fetch errors via alert dialogues.

## Adding New API Endpoints

1. Create a SvelteKit `+server.ts` under `src/routes/api/...`.
2. Import helper functions from `src/lib/server/workshop.ts` or add new ones as needed.
3. Use `json` from `@sveltejs/kit` for responses.
4. Update tests and documentation (this folder) to reflect the new behaviour.

See [DevOps & Deployment](devops.md) for guidance on migrating database changes and deploying to Railway.
