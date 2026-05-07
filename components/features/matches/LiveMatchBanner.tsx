'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { mapMatchRows, type MatchFull } from '@/lib/queries/matches'
import type { PlayerSnap, MatchSet } from '@/lib/queries/tournaments'

const ar = (n: number) => n.toLocaleString('ar-SA')
const nameOf = (p: { short_name: string | null; full_name: string } | null) =>
  p ? (p.short_name ?? p.full_name.split(' ')[0]) : '؟'

export function LiveMatchBanner({ initialMatches }: { initialMatches: MatchFull[] }) {
  const [matches, setMatches] = useState(initialMatches)

  useEffect(() => {
    const supabase = createClient()

    async function fetchLive() {
      const { data: rows } = await supabase
        .from('matches')
        .select('*, match_sets(*), tournaments(name)')
        .eq('status', 'live')

      if (!rows?.length) { setMatches([]); return }

      const ids = [...new Set(
        rows
          .flatMap((m: { player_a1_id: string | null; player_a2_id: string | null; player_b1_id: string | null; player_b2_id: string | null }) =>
            [m.player_a1_id, m.player_a2_id, m.player_b1_id, m.player_b2_id])
          .filter((id): id is string => !!id),
      )]

      const profileMap: Record<string, PlayerSnap> = {}
      if (ids.length) {
        const { data: profiles } = await supabase
          .from('profiles').select('id, full_name, short_name, avatar_url').in('id', ids)
        for (const p of profiles ?? []) profileMap[p.id] = p as PlayerSnap
      }

      setMatches(mapMatchRows(rows as Parameters<typeof mapMatchRows>[0], profileMap))
    }

    const channel = supabase
      .channel('live-banner')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchLive)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_sets' }, fetchLive)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (!matches.length) return null

  return (
    <div style={s.banner}>
      <div style={s.header}>
        <span style={s.liveLabel}>● مباشر الآن</span>
        <span style={s.count}>{ar(matches.length)} مباراة</span>
      </div>
      <div style={s.cards}>
        {matches.map(m => <LiveCard key={m.id} match={m} />)}
      </div>
    </div>
  )
}

function LiveCard({ match: m }: { match: MatchFull }) {
  const score = m.sets.length
    ? m.sets.map((s: MatchSet) => `${ar(s.score_a)}-${ar(s.score_b)}`).join(' · ')
    : 'قيد اللعب'

  const teamA = [m.player_a1, m.player_a2].filter(Boolean).map(nameOf).join(' / ') || '—'
  const teamB = [m.player_b1, m.player_b2].filter(Boolean).map(nameOf).join(' / ') || '—'

  return (
    <div style={s.card}>
      <div style={s.cardMeta}>{m.tournament_name} · {m.round}</div>
      <div style={s.cardBody}>
        <span style={s.cardTeam}>{teamA}</span>
        <span style={s.cardScore}>{score}</span>
        <span style={s.cardTeam}>{teamB}</span>
      </div>
      {m.court && <div style={s.cardCourt}>ملعب {m.court}</div>}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  banner:    { background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-xl)', padding: '1rem 1.25rem', marginBottom: '1.25rem' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' },
  liveLabel: { fontSize: '0.8125rem', fontWeight: 800, color: 'var(--danger)', letterSpacing: '0.03em' },
  count:     { fontSize: '0.75rem', color: 'var(--text-3)' },
  cards:     { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  card:      { background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', minWidth: 220, flex: '1 1 220px' },
  cardMeta:  { fontSize: '0.6875rem', color: 'var(--text-3)', marginBottom: '0.375rem' },
  cardBody:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' },
  cardTeam:  { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-1)', flex: 1 },
  cardScore: { fontSize: '0.875rem', fontWeight: 800, color: 'var(--danger)', direction: 'ltr', flexShrink: 0, padding: '0 0.25rem' },
  cardCourt: { fontSize: '0.625rem', color: 'var(--text-3)', marginTop: '0.25rem' },
}
