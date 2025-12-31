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
