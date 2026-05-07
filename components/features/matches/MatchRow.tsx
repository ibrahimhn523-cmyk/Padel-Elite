import type { MatchFull } from '@/lib/utils/match-mapper'

const ar = (n: number) => n.toLocaleString('ar-SA')

const STATUS_MAP = {
  upcoming: { label: 'قادمة',  color: 'var(--text-3)',  border: 'var(--border)' },
  live:     { label: 'مباشر',  color: 'var(--danger)',  border: 'rgba(239,68,68,0.4)' },
  done:     { label: 'انتهت',  color: 'var(--text-3)',  border: 'var(--border)' },
}

const nameOf = (p: { short_name: string | null; full_name: string } | null) =>
  p ? (p.short_name ?? p.full_name.split(' ')[0]) : '؟'

export function MatchRow({ match: m }: { match: MatchFull }) {
  const st  = STATUS_MAP[m.status]
  const winA = m.winner_team === 'A'
  const winB = m.winner_team === 'B'

  const teamA = [m.player_a1, m.player_a2].filter(Boolean).map(nameOf).join(' / ') || '—'
  const teamB = [m.player_b1, m.player_b2].filter(Boolean).map(nameOf).join(' / ') || '—'

  const score = m.sets.length
    ? m.sets.map(s => `${ar(s.score_a)}-${ar(s.score_b)}`).join(' · ')
    : null

  return (
    <div style={s.wrap}>
      <div style={s.left}>
        <span style={{ ...s.badge, color: st.color, borderColor: st.border }}>
          {m.status === 'live' && <span style={s.dot}>●&nbsp;</span>}
          {st.label}
        </span>

        <div style={s.body}>
          <div style={s.meta}>{m.tournament_name} · {m.round}</div>
          <div style={s.teams}>
            <span style={{ ...s.team, color: winA ? 'var(--accent)' : 'var(--text-1)', fontWeight: winA ? 700 : 500 }}>
              {teamA}
            </span>
            <span style={s.vs}>vs</span>
            <span style={{ ...s.team, color: winB ? 'var(--accent)' : 'var(--text-1)', fontWeight: winB ? 700 : 500 }}>
              {teamB}
            </span>
          </div>
        </div>
      </div>

      <div style={s.right}>
        {score && <span style={s.score}>{score}</span>}
        {m.court && <span style={s.court}>ملعب {m.court}</span>}
        {m.scheduled_at && (
          <span style={s.date}>
            {new Date(m.scheduled_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', gap: '0.75rem' },
  left:  { display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 },
  badge: { fontSize: '0.6875rem', fontWeight: 700, padding: '3px 8px', borderRadius: '99px', background: 'var(--surface-2)', border: '1px solid', flexShrink: 0, whiteSpace: 'nowrap' },
  dot:   { color: 'var(--danger)' },
  body:  { minWidth: 0 },
  meta:  { fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 2 },
  teams: { display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' },
  team:  { fontSize: '0.875rem' },
  vs:    { fontSize: '0.625rem', color: 'var(--text-3)', fontWeight: 700 },
  right: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  score: { fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-2)', direction: 'ltr' },
  court: { fontSize: '0.6875rem', color: 'var(--text-3)' },
  date:  { fontSize: '0.6875rem', color: 'var(--text-3)' },
}
