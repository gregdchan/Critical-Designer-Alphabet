-- Add enable_voting column to questions table
-- This allows facilitators to control whether voting is enabled for each question

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS enable_voting BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN questions.enable_voting IS 'Controls whether participants can vote on responses to this question. Defaults to true. Auto-disabled for response landscapes and scale questions.';

-- Update existing questions to have voting enabled by default
UPDATE questions
SET enable_voting = true
WHERE enable_voting IS NULL;
