-- Remove the GENERATED ALWAYS property from pages_read to allow manual input
ALTER TABLE public.reading_sessions DROP COLUMN pages_read;
ALTER TABLE public.reading_sessions ADD COLUMN pages_read INTEGER;

-- Optional: Update existing rows if any (simple calculation fallback)
UPDATE public.reading_sessions 
SET pages_read = end_page - start_page 
WHERE pages_read IS NULL AND end_page IS NOT NULL AND start_page IS NOT NULL;
