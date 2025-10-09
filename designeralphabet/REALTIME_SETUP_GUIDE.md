# Realtime Setup & Troubleshooting Guide

## Current Status
✅ Realtime code is implemented in the app
✅ Supabase client is configured
❓ Need to verify Realtime is enabled in Supabase database

## How to Enable Realtime in Supabase

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
2. **Navigate to Database → Replication**
3. **Enable Realtime for these tables:**
   - ✅ sessions
   - ✅ participants
   - ✅ responses
   - ✅ questions
   - ✅ timeline
   - ✅ chat
   - ✅ session_phases

4. **Toggle "Enable Realtime" for each table**

### Option 2: Via SQL (if tables exist)

Run this in **SQL Editor**:

```sql
-- Enable Realtime for all session tables
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE responses;
ALTER PUBLICATION supabase_realtime ADD TABLE questions;
ALTER PUBLICATION supabase_realtime ADD TABLE timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE chat;
ALTER PUBLICATION supabase_realtime ADD TABLE session_phases;
```

### Option 3: Run Full Recreation Script

If you need to recreate all tables with Realtime enabled:

1. Go to **SQL Editor** in Supabase
2. Copy contents of `/supabase/migrations/00_RECREATE_ALL_TABLES.sql`
3. Paste and run it
4. This will drop all tables and recreate them with Realtime enabled

## Testing Realtime

### Step 1: Check Console Logs

Open browser console and look for:
- `[Realtime] Subscription status: SUBSCRIBED` ✅ Good
- `[Realtime] Subscription status: CLOSED` ❌ Problem

### Step 2: Test Updates

1. **Open two browser tabs:**
   - Tab 1: Presentation view `/presentation?code=Q6PV1X`
   - Tab 2: Participant view `/session/Q6PV1X`

2. **Submit a response in Tab 2**

3. **Watch console in Tab 1** - should see:
   ```
   [Realtime] Responses updated! {payload details}
   [Realtime] Fetching bundle for session: Q6PV1X
   [Realtime] Bundle received: {...}
   [Presentation Data] {updated counts}
   ```

4. **The presentation view should update immediately** (not wait 30 seconds)

### Step 3: Verify Data Flow

You should see this sequence:
1. User submits response → `/api/responses/add`
2. Database updated → Supabase
3. Realtime event fired → `postgres_changes` callback
4. `fetchBundle()` called → Updates stores
5. UI updates → React to store changes

## Troubleshooting

### Issue: No realtime updates, only polling

**Symptoms:**
- Updates appear every 30 seconds
- Console shows no `[Realtime] Responses updated!` logs
- Only see `[Realtime] Fetching bundle` every 30 seconds

**Solution:**
- Realtime not enabled in database
- Run the SQL from Option 2 above
- Or enable via Dashboard (Option 1)

### Issue: Subscription status CLOSED or ERROR

**Symptoms:**
- Console shows `[Realtime] Subscription status: CLOSED`
- Or `[Realtime] Subscription status: CHANNEL_ERROR`

**Possible causes:**
1. **Realtime not enabled on tables** → Enable via Dashboard
2. **Row Level Security blocking** → Check RLS policies allow SELECT
3. **Supabase plan limit** → Free tier has Realtime limits

**Solution:**
```sql
-- Verify RLS policies allow reading
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('sessions', 'participants', 'responses', 'questions', 'timeline', 'chat', 'session_phases');

-- Should see policies like:
-- "read sessions" | SELECT | true
-- "read participants" | SELECT | true
-- etc.
```

### Issue: Updates work but data doesn't refresh

**Symptoms:**
- Console shows `[Realtime] Responses updated!`
- But UI doesn't update

**Solution:**
- Check browser console for errors in `fetchBundle()`
- Verify `/api/session/${code}` endpoint works
- Check network tab for failed requests

## Current Implementation Details

### Realtime Events Being Listened To:

| Table | Event | Action |
|-------|-------|--------|
| sessions | * (all) | Refetch full bundle |
| participants | * | Refetch full bundle |
| responses | * | Refetch full bundle |
| questions | * | Refetch full bundle |
| timeline | * | Refetch full bundle |
| chat | * | Refetch full bundle |
| session_phases | * | Refetch full bundle |

### Fallback Polling:
- Interval: 30 seconds
- Purpose: Backup if Realtime fails
- Code: `setInterval(() => fetchBundle(code), POLL_INTERVAL * 6)`

### Active Views with Realtime:
✅ Participant Session View (`/session/[code]`)
✅ Presentation View (`/presentation?code=`)

## Next Steps

1. ✅ **Enable Realtime in Supabase** (follow Option 1 or 2 above)
2. ✅ **Test with two browser tabs** (follow Testing steps)
3. ✅ **Watch console logs** to verify events are firing
4. ✅ **Confirm UI updates instantly** when data changes

Once Realtime is enabled in Supabase, all views will update instantly whenever:
- Someone joins the session
- A response is submitted
- A phase is started/completed
- Chat messages are sent
- Timeline entries are added
- Questions are created/updated
- Session status changes
