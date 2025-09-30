# Critical Designer Alphabet — Sanity Schemas

These schema definitions power the retro-tech design app. Add them to a Sanity v3 Studio (create a `sanity.config.ts` that imports `schemaTypes` from `./schemas`).

## Documents

- **cards**: Extended card metadata with retro style tokens, localized descriptions/prompts, reading list resources, and optional `postId` for sync.
- **themes**: Stores neon palettes, font stacks, and accent glow recipes to drive the design system.
- **achievements**: Defines gamified badges, point values, rarity, and trigger conditions.
- **pages**: Handles marketing/info pages (e.g., “about”) with structured sections and localized hero copy.

## Objects

- **i18nText**: Collapsible multi-locale text helper.
- **resourceLink**: Title + URL pair used by cards.
- **pageSection**: Portable-text section builder for informational pages.

When you run the Sanity Studio, expose `schemaTypes` so the Studio can manage this content:

```ts
import { defineConfig } from 'sanity';
import { schemaTypes } from './schemas';

export default defineConfig({
	projectId: 'YOUR_PROJECT_ID',
	dataset: 'production',
	title: 'Critical Designer Alphabet',
	schema: {
		types: schemaTypes
	}
});
```
