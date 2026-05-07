import { getTournaments } from '@/lib/queries/tournaments'
import { TournamentCard } from '@/components/features/tournaments/TournamentCard'

export const revalidate = 60

export default async function PublicTournamentsPage() {
  const tournaments = await getTournaments(true)

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>البطولات</h1>
        <span style={s.count}>{tournaments.length} بطولة</span>
      </div>

      {tournaments.length === 0 ? (
        <div style={s.empty}>
          <span style={{ fontSize: '2.5rem' }}>🏆</span>
          <p style={s.emptyText}>لا توجد بطولات متاحة حالياً</p>
        </div>
      ) : (
        <div style={s.grid}>
          {tournaments.map(t => (
            <TournamentCard key={t.id} tournament={t} href={`/tournament/${t.id}`} />
          ))}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:      { maxWidth: 760, margin: '0 auto', padding: '2rem 1rem 4rem', direction: 'rtl' },
  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' },
  title:     { fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' },
  count:     { fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '99px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
  empty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '5rem 1rem', textAlign: 'center' },
  emptyText: { color: 'var(--text-2)', margin: 0 },
}
