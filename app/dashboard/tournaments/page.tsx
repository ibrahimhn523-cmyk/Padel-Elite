import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTournaments } from '@/lib/queries/tournaments'
import { TournamentCard } from '@/components/features/tournaments/TournamentCard'
import Link from 'next/link'

export const revalidate = 30

export default async function DashboardTournamentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  // Admin sees all (including draft), players see public only
  const tournaments = await getTournaments(!isAdmin)

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>البطولات</h1>
          <p style={s.sub}>{tournaments.length} بطولة</p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/tournaments/create" style={s.createBtn}>
            + إنشاء بطولة
          </Link>
        )}
      </div>

      {tournaments.length === 0 ? (
        <div style={s.empty}>
          <span style={{ fontSize: '2.5rem' }}>🏆</span>
          <p style={{ color: 'var(--text-2)' }}>لا توجد بطولات بعد</p>
          {isAdmin && (
            <Link href="/dashboard/tournaments/create" style={s.emptyLink}>
              أنشئ أول بطولة
            </Link>
          )}
        </div>
      ) : (
        <div style={s.grid}>
          {tournaments.map(t => (
            <TournamentCard
              key={t.id}
              tournament={t}
              href={`/dashboard/tournaments/${t.id}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:      { padding: '2rem', direction: 'rtl' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  title:     { fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' },
  sub:       { fontSize: '0.875rem', color: 'var(--text-2)', marginTop: '0.25rem' },
  createBtn: {
    padding: '0.625rem 1.25rem',
    background: 'var(--accent)', color: '#000',
    fontWeight: 700, fontSize: '0.875rem',
    borderRadius: 'var(--radius)', textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
  empty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '4rem 1rem', textAlign: 'center' },
  emptyLink: { padding: '0.625rem 1.25rem', background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius)', textDecoration: 'none' },
}
