import Link from 'next/link'
import type { PlayerWithStats } from '@/lib/queries/players'

type Props = { player: PlayerWithStats }

const ar = (n: number) => n.toLocaleString('ar-SA')

function Avatar({ name, url, rank }: { name: string; url: string | null; rank: number | null }) {
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('')
  const color = rank === 1 ? 'var(--gold)' : rank === 2 ? 'var(--silver)' : rank === 3 ? 'var(--bronze)' : 'var(--accent)'

  if (url) {
    return (
      <img src={url} alt={name}
        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}`, flexShrink: 0 }} />
    )
  }
  return (
    <div style={{
      width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
      background: `${color}18`, border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.9375rem', fontWeight: 700, color,
    }}>
      {initials}
    </div>
  )
}

export function PlayerCard({ player: p }: Props) {
  const s = p.stats
  const rank = s?.rank ?? null

  return (
    <Link href={`/dashboard/players/${p.id}`} style={card.wrap}>
      <div style={card.left}>
        <Avatar name={p.full_name} url={p.avatar_url} rank={rank} />
        <div>
          <div style={card.name}>{p.full_name}</div>
          <div style={card.sub}>
            {p.club ?? p.country ?? 'KSA'}
            {p.age ? ` · ${p.age} سنة` : ''}
          </div>
        </div>
      </div>

      <div style={card.right}>
        {rank ? (
          <div style={{
            ...card.rankChip,
            background: rank <= 3
              ? (rank === 1 ? 'var(--gold-dim)' : rank === 2 ? 'rgba(148,163,184,0.15)' : 'rgba(205,124,60,0.15)')
              : 'var(--surface-2)',
            color: rank === 1 ? 'var(--gold)' : rank === 2 ? 'var(--silver)' : rank === 3 ? 'var(--bronze)' : 'var(--text-2)',
            borderColor: rank <= 3
              ? (rank === 1 ? 'var(--gold)' : rank === 2 ? 'var(--silver)' : 'var(--bronze)')
              : 'var(--border)',
          }}>
            #{ar(rank)}
          </div>
        ) : (
          <div style={{ ...card.rankChip, color: 'var(--text-3)', borderColor: 'var(--border)' }}>—</div>
        )}

        {s && (
          <div style={card.stats}>
            <Stat label="نقطة" value={ar(s.points)} accent />
            <Stat label="ف"    value={ar(s.wins)}   />
            <Stat label="خ"    value={ar(s.losses)}  dim />
            <Stat label="تقييم" value={s.rating.toFixed(1)} />
          </div>
        )}

        {s && s.streak !== 0 && (
          <span style={{
            fontSize: '0.6875rem', fontWeight: 700,
            padding: '2px 7px', borderRadius: '99px',
            background: s.streak > 0 ? 'var(--accent-dim)' : 'var(--danger-dim)',
            color: s.streak > 0 ? 'var(--accent)' : 'var(--danger)',
          }}>
            {ar(Math.abs(s.streak))}{s.streak > 0 ? 'ف' : 'خ'}
          </span>
        )}
      </div>
    </Link>
  )
}

function Stat({ label, value, accent, dim }: { label: string; value: string; accent?: boolean; dim?: boolean }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '0.9375rem', fontWeight: 700,
        color: accent ? 'var(--text-1)' : dim ? 'var(--text-3)' : 'var(--text-2)',
      }}>{value}</div>
      <div style={{ fontSize: '0.625rem', color: 'var(--text-3)', marginTop: 1 }}>{label}</div>
    </div>
  )
}

const card: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.875rem 1rem',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', textDecoration: 'none',
    transition: 'border-color 0.12s',
    gap: '0.75rem',
  },
  left: { display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 },
  name: { fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  sub:  { fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 },
  right: { display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 },
  rankChip: {
    fontSize: '0.8125rem', fontWeight: 800,
    padding: '3px 10px', borderRadius: '99px',
    border: '1.5px solid',
  },
  stats: { display: 'flex', gap: '0.875rem', alignItems: 'center' },
}
