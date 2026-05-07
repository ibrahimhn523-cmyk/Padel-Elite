'use client'

import { useTransition, useState } from 'react'
import { updateProfile } from '@/lib/actions/players'
import type { PlayerProfile } from '@/lib/queries/players'

export function EditProfileForm({ player }: { player: PlayerProfile }) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaved(false)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const age = fd.get('age') as string

    startTransition(async () => {
      const res = await updateProfile({
        id:         player.id,
        full_name:  (fd.get('full_name')  as string).trim() || undefined,
        short_name: fd.get('short_name')  as string,
        club:       fd.get('club')        as string,
        age:        age ? parseInt(age, 10) : undefined,
        country:    (fd.get('country')    as string).trim() || undefined,
      })
      if (res?.error) setError(res.error)
      else setSaved(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      <div style={s.grid}>
        <Field name="full_name"  label="الاسم الكامل"   defaultValue={player.full_name}          type="text"   required />
        <Field name="short_name" label="الاسم المختصر"  defaultValue={player.short_name ?? ''}   type="text"   />
        <Field name="club"       label="النادي"          defaultValue={player.club ?? ''}         type="text"   />
        <Field name="country"    label="الدولة"          defaultValue={player.country ?? ''}      type="text"   />
        <Field name="age"        label="العمر"           defaultValue={player.age?.toString() ?? ''} type="number" min={10} max={80} />
      </div>

      {error && <div style={s.errorBox}>{error}</div>}
      {saved && <div style={s.successBox}>تم حفظ التغييرات بنجاح ✓</div>}

      <button type="submit" disabled={pending} style={{ ...s.btn, opacity: pending ? 0.6 : 1 }}>
        {pending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
      </button>
    </form>
  )
}

function Field({
  name, label, defaultValue, type, required, min, max,
}: {
  name: string; label: string; defaultValue?: string; type: string
  required?: boolean; min?: number; max?: number
}) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        min={min}
        max={max}
        style={s.input}
      />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  form:       { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  grid:       { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem' },
  field:      { display: 'flex', flexDirection: 'column', gap: '0.375rem' },
  label:      { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)' },
  input:      {
    padding: '0.625rem 0.875rem',
    fontSize: '0.9375rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border-2)',
    background: 'var(--surface-2)',
    color: 'var(--text-1)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  errorBox:   { padding: '0.75rem 1rem', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', color: 'var(--danger)', fontSize: '0.875rem' },
  successBox: { padding: '0.75rem 1rem', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', color: 'var(--accent)', fontSize: '0.875rem' },
  btn:        { alignSelf: 'flex-start', padding: '0.625rem 1.5rem', background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer' },
}
