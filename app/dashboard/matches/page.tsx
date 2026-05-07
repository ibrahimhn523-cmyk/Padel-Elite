import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMatches } from '@/lib/queries/matches'
import { MatchesClient } from './MatchesClient'

export const revalidate = 60

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const matches = await getMatches()

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>المباريات</h1>
          <p style={s.sub}>{matches.length} مباراة</p>
        </div>
      </div>

      <MatchesClient matches={matches} />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:   { padding: '2rem', direction: 'rtl' },
  header: { marginBottom: '1.5rem' },
  title:  { fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' },
  sub:    { fontSize: '0.875rem', color: 'var(--text-2)', marginTop: '0.25rem' },
}
