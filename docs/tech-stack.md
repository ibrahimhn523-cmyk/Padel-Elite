# Tech Stack — PadelElite v2

## القرار الأساسي

**Next.js 15 (App Router) + Supabase + Vercel**

---

## Frontend
- **Framework**: Next.js 15 — App Router
- **Styling**: CSS Variables (نفس نظام التصميم الحالي) + Tailwind للـ utilities
- **State**: React Server Components أولاً، Zustand فقط لو احتجنا client-side state معقد
- **Realtime UI**: Supabase Realtime + `useEffect` subscriptions
- **السبب**: الـ UI الحالي جاهز ومتقن — نرحّله بدل ما نبنيه من صفر. App Router يخلينا نستخدم Server Components للبيانات الثابتة وClient Components للـ realtime.

## Backend
- **Runtime**: Next.js Server Actions + Route Handlers
- **لا backend منفصل** — Supabase يكفي للـ business logic البسيط
- **السبب**: المنصة ليست فيها منطق أعمال معقد. كل شيء CRUD + realtime = Supabase يكفي تماماً.

## Database
- **قاعدة البيانات**: PostgreSQL عبر Supabase
- **Hosting**: Supabase (Free tier → Pro لو تجاوزنا 50,000 rows أو 500MB)
- **Realtime**: Supabase Realtime (WebSocket) للنتائج المباشرة
- **Storage**: Supabase Storage لشعار الموقع وصور اللاعبين
- **السبب**: RLS يحل مشكلة الـ multi-role (player/admin) بدون server-side auth middleware. Realtime جاهز بدون إعداد.

## Authentication
- **المزود**: Supabase Auth
- **الأدوار**: `admin` و `player` عبر custom claims في JWT
- **السبب**: متكامل مع RLS مباشرة. Magic Link أو Email/Password حسب التفضيل.

## Deployment
- **Hosting**: Vercel (Hobby مجاناً، Pro عند الحاجة)
- **CI/CD**: GitHub → Vercel auto-deploy
- **Domain**: يتضاف لاحقاً عبر Vercel Domains
- **السبب**: أسرع deploy وأقل إعداداً مع Next.js.

## خدمات خارجية
- **Supabase Storage**: شعارات + صور اللاعبين
- بدون أي API خارجي مدفوع في المرحلة الأولى

---

## حدود Free Tier (مهم)

| الخدمة | الحد المجاني | يكفي لـ |
|--------|-------------|---------|
| Supabase DB | 500MB | آلاف المباريات |
| Supabase Auth | 50,000 MAU | أكثر من كافي |
| Supabase Realtime | 200 concurrent connections | كافي للبطولات |
| Vercel | 100GB bandwidth | أكثر من كافي |
