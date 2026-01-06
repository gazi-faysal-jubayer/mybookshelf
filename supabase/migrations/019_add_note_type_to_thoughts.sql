-- Migration: Add note_type column to reading_thoughts
-- Distinguishes between detailed thoughts and quick notes in the same table

-- Add note_type column to reading_thoughts
ALTER TABLE public.reading_thoughts 
ADD COLUMN IF NOT EXISTS note_type TEXT DEFAULT 'detailed_thought';

-- Add check constraint for valid note types
DO $$ BEGIN
    ALTER TABLE public.reading_thoughts 
    ADD CONSTRAINT reading_thoughts_note_type_check 
    CHECK (note_type IN ('detailed_thought', 'quick_note'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create index for filtering by note type
CREATE INDEX IF NOT EXISTS idx_reading_thoughts_note_type 
ON public.reading_thoughts(note_type);

-- Create index for combined journey + note_type queries
CREATE INDEX IF NOT EXISTS idx_reading_thoughts_journey_note_type 
ON public.reading_thoughts(journey_id, note_type);

-- Add is_starred column for marking important notes
ALTER TABLE public.reading_thoughts 
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;

-- Add sort_order for manual reordering of quick notes
ALTER TABLE public.reading_thoughts 
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Add journey-related activity types to the enum (if not already present)
-- Note: These may already exist in the enum from earlier migrations
DO $$ BEGIN
    ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'journey_started';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN invalid_parameter_value THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'journey_completed';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN invalid_parameter_value THEN null;
END $$;

-- Drop and recreate the journey_stats_view to include quick_notes count
DROP VIEW IF EXISTS public.journey_stats_view;

CREATE VIEW public.journey_stats_view AS
SELECT 
    rj.id AS journey_id,
    rj.book_id,
    rj.user_id,
    rj.status,
    rj.visibility,
    rj.session_name,
    rj.started_at,
    rj.finished_at,
    rj.rating,
    rj.review,
    rj.abandon_reason,
    -- Count of reading sessions
    COALESCE(session_counts.session_count, 0) AS sessions_count,
    -- Count of detailed thoughts
    COALESCE(thought_counts.thought_count, 0) AS thoughts_count,
    -- Count of quick notes
    COALESCE(note_counts.note_count, 0) AS quick_notes_count,
    -- Total pages read in this journey
    COALESCE(page_sums.total_pages, 0) AS total_pages_read,
    -- Number of distinct reading days
    COALESCE(day_counts.reading_days, 0) AS reading_days,
    -- Average pages per session
    CASE 
        WHEN COALESCE(session_counts.session_count, 0) > 0 
        THEN ROUND(COALESCE(page_sums.total_pages, 0)::NUMERIC / session_counts.session_count, 1)
        ELSE 0 
    END AS avg_pages_per_session,
    -- Days since started
    EXTRACT(DAY FROM (COALESCE(rj.finished_at, now()) - rj.started_at)) AS days_since_start,
    -- Total reading time in minutes
    COALESCE(time_sums.total_minutes, 0) AS total_reading_minutes
FROM public.reading_journeys rj
LEFT JOIN (
    SELECT journey_id, COUNT(*) AS session_count
    FROM public.reading_sessions
    WHERE journey_id IS NOT NULL
    GROUP BY journey_id
) session_counts ON session_counts.journey_id = rj.id
LEFT JOIN (
    SELECT journey_id, COUNT(*) AS thought_count
    FROM public.reading_thoughts
    WHERE journey_id IS NOT NULL AND (note_type = 'detailed_thought' OR note_type IS NULL)
    GROUP BY journey_id
) thought_counts ON thought_counts.journey_id = rj.id
LEFT JOIN (
    SELECT journey_id, COUNT(*) AS note_count
    FROM public.reading_thoughts
    WHERE journey_id IS NOT NULL AND note_type = 'quick_note'
    GROUP BY journey_id
) note_counts ON note_counts.journey_id = rj.id
LEFT JOIN (
    SELECT journey_id, SUM(pages_read) AS total_pages
    FROM public.reading_sessions
    WHERE journey_id IS NOT NULL
    GROUP BY journey_id
) page_sums ON page_sums.journey_id = rj.id
LEFT JOIN (
    SELECT journey_id, COUNT(DISTINCT DATE(session_date)) AS reading_days
    FROM public.reading_sessions
    WHERE journey_id IS NOT NULL
    GROUP BY journey_id
) day_counts ON day_counts.journey_id = rj.id
LEFT JOIN (
    SELECT journey_id, SUM(duration_minutes) AS total_minutes
    FROM public.reading_sessions
    WHERE journey_id IS NOT NULL
    GROUP BY journey_id
) time_sums ON time_sums.journey_id = rj.id;

-- Grant access to the view
GRANT SELECT ON public.journey_stats_view TO authenticated;
GRANT SELECT ON public.journey_stats_view TO anon;
