import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllPlayersWithStats } from '@/lib/queries/players'
import { PlayersClient } from './PlayersClient'
import Link from 'next/link'

export const revalidate = 60

export default async function DashboardPlayersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  const isAdmin = profile?.role === 'admin'
  const players = await getAllPlayersWithStats()

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>اللاعبون</h1>
          <p style={s.sub}>{players.length} لاعب مسجّل</p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/players/create" style={s.createBtn}>
            + إضافة لاعب
          </Link>
        )}
      </div>

      <PlayersClient players={players} />
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
}
