-- Create reading_sessions table
CREATE TABLE IF NOT EXISTS public.reading_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    book_id uuid NOT NULL,
    user_id uuid NOT NULL,
    session_date timestamp with time zone DEFAULT now(),
    start_page integer,
    end_page integer,
    pages_read integer GENERATED ALWAYS AS (end_page - start_page) STORED,
    duration_minutes integer,
    notes text,
    mood text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reading_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT reading_sessions_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE,
    CONSTRAINT reading_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create reading_thoughts table (for notes/reviews during reading)
CREATE TABLE IF NOT EXISTS public.reading_thoughts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    book_id uuid NOT NULL,
    user_id uuid NOT NULL,
    page_number integer,
    thought text NOT NULL,
    is_spoiler boolean DEFAULT false,
    images text[] DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reading_thoughts_pkey PRIMARY KEY (id),
    CONSTRAINT reading_thoughts_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE,
    CONSTRAINT reading_thoughts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_thoughts ENABLE ROW LEVEL SECURITY;

-- Policies for reading_sessions
CREATE POLICY "Users can view their own reading sessions" ON public.reading_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading sessions" ON public.reading_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading sessions" ON public.reading_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading sessions" ON public.reading_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for reading_thoughts
CREATE POLICY "Users can view their own reading thoughts" ON public.reading_thoughts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading thoughts" ON public.reading_thoughts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading thoughts" ON public.reading_thoughts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading thoughts" ON public.reading_thoughts
    FOR DELETE USING (auth.uid() = user_id);
