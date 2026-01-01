-- Add new columns to notifications for better tracking
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS related_post_id UUID,
ADD COLUMN IF NOT EXISTS related_friendship_id UUID,
ADD COLUMN IF NOT EXISTS notification_category TEXT DEFAULT 'general';

-- Create index for related user lookups
CREATE INDEX IF NOT EXISTS idx_notifications_related_user ON public.notifications(related_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(notification_category);

-- Update RLS policy to allow service role to insert notifications for other users
-- This is needed for server actions to create notifications for recipients
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Comment explaining notification categories
COMMENT ON COLUMN public.notifications.notification_category IS 'Categories: friend_request, friend_accepted, post_like, post_comment, post_share, new_follower, book_recommendation, general';
