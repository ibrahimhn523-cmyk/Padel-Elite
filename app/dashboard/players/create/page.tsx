import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreatePlayerForm } from './CreatePlayerForm'
import Link from 'next/link'

export default async function CreatePlayerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') redirect('/dashboard/players')

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>إضافة لاعب جديد</h1>
          <p style={s.sub}>سيتم إنشاء حساب جديد للاعب</p>
        </div>
        <Link href="/dashboard/players" style={s.back}>← رجوع</Link>
      </div>

      <div style={s.card}>
        <CreatePlayerForm />
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:   { padding: '2rem', direction: 'rtl', maxWidth: 720 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  title:  { fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' },
  sub:    { fontSize: '0.875rem', color: 'var(--text-2)', marginTop: '0.25rem' },
  back:   { fontSize: '0.875rem', color: 'var(--text-2)', textDecoration: 'none', whiteSpace: 'nowrap' },
  card:   { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.75rem' },
}
