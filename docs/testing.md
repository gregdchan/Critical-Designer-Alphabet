# Testing & Quality Assurance

## Test Suites

| Command | Location | Description |
| --- | --- | --- |
| `npm run lint` | `designeralphabet/` | Runs Prettier (format check) and ESLint. |
| `npm run check` | `designeralphabet/` | Executes `svelte-kit sync` followed by `svelte-check` for TypeScript validation. |
| `npm run test:unit` | `designeralphabet/` | Runs Vitest unit tests. Add specs under `src/` or `tests/`. |
| `npm run test:integration` | `designeralphabet/` | Runs Playwright end-to-end suites defined in `tests/`. |
| `npm run build` | `designeralphabet/` | Full production build (SSR + client) – use as part of CI gate. |

## E2E Scenarios to Cover

1. **Facilitator Launch**
   - Load `/facilitator` and create a session with template.
   - Ensure questions seeded, facilitator profile created, presentation tab opened.

2. **Participant Join**
   - Visit `/join`, choose session from Active Sessions or enter code.
   - Set avatar colour, join as participant, verify presence in session dashboard.

3. **Facilitator Rejoin**
   - Toggle facilitator mode, enter email, rejoin and verify control panel access.

4. **Collaboration Flows**
   - Add responses, vote, add timeline items, send chat messages.
   - Confirm realtime updates for multiple clients (use Playwright multi-context).

5. **Breakout Timers**
   - Start template round, observe countdown, stop round.
   - Trigger custom timer and verify participants see active round banner.

6. **End Session**
   - Hit “End Session” control (status becomes `done`).
   - Participant view updates and `/api/session/list` no longer shows session as active.

7. **Presentation View**
   - Open `/presentation`, link to session, ensure data streams.

## Test Data & Fixtures

- Supabase seed scripts exist in `designeralphabet/database/schema.sql` (optional TEST123 entries).
- For isolated testing, use unique session codes (Playwright can generate random values).

## Mocking & Utilities

- Vitest can mock `@supabase/supabase-js` if you add service abstractions. Currently, server routes hit real Supabase—consider dependency injection for unit test coverage of backend logic.
- Use `designeralphabet/src/lib/realtime.ts` helper functions to simulate client actions during tests.

## Continuous Integration Suggestions

1. Install dependencies (`npm ci`).
2. Run `npm run lint` and `npm run check`.
3. Execute `npm run test:unit`.
4. Build (`npm run build`).
5. Optionally run Playwright in headless mode (`npx playwright install --with-deps` followed by `npm run test:integration`).

## Troubleshooting

| Issue | Action |
| --- | --- |
| Playwright fails to launch Chromium | Run `npx playwright install --with-deps`. |
| Tests mutate Supabase prod data | Use a separate Supabase project or schema for CI. Consider environment-based table prefixes. |
| Flaky realtime tests | Increase timeouts; assert via Supabase REST responses as fallback. |
| Build warnings about CSS `@media` | Ensure CSS syntax valid; warnings already surfaced in `npm run build`. |

Document new tests and quality gates here when expanding coverage.
