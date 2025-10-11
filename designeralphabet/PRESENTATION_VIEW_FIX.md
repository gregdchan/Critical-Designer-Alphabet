# Presentation View Fix

## Problem

The presentation view was stuck showing "Waiting for content..." message even when a session was active.

## Root Cause

The `activeBoards` logic had overly strict requirements:

1. **No active phase** → returned empty array `[]`
2. **No recommended dashboards** configured on questions → returned empty array `[]`
3. **Dashboard validation** prevented showing dashboards without responses

This meant:

- New sessions with no responses would show nothing
- Sessions without configured `recommendedDashboards` fields would show nothing
- The presentation view was essentially unusable until:
  - Questions had `recommendedDashboards` configured in Sanity
  - AND responses existed
  - AND dashboards passed validation

## Solution

### Changed Behavior

**Before:**

```typescript
$: activeBoards = (() => {
	if (!activePhase) return normalizeBoards([]); // Empty!

	// Only add if validated
	if (!dashboards.includes(d) && isDashboardValid(d, q, responsesList, phaseQuestions)) {
		dashboards.push(d);
	}

	return normalizeBoards(dashboards); // Often empty!
})();
```

**After:**

```typescript
$: activeBoards = (() => {
	// Always show default boards if no active phase
	if (!activePhase) {
		return normalizeBoards(['phase', 'responses', 'timeline', 'leaderboard']);
	}

	// Add all configured dashboards without validation
	if (!dashboards.includes(d)) {
		dashboards.push(d);
	}

	// Provide sensible defaults if no dashboards configured
	if (dashboards.length === 0) {
		dashboards.push('phase', 'responses', 'timeline', 'leaderboard');
	}

	return normalizeBoards(dashboards);
})();
```

### Key Changes

1. **Default Dashboards**: Always show `['phase', 'responses', 'timeline', 'leaderboard']` when:
   - No active phase exists
   - No dashboards are configured on questions

2. **Removed Validation**: No longer call `isDashboardValid()` before adding dashboards
   - Charts handle their own empty states
   - Better UX to show empty charts than no charts at all

3. **Fallback Behavior**: If questions have no `recommendedDashboards` configured, automatically show default dashboards

## Default Dashboards Explained

### 1. **Phase** (`phase`)

- Shows current phase information
- Phase guidance and description
- What's coming next
- **Layout**: Sidebar

### 2. **Responses** (`responses`)

- QuadBubble visualization of all responses
- Shows ideas clustered by theme
- **Layout**: Main
- **Graceful degradation**: Shows "No responses yet" when empty

### 3. **Timeline** (`timeline`)

- Session activity timeline
- Events and milestones
- **Layout**: Sidebar
- **Always useful**: Shows session start even with no responses

### 4. **Leaderboard** (`leaderboard`)

- Participant engagement rankings
- Gamification element
- **Layout**: Sidebar
- **Graceful degradation**: Shows "Waiting for participation" when empty

## Benefits

✅ **Immediate value**: Presentation view works immediately when session starts
✅ **Better UX**: Shows structure even before responses arrive
✅ **No configuration required**: Works without setting `recommendedDashboards`
✅ **Graceful degradation**: Charts handle empty states themselves
✅ **Flexible**: Questions can still override with custom dashboard selections

## Chart Empty States

Each chart component should handle its own empty state:

```svelte
{#if responses.length === 0}
	<div class="text-center py-12">
		<p class="text-slate-400">Waiting for responses...</p>
	</div>
{:else}
	<!-- Render chart -->
{/if}
```

## Configuration (Optional)

To customize which dashboards appear, set the `recommendedDashboards` field on questions in Sanity:

```typescript
{
  text: "What are your top three risks?",
  recommendedDashboards: ['heatmap', 'roadmap', 'riskImpactMatrix']
}
```

This will **override** the defaults for questions in the active phase.

## Testing

To test the presentation view:

1. Create a new session
2. Navigate to `/presentation?code=YOUR_CODE`
3. Should immediately see default dashboards
4. As responses arrive, charts populate automatically
