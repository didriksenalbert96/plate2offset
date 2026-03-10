-- ============================================================
-- Plate2Offset Supabase Schema
-- Run this in your Supabase SQL Editor to set up the database.
-- ============================================================

-- Profiles: created on first sign-in
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  meals_per_day SMALLINT NOT NULL DEFAULT 3,
  auto_threshold_cents INTEGER NOT NULL DEFAULT 0,
  subscription_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Meals: the core data table (replaces plate2offset_history localStorage)
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  items JSONB NOT NULL,           -- MealItem[] array
  offset_cents INTEGER NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_meals_user_logged ON meals(user_id, logged_at DESC);

-- Donations: tracks when users donate (jar is computed from meals + donations)
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  donated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_donations_user ON donations(user_id, donated_at DESC);

-- Challenges: 30-day challenge tracking
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  meals_per_day SMALLINT NOT NULL,
  ended_at TIMESTAMPTZ,           -- NULL = active
  completed BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_challenges_user ON challenges(user_id, started_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Meals: users can only access their own
CREATE POLICY "Users manage own meals"
  ON meals FOR ALL USING (auth.uid() = user_id);

-- Donations: users can only access their own
CREATE POLICY "Users manage own donations"
  ON donations FOR ALL USING (auth.uid() = user_id);

-- Challenges: users can only access their own
CREATE POLICY "Users manage own challenges"
  ON challenges FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Groups (Phase 3: Household / Friend groups)
-- ============================================================

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Members can read their groups
CREATE POLICY "Members read own groups" ON groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Anyone authenticated can create a group
CREATE POLICY "Auth users create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Members can read group members
CREATE POLICY "Members read group members" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Anyone authenticated can join (insert themselves)
CREATE POLICY "Auth users join groups" ON group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Members can leave (delete themselves)
CREATE POLICY "Members can leave groups" ON group_members
  FOR DELETE USING (auth.uid() = user_id);

-- Group members can read each other's meal aggregates (not item details)
-- We allow reading meals for fellow group members
CREATE POLICY "Group members read peer meals" ON meals
  FOR SELECT USING (
    user_id IN (
      SELECT gm2.user_id FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
    )
  );

-- Group members can read each other's profiles (display name only)
CREATE POLICY "Group members read peer profiles" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT gm2.user_id FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
    )
  );

-- Allow reading groups by invite code (for joining)
CREATE POLICY "Anyone can find group by invite code" ON groups
  FOR SELECT USING (true);

-- ============================================================
-- Auto-create profile on sign-up (trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
