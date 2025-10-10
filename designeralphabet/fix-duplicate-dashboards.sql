-- Script to find and optionally fix questions with duplicate dashboard assignments
-- This identifies singleChoice/multiSelect questions that have both barChart and pieChart

-- STEP 1: View questions that have both barChart and pieChart
SELECT
  id,
  room_code,
  text,
  response_type,
  recommended_dashboards
FROM questions
WHERE response_type IN ('singleChoice', 'multiSelect')
  AND recommended_dashboards::jsonb @> '["barChart"]'::jsonb
  AND recommended_dashboards::jsonb @> '["pieChart"]'::jsonb
ORDER BY created_at DESC;

-- STEP 2: Uncomment and run ONE of these updates based on what you want:

-- Option A: Keep only barChart (remove pieChart)
-- UPDATE questions
-- SET recommended_dashboards = '["barChart"]'::jsonb
-- WHERE response_type IN ('singleChoice', 'multiSelect')
--   AND recommended_dashboards::jsonb @> '["barChart"]'::jsonb
--   AND recommended_dashboards::jsonb @> '["pieChart"]'::jsonb;

-- Option B: Keep only pieChart (remove barChart)
-- UPDATE questions
-- SET recommended_dashboards = '["pieChart"]'::jsonb
-- WHERE response_type IN ('singleChoice', 'multiSelect')
--   AND recommended_dashboards::jsonb @> '["barChart"]'::jsonb
--   AND recommended_dashboards::jsonb @> '["pieChart"]'::jsonb;

-- Option C: Update specific question by ID
-- UPDATE questions
-- SET recommended_dashboards = '["pieChart"]'::jsonb
-- WHERE id = 'YOUR_QUESTION_ID_HERE';
