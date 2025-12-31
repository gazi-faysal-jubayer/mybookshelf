-- =====================================================
-- BOOKKEEPER SOCIAL - Complete Social Features Schema
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For location-based features (may need to enable in Supabase dashboard)

-- =====================================================
-- 1. ENHANCED USER PROFILES
-- =====================================================

-- Add social fields to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_photo TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goodreads_url TEXT;

-- Location fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT true;

-- Reading preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_authors TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reading_interests TEXT[] DEFAULT '{}';

-- Privacy settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_reading_activity BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_lending_history BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_collections BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allow_messages_from TEXT DEFAULT 'everyone' CHECK (allow_messages_from IN ('everyone', 'friends', 'nobody'));

-- Stats (cached for performance)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_books_read INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_pages_read INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_books_lent INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_books_borrowed INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lending_reputation DECIMAL(3,2) DEFAULT 5.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS borrowing_reputation DECIMAL(3,2) DEFAULT 5.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0;

-- Verification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT false;

-- Lending preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_lending_duration INTEGER DEFAULT 14; -- days
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_lending_distance INTEGER DEFAULT 50; -- km
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS require_deposit BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_exchange_method TEXT DEFAULT 'both' CHECK (preferred_exchange_method IN ('meetup', 'mail', 'both'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lending_to TEXT DEFAULT 'everyone' CHECK (lending_to IN ('everyone', 'friends', 'verified'));

-- =====================================================
-- 2. FRIEND SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);

-- Indexes for friend queries
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id, status);

-- =====================================================
-- 3. FOLLOWING SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- =====================================================
-- 4. ENHANCED BOOK FIELDS FOR SOCIAL FEATURES
-- =====================================================

ALTER TABLE books ADD COLUMN IF NOT EXISTS is_available_for_lending BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS lending_condition TEXT CHECK (lending_condition IN ('new', 'like_new', 'good', 'fair', 'poor'));
ALTER TABLE books ADD COLUMN IF NOT EXISTS lending_notes TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_precious BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS require_deposit_override BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS deposit_amount_override DECIMAL(10,2);
ALTER TABLE books ADD COLUMN IF NOT EXISTS max_lending_duration INTEGER; -- days, null = use profile default
ALTER TABLE books ADD COLUMN IF NOT EXISTS times_lent INTEGER DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS max_lends_per_year INTEGER; -- null = unlimited

-- =====================================================
-- 5. BORROW REQUESTS SYSTEM
-- =====================================================

CREATE TYPE borrow_request_status AS ENUM (
    'pending',
    'accepted',
    'declined',
    'counter_offered',
    'cancelled',
    'expired',
    'active',        -- Book is currently borrowed
    'return_pending', -- Borrower initiated return
    'completed',
    'disputed'
);

CREATE TYPE exchange_method AS ENUM ('meetup', 'mail', 'drop_off');
CREATE TYPE urgency_level AS ENUM ('casual', 'soon', 'urgent');

CREATE TABLE IF NOT EXISTS borrow_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    borrower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Request details
    status borrow_request_status DEFAULT 'pending',
    proposed_duration INTEGER NOT NULL, -- days
    exchange_method exchange_method NOT NULL,
    meetup_location TEXT,
    borrower_message TEXT,
    urgency urgency_level DEFAULT 'casual',
    
    -- Deposit
    deposit_required BOOLEAN DEFAULT false,
    deposit_amount DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT false,
    
    -- Counter offer fields
    counter_duration INTEGER,
    counter_message TEXT,
    
    -- Dates
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    pickup_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    actual_return_date TIMESTAMPTZ,
    
    -- Condition tracking
    condition_at_lending TEXT,
    condition_photos_lending TEXT[],
    condition_at_return TEXT,
    condition_photos_return TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_borrow_requests_book ON borrow_requests(book_id, status);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_owner ON borrow_requests(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_borrower ON borrow_requests(borrower_id, status);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_due_date ON borrow_requests(due_date) WHERE status = 'active';

-- =====================================================
-- 6. TRANSACTION REVIEWS & RATINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS transaction_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    borrow_request_id UUID NOT NULL REFERENCES borrow_requests(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('owner', 'borrower')),
    
    -- Ratings (1-5)
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    timeliness_rating INTEGER CHECK (timeliness_rating BETWEEN 1 AND 5),
    book_condition_rating INTEGER CHECK (book_condition_rating BETWEEN 1 AND 5),
    
    -- Review text
    review_text TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(borrow_request_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_transaction_reviews_reviewee ON transaction_reviews(reviewee_id);

-- =====================================================
-- 7. BOOK REVIEWS (Community Reviews)
-- =====================================================

CREATE TABLE IF NOT EXISTS book_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    contains_spoilers BOOLEAN DEFAULT false,
    
    -- Review tags
    tags TEXT[] DEFAULT '{}',
    
    -- Engagement
    helpful_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(book_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_book_reviews_book ON book_reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_book_reviews_user ON book_reviews(user_id);

-- Review helpful votes
CREATE TABLE IF NOT EXISTS review_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES book_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- =====================================================
-- 8. DIRECT MESSAGING
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'borrow_request')),
    name TEXT, -- For group chats
    borrow_request_id UUID REFERENCES borrow_requests(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    last_read_at TIMESTAMPTZ,
    is_muted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'book_share', 'collection_share', 'location')),
    
    -- For sharing books/collections
    shared_book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    shared_collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    
    -- Read receipts
    read_by UUID[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants ON conversation_participants(user_id);

-- =====================================================
-- 9. USER BADGES & ACHIEVEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT, -- Emoji or icon name
    category TEXT CHECK (category IN ('reading', 'lending', 'community', 'special')),
    requirement_type TEXT, -- e.g., 'books_read', 'books_lent', 'reviews_written'
    requirement_value INTEGER,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Insert default badges
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, tier) VALUES
    ('Bookworm', 'Read 10 books', '📚', 'reading', 'books_read', 10, 'bronze'),
    ('Avid Reader', 'Read 50 books', '📖', 'reading', 'books_read', 50, 'silver'),
    ('Reading Machine', 'Read 100 books', '🏆', 'reading', 'books_read', 100, 'gold'),
    ('Literary Legend', 'Read 500 books', '👑', 'reading', 'books_read', 500, 'platinum'),
    ('Generous Lender', 'Lend 5 books', '🤝', 'lending', 'books_lent', 5, 'bronze'),
    ('Community Pillar', 'Lend 25 books', '🌟', 'lending', 'books_lent', 25, 'silver'),
    ('Library Hero', 'Lend 100 books', '🦸', 'lending', 'books_lent', 100, 'gold'),
    ('Reliable Borrower', 'Return 10 books on time', '⏰', 'lending', 'on_time_returns', 10, 'bronze'),
    ('Perfect Record', 'Return 50 books on time', '✨', 'lending', 'on_time_returns', 50, 'silver'),
    ('Review Writer', 'Write 10 reviews', '✍️', 'community', 'reviews_written', 10, 'bronze'),
    ('Critic', 'Write 50 reviews', '📝', 'community', 'reviews_written', 50, 'silver'),
    ('Genre Explorer', 'Read books from 5 different genres', '🗺️', 'reading', 'genres_read', 5, 'bronze'),
    ('Early Adopter', 'Joined in first year', '🌱', 'special', NULL, NULL, 'gold'),
    ('Verified User', 'Completed identity verification', '✅', 'special', NULL, NULL, 'silver')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 10. ACTIVITY FEED
-- =====================================================

CREATE TYPE activity_type AS ENUM (
    'book_added',
    'book_finished',
    'book_started',
    'review_written',
    'book_lent',
    'book_borrowed',
    'book_returned',
    'collection_created',
    'badge_earned',
    'friend_added',
    'reading_goal_achieved'
);

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    
    -- References (nullable based on activity type)
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    badge_id UUID REFERENCES badges(id) ON DELETE SET NULL,
    related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    review_id UUID REFERENCES book_reviews(id) ON DELETE SET NULL,
    
    -- Additional data as JSON
    metadata JSONB DEFAULT '{}',
    
    -- Visibility
    is_public BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_public ON activities(created_at DESC) WHERE is_public = true;

-- Activity likes
CREATE TABLE IF NOT EXISTS activity_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

-- Activity comments
CREATE TABLE IF NOT EXISTS activity_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_comments ON activity_comments(activity_id, created_at);

-- =====================================================
-- 11. BOOK CLUBS
-- =====================================================

CREATE TABLE IF NOT EXISTS book_clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    is_public BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    max_members INTEGER DEFAULT 50,
    genre_focus TEXT[],
    
    -- Current read
    current_book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    reading_start_date DATE,
    reading_end_date DATE,
    
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS book_club_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'banned')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_book_club_members ON book_club_members(user_id, status);

-- =====================================================
-- 12. READING CHALLENGES
-- =====================================================

CREATE TABLE IF NOT EXISTS reading_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    challenge_type TEXT CHECK (challenge_type IN ('books_count', 'pages_count', 'genre', 'series', 'custom')),
    target_value INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_community BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES reading_challenges(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- =====================================================
-- 13. WISHLISTS (Enhanced)
-- =====================================================

CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'My Wishlist',
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    
    -- Book info (can be from our DB or external)
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    external_title TEXT,
    external_author TEXT,
    external_isbn TEXT,
    external_cover TEXT,
    
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    notes TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Gift tracking
    reserved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_gifted BOOLEAN DEFAULT false
);

-- =====================================================
-- 14. BLOCKED USERS
-- =====================================================

CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- =====================================================
-- 15. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Friendships policies
CREATE POLICY "Users can view their friendships" ON friendships
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can create friend requests" ON friendships
    FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update their friendships" ON friendships
    FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can delete their friendships" ON friendships
    FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Follows policies
CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Borrow requests policies
CREATE POLICY "Users can view their borrow requests" ON borrow_requests
    FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = borrower_id);
CREATE POLICY "Users can create borrow requests" ON borrow_requests
    FOR INSERT WITH CHECK (auth.uid() = borrower_id);
CREATE POLICY "Participants can update borrow requests" ON borrow_requests
    FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = borrower_id);

-- Transaction reviews policies
CREATE POLICY "Anyone can view transaction reviews" ON transaction_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON transaction_reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Book reviews policies
CREATE POLICY "Anyone can view book reviews" ON book_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create book reviews" ON book_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON book_reviews
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON book_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Conversation participants policies
CREATE POLICY "Users can view their conversations" ON conversation_participants
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their conversation settings" ON conversation_participants
    FOR UPDATE USING (user_id = auth.uid());

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = conversations.id
            AND user_id = auth.uid()
        )
    );
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (true);

-- Badges - public read
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);

-- User badges policies
CREATE POLICY "Anyone can view user badges" ON user_badges FOR SELECT USING (true);

-- Activities policies
CREATE POLICY "Anyone can view public activities" ON activities
    FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "Users can create activities" ON activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity likes/comments
CREATE POLICY "Anyone can view activity likes" ON activity_likes FOR SELECT USING (true);
CREATE POLICY "Users can like activities" ON activity_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON activity_likes
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view activity comments" ON activity_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON activity_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit own comments" ON activity_comments
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON activity_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Book clubs policies
CREATE POLICY "Anyone can view public book clubs" ON book_clubs
    FOR SELECT USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "Users can create book clubs" ON book_clubs
    FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Club admins can update" ON book_clubs
    FOR UPDATE USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM book_club_members
            WHERE club_id = book_clubs.id AND user_id = auth.uid() AND role = 'admin'
        )
    );

-- Book club members
CREATE POLICY "Anyone can view club members" ON book_club_members FOR SELECT USING (true);
CREATE POLICY "Users can join clubs" ON book_club_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave clubs" ON book_club_members
    FOR DELETE USING (auth.uid() = user_id);

-- Reading challenges
CREATE POLICY "Anyone can view challenges" ON reading_challenges FOR SELECT USING (true);
CREATE POLICY "Users can create challenges" ON reading_challenges
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- User challenges
CREATE POLICY "Anyone can view user challenges" ON user_challenges FOR SELECT USING (true);
CREATE POLICY "Users can join challenges" ON user_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON user_challenges
    FOR UPDATE USING (auth.uid() = user_id);

-- Wishlists
CREATE POLICY "Users can view public wishlists" ON wishlists
    FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "Users can manage own wishlists" ON wishlists
    FOR ALL USING (auth.uid() = user_id);

-- Wishlist items
CREATE POLICY "Users can view wishlist items" ON wishlist_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM wishlists
            WHERE id = wishlist_items.wishlist_id
            AND (is_public = true OR user_id = auth.uid())
        )
    );
CREATE POLICY "Users can manage own wishlist items" ON wishlist_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM wishlists
            WHERE id = wishlist_items.wishlist_id AND user_id = auth.uid()
        )
    );

-- Blocked users
CREATE POLICY "Users can view their blocks" ON blocked_users
    FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others" ON blocked_users
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock" ON blocked_users
    FOR DELETE USING (auth.uid() = blocker_id);

-- =====================================================
-- 16. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update profile stats
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update books read count
    UPDATE profiles
    SET total_books_read = (
        SELECT COUNT(*) FROM books 
        WHERE user_id = NEW.user_id AND reading_status = 'completed'
    )
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating stats when book status changes
CREATE OR REPLACE TRIGGER on_book_status_change
    AFTER INSERT OR UPDATE OF reading_status ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_stats();

-- Function to calculate distance between two users (if PostGIS is available)
CREATE OR REPLACE FUNCTION calculate_distance(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    R CONSTANT DECIMAL := 6371; -- Earth's radius in km
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);
    
    a := SIN(dLat/2) * SIN(dLat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dLon/2) * SIN(dLon/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create activity on book actions
CREATE OR REPLACE FUNCTION create_book_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activities (user_id, activity_type, book_id, is_public)
        VALUES (NEW.user_id, 'book_added', NEW.id, true);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.reading_status != 'completed' AND NEW.reading_status = 'completed' THEN
            INSERT INTO activities (user_id, activity_type, book_id, is_public)
            VALUES (NEW.user_id, 'book_finished', NEW.id, true);
        ELSIF OLD.reading_status != 'currently_reading' AND NEW.reading_status = 'currently_reading' THEN
            INSERT INTO activities (user_id, activity_type, book_id, is_public)
            VALUES (NEW.user_id, 'book_started', NEW.id, true);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_book_change
    AFTER INSERT OR UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION create_book_activity();

-- Function to update reputation after transaction review
CREATE OR REPLACE FUNCTION update_reputation_after_review()
RETURNS TRIGGER AS $$
BEGIN
    -- Update reviewee's reputation
    IF NEW.reviewer_role = 'borrower' THEN
        -- Borrower reviewed owner, update owner's lending reputation
        UPDATE profiles
        SET lending_reputation = (
            SELECT AVG(overall_rating)::DECIMAL(3,2)
            FROM transaction_reviews
            WHERE reviewee_id = NEW.reviewee_id AND reviewer_role = 'borrower'
        ),
        total_books_lent = total_books_lent + 1
        WHERE id = NEW.reviewee_id;
    ELSE
        -- Owner reviewed borrower, update borrower's reputation
        UPDATE profiles
        SET borrowing_reputation = (
            SELECT AVG(overall_rating)::DECIMAL(3,2)
            FROM transaction_reviews
            WHERE reviewee_id = NEW.reviewee_id AND reviewer_role = 'owner'
        ),
        total_books_borrowed = total_books_borrowed + 1
        WHERE id = NEW.reviewee_id;
    END IF;
    
    -- Update overall reputation score
    UPDATE profiles
    SET reputation_score = (
        COALESCE(total_books_read, 0) * 2 +
        COALESCE(total_books_lent, 0) * 10 +
        COALESCE(total_books_borrowed, 0) * 5 +
        (CASE WHEN is_verified THEN 50 ELSE 0 END) +
        (SELECT COUNT(*) * 5 FROM book_reviews WHERE user_id = NEW.reviewee_id)
    )
    WHERE id = NEW.reviewee_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_transaction_review
    AFTER INSERT ON transaction_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reputation_after_review();

-- =====================================================
-- 17. REALTIME SUBSCRIPTIONS (Enable for messaging)
-- =====================================================

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE borrow_requests;
