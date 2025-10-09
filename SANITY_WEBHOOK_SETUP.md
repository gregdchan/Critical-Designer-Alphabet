# Sanity Webhook Setup Guide

This guide explains how to set up automatic syncing from Sanity CMS to Supabase, so that changes to questions (including chart configurations) update live sessions in real-time.

## Overview

When you update a question in Sanity and publish it, the changes need to sync to Supabase so that:
1. The Supabase realtime subscription detects the change
2. Connected clients (presentation views, facilitator panels) automatically refetch data
3. Charts update instantly with new configurations

## Setup Steps

### 1. Add Webhook Secret to Environment Variables

Add to your `.env` file:

```bash
# Sanity Webhook Secret (generate a random string)
SANITY_WEBHOOK_SECRET=your-secret-key-here
```

Generate a secure secret:
```bash
openssl rand -hex 32
```

### 2. Configure Webhook in Sanity Studio

1. Log into your Sanity project
2. Go to **Manage** > **API** > **Webhooks**
3. Click **Create webhook**
4. Configure:
   - **Name**: `Supabase Sync`
   - **URL**: `https://your-domain.com/api/sanity/webhook`
   - **Dataset**: Your dataset name (e.g., `production`)
   - **Trigger on**: `Create`, `Update`, `Delete`
   - **Filter**: `_type == "question"` (only sync questions)
   - **Projection**: Leave empty (sends full document)
   - **HTTP method**: `POST`
   - **HTTP headers**: None needed
   - **Secret**: Paste the same secret from your `.env` file
   - **API version**: `v2021-10-21` or later

5. Click **Save**

### 3. Test the Webhook

#### Option A: Test from Sanity Studio

1. Open any question document in Sanity
2. Make a small change to `recommendedDashboards` field
3. Click **Publish**
4. Check your application logs for:
   ```
   [Sanity Webhook] Received: { type: 'question', id: '...', rev: '...' }
   [Sanity Webhook] Updating question: ...
   [Sanity Webhook] Question updated successfully
   ```

#### Option B: Test with curl

```bash
curl -X POST https://your-domain.com/api/sanity/webhook \
  -H "Content-Type: application/json" \
  -H "sanity-webhook-signature: $(echo -n '{"_type":"question","_id":"test","text":"Test"}' | openssl dgst -sha256 -hmac "your-secret-key-here" | cut -d' ' -f2)" \
  -d '{"_type":"question","_id":"test","text":"Test","sessionCode":"TEST123","recommendedDashboards":["barChart","pieChart"]}'
```

### 4. Verify in Your App

1. Open a live session presentation view
2. Update a question's `recommendedDashboards` in Sanity
3. Publish the change
4. The presentation view should automatically update (no refresh needed)

## How It Works

### Data Flow

```
Sanity Studio
    ↓ (publish)
Sanity Webhook Triggers
    ↓ (HTTP POST)
/api/sanity/webhook endpoint
    ↓ (validates & processes)
Supabase questions table UPDATE
    ↓ (realtime subscription)
Connected Clients Refetch
    ↓
Charts Update Automatically
```

### Webhook Payload Structure

Sanity sends a payload like:

```json
{
  "_type": "question",
  "_id": "question-123",
  "_rev": "abc123",
  "text": "What are your main concerns?",
  "section": "Risk Identification",
  "sessionCode": "ABC123",
  "responseType": "multiSelect",
  "phaseKey": "discover",
  "recommendedDashboards": ["barChart", "pieChart"],
  "lens": "Risk",
  "enableVoting": true,
  "mapType": null,
  "config": {
    "options": ["Option A", "Option B", "Option C"]
  },
  "orderIndex": 1
}
```

### Field Mapping

| Sanity Field | Supabase Column | Notes |
|--------------|-----------------|-------|
| `text` | `text` | Question text |
| `section` | `section` | Section/category |
| `sessionCode` | `room_code` | Session code |
| `responseType` | `response_type` | Type of response expected |
| `phaseKey` | `phase_key` | Which phase this belongs to |
| `recommendedDashboards` | `recommended_dashboards` | **Chart types to display** |
| `lens` | `lens` | Critical design lens |
| `enableVoting` | `enable_voting` | Whether voting is enabled |
| `mapType` | `map_type` | Special map type (landscape, etc) |
| `config` | `config` | JSONB configuration |
| `orderIndex` | `order_index` | Display order |

## Updating Chart Configurations

### Example: Change from Bar Chart to Pie Chart

1. Open the question in Sanity Studio
2. Find the `Recommended Dashboards` field
3. Change from `["barChart"]` to `["pieChart"]`
4. Click **Publish**
5. The webhook automatically updates Supabase
6. Realtime subscription fires
7. Presentation view refetches and shows pie chart

### Supported Dashboard Types

- `barChart` - Horizontal bar chart (for choice questions)
- `pieChart` - Pie/donut chart (for choice questions)
- `lineChart` - Line chart (for scale/rating questions)
- `heatmap` - Heat map (for text responses)
- `wordcloud` - Word cloud (for open text)
- `quadBubbles` - Quad bubble chart (for categorized responses)
- `landscape` - 2D positioning landscape
- `roadmap` - Timeline/roadmap view

## Security

### Signature Verification

The webhook endpoint verifies that requests actually come from Sanity by:
1. Taking the raw request body
2. Computing HMAC-SHA256 with your secret key
3. Comparing with the `sanity-webhook-signature` header

If signatures don't match, the request is rejected with 401.

### Disable Verification (Dev Only)

For local development, you can skip signature verification:
1. Don't set `SANITY_WEBHOOK_SECRET` in `.env`
2. The endpoint will log a warning but process requests

**⚠️ Never do this in production!**

## Troubleshooting

### Webhook Not Triggering

1. Check webhook is enabled in Sanity
2. Verify the URL is accessible from internet
3. Check Sanity webhook logs for delivery failures
4. Ensure `_type == "question"` filter is correct

### Signature Verification Fails

1. Verify secret matches exactly in both Sanity and `.env`
2. Check for extra whitespace in secret
3. Regenerate secret if needed

### Questions Not Updating

1. Check application logs for webhook errors
2. Verify `sessionCode` field exists on question
3. Check Supabase permissions allow updates
4. Ensure `room_code` matches existing session

### Charts Don't Update After Publish

1. Verify webhook fired successfully (check logs)
2. Check browser console for realtime connection status
3. Ensure `recommended_dashboards` is array, not string
4. Try refreshing the page manually

## Environment Variables Summary

```bash
# Required for webhook
SANITY_WEBHOOK_SECRET=your-secret-here

# Required for Sanity client (already configured)
VITE_SANITY_PROJECT_ID=your-project-id
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-09-01

# Required for Supabase (already configured)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Testing Checklist

- [ ] Webhook created in Sanity with correct URL
- [ ] Secret configured in both Sanity and `.env`
- [ ] Test question published successfully
- [ ] Webhook logs show successful delivery
- [ ] Application logs show successful processing
- [ ] Supabase question record updated
- [ ] Presentation view updates without refresh

## Advanced: Manual Sync

If you need to manually sync questions without waiting for publishes:

```typescript
// In your code or API endpoint
import sanityClient from '$lib/sanity';
import { supabaseAdmin } from '$lib/server/supabase';

async function syncQuestionsFromSanity(sessionCode: string) {
  // Fetch questions from Sanity
  const questions = await sanityClient.fetch(`
    *[_type == "question" && sessionCode == $sessionCode] {
      _id,
      text,
      section,
      responseType,
      phaseKey,
      recommendedDashboards,
      lens,
      enableVoting,
      mapType,
      config,
      orderIndex
    }
  `, { sessionCode });

  // Upsert to Supabase
  for (const q of questions) {
    await supabaseAdmin.from('questions').upsert({
      room_code: sessionCode,
      text: q.text,
      section: q.section,
      response_type: q.responseType,
      phase_key: q.phaseKey,
      recommended_dashboards: q.recommendedDashboards,
      lens: q.lens,
      enable_voting: q.enableVoting,
      map_type: q.mapType,
      config: q.config,
      order_index: q.orderIndex
    }, { onConflict: 'room_code,text' });
  }
}
```
