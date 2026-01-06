-- Migration: Enhance Reading Sessions System
-- Adds session_name and abandon_reason columns for richer session tracking

-- Add session_name column for custom naming (e.g., "First Read", "Re-read 2024")
ALTER TABLE public.reading_journeys ADD COLUMN IF NOT EXISTS session_name TEXT;

-- Add abandon_reason for abandoned sessions
ALTER TABLE public.reading_journeys ADD COLUMN IF NOT EXISTS abandon_reason TEXT;

-- Create or replace function to generate default session name
CREATE OR REPLACE FUNCTION public.generate_session_name(p_book_id uuid, p_user_id uuid)
RETURNS TEXT AS $$
DECLARE
    session_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO session_count
    FROM public.reading_journeys
    WHERE book_id = p_book_id AND user_id = p_user_id;
    
    IF session_count = 0 THEN
        RETURN 'First Read';
    ELSE
        RETURN 'Re-read #' || (session_count + 1);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create view for journey statistics
CREATE OR REPLACE VIEW public.journey_stats_view AS
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
    -- Count of thoughts
    COALESCE(thought_counts.thought_count, 0) AS thoughts_count,
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
    EXTRACT(DAY FROM (COALESCE(rj.finished_at, now()) - rj.started_at)) AS days_since_start
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
    WHERE journey_id IS NOT NULL
    GROUP BY journey_id
) thought_counts ON thought_counts.journey_id = rj.id
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
) day_counts ON day_counts.journey_id = rj.id;

-- Grant access to the view
GRANT SELECT ON public.journey_stats_view TO authenticated;
GRANT SELECT ON public.journey_stats_view TO anon;
