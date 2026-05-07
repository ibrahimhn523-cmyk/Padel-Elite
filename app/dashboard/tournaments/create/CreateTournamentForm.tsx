'use client'

import { useState, useTransition } from 'react'
import { createTournament } from '@/lib/actions/tournaments'
import type { TournamentCategory } from '@/lib/queries/tournaments'

type Season = { id: string; name: string; is_current: boolean }

const CATEGORIES: TournamentCategory[] = ['ذهبية', 'فضية', 'برونزية']

const PRESET_COVERS: { label: string; value: string }[] = [
  { label: 'ذهبية',    value: 'linear-gradient(135deg, #78350F 0%, #F59E0B 50%, #92400E 100%)' },
  { label: 'فضية',     value: 'linear-gradient(135deg, #1E293B 0%, #94A3B8 50%, #334155 100%)' },
  { label: 'برونزية',  value: 'linear-gradient(135deg, #292524 0%, #CD7C3C 50%, #431407 100%)' },
  { label: 'بنفسجي',   value: 'linear-gradient(135deg, #1E1B4B 0%, #7C3AED 50%, #312E81 100%)' },
  { label: 'أزرق',     value: 'linear-gradient(135deg, #0C4A6E 0%, #38BDF8 50%, #075985 100%)' },
  { label: 'أخضر',     value: 'linear-gradient(135deg, #14532D 0%, #22C55E 50%, #15803D 100%)' },
]

export function CreateTournamentForm({ seasons }: { seasons: Season[] }) {
  const [category, setCategory]       = useState<TournamentCategory>('ذهبية')
  const [coverStyle, setCoverStyle]   = useState(PRESET_COVERS[0].value)
  const [error, setError]             = useState<string | null>(null)
  const [isPending, startT]           = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    startT(async () => {
      const res = await createTournament({
        name:        fd.get('name') as string,
        category,
        season_id:   (fd.get('season_id') as string) || undefined,
        start_date:  (fd.get('start_date') as string) || undefined,
        end_date:    (fd.get('end_date') as string)   || undefined,
        venue:       (fd.get('venue') as string)      || undefined,
        prize:       (fd.get('prize') as string)      || undefined,
        max_players: Number(fd.get('max_players'))    || 32,
        description: (fd.get('description') as string)|| undefined,
        cover_style: coverStyle,
      })
      if (res?.error) setError(res.error)
      // On success → redirect happens server-side
    })
  }

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      {/* Name */}
      <Field label="اسم البطولة *">
        <input name="name" required placeholder="بطولة الفجر الذهبي" style={s.input} />
      </Field>

      {/* Category */}
      <Field label="الفئة *">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {CATEGORIES.map(c => (
            <button
              key={c} type="button"
              onClick={() => { setCategory(c); setCoverStyle(PRESET_COVERS[CATEGORIES.indexOf(c)].value) }}
              style={{
                ...s.catBtn,
                borderColor: category === c ? 'var(--accent)' : 'var(--border)',
                color:       category === c ? 'var(--accent)' : 'var(--text-2)',
                background:  category === c ? 'var(--accent-dim)' : 'var(--surface-2)',
              }}
            >{c}</button>
          ))}
        </div>
      </Field>

      {/* Cover */}
      <Field label="غلاف البطولة">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {PRESET_COVERS.map(p => (
            <button
              key={p.value} type="button"
              onClick={() => setCoverStyle(p.value)}
              title={p.label}
              style={{
                width: 44, height: 28, borderRadius: 'var(--radius-sm)',
                background: p.value,
                border: `2px solid ${coverStyle === p.value ? 'var(--accent)' : 'transparent'}`,
                cursor: 'pointer', padding: 0,
              }}
            />
          ))}
        </div>
        <div style={{ ...s.coverPreview, background: coverStyle }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            معاينة الغلاف
          </span>
        </div>
      </Field>

      {/* Season */}
      {seasons.length > 0 && (
        <Field label="الموسم">
          <select name="season_id" style={s.input}>
            <option value="">— بدون موسم —</option>
            {seasons.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}{s.is_current ? ' (الحالي)' : ''}
              </option>
            ))}
          </select>
        </Field>
      )}

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Field label="تاريخ البداية">
          <input name="start_date" type="date" style={s.input} />
        </Field>
        <Field label="تاريخ النهاية">
          <input name="end_date" type="date" style={s.input} />
        </Field>
      </div>

      {/* Venue + Prize */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Field label="الملعب / المكان">
          <input name="venue" placeholder="نادي الفجر" style={s.input} />
        </Field>
        <Field label="الجائزة">
          <input name="prize" placeholder="٨٠٬٠٠٠ ر.س" style={s.input} />
        </Field>
      </div>

      {/* Max Players */}
      <Field label="أقصى عدد لاعبين">
        <input name="max_players" type="number" defaultValue={32} min={4} max={256} style={s.input} />
      </Field>

      {/* Description */}
      <Field label="وصف البطولة">
        <textarea name="description" rows={3} placeholder="نبذة عن البطولة..." style={{ ...s.input, resize: 'vertical' }} />
      </Field>

      {error && (
        <div style={s.errorBox}>{error}</div>
      )}

      <button type="submit" disabled={isPending} style={s.submitBtn}>
        {isPending ? 'جاري الإنشاء...' : 'إنشاء البطولة'}
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-2)' }}>{label}</label>
      {children}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  form:         { display: 'flex', flexDirection: 'column', gap: '1.125rem' },
  input:        { padding: '0.75rem 0.875rem', fontSize: '0.9375rem', width: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--text-1)', outline: 'none' },
  catBtn:       { padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: 'var(--radius)', border: '1.5px solid', cursor: 'pointer', transition: 'all 0.12s' },
  coverPreview: { marginTop: '0.5rem', height: 52, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  errorBox:     { padding: '0.75rem 1rem', background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius)', fontSize: '0.875rem', color: '#FCA5A5' },
  submitBtn:    { padding: '0.875rem', background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: '0.9375rem', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'opacity 0.15s', marginTop: '0.5rem' },
}
