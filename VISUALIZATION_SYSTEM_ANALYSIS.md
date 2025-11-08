# Design Thinking App - Data Visualization System Analysis

## Executive Summary

This design thinking app uses D3.js (v7.9.0) for real-time, interactive data visualization. The system intelligently maps question types to appropriate visualizations through a multi-layered inference system, enabling facilitators to understand participant responses dynamically during live sessions.

---

## 1. VISUALIZATION COMPONENTS INVENTORY

### Libraries & Technology Stack

**Primary Dependencies:**
- **D3.js v7.9.0** - Core visualization library (all custom charts)
- **Svelte 4.2.18** - Component framework
- **SvelteKit 2.0.0** - Full-stack framework
- **Tailwind CSS 3.4.17** - Styling

**No external chart libraries** - all visualizations built directly with D3.

### Chart Component Inventory

**Location:** `/home/user/Critical-Designer-Alphabet/designeralphabet/src/lib/components/charts/`

**Total: 21 components**

#### Core Question-Based Charts (9):
1. **BarChart.svelte** - Multiple choice visualization
2. **PieChart.svelte** - Proportional distribution
3. **LineChart.svelte** - Scale/rating distributions
4. **WordCloudChart.svelte** - Text responses (voting enabled)
5. **LandscapeChart.svelte** - 2D scatter plot
6. **RoadmapChart.svelte** - Timeline/roadmap swimlanes
7. **HeatmapChart.svelte** - Lens × Maturity matrix
8. **QuadBubbleChart.svelte** - Impact/Effort quadrant
9. **ParticipantJourneyChart.svelte** - Participant tracking

#### Real-time Stream Charts (3):
10. **RealtimeBarChart.svelte** - Live bar chart
11. **RealtimeLineChart.svelte** - Live line chart
12. **RealtimePieChart.svelte** - Live pie chart

#### Advanced Aggregate Charts (3):
13. **SupercloudChart.svelte** ⭐ - Multi-type aggregation with filtering
14. **SuperlineChart.svelte** - All scales overlaid
15. **PhaseStackedBar.svelte** ⭐ - Phase engagement by lens

#### Specialized Visualizations (2):
16. **PhaseTopIdeasBubbles.svelte** ⭐ - Top ideas per phase
17. **RatingsBeeswarm.svelte** - Beeswarm plot

#### Dynamic Chart Registry:
- **QuadBubbles.svelte** - Quad bubble for design lens
- **MaturityDial.svelte** - Radial gauge
- **ParticipationPulse.svelte** - Real-time activity
- **InclusivityMeter.svelte** - Gauge chart
- **RiskImpactMatrix.svelte** - Risk plotting
- **BaseChart.svelte** - Shared base component

---

## 2. KEY VISUALIZATIONS - DETAILED ANALYSIS

### SupercloudChart.svelte (887 lines) ⭐ Most Complex

**Purpose:** Unify three response types in one bubble cloud visualization

**What it shows:**
- **Purple bubbles** (Written) - sized by votes
- **Blue bubbles** (Choices) - sized by selection frequency  
- **Green bubbles** (Scales) - sized by response count
- **Lens ring** - colored border indicating design lens
- **Phase filter** - filter by session phase

**Data Aggregation:**
```
Written Responses:
  response_type='written' → 1 bubble per response
  Size = votes (minimum 1)

Choice Responses:
  response_type=['singleChoice','multiSelect']
  Group by [question_id + choice_text + lens]
  Size = count of identical selections

Scale Responses:
  response_type='scale'
  Group by [question_id + lens]
  Size = response count
```

**Sizing Algorithm:**
- Floor all values at 1 (minimum importance unit)
- Normalize: (value - min) / (max - min)
- Power curve: Math.pow(normalized, 0.65)
- Radius: 30px + curved * 35px (30-65px range)

**Key Features:**
- **Interactive Filtering:** Click legend items (type, lens, phase)
- **Zoom/Pan:** 0.5x-8x scale, Ctrl+wheel, touch pinch
- **Animations:** "Pop & giggle" on hover (scale 1.12, ±4-8°, 10px nudge)
- **Tooltips:** Question, bubble text, type, lens, metadata
- **Performance:** Throttled 100ms, ResizeObserver responsive

### WordCloudChart.svelte (605 lines) ⭐ Well-Designed

**Purpose:** Display text responses as sized bubbles with vote indicators

**What it shows:**
- Individual text responses as bubbles
- Size = votes received (exponential curve)
- Color = participant or lens
- Vote badge = small circle in top-right (only if votes > 0)

**Bubble Sizing:**
- minRadius: 18px, maxRadius: 80px
- exponentialScale = Math.pow(normalizedVotes, 0.6)
- Centers entire cloud in canvas

**Key Features:**
- **Typography:** 9-14px font, multi-line wrapping, text shadow
- **Zoom/Pan:** Same as SupercloudChart
- **Tooltips:** Question, text, participant, lens, votes %
- **Mobile:** Legend below chart, responsive positioning
- **Aspect:** 16:9 desktop, 70dvh mobile

### PhaseStackedBar.svelte (144 lines)

**Purpose:** Show engagement across phases segmented by lens

**What it shows:**
- Horizontal stacked bar per phase
- Each lens = colored segment
- Total responses aggregated per phase

**Key Features:**
- **Responsive:** Hides labels on mobile (<560px)
- **Legend:** Right desktop, compact mobile
- **Tooltips:** Phase, lens, count, percentage
- **Mobile Layout:** Legend width adjusted (220px → hidden)

### PhaseTopIdeasBubbles.svelte (178 lines)

**Purpose:** Display top voted ideas organized by phase in grid

**What it shows:**
- Grid layout (1-3 columns, responsive)
- Each phase: title, stats, bubble pack
- Stats: response count, total votes, top votes

**Grid Layout:**
- <640px: 1 column, min 350px height
- <900px: 2 columns
- ≥900px: 3 columns

**Key Features:**
- **Highlighting:** Optional highlightParticipantId parameter
- **Statistics:** Responsive text formatting
- **Tooltips:** Idea text, votes %, participant name

---

## 3. DATA FLOW ARCHITECTURE

### Flow Diagram

```
Supabase (responses table)
        ↓
/lib/realtime.ts (Svelte Stores)
  - responses, questions, participants, phases
        ↓
    ┌───┴───┬───────────┐
    ↓       ↓           ↓
Inference Filter    Adapters
    ↓       ↓           ↓
    └───┬───┴───────────┘
        ↓
/lib/stores/charts.ts (Chart Derivation)
        ↓
    ┌───┴────────┐
    ↓            ↓
Chart Comp    Phase Charts
    ↓            ↓
D3 Render ← Svelte Components
```

### Question Type Inference (Priority-Based)

**File:** `/lib/aggregators/questionCharts.ts`

```
1. recommended_dashboards (Sanity field)
   → 'pie', 'bar', 'line', 'wordcloud'

2. Explicit type (response_type field)
   → 'multiple_choice' → 'multipleChoiceBar'
   → 'scale' → 'rating'
   → 'boolean' → 'boolean'
   → 'written' → 'openText'

3. Config options
   → If question.config.options[] exists → 'multipleChoiceBar'

4. Response analysis
   → Has votes? → 'voting'
   → Looks boolean? → 'boolean'
   → 60%+ numeric? → 'rating'
   → Long text (30+ chars)? → 'openText'

5. Default: 'multipleChoiceBar'
```

### Data Transformations

**Multiple Choice:**
- Split by comma, normalize, count
- Output: ChartPoint[] with label/value

**Rating/Scale:**
- Parse numeric, group by value
- Extract scale config (min/max/labels)
- Sort by numeric value

**Boolean:**
- Count yes/no patterns
- Output: [yes: n, no: m]

**Voting/OpenText:**
- No aggregation, pass raw responses
- Component renders word cloud

### Realtime Updates

**Mechanism:**
- Supabase subscriptions (primary)
- Polling fallback (5 seconds)
- Throttled to 10fps (100ms minimum)
- Svelte reactivity triggers re-renders
- Zoom/pan state preserved

---

## 4. INTERACTIVITY PATTERNS

### Tooltips
- Fixed positioning, opacity fade
- Content: phase, lens, counts, percentages
- Positioned at cursor + (8, 8)px

### Hover Animations
- Supercloud/WordCloud: "Pop & giggle"
  - Scale 1.12, rotate ±4-8°, nudge ±10px
  - Duration: 250ms cubic-out
  - Smooth return: 300ms cubic-out

### Zoom & Pan
- Scale extent: [0.5, 8]x
- Drag for pan, Ctrl+wheel for zoom
- Touch pinch zoom supported
- Cursor feedback: grab ↔ grabbing

### Filtering (SupercloudChart Only)
- Response Type (written/choice/scale)
- Lens (Risk, Work, Sustainability, Ethics, Community, Justice, Agency)
- Phase (session phases)
- Click to toggle, dims non-matching (opacity 0.05)

### Real-time Updates
- New bubbles appear as responses come in
- Sizes recalculate as votes accumulate
- Chart state maintained across renders

---

## 5. QUESTION TYPES & VIZ MAPPING

### Type System

| Type | Response Type | Chart | Component |
|------|---|---|---|
| Multiple Choice | `multiple_choice`, `multiselect` | Bar/Pie | BarChart, PieChart |
| Scale | `scale`, `rating`, `number` | Line | LineChart |
| Boolean | `boolean`, `yesno` | Pie | PieChart |
| Written | `written`, `text` | Word Cloud | WordCloudChart |
| Voting | any + `enable_voting:true` | Word Cloud | WordCloudChart |
| 2D Position | `landscape` | Scatter | LandscapeChart |
| Roadmap | `map_type:roadmap` | Swimlanes | RoadmapChart |
| Risk Assessment | `riskAssessment` | Impact Matrix | QuadBubbleChart |
| Maturity | `maturityDial` | Gauge | MaturityDial |
| Inclusivity | `inclusivityMeter` | Gauge | InclusivityMeter |

### Gaps Identified

1. **No word frequency extraction**
   - WordCloud shows individual responses, not keyword frequency
   - Could add text processing for true word cloud

2. **Specialized types not in PhaseCharts**
   - riskAssessment, maturityDial, inclusivityMeter isolated
   - Opportunity: Unify chart registries

3. **No composite visualizations**
   - Missing: Compare questions, trend analysis
   - Could add heatmap, parallel coordinates

4. **Boolean chart is pie chart**
   - Could be better as simple percentage bar
   - Opportunity: Dedicated boolean component

5. **Multi-choice vote splitting**
   - Divides votes evenly across choices
   - Better: Track actual participant patterns

6. **No matrix questions**
   - Rows × columns not handled
   - Opportunity: Heatmap-style matrix visualization

7. **Landscape lacks guidance**
   - No axis labels or semantic regions
   - Opportunity: Configurable axis titles

8. **No time-series**
   - Responses not aggregated by time
   - Opportunity: Timeline charts showing trends

### Opportunities

1. **Chart Export:** SVG/PNG export, interactive HTML export
2. **Real-time Chart Selection:** Allow facilitator to toggle chart type
3. **Custom Colors:** Per-session color customization
4. **Legend Filtering:** Extend to all multi-group charts
5. **Accessibility:** ARIA labels, keyboard nav, high contrast
6. **Performance:** Data sampling, virtualization for 1000+ responses

---

## 6. TECHNICAL IMPLEMENTATION

### D3 Patterns

| Pattern | Usage | Components |
|---------|-------|-----------|
| Scale Band | Categorical axes | PhaseStackedBar |
| Scale Linear | Numeric axes | All bar/line charts |
| Pack Layout | Bubble positioning | SupercloudChart, WordCloudChart |
| Hierarchy | Parent-child aggregation | Bubble charts |
| Rollup | Group-by aggregation | HeatmapChart |
| Zoom | Pan/zoom interaction | SupercloudChart, WordCloudChart |

### Responsive Breakpoints

- <560px: Very mobile (hide labels)
- <640px: Mobile (1 column)
- <768px: Tablet (legend below)
- ≥900px: Desktop (3 columns, legend right)

### Theme Integration

- CSS variables: `--brand`, `--text-primary`, `--surface-elevated`
- Theme colors: `theme.chart[]` palette (10+ colors)
- Lens colors: Primary palette + fallback
- HSL values in D3 selections

### Svelte Reactivity

```svelte
import { responses, questions, phases } from '$lib/realtime';

$: chartEntries = ((): ChartEntry[] => {
  // Recompute when any store changes
})();
```

---

## 7. CODE METRICS

| Metric | Count | Notes |
|--------|-------|-------|
| Chart Components | 21 | Base, realtime, specialized |
| Lines of Code | ~11,000 | Across all components |
| Largest | SupercloudChart | 887 lines |
| Data Adapters | 6 | Risk, Maturity, Inclusivity, etc. |
| Realtime Stores | 7 | Session, questions, responses, etc. |
| Question Types | 12+ | Inferred + explicit types |
| Responsive Breakpoints | 5+ | Mobile to desktop |

---

## 8. EXPORT & SHARING

### Export Page
**Location:** `/src/routes/export/[code]/+page.svelte`

**Capabilities:**
- Print to PDF (browser print dialog)
- Markdown export (via `/api/export/[code]`)

**Includes:**
- Session metadata (name, code, date)
- Metrics: participants, ideas, votes, averages
- Top ideas with lenses
- Lens distribution
- Common choice selections

---

## 9. KEY RECOMMENDATIONS

### High Priority
1. Unify chart type systems (CHART_REGISTRY + response_type)
2. Add filtering to all multi-series charts (BarChart, PieChart, HeatmapChart)
3. Improve WordCloud with keyword extraction

### Medium Priority
4. Add chart export (SVG/PNG)
5. Implement keyboard navigation
6. Optimize performance for 1000+ responses

### Lower Priority
7. Add accessibility (ARIA, keyboard nav, high contrast)
8. Advanced visualizations (trend analysis, comparisons)

---

**Analysis Date:** November 8, 2025
**App Location:** `/home/user/Critical-Designer-Alphabet/`
**Analysis Depth:** Comprehensive (all 21 components examined)
