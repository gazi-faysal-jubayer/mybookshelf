-- Migration: Create Reading Journeys System
-- This enables multiple "reading seasons" per book with privacy controls

-- Drop existing table and recreate with proper schema
DROP TABLE IF EXISTS public.reading_journeys CASCADE;

-- Create privacy visibility enum
DO $$ BEGIN
    CREATE TYPE visibility_level AS ENUM ('public', 'connections', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create journey status enum
DO $$ BEGIN
    CREATE TYPE journey_status AS ENUM ('active', 'completed', 'abandoned', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create reading_journeys table (represents a "reading season")
CREATE TABLE public.reading_journeys (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    book_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status journey_status DEFAULT 'active',
    visibility visibility_level DEFAULT 'public',
    started_at timestamp with time zone DEFAULT now(),
    finished_at timestamp with time zone,
    rating decimal(2, 1) CHECK (rating >= 0 AND rating <= 5),
    review text,
    is_hidden_by_owner boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reading_journeys_pkey PRIMARY KEY (id),
    CONSTRAINT reading_journeys_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE,
    CONSTRAINT reading_journeys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Drop existing constraints on reading_sessions if they exist
DO $$ BEGIN
    ALTER TABLE public.reading_sessions DROP CONSTRAINT IF EXISTS reading_sessions_journey_id_fkey;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Drop existing constraints on reading_thoughts if they exist
DO $$ BEGIN
    ALTER TABLE public.reading_thoughts DROP CONSTRAINT IF EXISTS reading_thoughts_journey_id_fkey;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Add journey_id column to reading_sessions if it doesn't exist
ALTER TABLE public.reading_sessions ADD COLUMN IF NOT EXISTS journey_id uuid;

-- Add journey_id column to reading_thoughts if it doesn't exist
ALTER TABLE public.reading_thoughts ADD COLUMN IF NOT EXISTS journey_id uuid;

-- Clear existing journey_id values (they reference old table that we just dropped)
UPDATE public.reading_sessions SET journey_id = NULL WHERE journey_id IS NOT NULL;
UPDATE public.reading_thoughts SET journey_id = NULL WHERE journey_id IS NOT NULL;

-- Now add the foreign key constraints
ALTER TABLE public.reading_sessions 
    ADD CONSTRAINT reading_sessions_journey_id_fkey 
    FOREIGN KEY (journey_id) REFERENCES public.reading_journeys(id) ON DELETE CASCADE;

ALTER TABLE public.reading_thoughts 
    ADD CONSTRAINT reading_thoughts_journey_id_fkey 
    FOREIGN KEY (journey_id) REFERENCES public.reading_journeys(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reading_journeys_book_id ON public.reading_journeys(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_journeys_user_id ON public.reading_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_journeys_status ON public.reading_journeys(status);
CREATE INDEX IF NOT EXISTS idx_reading_journeys_visibility ON public.reading_journeys(visibility);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_journey_id ON public.reading_sessions(journey_id);
CREATE INDEX IF NOT EXISTS idx_reading_thoughts_journey_id ON public.reading_thoughts(journey_id);

-- Enable RLS
ALTER TABLE public.reading_journeys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own journeys" ON public.reading_journeys;
DROP POLICY IF EXISTS "Book owners can view journeys on their books" ON public.reading_journeys;
DROP POLICY IF EXISTS "Anyone can view public journeys" ON public.reading_journeys;
DROP POLICY IF EXISTS "Connected users can view connection journeys" ON public.reading_journeys;
DROP POLICY IF EXISTS "Users can insert their own journeys" ON public.reading_journeys;
DROP POLICY IF EXISTS "Users can update their own journeys" ON public.reading_journeys;
DROP POLICY IF EXISTS "Users can delete their own journeys" ON public.reading_journeys;
DROP POLICY IF EXISTS "Book owners can hide journeys" ON public.reading_journeys;

-- RLS Policies for reading_journeys

-- 1. SELECT policies (viewing)
-- Users can always view their own journeys
CREATE POLICY "Users can view their own journeys" ON public.reading_journeys
    FOR SELECT USING (auth.uid() = user_id);

-- Book owners can view journeys on their books (unless hidden)
CREATE POLICY "Book owners can view journeys on their books" ON public.reading_journeys
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.books 
            WHERE books.id = reading_journeys.book_id 
            AND books.user_id = auth.uid()
        )
        AND is_hidden_by_owner = false
    );

-- Anyone can view public journeys
CREATE POLICY "Anyone can view public journeys" ON public.reading_journeys
    FOR SELECT USING (visibility = 'public' AND is_hidden_by_owner = false);

-- Connected users (friends + followers) can view "connections" journeys
CREATE POLICY "Connected users can view connection journeys" ON public.reading_journeys
    FOR SELECT USING (
        visibility = 'connections' 
        AND is_hidden_by_owner = false
        AND (
            -- User is the creator
            auth.uid() = user_id
            OR
            -- User follows the creator
            EXISTS (
                SELECT 1 FROM public.follows 
                WHERE follows.follower_id = auth.uid() 
                AND follows.following_id = reading_journeys.user_id
            )
            OR
            -- Creator follows the user (mutual connection)
            EXISTS (
                SELECT 1 FROM public.follows 
                WHERE follows.follower_id = reading_journeys.user_id 
                AND follows.following_id = auth.uid()
            )
        )
    );

-- 2. INSERT policies
CREATE POLICY "Users can insert their own journeys" ON public.reading_journeys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE policies
CREATE POLICY "Users can update their own journeys" ON public.reading_journeys
    FOR UPDATE USING (auth.uid() = user_id);

-- Book owners can update (hide) journeys on their books
CREATE POLICY "Book owners can hide journeys" ON public.reading_journeys
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.books 
            WHERE books.id = reading_journeys.book_id 
            AND books.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.books 
            WHERE books.id = reading_journeys.book_id 
            AND books.user_id = auth.uid()
        )
    );

-- 4. DELETE policies
CREATE POLICY "Users can delete their own journeys" ON public.reading_journeys
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_reading_journeys_updated_at ON public.reading_journeys;
CREATE TRIGGER update_reading_journeys_updated_at
    BEFORE UPDATE ON public.reading_journeys
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create helper function to get active journey for a book/user
CREATE OR REPLACE FUNCTION public.get_active_journey(p_book_id uuid, p_user_id uuid)
RETURNS uuid AS $$
DECLARE
    v_journey_id uuid;
BEGIN
    SELECT id INTO v_journey_id
    FROM public.reading_journeys
    WHERE book_id = p_book_id
    AND user_id = p_user_id
    AND status = 'active'
    ORDER BY started_at DESC
    LIMIT 1;
    
    RETURN v_journey_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to auto-create journey if needed
CREATE OR REPLACE FUNCTION public.ensure_active_journey(p_book_id uuid, p_user_id uuid)
RETURNS uuid AS $$
DECLARE
    v_journey_id uuid;
BEGIN
    -- Check if there's an active journey
    v_journey_id := public.get_active_journey(p_book_id, p_user_id);
    
    -- If no active journey exists, create one
    IF v_journey_id IS NULL THEN
        INSERT INTO public.reading_journeys (book_id, user_id, status, visibility)
        VALUES (p_book_id, p_user_id, 'active', 'public')
        RETURNING id INTO v_journey_id;
    END IF;
    
    RETURN v_journey_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migrate existing data: create journeys for books currently being read or completed
-- This ensures backward compatibility with existing data
DO $$
DECLARE
    book_record RECORD;
    new_journey_id uuid;
BEGIN
    -- For each user's book that has been started or completed
    FOR book_record IN 
        SELECT DISTINCT b.id as book_id, b.user_id, b.reading_status, b.reading_started_at, b.reading_finished_at
        FROM public.books b
        WHERE b.reading_started_at IS NOT NULL
    LOOP
        -- Create a journey for this book
        INSERT INTO public.reading_journeys (
            book_id, 
            user_id, 
            status, 
            visibility,
            started_at,
            finished_at
        ) VALUES (
            book_record.book_id,
            book_record.user_id,
            CASE 
                WHEN book_record.reading_status = 'completed' THEN 'completed'::journey_status
                WHEN book_record.reading_status = 'currently_reading' THEN 'active'::journey_status
                WHEN book_record.reading_status = 'abandoned' THEN 'abandoned'::journey_status
                ELSE 'active'::journey_status
            END,
            'public'::visibility_level,
            book_record.reading_started_at,
            book_record.reading_finished_at
        )
        RETURNING id INTO new_journey_id;
        
        -- Link existing reading sessions to this journey
        UPDATE public.reading_sessions
        SET journey_id = new_journey_id
        WHERE book_id = book_record.book_id
        AND user_id = book_record.user_id
        AND journey_id IS NULL;
        
        -- Link existing reading thoughts to this journey
        UPDATE public.reading_thoughts
        SET journey_id = new_journey_id
        WHERE book_id = book_record.book_id
        AND user_id = book_record.user_id
        AND journey_id IS NULL;
    END LOOP;
END $$;
