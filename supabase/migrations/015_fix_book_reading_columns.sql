-- Migration: Add missing reading progress columns to books table
-- and fix column name in reading_thoughts table

-- Add missing reading progress columns to books table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS current_page integer DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS reading_started_at timestamp with time zone;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS reading_finished_at timestamp with time zone;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS reading_goal_pages_per_day integer;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS reading_goal_finish_by date;

-- Add chapter column to reading_thoughts if it doesn't exist
ALTER TABLE public.reading_thoughts ADD COLUMN IF NOT EXISTS chapter text;

-- Rename 'thought' to 'content' in reading_thoughts for consistency with application code
-- First check if column needs renaming (thought exists and content doesn't)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reading_thoughts' 
        AND column_name = 'thought'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reading_thoughts' 
        AND column_name = 'content'
    ) THEN
        ALTER TABLE public.reading_thoughts RENAME COLUMN thought TO content;
    END IF;
END $$;

-- Add contains_spoilers column if missing (used by code but missing in some versions)
ALTER TABLE public.reading_thoughts ADD COLUMN IF NOT EXISTS contains_spoilers boolean DEFAULT false;
