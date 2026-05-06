import { getCurrentSeason, getLeaderboard } from '@/lib/queries/leaderboard'
import { Podium } from '@/components/features/leaderboard/Podium'
import { LeaderboardTable } from '@/components/features/leaderboard/LeaderboardTable'

export const revalidate = 60

export default async function PublicLeaderboardPage() {
  const season = await getCurrentSeason()

  if (!season) {
    return (
      <div style={s.page}>
        <div style={s.noSeason}>
          <span style={{ fontSize: '2.5rem' }}>📅</span>
          <h2 style={s.noSeasonTitle}>لا يوجد موسم نشط</h2>
          <p style={s.noSeasonSub}>سيظهر الترتيب عند بدء الموسم الجديد</p>
        </div>
      </div>
    )
  }

  const entries = await getLeaderboard(season.id)
  const top3 = entries.slice(0, 3)

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>الترتيب العام</h1>
          <p style={s.subtitle}>موسم {season.name}</p>
        </div>
        <span style={s.badge}>{entries.length} لاعب</span>
      </div>

      {/* Podium */}
      {top3.length === 3 && (
        <div style={s.podiumWrap}>
          <Podium top3={top3} />
        </div>
      )}

      {/* Table */}
      <div style={s.tableSection}>
        <LeaderboardTable entries={entries} />
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '2rem 1rem 4rem',
    direction: 'rtl',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--text-1)',
    margin: 0,
    letterSpacing: '-0.03em',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-2)',
    marginTop: '0.25rem',
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '99px',
    background: 'var(--surface-2)',
    color: 'var(--text-2)',
    border: '1px solid var(--border)',
    marginTop: '0.375rem',
  },
  podiumWrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: '1.25rem',
    overflow: 'hidden',
  },
  tableSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  noSeason: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '6rem 1rem',
    textAlign: 'center',
  },
  noSeasonTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-1)',
    margin: 0,
  },
  noSeasonSub: {
    fontSize: '0.9rem',
    color: 'var(--text-2)',
    margin: 0,
  },
}
