import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main style={{ padding: '2rem', color: 'var(--text-1)' }}>
      <h1>Dashboard — قريباً</h1>
      <p style={{ color: 'var(--text-2)', marginTop: '0.5rem' }}>
        {user.email}
      </p>
    </main>
  )
}
