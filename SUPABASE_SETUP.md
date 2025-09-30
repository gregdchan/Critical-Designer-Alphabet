# 🚀 Supabase Database Setup Guide

This guide will help you set up the complete database schema for the Critical Designer Alphabet workshop platform.

## 📋 Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **New Project**: Create a new Supabase project
3. **Environment Variables**: Note down your project URL and keys

## 🗄️ Database Setup

### Step 1: Run the Schema Script

1. Open your Supabase project dashboard
2. Go to **SQL Editor** in the sidebar
3. Copy and paste the contents of `supabase-setup.sql`
4. Click **Run** to execute the script

### Step 2: Verify Tables Created

After running the script, you should see these tables in your **Table Editor**:

- ✅ `sessions` - Workshop sessions
- ✅ `participants` - Users in sessions
- ✅ `questions` - Workshop prompts
- ✅ `responses` - Participant answers
- ✅ `timeline` - Now/Next/Later roadmap
- ✅ `chat` - Real-time messaging

### Step 3: Configure Environment Variables

Update your `.env` file with your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key

# Sanity Configuration
VITE_SANITY_PROJECT_ID=your-project-id
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-09-01
```

## 🔍 Database Schema Overview

### Core Tables

#### `sessions`
```sql
code text PRIMARY KEY          -- Session join code (e.g., "ABC123")
title text                     -- Workshop title
template_slug text             -- Sanity template reference
status text                    -- 'planned' | 'live' | 'done'
created_at timestamptz         -- Creation timestamp
```

#### `participants`
```sql
id uuid PRIMARY KEY            -- Unique participant ID
room_code text                 -- References sessions(code)
name text                      -- Participant display name
role text                      -- 'facilitator' | 'participant'
color text                     -- Avatar color (hex code)
points int                     -- Gamification points
badges jsonb                   -- Earned badges array
created_at timestamptz         -- Join timestamp
```

#### `questions`
```sql
id uuid PRIMARY KEY            -- Unique question ID
room_code text                 -- References sessions(code)
section text                   -- Question category/section
text text                      -- Question content
created_at timestamptz         -- Creation timestamp
```

#### `responses`
```sql
id uuid PRIMARY KEY            -- Unique response ID
room_code text                 -- References sessions(code)
question_id uuid              -- References questions(id)
participant_id uuid           -- References participants(id)
text text                      -- Response content
cards jsonb                    -- Linked design cards
votes int                      -- Vote count
created_at timestamptz         -- Response timestamp
```

#### `timeline`
```sql
id uuid PRIMARY KEY            -- Unique timeline item ID
room_code text                 -- References sessions(code)
label text                     -- 'Now' | 'Next' | 'Later'
item_text text                 -- Timeline item content
owner text                     -- Responsible person
metric text                    -- Success metric
risk_note text                 -- Risk assessment
created_at timestamptz         -- Creation timestamp
```

#### `chat`
```sql
id uuid PRIMARY KEY            -- Unique message ID
room_code text                 -- References sessions(code)
participant_id uuid           -- References participants(id)
message text                   -- Chat message content
created_at timestamptz         -- Message timestamp
```

## 🔒 Security Features

### Row Level Security (RLS)
- **Enabled** on all tables
- **Open policies** for workshop functionality
- **Secure by default** with service role authentication

### Real-time Subscriptions
- **Live updates** for all table changes
- **WebSocket integration** for instant collaboration
- **Automatic sync** across all connected clients

## 🧪 Testing Your Setup

### 1. Test Session Creation
```bash
curl -X POST http://localhost:3000/api/session/create \
  -H 'Content-Type: application/json' \
  -d '{"code":"DEMO123","title":"Test Workshop"}'
```

### 2. Check Database
Go to your Supabase **Table Editor** and verify:
- New session appears in `sessions` table
- Data matches your test input

### 3. Test Real-time Features
1. Create a session via facilitator console
2. Join as participant in another browser
3. Send chat messages and responses
4. Verify live updates appear instantly

## 🔧 Troubleshooting

### Common Issues

#### "Missing Supabase service role key"
- ✅ Verify `SUPABASE_SERVICE_ROLE` in your `.env` file
- ✅ Restart Docker containers after env changes
- ✅ Check Docker environment variable passing

#### "Session creation fails"
- ✅ Check Supabase project URL is correct
- ✅ Verify service role key has proper permissions
- ✅ Ensure database schema is fully created

#### "Real-time not working"
- ✅ Verify real-time is enabled in Supabase dashboard
- ✅ Check WebSocket connection in browser dev tools
- ✅ Ensure RLS policies allow reads

### Useful SQL Queries

```sql
-- Check all sessions
SELECT * FROM sessions ORDER BY created_at DESC;

-- Check session activity
SELECT
  s.code,
  s.title,
  COUNT(DISTINCT p.id) as participants,
  COUNT(DISTINCT r.id) as responses
FROM sessions s
LEFT JOIN participants p ON s.code = p.room_code
LEFT JOIN responses r ON s.code = r.room_code
GROUP BY s.code, s.title;

-- Clear test data
DELETE FROM sessions WHERE code LIKE 'TEST%';
```

## ✅ Success Checklist

- [ ] Supabase project created
- [ ] Database schema executed successfully
- [ ] Environment variables configured
- [ ] Docker containers restarted
- [ ] Test session creation works
- [ ] Real-time features functional
- [ ] Multiple users can join sessions
- [ ] Chat and responses sync live

## 🆘 Need Help?

If you encounter issues:

1. **Check Logs**: `docker-compose logs web`
2. **Verify Schema**: Use the verification queries in `supabase-setup.sql`
3. **Test Connection**: Use the troubleshooting script `./create-session.sh`
4. **Supabase Dashboard**: Check logs in your Supabase project

Your workshop platform should now be fully functional with persistent storage and real-time collaboration! 🎉