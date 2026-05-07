import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getTournament,
  getSponsors,
  getTournamentMatches,
  getTournamentRegistrations,
} from '@/lib/queries/tournaments'
import { SharePage } from '@/components/features/tournaments/SharePage'
import { StatusControl } from './StatusControl'

export const revalidate = 30

export default async function DashboardTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  const tournament = await getTournament(id)
  // Draft only visible to admin
  if (!tournament || (tournament.status === 'draft' && !isAdmin)) notFound()

  const [sponsors, matches, registrations] = await Promise.all([
    getSponsors(id),
    getTournamentMatches(id),
    getTournamentRegistrations(id),
  ])

  return (
    <div style={{ padding: '1.5rem 2rem', direction: 'rtl' }}>
      {isAdmin && (
        <div style={s.adminBar}>
          <span style={s.adminLabel}>لوحة الإدارة</span>
          <div style={s.adminActions}>
            <StatusControl id={id} currentStatus={tournament.status} />
          </div>
        </div>
      )}

      <SharePage
        tournament={tournament}
        matches={matches}
        registrations={registrations}
        sponsors={sponsors}
        isAdmin={isAdmin}
      />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  adminBar:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1.25rem' },
  adminLabel:   { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  adminActions: { display: 'flex', gap: '0.625rem', alignItems: 'center' },
}
