# هيكل المشروع — PadelElite v2

```
padelelite/
│
├── app/                              # Next.js App Router
│   ├── (public)/                     # صفحات بدون auth
│   │   ├── page.tsx                  # redirect → /leaderboard
│   │   ├── leaderboard/page.tsx      # الترتيب العام
│   │   ├── tournaments/page.tsx      # قائمة البطولات
│   │   └── tournament/[id]/page.tsx  # صفحة بطولة مشتركة (share link)
│   │
│   ├── (auth)/                       # صفحات المصادقة
│   │   ├── login/page.tsx
│   │   └── callback/route.ts         # Supabase Auth callback
│   │
│   ├── dashboard/                    # محمية — لاعب وأدمن
│   │   ├── layout.tsx                # Sidebar + Topbar
│   │   ├── page.tsx                  # Dashboard الرئيسية
│   │   ├── tournaments/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── create/page.tsx       # أدمن فقط
│   │   ├── players/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── create/page.tsx       # أدمن فقط
│   │   ├── matches/page.tsx
│   │   ├── leaderboard/page.tsx
│   │   ├── results/page.tsx          # أدمن فقط — إدخال النتائج
│   │   ├── profile/page.tsx
│   │   └── settings/page.tsx
│   │
│   └── api/                          # Route Handlers
│       ├── auth/callback/route.ts
│       └── results/route.ts          # POST — تسجيل نتيجة + تحديث stats
│
├── components/
│   ├── ui/                           # مكونات عامة (مرحّلة من الـ prototype)
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Icon.tsx
│   │   ├── Stat.tsx
│   │   └── Sparkbars.tsx
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── PublicHeader.tsx
│   │
│   └── features/
│       ├── leaderboard/
│       │   ├── Podium.tsx
│       │   └── LeaderboardTable.tsx
│       ├── tournaments/
│       │   ├── TournamentCard.tsx
│       │   ├── Bracket.tsx           # realtime
│       │   └── SharePage.tsx         # صفحة المشاركة العامة
│       ├── matches/
│       │   ├── MatchRow.tsx
│       │   └── LiveMatchBanner.tsx   # realtime
│       └── results/
│           └── ResultsForm.tsx       # إدخال النتيجة
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # createBrowserClient
│   │   ├── server.ts                 # createServerClient
│   │   └── middleware.ts
│   ├── actions/
│   │   ├── auth.ts                   # login, logout server actions
│   │   ├── results.ts                # submitResult — يحدث match + stats
│   │   └── tournaments.ts            # createTournament, updateStatus
│   ├── queries/
│   │   ├── leaderboard.ts            # getLeaderboard(seasonId)
│   │   ├── tournaments.ts            # getTournaments, getTournament
│   │   ├── matches.ts                # getMatches, getLiveMatches
│   │   └── players.ts               # getPlayer, getPlayerStats
│   └── utils/
│       ├── points.ts                 # حساب النقاط بعد كل مباراة
│       └── ranking.ts                # إعادة حساب الترتيب
│
├── types/
│   ├── database.ts                   # Generated من Supabase CLI
│   └── app.ts                        # Types مخصصة للـ UI
│
├── styles/
│   └── globals.css                   # نفس نظام التصميم الحالي
│
├── middleware.ts                     # حماية routes الـ dashboard
├── next.config.ts
└── .env.local                        # SUPABASE_URL + ANON_KEY
```

---

## قواعد مهمة

### الـ Data Flow
```
Server Component → lib/queries → Supabase (server client)
Client Component → lib/supabase/client → Supabase (browser client)
Mutations        → lib/actions (Server Actions) → Supabase
Realtime         → useEffect + supabase.channel() في Client Components
```

### حماية الـ Routes
```
middleware.ts يفحص الـ session:
- /dashboard/* بدون session → redirect /login
- /dashboard/results بدون role=admin → redirect /dashboard
- /dashboard/*/create بدون role=admin → redirect /dashboard
```

### نظام النقاط (points.ts)
بعد كل مباراة تنتهي:
1. الفائز يكسب نقاط حسب الجولة (ربع نهائي=50، نصف=100، نهائي=200)
2. يتحدث `player_stats.wins/losses/points`
3. يُعاد حساب الترتيب الكامل `ranking.ts`
4. يُحدَّث `prev_rank` قبل ما يتغير `rank`
