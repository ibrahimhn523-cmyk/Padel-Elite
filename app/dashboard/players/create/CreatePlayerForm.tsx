'use client'

import { useTransition, useState } from 'react'
import { createPlayer } from '@/lib/actions/players'

export function CreatePlayerForm() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    const age = fd.get('age') as string
    const input = {
      full_name:  (fd.get('full_name')  as string).trim(),
      short_name: (fd.get('short_name') as string).trim() || undefined,
      club:       (fd.get('club')       as string).trim() || undefined,
      age:        age ? parseInt(age, 10) : undefined,
      country:    (fd.get('country')    as string).trim() || undefined,
      email:      (fd.get('email')      as string).trim(),
      password:   fd.get('password')    as string,
    }

    startTransition(async () => {
      const res = await createPlayer(input)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      <div style={s.grid}>
        <Field name="full_name"  label="الاسم الكامل *"    type="text"     required placeholder="محمد الغامدي" />
        <Field name="short_name" label="الاسم المختصر"     type="text"     placeholder="م. الغامدي" />
        <Field name="club"       label="النادي"             type="text"     placeholder="نادي الرياض" />
        <Field name="country"    label="الدولة"             type="text"     placeholder="KSA" />
        <Field name="age"        label="العمر"              type="number"   placeholder="25" min={10} max={80} />
        <div /> {/* spacer */}
        <Field name="email"      label="البريد الإلكتروني *" type="email"  required placeholder="player@example.com" />
        <Field name="password"   label="كلمة المرور *"      type="password" required placeholder="8 أحرف على الأقل" minLength={8} />
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      <button type="submit" disabled={pending} style={{ ...s.btn, opacity: pending ? 0.6 : 1 }}>
        {pending ? 'جارٍ الإنشاء...' : '+ إنشاء اللاعب'}
      </button>
    </form>
  )
}

function Field({
  name, label, type, required, placeholder, min, max, minLength,
}: {
  name: string; label: string; type: string
  required?: boolean; placeholder?: string
  min?: number; max?: number; minLength?: number
}) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        minLength={minLength}
        style={s.input}
      />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  form:     { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  grid:     { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' },
  field:    { display: 'flex', flexDirection: 'column', gap: '0.375rem' },
  label:    { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)' },
  input:    {
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
  errorBox: {
    padding: '0.75rem 1rem',
    background: 'var(--danger-dim)',
    border: '1px solid var(--danger)',
    borderRadius: 'var(--radius)',
    color: 'var(--danger)',
    fontSize: '0.875rem',
  },
  btn: {
    alignSelf: 'flex-start',
    padding: '0.75rem 1.75rem',
    background: 'var(--accent)',
    color: '#000',
    fontWeight: 700,
    fontSize: '0.9375rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    cursor: 'pointer',
  },
}
