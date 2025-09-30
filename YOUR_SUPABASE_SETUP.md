# 🎯 Your Supabase Setup Guide

**Project URL**: https://difwgczqmftehbyohkwe.supabase.co
**Status**: Ready for table creation

## 🚨 **IMPORTANT: Get Your Service Role Key First!**

**You need to get your SERVICE ROLE key from Supabase before proceeding:**

### Step 1: Get Service Role Key
1. Go to your Supabase dashboard: https://difwgczqmftehbyohkwe.supabase.co
2. Click **Settings** in the sidebar
3. Click **API**
4. Find the **Service Role** section
5. Copy the `service_role` key (starts with `eyJhbGc...`)
6. **⚠️ Keep this key secret - it has admin access to your database!**

### Step 2: Update Environment Variables
Replace the `SUPABASE_SERVICE_ROLE` in your `.env` file:

```env
# Replace this line in designeralphabet/.env
SUPABASE_SERVICE_ROLE=your_actual_service_role_key_here
```

## 📋 **Database Setup Steps**

### Step 3: Create Tables
1. Go to your Supabase dashboard
2. Click **SQL Editor** in the sidebar
3. Copy the entire contents of `setup-your-supabase.sql`
4. Paste into the SQL editor
5. Click **Run** to execute

### Step 4: Verify Setup
After running the script, check that these tables were created:
- ✅ `sessions` - Workshop sessions
- ✅ `participants` - Users in sessions
- ✅ `questions` - Workshop prompts
- ✅ `responses` - Participant answers
- ✅ `timeline` - Now/Next/Later items
- ✅ `chat` - Real-time messaging

### Step 5: Test Your Setup
```bash
# Restart Docker with new credentials
docker-compose down
docker-compose up --build

# Test session creation
./create-session.sh
```

## 🧪 **Quick Test**

### Test API Connection:
```bash
curl -X POST http://localhost:3000/api/session/create \
  -H 'Content-Type: application/json' \
  -d '{"code":"TEST001","title":"Connection Test"}'
```

**Expected Response:**
```json
{"success":true,"session":{"code":"TEST001","title":"Connection Test"}}
```

### Test in Browser:
1. Open http://localhost:3000/facilitator
2. Fill out the form:
   - **Your Name**: Test Facilitator
   - **Session Code**: TEST002
   - **Workshop Title**: Browser Test
3. Click **Launch Workshop**
4. Should redirect to session page successfully

## ✅ **Environment Variables Checklist**

Make sure your `designeralphabet/.env` has:

```env
# ✅ Updated Supabase credentials
VITE_SUPABASE_URL=https://difwgczqmftehbyohkwe.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZndnY3pxbWZ0ZWhieW9oa3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTEzODUsImV4cCI6MjA3NDc2NzM4NX0.LWcO-FQe9ijWEW_qzGXoB9DbX8srzEVhYKcIudWZ1gw

# ⚠️ YOU NEED TO GET THIS FROM SUPABASE DASHBOARD
SUPABASE_SERVICE_ROLE=your_service_role_key_here

# ✅ Sanity CMS (already configured)
VITE_SANITY_PROJECT_ID=pctfp1xq
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-09-01
```

## 🔍 **Troubleshooting**

### "Missing Supabase service role key"
- ❌ **Problem**: Service role key not set or incorrect
- ✅ **Solution**: Get the correct service role key from Supabase Settings → API

### "Session creation fails"
- ❌ **Problem**: Database tables don't exist
- ✅ **Solution**: Run `setup-your-supabase.sql` in Supabase SQL Editor

### "Cannot connect to database"
- ❌ **Problem**: Wrong project URL or credentials
- ✅ **Solution**: Double-check URL and keys match your Supabase project

### Tables already exist error
- ❌ **Problem**: Running setup script multiple times
- ✅ **Solution**: This is normal - script uses `IF NOT EXISTS` so it's safe

## 📊 **Verify Your Database**

Run these queries in Supabase SQL Editor to check your setup:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('sessions', 'participants', 'questions', 'responses', 'timeline', 'chat');

-- Check demo data was created
SELECT * FROM sessions WHERE code = 'DEMO123';

-- Check real-time is enabled
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('sessions', 'participants', 'questions', 'responses', 'timeline', 'chat');
```

## 🎉 **When Setup is Complete**

You should be able to:
- ✅ Create workshop sessions via facilitator console
- ✅ Join sessions as participants
- ✅ See real-time updates (participant count, chat, responses)
- ✅ Use all workshop features (voting, timeline, gamification)

## 🆘 **Need Help?**

1. **Check Docker logs**: `docker-compose logs web`
2. **Test connection**: `./create-session.sh`
3. **Verify database**: Run the verification queries above
4. **Check environment**: Ensure service role key is correct

---

**Next Step**: Get your service role key and update the `.env` file! 🔑