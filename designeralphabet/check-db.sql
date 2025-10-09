-- Quick database diagnostic
-- Run this in Supabase SQL Editor to see what data exists

SELECT 'Sessions' as table_name, COUNT(*) as count FROM sessions
UNION ALL
SELECT 'Participants', COUNT(*) FROM participants
UNION ALL
SELECT 'Questions', COUNT(*) FROM questions
UNION ALL
SELECT 'Responses', COUNT(*) FROM responses
UNION ALL
SELECT 'Phases', COUNT(*) FROM session_phases;

-- Check specific session
SELECT * FROM sessions WHERE code = 'Q6PV1X';
SELECT * FROM session_phases WHERE session_code = 'Q6PV1X';
SELECT * FROM questions WHERE room_code = 'Q6PV1X';
SELECT * FROM participants WHERE room_code = 'Q6PV1X';
