# Frontend Guide

## Stack

- **Framework**: SvelteKit 2 (SSR + SPA hybrid)
- **Bundler**: Vite (`designeralphabet/package.json:14`)
- **UI Layer**: Tailwind CSS + Skeleton plugin (`tailwind.config.cjs`, `designeralphabet/src/app.css`)
- **Charts**: D3 utilities rendered through Svelte components (`designeralphabet/src/lib/components/charts`)
- **TypeScript**: Enabled via `tsconfig.json`
- **Testing**: Playwright for E2E, Vitest for unit tests

## Entry Points

| Route | Purpose | Notes |
| --- | --- | --- |
| `src/routes/+page.svelte` | Landing page marketing the platform | Contains quick links and hero metrics |
| `src/routes/session/+page.svelte` | Session hub with join/presentation/facilitator links | Persists active session cookie |
| `src/routes/facilitator/+page.svelte` | Facilitator console for session creation | Integrates Sanity templates, facilitator email capture |
| `src/routes/join/+page.svelte` | Participant & facilitator join flow | Handles active session list, facilitator authentication |
| `src/routes/session/[code]/+page.svelte` | Live collaboration dashboard | Renders controls, breakout timers, charts, timeline, chat |
| `src/routes/presentation/+page.svelte` | Display mode for big screens | Accepts session code and streams stats |
| `src/routes/cards/+page.svelte` | Card library browsing | Pulls from Sanity cards via `$lib/sanity` |

## Shared Modules

- `src/lib/realtime.ts`: Client-side store for session bundle (participants, questions, responses, timeline, chat). Provides helper methods for adding responses, voting, timeline updates, chat, and storing participant profile.
- `src/lib/server/workshop.ts`: Supabase-admin wrappers used in server routes to manipulate sessions, participants, and related tables.
- `src/lib/stores/user.ts`: Persists current user profile (participant or facilitator) across reloads.
- `src/lib/components/charts/`: Visualization components for bubble maps, heatmaps, and roadmaps. All accept `responses` derived from realtime stores.
- `src/lib/sanity.ts`: GROQ client used to fetch templates and cards from Sanity Studio.

## Styling

- Tailwind base styles defined in `src/app.css` and `tailwind.config.cjs`.
- Skeleton plugin provides additional utility classes (e.g., buttons, cards).
- Custom neon gradients and retro themes referenced throughout session components (`designeralphabet/src/routes/session/[code]/+page.svelte:462`).

## State Management

- Svelte stores (`writable`, `derived`) for realtime data.
- Local storage + cookies used to persist participant profiles and session codes.
- Reactive statements (`$:`) inside components recalculating template data and countdown timers when upstream data changes.

## Navigation Patterns

- `goto` from `$app/navigation` handles transitions between facilitator/join/session screens.
- Query parameters (e.g., `?role=facilitator`) determine view-specific behavior inside `session/[code]` routes.
- Headers provide persistent emergency exit button that clears session cookies (`designeralphabet/src/routes/header.svelte:30`).

## Testing Hooks

- Run `npm run test:unit` for unit tests (Vitest) and `npm run test:integration` for Playwright suites.
- Use `npm run check` for `svelte-check` TypeScript validation and `npm run lint` for formatting.

## Local Development

```bash
cd designeralphabet
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Or launch both SvelteKit and Sanity via the root `./run-all.sh` script.

## Recommended Reading

- Explore `session/[code]/+page.svelte` first—it showcases most interactive behaviour and references nearly every shared module.
- Check `facilitator/+page.svelte` to understand how templates feed into new sessions.
- Consult `join/+page.svelte` for the facilitator re-authentication logic and active session discovery.

Refer to [Backend & APIs](backend.md) for the server endpoints powering these views.
