# Sanity Content Studio

The `content/` directory houses a Sanity Studio that feeds the facilitator experience with templates, cards, and visual themes.

## Installation & Development

```bash
cd content
npm install
npm run dev
```

The studio runs on port 3333. For Docker deployments, `content/Dockerfile` performs a static `npm run build` and serves the assets with `serve`.

## Key Schemas (`content/schemaTypes`)

| File | Description |
| --- | --- |
| `Cards.ts` | Card documents with localized descriptions, prompts, tags, reading lists, style metadata. |
| `WorkshopTemplate.ts` | Master schema driving facilitator flow—includes onboarding, breakout rounds, synthesis instructions, scoring, themes, and resources. |
| `Theme.ts` | Theme documents containing palette, fonts, and card styles for branded sessions. |
| `eventType.ts` | Example schema for event categories (extend as needed). |
| `index.ts` | Aggregates and exports all schema definitions to `sanity.config.ts`. |

## Workshop Template Anatomy

The template schema is the linchpin for session orchestration (`content/schemaTypes/WorkshopTemplate.ts:18`). Notable fields:

- `challenge`: Baseline challenge statement shown to facilitators & participants.
- `breakout.rounds`: Array of rounds (key, name, minutes, questions). Automatically seeded into Supabase when sessions launch.
- `synthesis.methods`: List of synthesis techniques (e.g., Prioritize, Now-Next-Later).
- `facilitation`: Guidance on roles, fairness thresholds, scoring weights, and badge suggestions.
- `visuals.theme`: Reference to a theme document (palette, fonts, card style) applied in the Svelte app.
- `resources`: Links or references to supportive material.

## Cards Library

- Each card contains `description`, `prompt`, optional `*_i18n` fields for localization, and style metadata (`content/schemaTypes/Cards.ts:1`).
- Cards are fetched in the frontend via GROQ queries for library browsing and in-session references (`designeralphabet/src/lib/Cards.ts:1`).

## GROQ Client Usage

`designeralphabet/src/lib/sanity.ts` creates a GROQ client using `VITE_SANITY_PROJECT_ID`, `VITE_SANITY_DATASET`, and `VITE_SANITY_API_VERSION`. The client powers:

- Template fetches in the facilitator console (`designeralphabet/src/routes/facilitator/+page.svelte:91`).
- Card library views (`designeralphabet/src/routes/cards/+page.svelte`).

## Deployment

- Docker image builds the studio and serves it using `serve`, exposing port 3333 (`content/Dockerfile:1`).
- In Railway, run the `studio` service separately from the `web` service so editors can manage content independently.

## Editorial Workflow

1. Create or update templates in Sanity Studio to reflect new agendas or question sets.
2. Editors can experiment with theme references to tweak palette/typography.
3. Facilitators automatically see the latest templates when loading the console—no redeploy required.

## Extending the Studio

- Add new document types under `content/schemaTypes` and export them via `index.ts`.
- Update GROQ queries if the frontend needs to consume new fields.
- Consider adding validation rules (e.g., min/max minutes) to ensure data integrity before it reaches the facilitator console.

Refer to [Features](features.md) and [Frontend Guide](frontend.md) to see how Sanity data surfaces in the product.
