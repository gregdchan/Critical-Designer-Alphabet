# Chart Refactoring Guide - PHASE-BASED ARCHITECTURE

## Overview

This guide documents the **phase-based, question-specific** chart architecture for consistent rendering across facilitator and presentation pages.

### Key Principles
1. **Each PHASE has multiple QUESTIONS**
2. **Each QUESTION has ONE specific chart** (type determined by Sanity)
3. **Charts show data ONLY for their question** (not aggregated)
4. **Phases organize which charts to display**
5. **No Supabase schema changes** - read-only
6. **Backward compatible** with existing code

---

## Architecture

### Data Flow

```
Supabase (dynamic data: responses, participants)
    �
lib/realtime.ts (realtime subscriptions)
    �
lib/stores/charts.ts (unified chart stores)
    �
Components (BarChart, WordCloud, etc.)
    �
Facilitator & Presentation Pages
```

```
Sanity CMS (static data: questions, labels, config)
    �
lib/utils/sanity.ts (cached queries)
    �
lib/stores/charts.ts (metadata enrichment)
```

---

## Key Files

### 1. `src/lib/types/charts.ts`
Unified type definitions for all charts.

**Key Types:**
- `ChartData` - Main chart data structure
- `ChartSeries` - Data series with points
- `ChartPoint` - Individual data point
- `SessionState` - Complete session state
- `WordCloudData`, `LandscapePoint`, etc. - Chart-specific types

### 2. `src/lib/utils/sanity.ts`
Utilities for fetching static metadata from Sanity CMS.

**Functions:**
- `getSanitySessionData(code)` - Fetch session metadata
- `getSanityTemplate(slug)` - Fetch template configuration
- `getChartColor(index)` - Get color from design tokens
- `getCachedSanityData(key, fetcher)` - SWR-style caching

### 3. `src/lib/stores/charts.ts`
Centralized chart stores that combine Supabase + Sanity data.

**Exported Stores:**
- `charts.responseTally` - Response count by option
- `charts.wordCloud` - Text response word cloud
- `charts.landscape` - 2D scatter plot data
- `charts.themes` - Theme/section heatmap
- `charts.scale` - Scale question averages
- `charts.votingLeaderboard` - Top voted responses
- `charts.summary` - Session summary stats

**Features:**
-  Realtime updates from Supabase
-  Throttled updates (~10fps) for performance
-  Derived from existing `realtime.ts` stores
-  No database schema changes

### 4. `src/lib/components/charts/BarChart.svelte`
Refactored chart component supporting both old and new APIs.

**Props:**
- `chartData: ChartData | null` - **New unified approach**
- `data: Array<{...}>` - Legacy backward-compatible prop
- `ariaLabel: string` - Accessibility label
- `width`, `height` - Dimensions

---

## Usage Examples

### Example 1: Phase-Based Facilitator Page (RECOMMENDED)

```svelte
<script lang="ts">
  import { phases, sessionDetails } from '$lib/realtime';
  import PhaseCharts from '$lib/components/PhaseCharts.svelte';
  import { browser } from '$app/environment';

  // Currently active phase (or selected phase)
  $: activePhaseKey = $sessionDetails?.active_phase_key;
</script>

<!-- Phase Tabs/Buttons -->
<nav class="phase-navigation">
  {#each $phases as phase}
    <button
      class={activePhaseKey === phase.phase_key ? 'active' : ''}
      on:click={() => selectPhase(phase.phase_key)}
    >
      {phase.title}
    </button>
  {/each}
</nav>

<!-- Charts for Selected Phase -->
{#if activePhaseKey && browser}
  <PhaseCharts phaseKey={activePhaseKey} width={900} height={520} />
{/if}
```

**How it works:**
- User clicks a phase button
- `PhaseCharts` component automatically:
  - Finds all questions for that phase
  - Determines chart type from Sanity (`response_type`, `map_type`, `recommended_dashboards`)
  - Renders one chart per question
  - Filters responses to show only data for each specific question

### Example 2: Presentation Page (Same Approach)

```svelte
<script lang="ts">
  import { charts } from '$lib/stores/charts';
  import WordCloudChart from '$lib/components/charts/WordCloudChart.svelte';
  import LandscapeChart from '$lib/components/charts/LandscapeChart.svelte';
  import { browser } from '$app/environment';
</script>

<!-- Immersive dashboard view -->
<div class="presentation-mode">
  {#if browser}
    {#if $charts.wordCloud}
      <WordCloudChart data={$charts.wordCloud} width={900} height={520} />
    {:else}
      <p>Waiting for responses...</p>
    {/if}
  {/if}
</div>
```

### Example 3: Backward Compatible Usage

```svelte
<!-- Old approach still works! -->
<BarChart
  data={[
    { label: 'Option A', value: 10, percentage: 50 },
    { label: 'Option B', value: 5, percentage: 25 },
    { label: 'Option C', value: 5, percentage: 25 }
  ]}
  width={800}
  height={400}
  totalResponses={20}
/>
```

---

## Migration Steps

### Step 1: Add Realtime Connection (if not already present)

Your pages should already be using `lib/realtime.ts`. The chart stores automatically subscribe to these updates.

```svelte
<script lang="ts">
  import { connectSession } from '$lib/realtime';
  import { page } from '$app/stores';

  const sessionCode = $page.params.code;

  onMount(() => {
    connectSession(sessionCode);
  });
</script>
```

### Step 2: Import Chart Stores

```svelte
<script lang="ts">
  import { charts } from '$lib/stores/charts';
</script>
```

### Step 3: Use Chart Components with ChartData

```svelte
{#if $charts.responseTally}
  <BarChart chartData={$charts.responseTally} width={800} height={400} />
{/if}
```

### Step 4: Guard with Browser Check

Always wrap D3-based charts with `{#if browser}` to prevent SSR issues:

```svelte
<script>
  import { browser } from '$app/environment';
</script>

{#if browser}
  <BarChart chartData={$charts.responseTally} />
{/if}
```

---

## Performance Optimizations

### 1. Throttled Updates
Chart updates are throttled to ~10fps (100ms) to prevent excessive re-renders:

```ts
const CHART_UPDATE_THROTTLE = 100; // ms
```

### 2. SWR Caching
Sanity data is cached for 5 minutes:

```ts
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

### 3. Derived Stores
Charts use Svelte's `derived()` for efficient reactivity - only recalculate when dependencies change.

### 4. Browser Guards
Prevent SSR rendering of D3 charts:

```svelte
{#if browser}
  <Chart data={$chartStore} />
{/if}
```

---

## Accessibility

All charts include:
-  `role="img"` on SVG elements
-  `aria-label` with descriptive text
-  Fallback `<p>Loading data...</p>` messages
-  High-contrast design tokens (`var(--chart-1)` through `var(--chart-8)`)

---

## Chart Color Tokens

Use CSS custom properties for consistent, accessible colors:

```css
--chart-1: #007172; /* Teal */
--chart-2: #F29325; /* Orange */
--chart-3: #025259; /* Dark teal */
--chart-4: #D94F04; /* Dark orange */
--chart-5: #F4E2DE; /* Cream */
--chart-6: #00a0a3; /* Light teal */
--chart-7: #ff9f1c; /* Light orange */
--chart-8: #013840; /* Navy */
```

Access in TypeScript:

```ts
import { getChartColor } from '$lib/utils/sanity';

const color = getChartColor(index); // 'var(--chart-1)'
```

---

## Testing

### Unit Tests
```bash
npm run test
```

### Visual Testing
1. Start dev server: `npm run dev`
2. Navigate to facilitator page: `/facilitator/[code]`
3. Add responses via participant page: `/session/[code]`
4. Verify charts update in realtime
5. Check presentation page: `/presentation/[code]`

### Performance Testing
- Open browser DevTools > Performance
- Record while adding ~20 responses
- Verify chart updates don't cause jank
- Target: <16ms frame time (60fps)

---

## Troubleshooting

### Charts not updating?
- Check browser console for errors
- Verify `connectSession()` is called in `onMount()`
- Ensure realtime subscription is active
- Check Supabase connection

### SSR errors?
- Wrap charts in `{#if browser}` blocks
- Use `onMount()` for D3 operations
- Don't access `window` or `document` at module scope

### Missing data?
- Verify Supabase tables have data
- Check network tab for failed API calls
- Confirm session code is valid
- Check realtime store values in Svelte DevTools

---

## Future Enhancements

1. **Add more chart types** (scatter, radar, treemap)
2. **Export to PNG/SVG** functionality
3. **Time-series charts** for session timeline
4. **Comparative views** (side-by-side sessions)
5. **Custom color schemes** per template

---

## Summary

 No database schema changes
 Backward compatible with existing code
 Centralized chart data logic
 Consistent across facilitator and presentation pages
 Realtime updates with performance throttling
 Accessible and responsive
 Uses design system tokens

**Next Steps:**
1. Update facilitator page to use `charts` store
2. Update presentation page to use `charts` store
3. Refactor remaining chart components (WordCloud, Landscape, etc.)
4. Add comprehensive tests
