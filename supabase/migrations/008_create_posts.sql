-- =====================================================
-- Posts System Migration
-- =====================================================

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'connections', 'private')),
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility, created_at DESC);

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

-- Post comments table
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id, created_at);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Posts RLS Policies

-- View public posts, own posts, or posts from friends (for 'connections' visibility)
CREATE POLICY "View posts" ON posts FOR SELECT USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (visibility = 'connections' AND EXISTS (
        SELECT 1 FROM friendships
        WHERE status = 'accepted'
        AND ((requester_id = auth.uid() AND addressee_id = posts.user_id)
        OR (addressee_id = auth.uid() AND requester_id = posts.user_id))
    ))
);

-- Users can create their own posts
CREATE POLICY "Create posts" ON posts FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own posts
CREATE POLICY "Update own posts" ON posts FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own posts
CREATE POLICY "Delete own posts" ON posts FOR DELETE USING (user_id = auth.uid());

-- Post likes policies
CREATE POLICY "View post likes" ON post_likes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM posts WHERE id = post_likes.post_id AND (
            visibility = 'public'
            OR user_id = auth.uid()
            OR (visibility = 'connections' AND EXISTS (
                SELECT 1 FROM friendships
                WHERE status = 'accepted'
                AND ((requester_id = auth.uid() AND addressee_id = posts.user_id)
                OR (addressee_id = auth.uid() AND requester_id = posts.user_id))
            ))
        )
    )
);

CREATE POLICY "Like posts" ON post_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Unlike posts" ON post_likes FOR DELETE USING (user_id = auth.uid());

-- Post comments policies
CREATE POLICY "View post comments" ON post_comments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM posts WHERE id = post_comments.post_id AND (
            visibility = 'public'
            OR user_id = auth.uid()
            OR (visibility = 'connections' AND EXISTS (
                SELECT 1 FROM friendships
                WHERE status = 'accepted'
                AND ((requester_id = auth.uid() AND addressee_id = posts.user_id)
                OR (addressee_id = auth.uid() AND requester_id = posts.user_id))
            ))
        )
    )
);

CREATE POLICY "Create comments" ON post_comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own comments" ON post_comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Delete own comments" ON post_comments FOR DELETE USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
    BEFORE UPDATE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for posts (optional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE posts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
