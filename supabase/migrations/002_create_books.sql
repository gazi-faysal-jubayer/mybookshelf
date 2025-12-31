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
