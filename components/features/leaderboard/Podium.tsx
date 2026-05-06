import type { LeaderboardEntry } from '@/lib/queries/leaderboard'
import Link from 'next/link'

type Props = { top3: LeaderboardEntry[] }

const MEDALS = [
  { pos: 2, color: 'var(--silver)', bg: 'rgba(148,163,184,0.1)', height: 80, crown: false },
  { pos: 1, color: 'var(--gold)',   bg: 'var(--gold-dim)',       height: 110, crown: true },
  { pos: 3, color: 'var(--bronze)', bg: 'rgba(205,124,60,0.1)',  height: 60,  crown: false },
]

export function Podium({ top3 }: Props) {
  // order: 2nd, 1st, 3rd
  const ordered = [top3[1], top3[0], top3[2]]

  return (
    <div style={s.wrap}>
      {MEDALS.map(({ pos, color, bg, height, crown }, i) => {
        const entry = ordered[i]
        if (!entry) return null
        return (
          <div key={pos} style={s.col}>
            {crown && <Crown />}
            <Link href={`/dashboard/players/${entry.player_id}`} style={s.playerLink}>
              <Avatar name={entry.full_name} url={entry.avatar_url} color={color} size={pos === 1 ? 68 : 52} />
              <span style={{ ...s.name, fontSize: pos === 1 ? '0.9375rem' : '0.8125rem' }}>
                {entry.short_name ?? entry.full_name.split(' ')[0]}
              </span>
              {entry.club && <span style={s.club}>{entry.club}</span>}
            </Link>

            <div style={{ ...s.platform, height, borderTopColor: color, background: bg }}>
              <span style={{ ...s.medal, color }}>{pos}</span>
              <span style={s.pts}>{ar(entry.points)}</span>
              <span style={s.ptsLabel}>نقطة</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Avatar({ name, url, color, size }: { name: string; url: string | null; color: string; size: number }) {
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('')
  const dim = `${size}px`

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        style={{ width: dim, height: dim, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}` }}
      />
    )
  }

  return (
    <div style={{
      width: dim, height: dim, borderRadius: '50%',
      background: `${color}22`, border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size > 60 ? '1.25rem' : '0.9375rem',
      fontWeight: 700, color,
    }}>
      {initials}
    </div>
  )
}

function Crown() {
  return (
    <svg width="24" height="20" viewBox="0 0 24 20" fill="none" style={{ marginBottom: 4 }}>
      <path d="M2 16L5 7L9 12L12 3L15 12L19 7L22 16H2Z" fill="var(--gold)" opacity="0.9" />
      <rect x="2" y="16" width="20" height="3" rx="1" fill="var(--gold)" />
    </svg>
  )
}

const ar = (n: number) => n.toLocaleString('ar-SA')

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '1rem',
    padding: '2rem 1rem 0',
    direction: 'ltr',
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    flex: '0 0 auto',
    width: '120px',
  },
  playerLink: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.375rem',
    textDecoration: 'none',
  },
  name: {
    color: 'var(--text-1)',
    fontWeight: 600,
    textAlign: 'center',
    lineHeight: 1.2,
  },
  club: {
    color: 'var(--text-3)',
    fontSize: '0.6875rem',
    textAlign: 'center',
  },
  platform: {
    width: '100%',
    borderTop: '2px solid',
    borderRadius: '6px 6px 0 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    paddingTop: '0.75rem',
  },
  medal: {
    fontSize: '1.375rem',
    fontWeight: 800,
    lineHeight: 1,
  },
  pts: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-1)',
  },
  ptsLabel: {
    fontSize: '0.6875rem',
    color: 'var(--text-3)',
  },
}
