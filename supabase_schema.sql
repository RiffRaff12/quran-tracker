CREATE TABLE surah_revisions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    surah_number INT NOT NULL,
    memorized BOOLEAN DEFAULT false NOT NULL,
    last_revision TIMESTAMPTZ,
    next_revision TIMESTAMPTZ,
    interval INT DEFAULT 1,
    ease_factor REAL DEFAULT 2.5,
    learning_step INT DEFAULT 0,
    consecutive_correct INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, surah_number)
);

CREATE TABLE revision_history (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    surah_number INT NOT NULL,
    revision_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    difficulty TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create profiles table for user onboarding and preferences
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    has_completed_onboarding BOOLEAN DEFAULT false NOT NULL,
    memorised_surahs INTEGER[] DEFAULT '{}',
    goals JSONB DEFAULT '{"dailyRevisions": 5, "weeklyRevisions": 20, "memorizePerMonth": 1}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Enable Row Level Security on profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
CREATE POLICY "Users can view their own profile."
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile."
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile."
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to update the `updated_at` timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update `updated_at` on `surah_revisions` table
CREATE TRIGGER on_surah_revisions_updated
BEFORE UPDATE ON surah_revisions
FOR EACH ROW
EXECUTE PROCEDURE handle_updated_at();

-- Trigger to automatically update `updated_at` on `profiles` table
CREATE TRIGGER on_user_profiles_updated
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE PROCEDURE handle_updated_at();

-- Enable Row Level Security
ALTER TABLE surah_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_history ENABLE ROW LEVEL SECURITY;

-- Policies for `surah_revisions`
CREATE POLICY "Users can view their own revision data."
ON surah_revisions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own revision data."
ON surah_revisions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own revision data."
ON surah_revisions FOR UPDATE
USING (auth.uid() = user_id);

-- Policies for `revision_history`
CREATE POLICY "Users can view their own revision history."
ON revision_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own revision history."
ON revision_history FOR INSERT
WITH CHECK (auth.uid() = user_id); 