# Platform Features

## Facilitator Experience

- **Template-driven session launch** – Facilitators choose a Sanity workshop template, add a challenge statement, provide their email, and generate a session code in the console (`designeralphabet/src/routes/facilitator/+page.svelte:80`).
- **Automatic question seeding** – Breakout rounds defined in the template are seeded into Supabase when a session is created (`designeralphabet/src/routes/facilitator/+page.svelte:136`).
- **Rejoin with email** – The facilitator email captured at launch is stored on the session, enabling re-authentication on new devices (`designeralphabet/src/routes/api/session/facilitator/+server.ts:1`).
- **Live control panel** – Facilitators can toggle session status, start/stop breakout timers (template or custom), and export summaries from the in-session dashboard (`designeralphabet/src/routes/session/[code]/+page.svelte:199`).
- **Realtime oversight** – Presence lists, response streams, timeline updates, and chat messages surface via Supabase Realtime subscriptions (`designeralphabet/src/lib/realtime.ts:286`).

## Participant Experience

- **Guided join flow** – Participants pick avatar colours, preview the session blueprint, and join by code. Facilitator mode can be toggled to authenticate via email (`designeralphabet/src/routes/join/+page.svelte:264`).
- **Active session discovery** – `/api/session/list` returns currently planned/live sessions; the join screen renders them as clickable cards (`designeralphabet/src/routes/api/session/list/+server.ts:1`).
- **Interactive collaboration** – Participants answer prompts, vote on ideas, add timeline items, and chat in real time within the session workspace (`designeralphabet/src/routes/session/[code]/+page.svelte:462`).
- **Leaderboards & analytics** – Scores, charts, heatmaps, and roadmaps provide immediate feedback and alignment metrics (`designeralphabet/src/routes/session/[code]/+page.svelte:616`).

## Presentation Mode

- **Room display** – A shareable presentation view mirrors responses, votes, and timelines for projectors or shared screens (`designeralphabet/src/routes/presentation/+page.svelte:74`).
- **Session switching** – Hosts can enter a new code to swap the data feed live without refreshing (`designeralphabet/src/routes/presentation/+page.svelte:92`).

## Content Management

- **Workshop Templates** – Sanity schemas define onboarding, breakout rounds, synthesis, commitments, and AI guidance (`content/schemaTypes/WorkshopTemplate.ts:18`).
- **Card Library** – Cards with localized text, prompts, and style metadata are managed in Sanity and consumed in the front-end (`content/schemaTypes/Cards.ts:1`).
- **Themes** – Palette and typography references allow branded experiences per workshop (`content/schemaTypes/Theme.ts:1`).

## Platform Utilities

- **Realtime API** – Postgres change subscriptions stream updates from Supabase to clients (`designeralphabet/src/lib/realtime.ts:286`).
- **REST APIs** – Endpoints handle session creation, participant joins, facilitator login, status updates, round control, timeline, responses, chat, and exporting (`designeralphabet/src/routes/api`).
- **Environment-aware builds** – Dockerfiles bake environment defaults and prune dev dependencies for lean production images (`designeralphabet/Dockerfile:1`).

## Operational Enhancements

- **run-all.sh** – One-command dev environment launching both the Svelte and Sanity servers (`run-all.sh:1`).
- **Supabase migrations** – SQL files automate schema evolution for challenge statements, active rounds, and facilitator email support (`designeralphabet/supabase/migrations`).
- **Testing** – Integrated Playwright and Vitest commands (`designeralphabet/package.json:11`).

Refer to [Architecture](architecture.md) for how these capabilities map onto system components.
