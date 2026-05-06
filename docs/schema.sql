-- ============================================================
-- PadelElite v2 — Database Schema
-- PostgreSQL via Supabase
-- ============================================================

-- ─────────────────────────────────────────
-- 0. Extensions
-- ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- 1. PROFILES — امتداد لـ auth.users
--    لاعب أو أدمن
-- ─────────────────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  short_name  TEXT,                          -- مثال: ي.ر
  role        TEXT NOT NULL DEFAULT 'player'
                CHECK (role IN ('player', 'admin')),
  club        TEXT,
  age         INTEGER,
  country     TEXT DEFAULT 'KSA',
  avatar_url  TEXT,                          -- Supabase Storage URL
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 2. SEASONS — الموسم (مرجع للترتيب)
-- ─────────────────────────────────────────
CREATE TABLE seasons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,                 -- مثال: ٢٠٢٦
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  is_current  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 3. PLAYER_STATS — إحصائيات اللاعب بالموسم
-- ─────────────────────────────────────────
CREATE TABLE player_stats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  season_id   UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  points      INTEGER DEFAULT 0,
  wins        INTEGER DEFAULT 0,
  losses      INTEGER DEFAULT 0,
  rating      NUMERIC(3,1) DEFAULT 6.0,
  rank        INTEGER,
  prev_rank   INTEGER,
  streak      INTEGER DEFAULT 0,            --양수 = فوز متتالي، سالب = خسارة
  UNIQUE (player_id, season_id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 4. TOURNAMENTS — البطولات
-- ─────────────────────────────────────────
CREATE TABLE tournaments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id    UUID REFERENCES seasons(id),
  name         TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('ذهبية', 'فضية', 'برونزية')),
  status       TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'open', 'live', 'done')),
  start_date   DATE,
  end_date     DATE,
  venue        TEXT,
  prize        TEXT,                         -- نص مثل "٨٠٬٠٠٠ ر.س"
  max_players  INTEGER DEFAULT 32,
  cover_style  TEXT,                         -- CSS gradient string
  description  TEXT,
  winner_id    UUID REFERENCES profiles(id),
  logo_url     TEXT,                         -- Supabase Storage
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 5. SPONSORS — رعاة البطولة
-- ─────────────────────────────────────────
CREATE TABLE sponsors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  tier            TEXT NOT NULL CHECK (tier IN ('ذهبي', 'فضي', 'برونزي')),
  logo_url        TEXT,
  website_url     TEXT,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 6. TOURNAMENT_REGISTRATIONS — تسجيلات اللاعبين في البطولات
-- ─────────────────────────────────────────
CREATE TABLE tournament_registrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'withdrawn')),
  registered_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tournament_id, player_id)
);

-- ─────────────────────────────────────────
-- 7. MATCHES — المباريات
-- ─────────────────────────────────────────
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round           TEXT NOT NULL,             -- ربع النهائي، نصف النهائي، ...
  court           TEXT,
  scheduled_at    TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'upcoming'
                    CHECK (status IN ('upcoming', 'live', 'done')),
  -- الفريق أ
  player_a1_id    UUID REFERENCES profiles(id),
  player_a2_id    UUID REFERENCES profiles(id),
  -- الفريق ب
  player_b1_id    UUID REFERENCES profiles(id),
  player_b2_id    UUID REFERENCES profiles(id),
  -- النتيجة
  winner_team     TEXT CHECK (winner_team IN ('A', 'B')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 8. MATCH_SETS — أشواط كل مباراة
-- ─────────────────────────────────────────
CREATE TABLE match_sets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_number  INTEGER NOT NULL,
  score_a     INTEGER DEFAULT 0,
  score_b     INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (match_id, set_number)
);

-- ─────────────────────────────────────────
-- 9. NEWS — الأخبار والإعلانات
-- ─────────────────────────────────────────
CREATE TABLE news (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT,
  author_id   UUID REFERENCES profiles(id),
  published   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX idx_player_stats_season   ON player_stats(season_id);
CREATE INDEX idx_player_stats_player   ON player_stats(player_id);
CREATE INDEX idx_player_stats_rank     ON player_stats(season_id, rank);
CREATE INDEX idx_matches_tournament    ON matches(tournament_id);
CREATE INDEX idx_matches_status        ON matches(status);
CREATE INDEX idx_match_sets_match      ON match_sets(match_id);
CREATE INDEX idx_registrations_tourn  ON tournament_registrations(tournament_id);
CREATE INDEX idx_sponsors_tournament   ON sponsors(tournament_id, display_order);

-- ─────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated    BEFORE UPDATE ON profiles    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_player_stats_updated BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tournaments_updated BEFORE UPDATE ON tournaments  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_matches_updated     BEFORE UPDATE ON matches      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_news_updated        BEFORE UPDATE ON news         FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────

ALTER TABLE profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_sets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE news                     ENABLE ROW LEVEL SECURITY;

-- Helper: هل المستخدم الحالي أدمن؟
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ── profiles ──
CREATE POLICY "profiles: public read"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles: self update"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles: admin all"
  ON profiles FOR ALL USING (is_admin());

-- ── seasons ──
CREATE POLICY "seasons: public read"
  ON seasons FOR SELECT USING (true);

CREATE POLICY "seasons: admin write"
  ON seasons FOR INSERT WITH CHECK (is_admin());

-- ── player_stats ──
CREATE POLICY "player_stats: public read"
  ON player_stats FOR SELECT USING (true);

CREATE POLICY "player_stats: admin write"
  ON player_stats FOR ALL USING (is_admin());

-- ── tournaments ──
CREATE POLICY "tournaments: public read non-draft"
  ON tournaments FOR SELECT
  USING (status != 'draft' OR is_admin());

CREATE POLICY "tournaments: admin write"
  ON tournaments FOR ALL USING (is_admin());

-- ── sponsors ──
CREATE POLICY "sponsors: public read"
  ON sponsors FOR SELECT USING (true);

CREATE POLICY "sponsors: admin write"
  ON sponsors FOR ALL USING (is_admin());

-- ── tournament_registrations ──
CREATE POLICY "registrations: player read own"
  ON tournament_registrations FOR SELECT
  USING (player_id = auth.uid() OR is_admin());

CREATE POLICY "registrations: player insert own"
  ON tournament_registrations FOR INSERT
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "registrations: admin all"
  ON tournament_registrations FOR ALL USING (is_admin());

-- ── matches ──
CREATE POLICY "matches: public read"
  ON matches FOR SELECT USING (true);

CREATE POLICY "matches: admin write"
  ON matches FOR ALL USING (is_admin());

-- ── match_sets ──
CREATE POLICY "match_sets: public read"
  ON match_sets FOR SELECT USING (true);

CREATE POLICY "match_sets: admin write"
  ON match_sets FOR ALL USING (is_admin());

-- ── news ──
CREATE POLICY "news: public read published"
  ON news FOR SELECT USING (published = true OR is_admin());

CREATE POLICY "news: admin write"
  ON news FOR ALL USING (is_admin());

-- ─────────────────────────────────────────
-- REALTIME — الجداول اللي تحتاج live updates
-- ─────────────────────────────────────────
-- يُفعَّل من Supabase Dashboard → Database → Replication
-- الجداول: matches, match_sets, player_stats, tournaments
