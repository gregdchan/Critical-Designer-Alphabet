-- Migration: Add missing columns to existing Supabase database
-- Run this in your Supabase SQL Editor to fix production database

-- Add missing columns to questions table
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS lens text,
  ADD COLUMN IF NOT EXISTS response_type text,
  ADD COLUMN IF NOT EXISTS map_type text,
  ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS order_index integer,
  ADD COLUMN IF NOT EXISTS recommended_dashboards jsonb DEFAULT '[]'::jsonb;

-- Create index for question ordering
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(room_code, order_index);

-- Create session_phases table if it doesn't exist
CREATE TABLE IF NOT EXISTS session_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code text NOT NULL REFERENCES sessions(code) ON DELETE CASCADE,
  phase_key text,
  title text,
  description text,
  order_index integer,
  duration_minutes integer,
  dashboards jsonb DEFAULT '[]'::jsonb,
  status text CHECK (status IN ('pending', 'active', 'completed')) DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for session_phases
CREATE INDEX IF NOT EXISTS idx_session_phases_session_code ON session_phases(session_code);
CREATE INDEX IF NOT EXISTS idx_session_phases_order ON session_phases(session_code, order_index);
CREATE INDEX IF NOT EXISTS idx_session_phases_status ON session_phases(status);

-- Enable real-time for session_phases
ALTER PUBLICATION supabase_realtime ADD TABLE session_phases;

-- Add RLS policies for session_phases
ALTER TABLE session_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_phases_select" ON session_phases FOR SELECT USING (true);
CREATE POLICY "session_phases_insert" ON session_phases FOR INSERT WITH CHECK (true);
CREATE POLICY "session_phases_update" ON session_phases FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "session_phases_delete" ON session_phases FOR DELETE USING (true);
