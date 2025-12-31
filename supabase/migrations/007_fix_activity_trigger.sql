-- Fix: Make the create_book_activity trigger more robust
-- It should only create activities if the user's profile exists
-- Also ensures no activity tracking if profile doesn't exist

CREATE OR REPLACE FUNCTION create_book_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create activity if user has a profile
    IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.user_id) THEN
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
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
