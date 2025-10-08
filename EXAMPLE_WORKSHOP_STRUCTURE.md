# Example Workshop Structure

This demonstrates the correct hierarchy and flow for workshop templates.

## Structure Overview

```
Workshop Template
└── Phases (sequential stages of the workshop)
    └── Breakout Rounds (timed activities within each phase)
        └── Questions (what participants respond to)
```

## Complete Example: "AI Ethics Workshop"

### Phase 1: Onboarding (15 min)
- **No breakout rounds** - just introduction content
- Participants get oriented, understand the challenge

### Phase 2: Exploration (30 min)

#### Breakout Round 1: "Risk Identification" (15 min)
**Questions:**
1. "What AI risks concern you most?"
   - Response Type: `written` (text + voting)
   - Lens: Risk
   - → Enables dashboards: Heatmap, Roadmap, Overview

2. "How mature is your organization's AI governance?"
   - Response Type: `scale` (0-10 slider)
   - Min Label: "Just starting"
   - Max Label: "Fully established"
   - → Enables dashboards: Overview, Distribution charts

#### Breakout Round 2: "Stakeholder Mapping" (15 min)
**Questions:**
1. "Who is most impacted by this AI system?"
   - Response Type: `written`
   - Lens: Justice
   - → Enables dashboards: Heatmap, Roadmap, Overview

2. "Position your concern on risk vs. impact"
   - Response Type: `landscape` (2D positioning)
   - X Axis: "Personal Risk" (0-10)
   - Y Axis: "Societal Impact" (0-10)
   - → Enables dashboards: Response Landscape

**Available Dashboards for Phase 2:**
- Overview (always available)
- Heatmap (from written questions)
- Roadmap (from written questions with voting)
- Response Landscape (from landscape question)
- Timeline (always available)
- Chat (always available)

### Phase 3: Synthesis (20 min)

#### Breakout Round 1: "Prioritization" (10 min)
**Questions:**
1. "Which risks should we address first?"
   - Response Type: `written`
   - → Voting enabled (participants vote on responses)
   - → Roadmap auto-assigns: High votes → "Now", Medium → "Next", Low → "Later"

#### Breakout Round 2: "Commitments" (10 min)
**Questions:**
1. "What will you do differently?"
   - Response Type: `written`
   - Lens: Agency

**Available Dashboards for Phase 3:**
- Overview
- Heatmap (maturity by lens)
- Roadmap (priority by votes)
- Timeline
- Leaderboard (participation scoring)
- Chat

## How Data Flows Through Visualizations

### 1. Written Response Questions
**Input:** Text + optional lens + voting
**Dashboards:**
- **Overview/Quad Bubbles**: Clusters responses by similarity
- **Heatmap**: Groups by lens (Y-axis) × maturity from votes (X-axis)
- **Roadmap**: Prioritizes by votes → Now (6+) / Next (3-5) / Later (1-2) / Signal (0)

### 2. Scale/Slider Questions
**Input:** Numeric value (0-10)
**Dashboards:**
- **Overview**: Shows distribution/average
- Custom charts could show trends over time

### 3. Landscape Questions
**Input:** X/Y coordinates
**Dashboards:**
- **Response Landscape**: 2D scatter plot with axis labels

### 4. Choice Questions
**Input:** Selected option(s)
**Dashboards:**
- **Overview**: Bar chart of selections
- **Heatmap**: If choices are lens-based

## Key Principles

✅ **Questions determine data structure** - responseType controls what's collected
✅ **Dashboards auto-detect compatibility** - only show if data supports them
✅ **Phases organize narrative flow** - guide participants through stages
✅ **Breakout rounds add timing** - structure activities within phases
✅ **Voting enables prioritization** - transforms responses into roadmap items

## Frontend Behavior

When a phase is active, the frontend:
1. Finds all questions with matching `phase_key`
2. Checks each question's `response_type`
3. Builds available dashboard list:
   ```javascript
   if (responseType === 'written') {
     dashboards.add('heatmap', 'roadmap', 'quadBubbles')
   }
   if (responseType === 'landscape') {
     dashboards.add('response-landscape')
   }
   // Always available:
   dashboards.add('overview', 'timeline', 'chat')
   ```
4. Only shows dashboard tabs that have compatible data

## Creating a New Workshop

1. **Define phases** - What are the stages of your workshop?
2. **Add breakout rounds** - What timed activities happen in each phase?
3. **Choose response types** - How should participants input data?
   - Written → qualitative insights, voting, categorization
   - Scale → quantitative ratings, maturity assessment
   - Landscape → 2D positioning, risk/impact mapping
   - Choices → categorical selection, preferences
4. **Let dashboards emerge** - They auto-configure based on question types!

No need to manually configure dashboards - they intelligently adapt to your data! 🎯
