-- ============================================================
-- PadelElite v2 — Seed Data للاختبار
-- ============================================================
--
-- كيفية الاستخدام:
--   Supabase Dashboard → SQL Editor → الصق وشغّل
--
-- ما سيُنشأ:
--   • موسم واحد (is_current = true)
--   • 4 لاعبين تجريبيين (كلمة المرور: Test1234!)
--   • بطولة ذهبية status='live'
--   • 4 مباريات: 2 done + 1 live + 1 upcoming
--   • player_stats بناءً على نتائج المباريات
--
-- الملف idempotent — يمكن تشغيله أكثر من مرة بأمان
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  -- Fixed UUIDs (predictable, easy to reference)
  v_season UUID := '00000001-0000-0000-0000-000000000001';
  v_tourn  UUID := '00000002-0000-0000-0000-000000000001';
  v_p1     UUID := '00000003-0000-0000-0000-000000000001'; -- محمد الغامدي
  v_p2     UUID := '00000003-0000-0000-0000-000000000002'; -- فهد العتيبي
  v_p3     UUID := '00000003-0000-0000-0000-000000000003'; -- خالد الزهراني
  v_p4     UUID := '00000003-0000-0000-0000-000000000004'; -- عمر السبيعي
  v_m1     UUID := '00000004-0000-0000-0000-000000000001'; -- ربع النهائي (done, A wins)
  v_m2     UUID := '00000004-0000-0000-0000-000000000002'; -- نصف النهائي (done, B wins)
  v_m3     UUID := '00000004-0000-0000-0000-000000000003'; -- النهائي (live)
  v_m4     UUID := '00000004-0000-0000-0000-000000000004'; -- ربع النهائي آخر (upcoming)
  v_pw     TEXT;
BEGIN

  v_pw := crypt('Test1234!', gen_salt('bf', 10));

  -- ────────────────────────────────────────────────────────
  -- 1. Auth Users
  -- ────────────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at
  ) VALUES
    (v_p1, '00000000-0000-0000-0000-000000000000',
     'authenticated', 'authenticated',
     'player1@padel.test', v_pw, NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
     false, NOW(), NOW()),
    (v_p2, '00000000-0000-0000-0000-000000000000',
     'authenticated', 'authenticated',
     'player2@padel.test', v_pw, NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
     false, NOW(), NOW()),
    (v_p3, '00000000-0000-0000-0000-000000000000',
     'authenticated', 'authenticated',
     'player3@padel.test', v_pw, NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
     false, NOW(), NOW()),
    (v_p4, '00000000-0000-0000-0000-000000000000',
     'authenticated', 'authenticated',
     'player4@padel.test', v_pw, NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
     false, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW());

  -- Auth identities (needed for email/password login)
  INSERT INTO auth.identities (
    id, user_id, provider_id, provider,
    identity_data, created_at, updated_at, last_sign_in_at
  )
  SELECT
    gen_random_uuid(), usr.id, usr.email, 'email',
    jsonb_build_object('sub', usr.id::text, 'email', usr.email),
    NOW(), NOW(), NULL
  FROM (VALUES
    (v_p1, 'player1@padel.test'),
    (v_p2, 'player2@padel.test'),
    (v_p3, 'player3@padel.test'),
    (v_p4, 'player4@padel.test')
  ) AS usr(id, email)
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = usr.id
  );

  -- ────────────────────────────────────────────────────────
  -- 2. Profiles
  -- ────────────────────────────────────────────────────────
  INSERT INTO profiles (id, full_name, short_name, role, club, age, country)
  VALUES
    (v_p1, 'محمد الغامدي',  'م.الغامدي',  'player', 'نادي الرياض',  28, 'KSA'),
    (v_p2, 'فهد العتيبي',   'ف.العتيبي',   'player', 'نادي الاتحاد', 25, 'KSA'),
    (v_p3, 'خالد الزهراني', 'خ.الزهراني', 'player', 'نادي النصر',  30, 'KSA'),
    (v_p4, 'عمر السبيعي',   'ع.السبيعي',   'player', 'نادي الهلال', 27, 'KSA')
  ON CONFLICT (id) DO UPDATE
    SET full_name  = EXCLUDED.full_name,
        short_name = EXCLUDED.short_name,
        club       = EXCLUDED.club,
        age        = EXCLUDED.age;

  -- ────────────────────────────────────────────────────────
  -- 3. Season
  -- ────────────────────────────────────────────────────────
  -- أوقف الموسم الحالي إن وُجد
  UPDATE seasons SET is_current = false
  WHERE is_current = true AND id <> v_season;

  INSERT INTO seasons (id, name, start_date, end_date, is_current)
  VALUES (v_season, '٢٠٢٦', '2026-01-01', '2026-12-31', true)
  ON CONFLICT (id) DO UPDATE SET is_current = true;

  -- ────────────────────────────────────────────────────────
  -- 4. Tournament
  -- ────────────────────────────────────────────────────────
  INSERT INTO tournaments (
    id, season_id, name, category, status,
    start_date, end_date, venue, prize, max_players,
    description
  ) VALUES (
    v_tourn, v_season,
    'بطولة الرياض الذهبية ٢٠٢٦', 'ذهبية', 'live',
    '2026-05-01', '2026-05-15',
    'ملاعب المملكة — الرياض',
    '٨٠٬٠٠٠ ر.س',
    16,
    'البطولة الذهبية الأولى لموسم ٢٠٢٦. أقوى لاعبي المملكة يتنافسون على اللقب.'
  )
  ON CONFLICT (id) DO NOTHING;

  -- ────────────────────────────────────────────────────────
  -- 5. Tournament Registrations
  -- ────────────────────────────────────────────────────────
  INSERT INTO tournament_registrations (tournament_id, player_id, status)
  VALUES
    (v_tourn, v_p1, 'confirmed'),
    (v_tourn, v_p2, 'confirmed'),
    (v_tourn, v_p3, 'confirmed'),
    (v_tourn, v_p4, 'confirmed')
  ON CONFLICT (tournament_id, player_id) DO NOTHING;

  -- ────────────────────────────────────────────────────────
  -- 6. Matches
  -- ────────────────────────────────────────────────────────
  INSERT INTO matches (
    id, tournament_id, round, court, status,
    player_a1_id, player_a2_id,
    player_b1_id, player_b2_id,
    winner_team, scheduled_at
  ) VALUES
    -- ربع النهائي (done) → م.الغامدي+ف.العتيبي (A) vs خ.الزهراني+ع.السبيعي (B) → A يفوز
    (v_m1, v_tourn, 'ربع النهائي', '1', 'done',
     v_p1, v_p2, v_p3, v_p4, 'A',
     NOW() - INTERVAL '4 days'),

    -- نصف النهائي (done) → نفس الفريقين تقريباً → B يفوز هذه المرة
    (v_m2, v_tourn, 'نصف النهائي', '1', 'done',
     v_p1, v_p2, v_p3, v_p4, 'B',
     NOW() - INTERVAL '2 days'),

    -- النهائي (live) → م.الغامدي+خ.الزهراني (A) vs ف.العتيبي+ع.السبيعي (B)
    (v_m3, v_tourn, 'النهائي', '1', 'live',
     v_p1, v_p3, v_p2, v_p4, NULL,
     NOW()),

    -- ربع النهائي آخر (upcoming)
    (v_m4, v_tourn, 'ربع النهائي', '2', 'upcoming',
     v_p2, v_p3, v_p1, v_p4, NULL,
     NOW() + INTERVAL '2 days')
  ON CONFLICT (id) DO NOTHING;

  -- ────────────────────────────────────────────────────────
  -- 7. Match Sets
  -- ────────────────────────────────────────────────────────

  -- م1 (ربع نهائي، A يفوز 2-0): ٦-٣، ٦-٤
  INSERT INTO match_sets (match_id, set_number, score_a, score_b)
  VALUES
    (v_m1, 1, 6, 3),
    (v_m1, 2, 6, 4)
  ON CONFLICT (match_id, set_number) DO UPDATE
    SET score_a = EXCLUDED.score_a, score_b = EXCLUDED.score_b;

  -- م2 (نصف نهائي، B يفوز 2-1): ٦-٣ · ٣-٦ · ٢-٦
  -- (A wins set1, B wins set2 & set3 → B wins overall)
  INSERT INTO match_sets (match_id, set_number, score_a, score_b)
  VALUES
    (v_m2, 1, 6, 3),
    (v_m2, 2, 3, 6),
    (v_m2, 3, 2, 6)
  ON CONFLICT (match_id, set_number) DO UPDATE
    SET score_a = EXCLUDED.score_a, score_b = EXCLUDED.score_b;

  -- م3 (النهائي، live) — شوط أول جارٍ
  INSERT INTO match_sets (match_id, set_number, score_a, score_b)
  VALUES (v_m3, 1, 4, 3)
  ON CONFLICT (match_id, set_number) DO UPDATE
    SET score_a = EXCLUDED.score_a, score_b = EXCLUDED.score_b;

  -- ────────────────────────────────────────────────────────
  -- 8. Player Stats
  -- ────────────────────────────────────────────────────────
  --
  -- نتيجة المباريات:
  --   م1 (ربع نهائي): A يفوز → p1,p2 يكسبان 50 نقطة | p3,p4 يخسران 10 نقاط
  --   م2 (نصف نهائي): B يفوز → p3,p4 يكسبان 100 نقطة | p1,p2 يخسران 20 نقطة
  --
  --   p1 (م.الغامدي):  50 + 20 = 70 نقطة | 1ف 1خ | streak=-1 (آخر مباراة خسارة)
  --   p2 (ف.العتيبي):  50 + 20 = 70 نقطة | 1ف 1خ | streak=-1
  --   p3 (خ.الزهراني): 10 + 100 = 110 نقطة | 1ف 1خ | streak=+1 (آخر مباراة فوز)
  --   p4 (ع.السبيعي):  10 + 100 = 110 نقطة | 1ف 1خ | streak=+1
  --
  --   الترتيب: p3=1 (110)، p4=2 (110)، p1=3 (70)، p2=4 (70)
  --
  INSERT INTO player_stats (
    player_id, season_id,
    points, wins, losses,
    rating, rank, prev_rank, streak
  ) VALUES
    (v_p1, v_season,  70, 1, 1, 6.5, 3, 4, -1),
    (v_p2, v_season,  70, 1, 1, 6.3, 4, 3, -1),
    (v_p3, v_season, 110, 1, 1, 6.8, 1, 2,  1),
    (v_p4, v_season, 110, 1, 1, 6.6, 2, 1,  1)
  ON CONFLICT (player_id, season_id) DO UPDATE
    SET points    = EXCLUDED.points,
        wins      = EXCLUDED.wins,
        losses    = EXCLUDED.losses,
        rating    = EXCLUDED.rating,
        rank      = EXCLUDED.rank,
        prev_rank = EXCLUDED.prev_rank,
        streak    = EXCLUDED.streak;

END $$;

-- ────────────────────────────────────────────────────────────
-- Verify — عدد الصفوف في كل جدول
-- ────────────────────────────────────────────────────────────
SELECT
  'seasons'        AS table_name, COUNT(*)::int AS rows FROM seasons                    UNION ALL
SELECT 'profiles',                COUNT(*)             FROM profiles WHERE role='player' UNION ALL
SELECT 'tournaments',             COUNT(*)             FROM tournaments                  UNION ALL
SELECT 'matches',                 COUNT(*)             FROM matches                      UNION ALL
SELECT 'match_sets',              COUNT(*)             FROM match_sets                   UNION ALL
SELECT 'player_stats',            COUNT(*)             FROM player_stats                 UNION ALL
SELECT 'registrations',           COUNT(*)             FROM tournament_registrations
ORDER BY table_name;
