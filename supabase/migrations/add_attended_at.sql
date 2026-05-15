-- Migration: Add attended_at to event_attendees
-- Run this in your Supabase SQL Editor if the table already exists

ALTER TABLE event_attendees
ADD COLUMN IF NOT EXISTS attended_at TIMESTAMP WITH TIME ZONE;

-- Optional: index for fast check-in lookups
CREATE INDEX IF NOT EXISTS idx_event_attendees_attended_at 
ON event_attendees (attended_at) 
WHERE attended_at IS NOT NULL;
