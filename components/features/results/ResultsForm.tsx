'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { submitResult } from '@/lib/actions/results'
import type { MatchFull } from '@/lib/queries/matches'

type SetEntry = { score_a: string; score_b: string }

const ar = (n: number) => n.toLocaleString('ar-SA')
const nameOf = (p: { short_name: string | null; full_name: string } | null) =>
  p ? (p.short_name ?? p.full_name.split(' ')[0]) : '؟'

const teamLabel = (m: MatchFull, team: 'A' | 'B') =>
  (team === 'A'
    ? [m.player_a1, m.player_a2]
    : [m.player_b1, m.player_b2]
  ).filter(Boolean).map(nameOf).join(' / ') || '—'

export function ResultsForm({ matches }: { matches: MatchFull[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sets, setSets]             = useState<SetEntry[]>([{ score_a: '', score_b: '' }, { score_a: '', score_b: '' }])
  const [success, setSuccess]       = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)

  const selected = useMemo(() => matches.find(m => m.id === selectedId) ?? null, [matches, selectedId])

  const { setsA, setsB, winnerTeam } = useMemo(() => {
    let setsA = 0, setsB = 0
    for (const s of sets) {
      const a = parseInt(s.score_a) || 0
      const b = parseInt(s.score_b) || 0
      if (a > b) setsA++
      else if (b > a) setsB++
    }
    return {
      setsA,
      setsB,
      winnerTeam: setsA > setsB ? 'A' as const : setsB > setsA ? 'B' as const : null,
    }
  }, [sets])

  function selectMatch(id: string) {
    setSelectedId(id)
    setSets([{ score_a: '', score_b: '' }, { score_a: '', score_b: '' }])
    setSuccess(null)
    setError(null)
  }

  function updateSet(i: number, field: 'score_a' | 'score_b', val: string) {
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  function handleSubmit() {
    if (!selectedId || !selected) return
    setError(null)

    const parsed = sets.map((s, i) => ({
      set_number: i + 1,
      score_a:    parseInt(s.score_a),
      score_b:    parseInt(s.score_b),
    }))

    if (parsed.some(s => isNaN(s.score_a) || isNaN(s.score_b) || s.score_a < 0 || s.score_b < 0)) {
      setError('يرجى إدخال أرقام صحيحة لجميع الأشواط')
      return
    }
    if (!winnerTeam) {
      setError('النتيجة متعادلة — يجب أن يكون هناك فائز')
      return
    }

    const winNames = teamLabel(selected, winnerTeam)

    startTransition(async () => {
      const res = await submitResult(selectedId, parsed)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess(`تم تسجيل النتيجة — الفائز: ${winNames}`)
        setSelectedId(null)
        setSets([{ score_a: '', score_b: '' }, { score_a: '', score_b: '' }])
        router.refresh()
      }
    })
  }

  return (
    <div style={s.wrap}>

      {/* ── Success banner ── */}
      {success && (
        <div style={s.successBanner}>
          <span style={s.successIcon}>✓</span>
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} style={s.dismissBtn}>✕</button>
        </div>
      )}

      {/* ── Match selector ── */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>اختر المباراة</h2>
        {matches.length === 0 ? (
          <div style={s.empty}>
            <span style={{ fontSize: '1.5rem' }}>🎾</span>
            <p style={{ color: 'var(--text-2)', margin: 0 }}>لا توجد مباريات نشطة أو قادمة</p>
          </div>
        ) : (
          <div style={s.matchList}>
            {matches.map(m => (
              <button
                key={m.id}
                onClick={() => selectMatch(m.id)}
                style={{
                  ...s.matchBtn,
                  borderColor: selectedId === m.id
                    ? 'var(--accent)'
                    : m.status === 'live' ? 'rgba(239,68,68,0.5)' : 'var(--border)',
                  background: selectedId === m.id ? 'var(--accent-dim)' : 'var(--surface)',
                }}
              >
                <div style={s.matchBtnInner}>
                  <div style={s.matchBtnLeft}>
                    {m.status === 'live' && <span style={s.liveDot}>●</span>}
                    <div>
                      <div style={s.matchTournament}>{m.tournament_name} · {m.round}</div>
                      <div style={s.matchTeams}>
                        <span style={{ fontWeight: 600 }}>{teamLabel(m, 'A')}</span>
                        <span style={s.vs}>vs</span>
                        <span style={{ fontWeight: 600 }}>{teamLabel(m, 'B')}</span>
                      </div>
                    </div>
                  </div>
                  {selectedId === m.id && <span style={s.check}>✓</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Score entry ── */}
      {selected && (
        <div style={s.card}>
          <h2 style={s.cardTitle}>نتيجة الأشواط</h2>

          {/* Team headers */}
          <div style={s.teamHeader}>
            <span style={s.teamNameA}>{teamLabel(selected, 'A')}</span>
            <span style={s.teamSep}>VS</span>
            <span style={s.teamNameB}>{teamLabel(selected, 'B')}</span>
          </div>

          {/* Sets input */}
          <div style={s.setsGrid}>
            {sets.map((set, i) => (
              <div key={i} style={s.setRow}>
                <span style={s.setLabel}>شوط {ar(i + 1)}</span>
                <input
                  type="number" min={0} max={9}
                  value={set.score_a}
                  onChange={e => updateSet(i, 'score_a', e.target.value)}
                  style={s.scoreInput}
                  placeholder="0"
                />
                <span style={s.scoreDash}>—</span>
                <input
                  type="number" min={0} max={9}
                  value={set.score_b}
                  onChange={e => updateSet(i, 'score_b', e.target.value)}
                  style={s.scoreInput}
                  placeholder="0"
                />
                {sets.length > 1 && (
                  <button
                    onClick={() => setSets(p => p.filter((_, j) => j !== i))}
                    style={s.removeBtn}
                  >✕</button>
                )}
              </div>
            ))}
          </div>

          {sets.length < 3 && (
            <button
              onClick={() => setSets(p => [...p, { score_a: '', score_b: '' }])}
              style={s.addSetBtn}
            >
              + إضافة شوط
            </button>
          )}

          {/* Winner preview */}
          {winnerTeam ? (
            <div style={s.preview}>
              <span style={s.previewTag}>الفائز</span>
              <span style={s.previewName}>{teamLabel(selected, winnerTeam)}</span>
              <span style={s.previewScore}>{ar(setsA)} — {ar(setsB)} أشواط</span>
            </div>
          ) : sets.some(s => s.score_a || s.score_b) ? (
            <div style={{ ...s.preview, background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>لا يوجد فائز بعد — التعادل غير مقبول</span>
            </div>
          ) : null}

          {error && <div style={s.errorBox}>{error}</div>}

          <div style={s.actions}>
            <button
              onClick={handleSubmit}
              disabled={pending || !winnerTeam}
              style={{ ...s.submitBtn, opacity: pending || !winnerTeam ? 0.5 : 1 }}
            >
              {pending ? 'جارٍ الحفظ...' : 'حفظ النتيجة'}
            </button>
            <button onClick={() => setSelectedId(null)} style={s.cancelBtn} disabled={pending}>
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap:          { display: 'flex', flexDirection: 'column', gap: '1.25rem' },

  successBanner: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', color: 'var(--accent)', fontWeight: 600, fontSize: '0.9375rem' },
  successIcon:   { fontSize: '1.125rem', flexShrink: 0 },
  dismissBtn:    { marginRight: 'auto', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.875rem', padding: '0 4px' },

  card:          { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem' },
  cardTitle:     { fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 1rem' },

  matchList:     { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  matchBtn:      { width: '100%', background: 'var(--surface)', border: '1px solid', borderRadius: 'var(--radius)', padding: '0.875rem 1rem', cursor: 'pointer', textAlign: 'right', transition: 'all 0.12s' },
  matchBtnInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' },
  matchBtnLeft:  { display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 },
  liveDot:       { color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 },
  matchTournament:{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 2 },
  matchTeams:    { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-1)', flexWrap: 'wrap' },
  vs:            { fontSize: '0.625rem', color: 'var(--text-3)', fontWeight: 700 },
  check:         { color: 'var(--accent)', fontWeight: 800, fontSize: '1rem', flexShrink: 0 },

  teamHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', marginBottom: '1rem' },
  teamNameA:     { fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-1)', flex: 1 },
  teamSep:       { fontSize: '0.625rem', color: 'var(--text-3)', fontWeight: 700, padding: '0 0.75rem' },
  teamNameB:     { fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-1)', flex: 1, textAlign: 'left' },

  setsGrid:      { display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '0.75rem' },
  setRow:        { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  setLabel:      { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', minWidth: 52 },
  scoreInput:    { width: 72, padding: '0.5rem 0.75rem', fontSize: '1.125rem', fontWeight: 700, textAlign: 'center', borderRadius: 'var(--radius)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box' as const },
  scoreDash:     { fontSize: '1rem', color: 'var(--text-3)', fontWeight: 700 },
  removeBtn:     { background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '0.875rem', padding: '0 4px', marginRight: 'auto' },

  addSetBtn:     { padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-2)', background: 'none', color: 'var(--text-2)', cursor: 'pointer', marginBottom: '1rem' },

  preview:       { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', marginBottom: '1rem' },
  previewTag:    { fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent)', background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: '99px', flexShrink: 0 },
  previewName:   { fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent)', flex: 1 },
  previewScore:  { fontSize: '0.8125rem', color: 'var(--text-2)', flexShrink: 0 },

  errorBox:      { padding: '0.75rem 1rem', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' },

  actions:       { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  submitBtn:     { padding: '0.75rem 2rem', background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: '0.9375rem', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer' },
  cancelBtn:     { padding: '0.75rem 1.25rem', background: 'none', color: 'var(--text-2)', fontWeight: 500, fontSize: '0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer' },

  empty:         { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2.5rem 1rem' },
}
