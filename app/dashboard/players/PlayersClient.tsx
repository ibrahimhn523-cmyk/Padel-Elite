'use client'

import { useState, useMemo } from 'react'
import { PlayerCard } from '@/components/features/leaderboard/PlayerCard'
import type { PlayerWithStats } from '@/lib/queries/players'

type SortKey = 'rank' | 'name' | 'points' | 'wins'

export function PlayersClient({ players }: { players: PlayerWithStats[] }) {
  const [query, setQuery]   = useState('')
  const [sort, setSort]     = useState<SortKey>('rank')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = q
      ? players.filter(p =>
          p.full_name.toLowerCase().includes(q) ||
          (p.club?.toLowerCase().includes(q) ?? false) ||
          (p.short_name?.toLowerCase().includes(q) ?? false),
        )
      : [...players]

    list.sort((a, b) => {
      if (sort === 'rank') {
        const ra = a.stats?.rank ?? 9999
        const rb = b.stats?.rank ?? 9999
        return ra - rb
      }
      if (sort === 'points') return (b.stats?.points ?? 0) - (a.stats?.points ?? 0)
      if (sort === 'wins')   return (b.stats?.wins   ?? 0) - (a.stats?.wins   ?? 0)
      return a.full_name.localeCompare(b.full_name, 'ar')
    })

    return list
  }, [players, query, sort])

  return (
    <div>
      {/* Controls */}
      <div style={s.controls}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ابحث باسم اللاعب أو النادي..."
          style={s.search}
        />
        <div style={s.sortGroup}>
          {SORTS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              style={{ ...s.sortBtn, ...(sort === key ? s.sortActive : {}) }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          <span style={{ fontSize: '2rem' }}>🔍</span>
          <p style={{ color: 'var(--text-2)' }}>لا توجد نتائج لـ "{query}"</p>
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map(p => <PlayerCard key={p.id} player={p} />)}
        </div>
      )}

      <p style={s.count}>{filtered.length} لاعب</p>
    </div>
  )
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'rank',   label: 'الترتيب' },
  { key: 'points', label: 'النقاط'  },
  { key: 'wins',   label: 'الفوز'   },
  { key: 'name',   label: 'الاسم'   },
]

const s: Record<string, React.CSSProperties> = {
  controls:   { display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' },
  search:     { flex: 1, minWidth: 200, padding: '0.625rem 0.875rem', fontSize: '0.9375rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--text-1)', outline: 'none' },
  sortGroup:  { display: 'flex', gap: '0.375rem' },
  sortBtn:    { padding: '0.5rem 0.875rem', fontSize: '0.8125rem', fontWeight: 500, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', cursor: 'pointer', transition: 'all 0.12s' },
  sortActive: { background: 'var(--accent-dim)', borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 700 },
  list:       { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  empty:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '3rem 1rem', textAlign: 'center' },
  count:      { fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '1rem', textAlign: 'center' },
}
