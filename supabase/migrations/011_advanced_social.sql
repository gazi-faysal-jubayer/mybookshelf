-- Add parent_id to post_comments for threaded replies
ALTER TABLE public.post_comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON public.post_comments(parent_id);

-- Create table for comment likes
CREATE TABLE IF NOT EXISTS public.post_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_comment_likes_comment ON public.post_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comment_likes_user ON public.post_comment_likes(user_id);

-- Enable RLS for comment likes
ALTER TABLE public.post_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment likes
-- View likes: consistent with viewing the post/comment
CREATE POLICY "View comment likes" ON public.post_comment_likes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.post_comments 
        JOIN public.posts ON post_comments.post_id = posts.id
        WHERE post_comments.id = post_comment_likes.comment_id AND (
            posts.visibility = 'public'
            OR posts.user_id = auth.uid()
            OR (posts.visibility = 'connections' AND EXISTS (
                SELECT 1 FROM public.friendships
                WHERE status = 'accepted'
                AND ((requester_id = auth.uid() AND addressee_id = posts.user_id)
                OR (addressee_id = auth.uid() AND requester_id = posts.user_id))
            ))
        )
    )
);

CREATE POLICY "Like comments" ON public.post_comment_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Unlike comments" ON public.post_comment_likes FOR DELETE USING (user_id = auth.uid());

-- Add related_comment_id to notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS related_comment_id UUID REFERENCES public.post_comments(id) ON DELETE SET NULL;

-- Update notification comments
COMMENT ON COLUMN public.notifications.notification_category IS 'Categories: friend_request, friend_accepted, post_like, post_comment, post_share, new_follower, book_recommendation, book_add_request, book_add_approved, book_add_declined, comment_reply, comment_like, mention_post, mention_comment, general';
