'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { mapMatchRows, type MatchFull, type PlayerSnap } from '@/lib/utils/match-mapper'

const ar = (n: number) => n.toLocaleString('ar-SA')
const nameOf = (p: { short_name: string | null; full_name: string } | null) =>
  p ? (p.short_name ?? p.full_name.split(' ')[0]) : '؟'

const ROUND_ORDER = ['ربع النهائي', 'نصف النهائي', 'النهائي']

function sortRounds(a: string, b: string) {
  const ia = ROUND_ORDER.indexOf(a)
  const ib = ROUND_ORDER.indexOf(b)
  if (ia !== -1 && ib !== -1) return ia - ib
  if (ia !== -1) return -1
  if (ib !== -1) return 1
  return a.localeCompare(b, 'ar')
}

type Props = { tournamentId: string; initialMatches: MatchFull[] }

export function Bracket({ tournamentId, initialMatches }: Props) {
  const [matches, setMatches] = useState(initialMatches)

  useEffect(() => {
    const supabase = createClient()

    async function fetch() {
      const { data: rows } = await supabase
        .from('matches')
        .select('*, match_sets(*), tournaments(name)')
        .eq('tournament_id', tournamentId)
        .order('scheduled_at', { ascending: true, nullsFirst: true })

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
      .channel(`bracket-${tournamentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'matches',
        filter: `tournament_id=eq.${tournamentId}`,
      }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_sets' }, fetch)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tournamentId])

  if (!matches.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '3rem 1rem' }}>
        <span style={{ fontSize: '1.75rem' }}>🎾</span>
        <p style={{ color: 'var(--text-2)', margin: 0 }}>لم تُضاف مباريات بعد</p>
      </div>
    )
  }

  const byRound: Record<string, MatchFull[]> = {}
  for (const m of matches) {
    if (!byRound[m.round]) byRound[m.round] = []
    byRound[m.round].push(m)
  }
  const rounds = Object.keys(byRound).sort(sortRounds)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {rounds.map(round => (
        <div key={round}>
          <h3 style={s.roundTitle}>{round}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {byRound[round].map(m => <BracketCard key={m.id} match={m} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function BracketCard({ match: m }: { match: MatchFull }) {
  const winA  = m.winner_team === 'A'
  const winB  = m.winner_team === 'B'
  const isLive = m.status === 'live'

  return (
    <div style={{ ...s.card, borderColor: isLive ? 'var(--danger)' : 'var(--border)' }}>
      {isLive && <div style={s.livePill}>● مباشر</div>}

      {/* Team A */}
      <div style={{ ...s.teamRow, opacity: m.winner_team && !winA ? 0.45 : 1 }}>
        <span style={{ ...s.teamName, color: winA ? 'var(--accent)' : 'var(--text-1)', fontWeight: winA ? 700 : 500 }}>
          {nameOf(m.player_a1)} / {nameOf(m.player_a2)}
        </span>
        <div style={s.scores}>
          {m.sets.map((set, i) => (
            <span key={i} style={{ ...s.scoreCell, color: winA ? 'var(--accent)' : 'var(--text-2)' }}>
              {ar(set.score_a)}
            </span>
          ))}
          {!m.sets.length && <span style={{ color: 'var(--text-3)', fontSize: '0.8125rem' }}>—</span>}
        </div>
      </div>

      <div style={s.divider}>VS</div>

      {/* Team B */}
      <div style={{ ...s.teamRow, opacity: m.winner_team && !winB ? 0.45 : 1 }}>
        <span style={{ ...s.teamName, color: winB ? 'var(--accent)' : 'var(--text-1)', fontWeight: winB ? 700 : 500 }}>
          {nameOf(m.player_b1)} / {nameOf(m.player_b2)}
        </span>
        <div style={s.scores}>
          {m.sets.map((set, i) => (
            <span key={i} style={{ ...s.scoreCell, color: winB ? 'var(--accent)' : 'var(--text-2)' }}>
              {ar(set.score_b)}
            </span>
          ))}
          {!m.sets.length && <span style={{ color: 'var(--text-3)', fontSize: '0.8125rem' }}>—</span>}
        </div>
      </div>

      {m.court && <div style={s.court}>ملعب {m.court}</div>}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  roundTitle: { fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' },
  card:       { background: 'var(--surface)', border: '1px solid', borderRadius: 'var(--radius)', padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' },
  livePill:   { position: 'absolute', top: 8, left: 10, fontSize: '0.625rem', fontWeight: 800, color: 'var(--danger)', letterSpacing: '0.04em' },
  teamRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', transition: 'opacity 0.2s' },
  teamName:   { fontSize: '0.875rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  scores:     { display: 'flex', gap: '0.25rem', flexShrink: 0 },
  scoreCell:  { minWidth: 22, textAlign: 'center', fontSize: '0.875rem', fontWeight: 700 },
  divider:    { fontSize: '0.625rem', color: 'var(--text-3)', fontWeight: 700, textAlign: 'center', letterSpacing: '0.08em' },
  court:      { fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: 2 },
}
