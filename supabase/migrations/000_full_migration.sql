-- ============================================
-- MYBOOKSHELF - FULL DATABASE MIGRATION
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    profile_picture TEXT,
    bio TEXT,
    location TEXT,
    favorite_genre TEXT,
    email_notifications BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT false,
    language TEXT DEFAULT 'en',
    default_lending_period INTEGER DEFAULT 14,
    yearly_goal INTEGER DEFAULT 12,
    current_year_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1) || FLOOR(RANDOM() * 1000)::TEXT),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. BOOKS TABLE
-- ============================================

-- Create enum types for books
CREATE TYPE book_format AS ENUM ('hardcover', 'paperback', 'ebook', 'audiobook');
CREATE TYPE ownership_status AS ENUM ('owned', 'borrowed_from_others', 'wishlist', 'sold', 'lost');
CREATE TYPE reading_status AS ENUM ('to_read', 'currently_reading', 'completed', 'abandoned');
CREATE TYPE lending_status AS ENUM ('available', 'lent_out', 'reserved');

-- Create books table
CREATE TABLE IF NOT EXISTS public.books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT,
    publisher TEXT,
    publication_year INTEGER,
    pages INTEGER,
    language TEXT,
    genre TEXT[] DEFAULT '{}',
    cover_image TEXT,
    description TEXT,
    format book_format DEFAULT 'paperback',
    condition TEXT,
    -- Purchase info (flattened from nested object)
    purchase_date TIMESTAMPTZ,
    purchase_price DECIMAL(10, 2),
    purchase_location TEXT,
    purchase_currency TEXT DEFAULT 'USD',
    purchase_link TEXT,
    -- Borrowed info (flattened from nested object)
    borrowed_owner_name TEXT,
    borrowed_borrow_date TIMESTAMPTZ,
    borrowed_due_date TIMESTAMPTZ,
    borrowed_return_date TIMESTAMPTZ,
    -- Status fields
    ownership_status ownership_status DEFAULT 'owned',
    reading_status reading_status DEFAULT 'to_read',
    lending_status lending_status DEFAULT 'available',
    -- Additional fields
    rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
    review TEXT,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_books_user_id ON public.books(user_id);
CREATE INDEX idx_books_title ON public.books(title);
CREATE INDEX idx_books_author ON public.books(author);
CREATE INDEX idx_books_ownership_status ON public.books(user_id, ownership_status);
CREATE INDEX idx_books_reading_status ON public.books(user_id, reading_status);

-- Full text search index
CREATE INDEX idx_books_search ON public.books USING GIN (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(author, '') || ' ' || coalesce(description, ''))
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Books policies
CREATE POLICY "Users can view own books" ON public.books
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books" ON public.books
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books" ON public.books
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books" ON public.books
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger for books updated_at
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON public.books
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. COLLECTIONS TABLE
-- ============================================

-- Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Unique constraint on user_id + name
    UNIQUE(user_id, name)
);

-- Create junction table for collection_books (many-to-many)
CREATE TABLE IF NOT EXISTS public.collection_books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent duplicate books in same collection
    UNIQUE(collection_id, book_id)
);

-- Create indexes
CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE INDEX idx_collection_books_collection_id ON public.collection_books(collection_id);
CREATE INDEX idx_collection_books_book_id ON public.collection_books(book_id);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_books ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Users can view own collections" ON public.collections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections" ON public.collections
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own collections" ON public.collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON public.collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON public.collections
    FOR DELETE USING (auth.uid() = user_id);

-- Collection books policies
CREATE POLICY "Users can view own collection books" ON public.collection_books
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.collections 
            WHERE collections.id = collection_books.collection_id 
            AND collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert to own collections" ON public.collection_books
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collections 
            WHERE collections.id = collection_books.collection_id 
            AND collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete from own collections" ON public.collection_books
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.collections 
            WHERE collections.id = collection_books.collection_id 
            AND collections.user_id = auth.uid()
        )
    );

-- Trigger for collections updated_at
CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON public.collections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. LENDINGS TABLE
-- ============================================

-- Create enum for lending status
CREATE TYPE lending_record_status AS ENUM ('active', 'returned');

-- Create lendings table
CREATE TABLE IF NOT EXISTS public.lendings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    borrower_name TEXT NOT NULL,
    borrower_email TEXT,
    borrow_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    return_date TIMESTAMPTZ,
    status lending_record_status DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_lendings_user_id ON public.lendings(user_id);
CREATE INDEX idx_lendings_book_id ON public.lendings(book_id);
CREATE INDEX idx_lendings_status ON public.lendings(user_id, status);

-- Enable RLS
ALTER TABLE public.lendings ENABLE ROW LEVEL SECURITY;

-- Lendings policies
CREATE POLICY "Users can view own lendings" ON public.lendings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lendings" ON public.lendings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lendings" ON public.lendings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lendings" ON public.lendings
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger for lendings updated_at
CREATE TRIGGER update_lendings_updated_at
    BEFORE UPDATE ON public.lendings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. NOTIFICATIONS TABLE
-- ============================================

-- Create enum for notification type
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type notification_type DEFAULT 'info',
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
