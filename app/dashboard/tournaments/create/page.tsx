import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateTournamentForm } from './CreateTournamentForm'

export default async function CreateTournamentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') redirect('/dashboard/tournaments')

  // Fetch seasons for dropdown
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name, is_current')
    .order('start_date', { ascending: false })

  return (
    <div style={{ padding: '2rem', direction: 'rtl', maxWidth: 600 }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' }}>
          إنشاء بطولة جديدة
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          ستُحفظ كمسودة حتى تفتحها للتسجيل
        </p>
      </div>
      <CreateTournamentForm seasons={seasons ?? []} />
    </div>
  )
}
