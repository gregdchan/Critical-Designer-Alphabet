-- Check the current recommended_dashboards values for all questions
SELECT 
  id, 
  text, 
  response_type, 
  recommended_dashboards 
FROM questions 
WHERE room_code = 'YOUR_SESSION_CODE_HERE'
ORDER BY created_at DESC;
