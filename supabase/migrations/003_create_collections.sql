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
