import type { LeaderboardEntry } from '@/lib/queries/leaderboard'
import Link from 'next/link'

type Props = { entries: LeaderboardEntry[] }

export function LeaderboardTable({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div style={s.empty}>
        <span style={s.emptyIcon}>🏆</span>
        <p style={s.emptyText}>لا يوجد لاعبون في الترتيب بعد</p>
      </div>
    )
  }

  return (
    <div style={s.tableWrap}>
      {/* Header */}
      <div style={s.header}>
        <span style={{ ...s.hCell, ...s.rankCol }}>الترتيب</span>
        <span style={{ ...s.hCell, ...s.playerCol }}>اللاعب</span>
        <span style={{ ...s.hCell, ...s.numCol }}>نقاط</span>
        <span style={{ ...s.hCell, ...s.numCol }}>ف</span>
        <span style={{ ...s.hCell, ...s.numCol }}>خ</span>
        <span style={{ ...s.hCell, ...s.numCol, display: 'none' } as React.CSSProperties}>تقييم</span>
      </div>

      {/* Rows */}
      {entries.map((entry, i) => (
        <Row key={entry.player_id} entry={entry} isEven={i % 2 === 1} />
      ))}
    </div>
  )
}

function Row({ entry, isEven }: { entry: LeaderboardEntry; isEven: boolean }) {
  const movement = getRankMovement(entry.rank, entry.prev_rank)

  return (
    <div style={{ ...s.row, background: isEven ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
      {/* Rank chip */}
      <div style={{ ...s.cell, ...s.rankCol }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <RankChip rank={entry.rank} />
          <MovementBadge movement={movement} prev={entry.prev_rank} curr={entry.rank} />
        </div>
      </div>

      {/* Player */}
      <div style={{ ...s.cell, ...s.playerCol }}>
        <Link href={`/dashboard/players/${entry.player_id}`} style={s.playerLink}>
          <SmallAvatar name={entry.full_name} url={entry.avatar_url} rank={entry.rank} />
          <div>
            <div style={s.playerName}>{entry.full_name}</div>
            {entry.club && <div style={s.playerClub}>{entry.club}</div>}
          </div>
          {entry.streak !== 0 && <StreakBadge streak={entry.streak} />}
        </Link>
      </div>

      {/* Points */}
      <div style={{ ...s.cell, ...s.numCol }}>
        <span style={s.points}>{ar(entry.points)}</span>
      </div>

      {/* Wins */}
      <div style={{ ...s.cell, ...s.numCol }}>
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{ar(entry.wins)}</span>
      </div>

      {/* Losses */}
      <div style={{ ...s.cell, ...s.numCol }}>
        <span style={{ color: 'var(--text-3)' }}>{ar(entry.losses)}</span>
      </div>

      {/* Rating — hidden on small; would need media query in real CSS */}
      <div style={{ ...s.cell, ...s.numCol, display: 'none' } as React.CSSProperties}>
        <span style={{ color: 'var(--text-2)' }}>{entry.rating.toFixed(1)}</span>
      </div>
    </div>
  )
}

function RankChip({ rank }: { rank: number }) {
  const style = rank === 1
    ? { color: '#000', background: 'var(--gold)', borderColor: 'var(--gold)' }
    : rank === 2
    ? { color: '#000', background: 'var(--silver)', borderColor: 'var(--silver)' }
    : rank === 3
    ? { color: '#fff', background: 'var(--bronze)', borderColor: 'var(--bronze)' }
    : { color: 'var(--text-2)', background: 'var(--surface-2)', borderColor: 'var(--border-2)' }

  return (
    <span style={{ ...s.chip, ...style }}>{ar(rank)}</span>
  )
}

type Movement = 'up' | 'down' | 'same' | 'new'

function MovementBadge({ movement, prev, curr }: { movement: Movement; prev: number | null; curr: number }) {
  if (movement === 'new') {
    return <span style={{ fontSize: '0.5625rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.02em' }}>جديد</span>
  }
  if (movement === 'up') {
    const diff = prev! - curr
    return <span style={{ fontSize: '0.625rem', color: 'var(--accent)', fontWeight: 700 }}>▴{diff > 0 ? ar(diff) : ''}</span>
  }
  if (movement === 'down') {
    const diff = curr - prev!
    return <span style={{ fontSize: '0.625rem', color: 'var(--danger)', fontWeight: 700 }}>▾{diff > 0 ? ar(diff) : ''}</span>
  }
  return <span style={{ fontSize: '0.625rem', color: 'var(--text-3)' }}>—</span>
}

function StreakBadge({ streak }: { streak: number }) {
  const isWin = streak > 0
  return (
    <span style={{
      fontSize: '0.6875rem',
      fontWeight: 700,
      padding: '1px 6px',
      borderRadius: '99px',
      background: isWin ? 'var(--accent-dim)' : 'var(--danger-dim)',
      color: isWin ? 'var(--accent)' : 'var(--danger)',
      marginRight: '0.25rem',
    }}>
      {ar(Math.abs(streak))}{isWin ? 'ف' : 'خ'}
    </span>
  )
}

function SmallAvatar({ name, url, rank }: { name: string; url: string | null; rank: number }) {
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('')
  const color = rank === 1 ? 'var(--gold)' : rank === 2 ? 'var(--silver)' : rank === 3 ? 'var(--bronze)' : 'var(--accent)'

  if (url) {
    return (
      <img src={url} alt={name} width={36} height={36}
        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${color}`, flexShrink: 0 }} />
    )
  }

  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: `${color}18`, border: `1.5px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.75rem', fontWeight: 700, color,
    }}>
      {initials}
    </div>
  )
}

function getRankMovement(rank: number, prevRank: number | null): Movement {
  if (prevRank === null) return 'new'
  if (rank < prevRank) return 'up'
  if (rank > prevRank) return 'down'
  return 'same'
}

const ar = (n: number) => n.toLocaleString('ar-SA')

const s: Record<string, React.CSSProperties> = {
  tableWrap: {
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    direction: 'rtl',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface-2)',
  },
  hCell: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.12s',
  },
  cell: {
    display: 'flex',
    alignItems: 'center',
  },
  rankCol: { width: 64, flexShrink: 0 },
  playerCol: { flex: 1, minWidth: 0 },
  numCol: { width: 60, flexShrink: 0, justifyContent: 'center' },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: '1.5px solid',
    fontSize: '0.8125rem',
    fontWeight: 700,
  },
  playerLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    textDecoration: 'none',
    minWidth: 0,
  },
  playerName: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-1)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  playerClub: {
    fontSize: '0.75rem',
    color: 'var(--text-3)',
    marginTop: 1,
  },
  points: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: 'var(--text-1)',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '4rem 1rem',
  },
  emptyIcon: { fontSize: '2.5rem' },
  emptyText: { color: 'var(--text-2)', fontSize: '0.9375rem', textAlign: 'center' },
}
