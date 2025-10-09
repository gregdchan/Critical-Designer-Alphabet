# Critical Designer Alphabet - Complete System Architecture

## Overview
This document provides a comprehensive view of how all components work together in the Critical Designer Alphabet application.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                            │
│  Tables: sessions, participants, questions, responses,               │
│          timeline, chat, session_phases                              │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      │ Postgres Changes Events
                      ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPABASE REALTIME LAYER                          │
│  • Broadcasts INSERT, UPDATE, DELETE events                          │
│  • Filters by room_code                                              │
│  • Session status monitoring                                         │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      │ WebSocket Subscriptions
                      ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    REALTIME MANAGEMENT LAYER                         │
│  /src/lib/realtime.ts                                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ setupSessionStatusSubscription()                             │    │
│  │ • Monitors session.status changes                           │    │
│  │ • Triggers subscription enable/disable                      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ setupDataSubscriptions() [Conditional]                       │    │
│  │ • Active only when status === 'live'                        │    │
│  │ • Subscribes to: participants, questions, responses,        │    │
│  │   timeline, chat, session_phases                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Polling Fallback                                             │    │
│  │ • Live: 30 sec intervals                                    │    │
│  │ • Planned/Done: 2.5 min intervals                           │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      │ Stores (Writable/Derived)
                      ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        SVELTE STORES                                 │
│  sessionDetails, participants, questions, responses,                 │
│  timeline, chat, phases, leaderboard                                 │
└────────┬──────────────────────────────────────────┬─────────────────┘
         │                                          │
         │                                          │
         ↓                                          ↓
┌─────────────────────────┐         ┌──────────────────────────────┐
│   SUPABASE HOOKS        │         │    CHART DATA STORES         │
│   useSupabaseRealtime   │         │    /stores/charts.ts         │
│   ├─ useResponses       │         │    ├─ getPhaseCharts()      │
│   ├─ useQuestions       │         │    ├─ activePhaseCharts     │
│   ├─ useParticipants    │         │    ├─ getChartType()        │
│   ├─ useTimeline        │         │    └─ sessionSummary        │
│   └─ useChat            │         └──────────────────────────────┘
└────────┬────────────────┘
         │
         │ setState Callbacks
         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    REALTIME CHART WRAPPERS                           │
│  /components/charts/Realtime*.svelte                                 │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────┐ │
│  │ RealtimeBarChart  │  │ RealtimePieChart  │  │ RealtimeLineChart│ │
│  │ • useResponses()  │  │ • useResponses()  │  │ • useResponses() │ │
│  │ • useQuestions()  │  │ • useQuestions()  │  │ • useQuestions() │ │
│  │ • Transform data  │  │ • Transform data  │  │ • Transform data │ │
│  └────────┬──────────┘  └────────┬──────────┘  └────────┬────────┘ │
└───────────┼─────────────────────┼─────────────────────┼────────────┘
            │                     │                     │
            │ Props (data)        │                     │
            ↓                     ↓                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     D3 CHART COMPONENTS                              │
│  /components/charts/*.svelte                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  BarChart    │  │  PieChart    │  │  LineChart   │              │
│  │  • D3 Scales │  │  • D3 Arcs   │  │  • D3 Lines  │              │
│  │  • D3 Bars   │  │  • D3 Legend │  │  • D3 Area   │              │
│  │  • Gradients │  │  • Hover FX  │  │  • Tooltips  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ HeatmapChart │  │ RoadmapChart │  │WordCloudChart│              │
│  │ • 2D Matrix  │  │ • Swimlanes  │  │ • Text Freq  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Immersive Charts Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                   IMMERSIVE CHART COMPONENTS                         │
│  /lib/charts/*.svelte                                                │
│  (Self-contained with integrated realtime)                           │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ QuadBubbles.svelte                                            │  │
│  │ • useResponses(roomCode) → responses[]                        │  │
│  │ • D3 Force Simulation                                         │  │
│  │ • Group by lens → bubbles                                     │  │
│  │ • Force positioning                                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ ParticipationPulse.svelte                                     │  │
│  │ • useResponses(roomCode) → timeline                           │  │
│  │ • D3 Line/Area charts                                         │  │
│  │ • Engagement over time                                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ MaturityDial.svelte                                           │  │
│  │ • useResponses(roomCode) → scores                             │  │
│  │ • D3 Arc/Gauge rendering                                      │  │
│  │ • Progress visualization                                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ InclusivityMeter.svelte                                       │  │
│  │ • useParticipants(roomCode) → participation                   │  │
│  │ • Fairness calculation                                        │  │
│  │ • D3 Gauge                                                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ RiskImpactMatrix.svelte                                       │  │
│  │ • useResponses(roomCode) → risk data                          │  │
│  │ • 2D scatter plot (risk vs impact)                            │  │
│  │ • Quadrant visualization                                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Application Views

### 1. Presentation View (`/presentation`)
```
┌──────────────────────────────────────────────────────────────────┐
│                     PRESENTATION DASHBOARD                        │
├──────────────────────────────────────────────────────────────────┤
│  Header: Session info, status indicator, participant count       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Status Banner (Live/Planned/Ended)                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Phase Navigation (tabs)                                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Main Column                        │  Sidebar                   │
│  ┌──────────────────────────────┐   │  ┌──────────────────────┐ │
│  │ PhaseCharts                  │   │  │ Session Dashboard    │ │
│  │ • Per-question charts        │   │  └──────────────────────┘ │
│  │ • Auto chart type selection  │   │  ┌──────────────────────┐ │
│  └──────────────────────────────┘   │  │ Phase Info           │ │
│  ┌──────────────────────────────┐   │  │ • Cards              │ │
│  │ HeatmapChart                 │   │  │ • Description        │ │
│  └──────────────────────────────┘   │  └──────────────────────┘ │
│  ┌──────────────────────────────┐   │  ┌──────────────────────┐ │
│  │ RoadmapChart                 │   │  │ Leaderboard          │ │
│  └──────────────────────────────┘   │  └──────────────────────┘ │
│  ┌──────────────────────────────┐   │  ┌──────────────────────┐ │
│  │ QuadBubbles                  │   │  │ Timeline             │ │
│  └──────────────────────────────┘   │  └──────────────────────┘ │
│  ┌──────────────────────────────┐   │  ┌──────────────────────┐ │
│  │ ParticipationPulse           │   │  │ Chat Feed            │ │
│  └──────────────────────────────┘   │  └──────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 2. Session View (`/session/[code]`)
```
┌──────────────────────────────────────────────────────────────────┐
│                      SESSION WORKSPACE                            │
├──────────────────────────────────────────────────────────────────┤
│  Header: Session title, code, participant info                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Status Banner (Live/Planned/Ended)                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Participant View:                                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Active Phase Info                                          │  │
│  │ • Phase questions                                          │  │
│  │ • Response inputs                                          │  │
│  │ • Responses with voting                                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Facilitator View (additional):                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Session Progress                                           │  │
│  │ • Status controls (Planned → Live → Done)                 │  │
│  │ • Phase management                                         │  │
│  │ • Phase activation/completion                              │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Tabs: Overview, Charts, Timeline, Chat, Participants      │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Examples

### Example 1: Adding a Response
```
1. User submits response in Session View
   ↓
2. POST /api/responses/add
   ↓
3. addResponse() in /lib/server/workshop.ts
   ↓
4. INSERT into Supabase responses table
   ↓
5. Supabase triggers postgres_changes event
   ↓
6. IF session.status === 'live':
      → Realtime subscription receives event
      → fetchBundle() called
      → responses store updated
      → All subscribed components re-render
   ELSE:
      → Next polling interval (2.5 min) fetches data
   ↓
7. Charts update:
   • RealtimeBarChart sees new responses
   • Transforms data for BarChart
   • BarChart re-renders with D3 animation
```

### Example 2: Session Status Change
```
1. Facilitator clicks "Live" button
   ↓
2. POST /api/session/status { code, status: 'live' }
   ↓
3. UPDATE sessions SET status='live'
   ↓
4. sessionStatusChannel receives UPDATE event
   ↓
5. setupSessionStatusSubscription handler fires:
   • Calls setupDataSubscriptions()
   • Enables realtime for all data tables
   • Changes poll interval to 30 sec
   • Updates UI status indicator
   ↓
6. All views see status change:
   • Green "Live" banner appears
   • Realtime subscriptions activate
   • Charts start updating in real-time
```

### Example 3: Phase Transition
```
1. Facilitator activates Phase 2
   ↓
2. POST /api/session/phase { code, phaseKey, action: 'start' }
   ↓
3. Server updates:
   • session_phases SET status='active' WHERE phase_key='phase2'
   • session_phases SET status='completed' WHERE phase_key='phase1'
   • sessions SET active_phase_key='phase2'
   ↓
4. Realtime events trigger:
   • session_phases table update
   • sessions table update
   ↓
5. Stores update:
   • phases store gets new data
   • sessionDetails store gets new active_phase_key
   ↓
6. Views re-render:
   • Presentation: PhaseCharts switches to Phase 2 questions
   • Session: Active phase banner updates
   • Charts: Filter data by phase_key='phase2'
```

---

## 🎯 Performance Optimizations

### Realtime Management
- **Session Status Awareness**: Only subscribe to realtime when session is live
- **Conditional Polling**: Adjust frequency based on session status
- **Channel Cleanup**: Properly remove channels when switching sessions

### Chart Rendering
- **Throttled Updates**: Chart data updates throttled to ~10fps (100ms)
- **Reactive Filtering**: Svelte reactive statements for efficient data transformation
- **D3 Transitions**: Smooth animations with enter/update/exit patterns

### Data Loading
- **Parallel Fetches**: API endpoint fetches all tables in parallel
- **Joined Queries**: Supabase joins reduce round trips
- **Selective Subscriptions**: Only subscribe to tables needed for current view

---

## 🔐 Security Notes

- **Server-Side Operations**: All database writes go through API endpoints
- **Admin Client**: `/lib/server/workshop.ts` uses `supabaseAdmin` for privileged operations
- **Client Filtering**: Realtime subscriptions filtered by `room_code`
- **Participant Auth**: Participant profiles stored in localStorage with session validation

---

## 🚀 Quick Start Guide

### To View Realtime Charts:
1. Create a session with status `'live'`
2. Add questions to the session
3. Open `/presentation?sessionCode=YOUR_CODE`
4. Add responses from `/session/YOUR_CODE`
5. Watch charts update in real-time

### To Test Status Transitions:
1. Open presentation in one browser
2. Open session (as facilitator) in another
3. Change status from Planned → Live → Done
4. Observe UI changes and realtime behavior

### To Inspect Data Flow:
1. Open browser DevTools
2. Go to Console tab
3. Look for `[Realtime]` logs
4. Network tab shows:
   - Initial API fetch
   - WebSocket connection (when live)
   - Polling requests (all statuses)

---

## 📚 Documentation Files

- `REALTIME_CHARTS_IMPLEMENTATION.md` - Chart implementation details
- `SESSION_STATUS_REALTIME_UPDATE.md` - Status-aware realtime behavior
- `CHARTS_AND_DATA_FLOW_VERIFICATION.md` - Component verification (this file)

---

**Status**: ✅ All systems operational and ready to populate with data!
