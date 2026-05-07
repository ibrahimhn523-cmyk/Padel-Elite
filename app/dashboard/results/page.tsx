import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMatches } from '@/lib/queries/matches'
import { ResultsForm } from '@/components/features/results/ResultsForm'

export const revalidate = 0

export default async function ResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Live first, then upcoming
  const [live, upcoming] = await Promise.all([
    getMatches({ status: 'live' }),
    getMatches({ status: 'upcoming' }),
  ])
  const matches = [...live, ...upcoming]

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>إدخال النتائج</h1>
          <p style={s.sub}>
            {live.length > 0 && <span style={s.liveBadge}>● {live.length} مباشر</span>}
            {matches.length} مباراة متاحة
          </p>
        </div>
      </div>

      <ResultsForm matches={matches} />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:      { padding: '2rem', direction: 'rtl', maxWidth: 720 },
  header:    { marginBottom: '1.5rem' },
  title:     { fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' },
  sub:       { fontSize: '0.875rem', color: 'var(--text-2)', marginTop: '0.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' },
  liveBadge: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '99px', border: '1px solid rgba(239,68,68,0.3)' },
}
