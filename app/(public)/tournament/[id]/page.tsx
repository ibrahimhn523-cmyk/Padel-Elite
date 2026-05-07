import { notFound } from 'next/navigation'
import {
  getTournament,
  getSponsors,
  getTournamentMatches,
  getTournamentRegistrations,
} from '@/lib/queries/tournaments'
import { SharePage } from '@/components/features/tournaments/SharePage'

export const revalidate = 30

export default async function PublicTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const tournament = await getTournament(id)
  if (!tournament || tournament.status === 'draft') notFound()

  const [sponsors, matches, registrations] = await Promise.all([
    getSponsors(id),
    getTournamentMatches(id),
    getTournamentRegistrations(id),
  ])

  return (
    <div style={{ padding: '1.5rem 1rem' }}>
      <SharePage
        tournament={tournament}
        matches={matches}
        registrations={registrations}
        sponsors={sponsors}
      />
    </div>
  )
}
