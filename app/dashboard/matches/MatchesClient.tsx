'use client'

import { useState, useMemo } from 'react'
import { MatchRow } from '@/components/features/matches/MatchRow'
import { LiveMatchBanner } from '@/components/features/matches/LiveMatchBanner'
import type { MatchFull, MatchStatus } from '@/lib/utils/match-mapper'

type Filter = 'all' | MatchStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',      label: 'الكل'   },
  { key: 'live',     label: 'مباشر'  },
  { key: 'upcoming', label: 'قادمة'  },
  { key: 'done',     label: 'انتهت'  },
]

export function MatchesClient({ matches }: { matches: MatchFull[] }) {
  const [filter,     setFilter]     = useState<Filter>('all')
  const [tournament, setTournament] = useState('')

  const tournaments = useMemo(() => {
    const seen = new Set<string>()
    const list: { id: string; name: string }[] = []
    for (const m of matches) {
      if (!seen.has(m.tournament_id)) {
        seen.add(m.tournament_id)
        list.push({ id: m.tournament_id, name: m.tournament_name })
      }
    }
    return list
  }, [matches])

  const liveMatches = useMemo(() => matches.filter(m => m.status === 'live'), [matches])

  const filtered = useMemo(() =>
    matches.filter(m => {
      if (filter !== 'all' && m.status !== filter) return false
      if (tournament && m.tournament_id !== tournament) return false
      return true
    }),
  [matches, filter, tournament])

  const ar = (n: number) => n.toLocaleString('ar-SA')

  return (
    <div>
      {liveMatches.length > 0 && (
        <LiveMatchBanner initialMatches={liveMatches} />
      )}

      <div style={s.controls}>
        <div style={s.tabs}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{ ...s.tab, ...(filter === f.key ? s.tabActive : {}) }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {tournaments.length > 1 && (
          <select
            value={tournament}
            onChange={e => setTournament(e.target.value)}
            style={s.select}
          >
            <option value="">كل البطولات</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <span style={{ fontSize: '1.75rem' }}>🎾</span>
          <p style={{ color: 'var(--text-2)', margin: 0 }}>لا توجد مباريات في هذه الفئة</p>
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map(m => <MatchRow key={m.id} match={m} />)}
        </div>
      )}

      <p style={s.count}>{ar(filtered.length)} مباراة</p>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  controls:  { display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' },
  tabs:      { display: 'flex', gap: '0.375rem' },
  tab:       { padding: '0.5rem 0.875rem', fontSize: '0.8125rem', fontWeight: 500, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', cursor: 'pointer', transition: 'all 0.12s' },
  tabActive: { background: 'var(--accent-dim)', borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 700 },
  select:    { padding: '0.5rem 0.75rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--text-2)', cursor: 'pointer', outline: 'none' },
  list:      { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  empty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3rem 1rem' },
  count:     { fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '1rem', textAlign: 'center' },
}
