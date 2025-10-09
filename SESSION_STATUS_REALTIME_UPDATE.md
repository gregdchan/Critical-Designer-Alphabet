# Session Status-Aware Realtime Updates

## Overview
All three views (session, presentation, and participant) now intelligently update based on session status:
- **Live sessions** (`status: 'live'`): Full Supabase realtime subscriptions with automatic updates
- **Planned sessions** (`status: 'planned'`): Polling-based updates (less frequent)
- **Ended sessions** (`status: 'done'`): Polling-based updates (infrequent) showing final data

## Changes Made

### 1. Core Realtime System (`/src/lib/realtime.ts`)

#### New Variables
- `sessionStatusChannel`: Dedicated channel for monitoring session status changes
- `isRealtimeEnabled`: Tracks whether realtime subscriptions are active

#### Updated Functions

**`setupDataSubscriptions(code: string)`**
- Extracted subscription logic into a separate function
- Subscribes to all data tables (participants, responses, questions, timeline, chat, phases)
- Only called when session status is 'live'

**`setupSessionStatusSubscription(code: string)`**
- New function that monitors the sessions table for status changes
- Automatically enables/disables data subscriptions based on status transitions
- Adjusts polling frequency based on session status:
  - Live: 30 seconds (with realtime subscriptions)
  - Planned/Ended: 2.5 minutes (polling only)

**`startRealtimeSession(code: string)`**
- Now checks session status before setting up subscriptions
- Conditionally enables realtime based on `session.status === 'live'`
- Always subscribes to session status changes to detect transitions

**`stopRealtimeSession()`**
- Cleans up both data and status channels
- Resets `isRealtimeEnabled` flag

### 2. Presentation View (`/routes/presentation/+page.svelte`)

#### New Reactive Variables
```javascript
$: isSessionLive = sessionInfo?.status === 'live';
$: isSessionEnded = sessionInfo?.status === 'done';
$: isSessionPlanned = sessionInfo?.status === 'planned';
```

#### UI Enhancements
- **Status Indicator in Header**: Shows live pulse animation for active sessions
- **Status Banner**: Displays contextual information based on session state:
  - **Live**: Green banner with pulse animation - "Data is updating in real-time"
  - **Ended**: Gray banner - "Session Ended - Showing final results"
  - **Planned**: Cyan banner - "Session hasn't started yet"

### 3. Session View (`/routes/session/[code]/+page.svelte`)

#### New Reactive Variables
```javascript
$: isSessionLive = sessionInfo?.status === 'live';
$: isSessionEnded = sessionInfo?.status === 'done';
$: isSessionPlanned = sessionInfo?.status === 'planned';
```

#### UI Enhancements
- **Status Banner**: Similar to presentation view, displays session state
- Participants see appropriate messages based on session status
- Facilitators can still manage session even when ended

### 4. Chart Components
All realtime chart components already use the `useSupabaseRealtime` hooks, which automatically benefit from the session status-aware behavior:
- `RealtimeBarChart.svelte`
- `RealtimePieChart.svelte`
- `RealtimeLineChart.svelte`
- `QuadBubbles.svelte`
- `ParticipationPulse.svelte`
- `MaturityDial.svelte`
- `InclusivityMeter.svelte`
- `RiskImpactMatrix.svelte`

## Behavior by Session Status

### Live Sessions (`status: 'live'`)
- ✅ Full Supabase realtime subscriptions enabled
- ✅ Instant updates when data changes
- ✅ Backup polling every 30 seconds
- ✅ Green status indicator with pulse animation
- ✅ "Live" badge in UI

### Planned Sessions (`status: 'planned'`)
- 📊 Polling only (no realtime subscriptions)
- 📊 Updates every 2.5 minutes
- 📊 Shows latest data from Supabase
- 📊 Cyan status indicator
- 📊 "Planned" message in UI

### Ended Sessions (`status: 'done'`)
- 📋 Polling only (no realtime subscriptions)
- 📋 Updates every 2.5 minutes (for any late data changes)
- 📋 Shows final data snapshot
- 📋 Gray status indicator
- 📋 "Session Ended" message in UI

## Automatic Status Transitions

The system automatically detects and responds to status changes:

1. **Planned → Live**: 
   - Realtime subscriptions activated
   - Polling frequency increased
   - UI updates to show "Live" status

2. **Live → Done**:
   - Realtime subscriptions disabled
   - Polling frequency reduced
   - UI updates to show "Session Ended" status

3. **Any status change**:
   - All views refresh data immediately
   - UI indicators update automatically
   - No page reload required

## Performance Optimizations

- **Reduced Server Load**: Ended sessions don't maintain realtime connections
- **Efficient Polling**: Frequency adjusted based on session activity level
- **Graceful Degradation**: Falls back to polling if realtime fails
- **Automatic Cleanup**: Subscriptions removed when switching sessions

## Testing Recommendations

1. **Start with Planned Session**:
   - Create a session with status 'planned'
   - Open in presentation view
   - Verify cyan "Planned" banner appears
   - Confirm data loads but doesn't update in realtime

2. **Transition to Live**:
   - Change session status to 'live' (via facilitator controls)
   - Verify green "Live" banner appears automatically
   - Add a response and confirm it appears in real-time

3. **End Session**:
   - Change session status to 'done'
   - Verify gray "Session Ended" banner appears
   - Confirm data still displays correctly

4. **Multi-View Test**:
   - Open session in 3 browser windows (session, presentation, participant)
   - Verify all views show the same status
   - Change status and verify all views update simultaneously

## Known Limitations

- Chart components rely on `useSupabaseRealtime` hooks which maintain their own subscriptions
- The session status subscription runs independently of data subscriptions
- Polling continues even for ended sessions to catch any late updates (by design)

## Future Enhancements

- [ ] Add "Archive" status to completely freeze ended sessions
- [ ] Implement session recording/playback for ended sessions
- [ ] Add visual timeline showing when session transitioned between statuses
- [ ] Export functionality for ended session data
