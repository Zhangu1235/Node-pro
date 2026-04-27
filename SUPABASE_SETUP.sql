-- ============================================================
-- StartupEvents – Supabase Database Setup
-- Safe to run multiple times (idempotent).
-- Run in: Supabase Dashboard > SQL Editor > New Query > Run
-- ============================================================

-- ────────────────────────────────────────────────
-- 1.  USER PROFILES TABLE
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID          NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username    VARCHAR(255)  NOT NULL UNIQUE,
    email       VARCHAR(255)  NOT NULL,
    created_at  TIMESTAMPTZ   DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx  ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_username_idx ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS user_profiles_email_idx    ON public.user_profiles(email);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to run even if they don't exist)
DROP POLICY IF EXISTS "Users can view their own profile"      ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile"    ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles"  ON public.user_profiles;

-- Recreate policies
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all profiles"
    ON public.user_profiles
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- ────────────────────────────────────────────────
-- 2.  FEEDBACK TABLE
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email       VARCHAR(255)  NOT NULL,
    subject     VARCHAR(255)  NOT NULL,
    message     TEXT          NOT NULL,
    rating      INTEGER       CHECK (rating >= 1 AND rating <= 5),
    category    VARCHAR(50)   DEFAULT 'general',
    created_at  TIMESTAMPTZ   DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feedback_user_id_idx    ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback(created_at);
CREATE INDEX IF NOT EXISTS feedback_category_idx   ON public.feedback(category);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own feedback"    ON public.feedback;
DROP POLICY IF EXISTS "Users can create feedback"            ON public.feedback;
DROP POLICY IF EXISTS "Service role can manage all feedback" ON public.feedback;

-- Recreate policies
CREATE POLICY "Users can view their own feedback"
    ON public.feedback FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
    ON public.feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all feedback"
    ON public.feedback
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

GRANT ALL ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;

-- ────────────────────────────────────────────────
-- 3.  AUTO-UPDATE updated_at TRIGGER (optional)
-- ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_feedback_updated_at ON public.feedback;
CREATE TRIGGER set_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ────────────────────────────────────────────────
-- Done! Tables, policies, and triggers are ready.
-- ────────────────────────────────────────────────
