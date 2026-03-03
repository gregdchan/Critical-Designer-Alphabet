# Critical Designer Alphabet Platform

Welcome to the documentation hub for the Critical Designer Alphabet (CDA) platform. This collection of Markdown files provides a comprehensive reference for the product vision, architecture, data model, workflows, and operational playbooks that power the experience.

## Documentation Map

| Area | Description |
| --- | --- |
| [Features](features.md) | Product capabilities from facilitator launch to live collaboration. |
| [Architecture](architecture.md) | High-level system diagram covering frontend, backend, database, and content studio. |
| [Frontend Guide](frontend.md) | SvelteKit application structure, component catalogue, and styling approach. |
| [Backend & APIs](backend.md) | Supabase data model, REST endpoints, and Supabase Realtime flows. |
| [Content Studio](content-studio.md) | Sanity schemas, template authoring, and editorial workflows. |
| [DevOps & Deployment](devops.md) | Local development, Docker images, Railway deployment, and environment configuration. |
| [Testing & QA](testing.md) | Available test harnesses, how to run them, and recommended coverage. |

Each document references concrete source paths (e.g. `designeralphabet/src/routes/session/[code]/+page.svelte`) so you can quickly jump between the docs and implementation.

## Getting Started

1. Review the [Features](features.md) overview to understand what the platform delivers.
2. Consult the [Architecture](architecture.md) guide for a big-picture mental model.
3. If you are developing on CDA, follow the instructions in [DevOps & Deployment](devops.md) to configure your environment.
4. Use [Backend & APIs](backend.md) and [Frontend Guide](frontend.md) as day-to-day references when implementing features or debugging.

## Contributing

- Update the relevant Markdown file whenever you change behaviour or add a new feature.
- Prefer short sections with explicit file references and keep tables of contents in sync.
- Run `npm run lint` and `npm run build` before submitting changes.

Have ideas for improving the docs? Open an issue or append a proposal to `docs/DEV_NOTES.md` (create if needed) so the team can review.
