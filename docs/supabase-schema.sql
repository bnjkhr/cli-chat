-- CLI-Chat Database Schema für Supabase
-- Dieses Schema in der Supabase SQL-Editor einfügen

-- 1. Profiles Tabelle (erweitert Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chaträume
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard-Räume erstellen
INSERT INTO rooms (name, description) VALUES
  ('general', 'Allgemeiner Chatraum'),
  ('random', 'Random Talk'),
  ('dev', 'Developer Chat');

-- 3. Nachrichten
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: Entweder room_id ODER recipient_id muss gesetzt sein
  CONSTRAINT message_type_check CHECK (
    (room_id IS NOT NULL AND recipient_id IS NULL) OR
    (room_id IS NULL AND recipient_id IS NOT NULL)
  )
);

-- 4. Gebannte User
CREATE TABLE bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  banned_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  reason TEXT,
  banned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes für Performance
CREATE INDEX idx_messages_room ON messages(room_id, created_at DESC);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, created_at DESC);
CREATE INDEX idx_messages_user ON messages(user_id, created_at DESC);
CREATE INDEX idx_bans_user ON bans(user_id);
CREATE INDEX idx_profiles_username ON profiles(username);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Profiles: Alle können lesen, nur eigenes Profil updaten
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Messages: User sehen Raum-Nachrichten + eigene PMs
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view room messages and own DMs"
  ON messages FOR SELECT
  USING (
    room_id IS NOT NULL OR           -- Alle Raum-Nachrichten
    user_id = auth.uid() OR          -- Eigene Nachrichten
    recipient_id = auth.uid()        -- An mich gerichtete Nachrichten
  );

CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Rooms: Alle können lesen
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms are viewable by everyone"
  ON rooms FOR SELECT
  USING (true);

-- Nur Admins können Räume erstellen
CREATE POLICY "Admins can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete rooms"
  ON rooms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bans: Nur Admins können sehen und verwalten
ALTER TABLE bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bans"
  ON bans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create bans"
  ON bans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can remove bans"
  ON bans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Functions
-- ============================================

-- Funktion: Check ob User gebannt ist
CREATE OR REPLACE FUNCTION is_user_banned(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM bans WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Update last_seen beim Login
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET last_seen = NOW() WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-update last_seen
-- (Wird vom Server bei jedem connect aufgerufen)
