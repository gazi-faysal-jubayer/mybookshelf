-- Add type and metadata columns to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text' CHECK (type IN ('text', 'reading_session', 'review', 'finished_book')),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for post type
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(type);
