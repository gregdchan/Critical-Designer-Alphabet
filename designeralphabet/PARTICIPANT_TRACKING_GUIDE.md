# Participant Tracking & Reconnection Guide

## Overview

The system now supports **cross-session participant tracking** using email and device IDs. This allows participants to:
- ✅ Reconnect to sessions without losing their stats
- ✅ Track contributions across multiple sessions
- ✅ Maintain their scores even if they drop off
- ✅ Automatically rejoin as the same participant

---

## Implementation Summary

### **1. Database Migration**

Created: `/supabase/migrations/20251008000100_add_participant_tracking.sql`

```sql
ALTER TABLE participants
ADD COLUMN email VARCHAR(255),
ADD COLUMN device_id VARCHAR(255);

-- Indexes for performance
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_device_id ON participants(device_id);

-- Prevent duplicate participants per session
CREATE UNIQUE INDEX idx_participants_email_room ON participants(email, room_code)
WHERE email IS NOT NULL;
```

### **2. TypeScript Interfaces Updated**

**Files:**
- `/src/lib/server/workshop.ts:44-55`
- `/src/lib/gamification.ts:1-12`

```typescript
export interface Participant {
  id: string;
  room_code: string;
  name: string;
  role: 'facilitator' | 'participant';
  color: string;
  points: number;
  badges: string[];
  email?: string | null;        // NEW: For cross-session tracking
  device_id?: string | null;    // NEW: Browser fingerprint fallback
  created_at: string;
}
```

### **3. Device ID Utility**

Created: `/src/lib/utils/device.ts`

Generates a stable browser-specific ID stored in localStorage:
```typescript
import { getOrCreateDeviceId } from '$lib/utils/device';

const deviceId = getOrCreateDeviceId();
// Returns: "device_1696800000000_abc123xyz"
```

### **4. Reconnection Logic**

**File:** `/src/lib/server/workshop.ts:389-460`

```typescript
export async function addParticipant({
  code, name, role, color,
  email,      // NEW
  deviceId    // NEW
}) {
  // 1. Check if participant exists by email
  if (email) {
    const existing = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('room_code', code)
      .eq('email', email)
      .maybeSingle();

    if (existing.data) {
      console.log('[addParticipant] Reconnecting via email');
      return asParticipant(existing.data);
    }
  }

  // 2. Check by device_id as fallback
  if (deviceId) {
    const existing = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('room_code', code)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (existing.data) {
      console.log('[addParticipant] Reconnecting via device ID');
      return asParticipant(existing.data);
    }
  }

  // 3. Create new participant
  const response = await supabaseAdmin
    .from('participants')
    .insert({
      room_code: code,
      name, role, color,
      email: email || null,
      device_id: deviceId || null
    })
    .select()
    .single();

  return asParticipant(ensure(response, 'addParticipant'));
}
```

### **5. API Endpoint Updated**

**File:** `/src/routes/api/participants/join/+server.ts:5-31`

```typescript
export const POST: RequestHandler = async ({ request }) => {
  const { code, name, role, color, email, deviceId } = await request.json();

  const participant = await addParticipant({
    code, name, role, color,
    email: email || undefined,
    deviceId: deviceId || undefined
  });

  return json({ success: true, participant });
};
```

### **6. Join Page Updates**

**File:** `/src/routes/join/+page.svelte:265-298`

```typescript
const deviceId = getOrCreateDeviceId();

const response = await fetch('/api/participants/join', {
  method: 'POST',
  body: JSON.stringify({
    code: uppercaseCode,
    name: participantName,
    role: 'participant',
    color: selectedColor,
    email: participantEmail.trim() || undefined,  // NEW
    deviceId: deviceId || undefined                // NEW
  })
});

const profile = {
  id: data.participant.id,
  participantId: data.participant.id,
  sessionCode: uppercaseCode,
  name: participantName,
  email: participantEmail.trim() || undefined,    // NEW
  role: 'participant',
  color: selectedColor,
  deviceId: deviceId || undefined                  // NEW
};

currentUser.set(profile);
storeParticipantProfile(uppercaseCode, profile);
```

---

## How It Works

### **Scenario 1: First-time Join**
1. User visits `/join?code=ABC123`
2. Enters name: "Alice"
3. (Optional) Enters email: "alice@example.com"
4. System generates device ID: `device_1696800000000_xyz`
5. Creates new participant record with email + device_id
6. Stores profile in localStorage
7. User can now participate

### **Scenario 2: Reconnection via Email**
1. User drops off and visits `/join?code=ABC123` again
2. Enters name: "Alice" (could be different)
3. Enters email: "alice@example.com" (SAME as before)
4. System finds existing participant by email
5. **Returns existing participant record** (preserves stats!)
6. User continues with same ID, points, badges

### **Scenario 3: Reconnection via Device ID**
1. User drops off (didn't provide email)
2. Visits `/join?code=ABC123` from SAME browser
3. System reads device ID from localStorage: `device_1696800000000_xyz`
4. Finds existing participant by device_id
5. **Returns existing participant record**
6. User continues with preserved stats

### **Scenario 4: New Session, Same Email**
1. User joins session "ABC123" with email "alice@example.com"
2. Later joins session "XYZ789" with same email
3. System creates NEW participant for XYZ789
4. Can track Alice's participation across both sessions via email

---

## UI Addition Needed

To complete this feature, add an email input field to `/src/routes/join/+page.svelte`:

```svelte
<!-- After the "Your Name" field -->
{#if !joinAsFacilitator}
  <div>
    <label for="participantEmail" class="block text-sm font-medium text-secondary mb-2">
      Email (Optional)
    </label>
    <input
      id="participantEmail"
      type="email"
      bind:value={participantEmail}
      placeholder="you@example.com (optional)"
      class="w-full px-4 py-3 surface-input border border-line rounded-lg..."
    />
    <p class="mt-2 text-xs text-secondary">
      📧 Optional: Add your email to reconnect if you drop off and track stats across sessions.
    </p>
  </div>
{/if}
```

---

## Testing

### **Test Reconnection by Email:**
1. Join session with email: `test@example.com`
2. Submit a response (note your points)
3. Leave session (close tab)
4. Join again with same email
5. ✅ Should show same participant ID and points

### **Test Reconnection by Device ID:**
1. Join session WITHOUT email
2. Submit a response (note your points)
3. Leave session
4. Join again from SAME browser
5. ✅ Should reconnect automatically

### **Test Cross-Session Tracking:**
1. Join Session A with email
2. Join Session B with same email
3. ✅ Different participant IDs (one per session)
4. Query database for email to see both sessions

---

## Database Query Examples

### Find all sessions a participant joined:
```sql
SELECT p.*, s.code, s.title
FROM participants p
JOIN sessions s ON p.room_code = s.code
WHERE p.email = 'alice@example.com'
ORDER BY p.created_at DESC;
```

### See participant's total contributions:
```sql
SELECT p.email, p.name, COUNT(r.id) as total_responses
FROM participants p
LEFT JOIN responses r ON r.participant_id = p.id
WHERE p.email = 'alice@example.com'
GROUP BY p.email, p.name;
```

---

## Security & Privacy

### ✅ **Privacy Considerations:**
- Email is **optional** - participants can join anonymously
- Device ID is browser-specific, not personally identifiable
- Email is stored but **not displayed** publicly
- Use hashed device IDs for production

### ✅ **GDPR Compliance:**
- Add privacy policy link to join page
- Allow users to request data deletion
- Don't share emails with third parties
- Inform users how data is used

### 🔒 **Recommended Additions:**
```typescript
// Hash device ID for privacy
import { createHash } from 'crypto';

function getOrCreateDeviceId(): string {
  const rawId = `${navigator.userAgent}_${screen.width}_${screen.height}`;
  const hash = createHash('sha256').update(rawId).digest('hex');
  return `device_${hash.substring(0, 16)}`;
}
```

---

## Benefits

✅ **User Experience:**
- Seamless reconnection without losing progress
- Works even without email (device ID fallback)
- Maintains gamification progress

✅ **Analytics:**
- Track participant engagement across sessions
- Identify power users by email
- Analyze participation patterns

✅ **Reliability:**
- Handles network drops gracefully
- Prevents duplicate participants
- Preserves session integrity

---

## Next Steps

1. **Run the migration:**
   ```bash
   cd supabase
   npx supabase db push
   ```

2. **Add email field to join page UI** (see above)

3. **Test reconnection flow** thoroughly

4. **Add privacy policy link** to join page

5. **Monitor logs** for reconnection events:
   ```
   [addParticipant] Reconnecting via email: user123
   [addParticipant] Reconnecting via device ID: device_abc123
   ```

---

## Summary

🎉 **Participants can now:**
- Provide optional email for cross-session tracking
- Automatically reconnect via device ID
- Maintain stats even after dropping off
- Track contributions across multiple sessions

All changes are backward compatible - existing participants without email/device_id will continue to work normally.
