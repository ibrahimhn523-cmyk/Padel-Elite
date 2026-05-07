import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlayer, getPlayerMatches } from '@/lib/queries/players'
import { getCurrentSeason } from '@/lib/queries/leaderboard'
import { getPlayerStats } from '@/lib/queries/players'
import { EditProfileForm } from './EditProfileForm'
import Link from 'next/link'

export const revalidate = 60

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [player, season] = await Promise.all([
    getPlayer(user.id),
    getCurrentSeason(),
  ])

  if (!player) redirect('/login')

  const [stats, matches] = await Promise.all([
    season ? getPlayerStats(user.id, season.id) : Promise.resolve(null),
    getPlayerMatches(user.id, 5),
  ])

  const rank       = stats?.rank ?? null
  const initials   = player.full_name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('')
  const rankColor  = rank === 1 ? 'var(--gold)' : rank === 2 ? 'var(--silver)' : rank === 3 ? 'var(--bronze)' : 'var(--accent)'

  return (
    <div style={s.page}>
      {/* ── Hero ── */}
      <div style={s.hero}>
        <div style={s.heroLeft}>
          {player.avatar_url ? (
            <img src={player.avatar_url} alt={player.full_name}
              style={{ ...s.avatar, border: `3px solid ${rankColor}` }} />
          ) : (
            <div style={{ ...s.avatarFallback, borderColor: rankColor, color: rankColor, background: `${rankColor}18` }}>
              {initials}
            </div>
          )}
          <div>
            <h1 style={s.name}>{player.full_name}</h1>
            {player.short_name && <p style={s.shortName}>{player.short_name}</p>}
            <div style={s.metaRow}>
              {player.club    && <span style={s.metaChip}>🏟 {player.club}</span>}
              {player.country && <span style={s.metaChip}>🌍 {player.country}</span>}
              {player.age     && <span style={s.metaChip}>📅 {player.age} سنة</span>}
            </div>
          </div>
        </div>
        {rank && (
          <div style={{ ...s.rankBig, color: rankColor, borderColor: `${rankColor}40`, background: `${rankColor}10` }}>
            <span style={s.rankNum}>#{rank}</span>
            <span style={s.rankLabel}>الترتيب</span>
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div style={s.statsCard}>
          <div style={s.statsHeader}>
            <span style={s.sectionTitle}>إحصائيات الموسم</span>
            {season && <span style={s.seasonName}>{season.name}</span>}
          </div>
          <div style={s.statsGrid}>
            <Stat label="النقاط"   value={ar(stats.points)} />
            <Stat label="انتصارات" value={ar(stats.wins)} />
            <Stat label="خسائر"    value={ar(stats.losses)} />
            <Stat label="التقييم"  value={stats.rating.toFixed(1)} />
          </div>
        </div>
      )}

      {/* ── Edit Form ── */}
      <div style={s.card}>
        <h2 style={s.sectionTitle}>تعديل البيانات</h2>
        <div style={{ marginTop: '1rem' }}>
          <EditProfileForm player={player} />
        </div>
      </div>

      {/* ── Recent Matches ── */}
      {matches.length > 0 && (
        <div style={s.section}>
          <h2 style={s.sectionTitle}>آخر المباريات</h2>
          <div style={s.matchList}>
            {matches.map(m => {
              const resultColor = m.won === true ? 'var(--accent)' : m.won === false ? 'var(--danger)' : 'var(--text-3)'
              const resultLabel = m.won === true ? 'فوز' : m.won === false ? 'خسارة' : 'لم تُلعب'
              const score = m.sets.map(st => `${st.score_a}-${st.score_b}`).join('، ')
              const opp = [m.opponent1, m.opponent2].filter(Boolean).map(p => p!.short_name ?? p!.full_name.split(' ')[0]).join(' / ') || '؟'
              return (
                <div key={m.id} style={row.wrap}>
                  <div style={row.left}>
                    <span style={{ ...row.result, color: resultColor }}>{resultLabel}</span>
                    <div>
                      <div style={row.round}>{m.tournament_name} · {m.round}</div>
                      <div style={row.opp}>ضد: {opp}</div>
                    </div>
                  </div>
                  <div style={row.right}>
                    {score && <span style={row.score}>{score}</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <Link href={`/dashboard/players/${user.id}`} style={s.moreLink}>عرض جميع المباريات ←</Link>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '0.6875rem', color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>
    </div>
  )
}

const ar = (n: number) => n.toLocaleString('ar-SA')

const s: Record<string, React.CSSProperties> = {
  page:         { padding: '2rem', direction: 'rtl', maxWidth: 800 },
  hero:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' },
  heroLeft:     { display: 'flex', alignItems: 'flex-start', gap: '1rem' },
  avatar:       { width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  avatarFallback:{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0, border: '3px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem', fontWeight: 800 },
  name:         { fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-1)', margin: 0 },
  shortName:    { fontSize: '0.875rem', color: 'var(--text-3)', margin: '2px 0 0' },
  metaRow:      { display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' },
  metaChip:     { fontSize: '0.75rem', padding: '2px 8px', borderRadius: '99px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' },
  rankBig:      { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '2px solid', minWidth: 80 },
  rankNum:      { fontSize: '1.75rem', fontWeight: 900, lineHeight: 1 },
  rankLabel:    { fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: 2 },
  statsCard:    { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.25rem' },
  statsHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' },
  sectionTitle: { fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-1)', margin: 0 },
  seasonName:   { fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 600 },
  card:         { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', marginBottom: '1.25rem' },
  section:      { marginBottom: '1.5rem' },
  matchList:    { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' },
  moreLink:     { display: 'inline-block', marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'none' },
}

const row: Record<string, React.CSSProperties> = {
  wrap:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0.875rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', gap: '0.5rem' },
  left:   { display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 },
  result: { fontSize: '0.75rem', fontWeight: 700, minWidth: 44, textAlign: 'center', padding: '3px 8px', borderRadius: '99px', background: 'var(--surface)', flexShrink: 0 },
  round:  { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-1)' },
  opp:    { fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 1 },
  right:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  score:  { fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-2)', direction: 'ltr' },
}
