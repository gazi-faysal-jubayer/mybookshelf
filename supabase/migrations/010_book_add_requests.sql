-- =====================================================
-- BOOK ADD REQUESTS - Schema for borrowed book requests
-- =====================================================

-- Add column to books table to link borrowed books to real users
ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS borrowed_owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for lookup
CREATE INDEX IF NOT EXISTS idx_books_borrowed_owner ON public.books(borrowed_owner_user_id) WHERE borrowed_owner_user_id IS NOT NULL;

-- Create book_add_requests table
CREATE TABLE IF NOT EXISTS public.book_add_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Book details from the requester's entry
    book_title TEXT NOT NULL,
    book_author TEXT NOT NULL,
    book_isbn TEXT,
    book_cover_image TEXT,
    book_publisher TEXT,
    book_format TEXT,
    
    -- Link to the requester's borrowed book entry
    requester_book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
    
    -- If approved, link to the owner's newly created book entry
    owner_book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
    
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'cancelled')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_book_add_requests_owner ON public.book_add_requests(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_book_add_requests_requester ON public.book_add_requests(requester_id);

-- Enable Row Level Security
ALTER TABLE public.book_add_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own requests" ON public.book_add_requests
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create requests" ON public.book_add_requests
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Owners can update request status" ON public.book_add_requests
    FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = requester_id);

-- Update notification category comment to include new categories
COMMENT ON COLUMN public.notifications.notification_category IS 'Categories: friend_request, friend_accepted, post_like, post_comment, post_share, new_follower, book_recommendation, book_add_request, book_add_approved, book_add_declined, general';

-- Add related_book_request_id to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS related_book_request_id UUID REFERENCES public.book_add_requests(id) ON DELETE SET NULL;
