-- Migration: Link Reviews to Reading Journeys
-- This enables reviews to be journey-specific rather than book-level

-- Add journey_id column to book_reviews table
ALTER TABLE public.book_reviews ADD COLUMN IF NOT EXISTS journey_id uuid;

-- Add foreign key constraint
DO $$ BEGIN
    ALTER TABLE public.book_reviews 
        ADD CONSTRAINT book_reviews_journey_id_fkey 
        FOREIGN KEY (journey_id) REFERENCES public.reading_journeys(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_book_reviews_journey_id ON public.book_reviews(journey_id);

-- Migrate existing reviews to link them to their corresponding journey
-- For each review, find the most recent completed journey for that book/user
DO $$
DECLARE
    review_record RECORD;
    journey_id_to_link uuid;
BEGIN
    -- For each existing review without a journey_id
    FOR review_record IN 
        SELECT id, book_id, user_id
        FROM public.book_reviews
        WHERE journey_id IS NULL
    LOOP
        -- Find the most recent completed journey for this book/user
        SELECT rj.id INTO journey_id_to_link
        FROM public.reading_journeys rj
        WHERE rj.book_id = review_record.book_id
        AND rj.user_id = review_record.user_id
        AND rj.status = 'completed'
        ORDER BY rj.finished_at DESC NULLS LAST, rj.created_at DESC
        LIMIT 1;
        
        -- If no completed journey found, try to find any journey
        IF journey_id_to_link IS NULL THEN
            SELECT rj.id INTO journey_id_to_link
            FROM public.reading_journeys rj
            WHERE rj.book_id = review_record.book_id
            AND rj.user_id = review_record.user_id
            ORDER BY rj.created_at DESC
            LIMIT 1;
        END IF;
        
        -- Link the review to the journey
        IF journey_id_to_link IS NOT NULL THEN
            UPDATE public.book_reviews
            SET journey_id = journey_id_to_link
            WHERE id = review_record.id;
        END IF;
    END LOOP;
END $$;

-- Update RLS policies to consider journey privacy
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view public reviews" ON public.book_reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON public.book_reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.book_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.book_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.book_reviews;

-- Recreate policies with journey awareness
-- 1. Users can always view their own reviews
CREATE POLICY "Users can view own reviews" ON public.book_reviews
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Users can view reviews from public journeys
CREATE POLICY "Users can view public journey reviews" ON public.book_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reading_journeys rj
            WHERE rj.id = book_reviews.journey_id
            AND rj.visibility = 'public'
            AND rj.is_hidden_by_owner = false
        )
    );

-- 3. Connected users can view reviews from 'connections' journeys
CREATE POLICY "Connected users can view connection reviews" ON public.book_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reading_journeys rj
            WHERE rj.id = book_reviews.journey_id
            AND rj.visibility = 'connections'
            AND rj.is_hidden_by_owner = false
            AND (
                -- User is the creator
                auth.uid() = rj.user_id
                OR
                -- User follows the creator
                EXISTS (
                    SELECT 1 FROM public.follows 
                    WHERE follows.follower_id = auth.uid() 
                    AND follows.following_id = rj.user_id
                )
                OR
                -- Creator follows the user
                EXISTS (
                    SELECT 1 FROM public.follows 
                    WHERE follows.follower_id = rj.user_id 
                    AND follows.following_id = auth.uid()
                )
            )
        )
    );

-- 4. Book owners can view reviews on their books
CREATE POLICY "Book owners can view reviews" ON public.book_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.books b
            JOIN public.reading_journeys rj ON rj.book_id = b.id
            WHERE b.user_id = auth.uid()
            AND rj.id = book_reviews.journey_id
            AND rj.is_hidden_by_owner = false
        )
    );

-- 5. INSERT policy
CREATE POLICY "Users can insert own reviews" ON public.book_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. UPDATE policy
CREATE POLICY "Users can update own reviews" ON public.book_reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- 7. DELETE policy
CREATE POLICY "Users can delete own reviews" ON public.book_reviews
    FOR DELETE USING (auth.uid() = user_id);
