import { createClient } from '@/lib/supabase/server'
import type { PlayerSnap, MatchSet } from './tournaments'

export type MatchStatus = 'upcoming' | 'live' | 'done'

export type MatchFull = {
  id: string
  tournament_id: string
  tournament_name: string
  round: string
  court: string | null
  scheduled_at: string | null
  status: MatchStatus
  player_a1: PlayerSnap | null
  player_a2: PlayerSnap | null
  player_b1: PlayerSnap | null
  player_b2: PlayerSnap | null
  winner_team: 'A' | 'B' | null
  sets: MatchSet[]
}

// ── shared mapper (used by server queries AND client realtime) ─

export function mapMatchRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[],
  profileMap: Record<string, PlayerSnap>,
): MatchFull[] {
  return rows.map(m => ({
    id:              m.id,
    tournament_id:   m.tournament_id,
    tournament_name: (m.tournaments as { name: string } | null)?.name ?? '—',
    round:           m.round,
    court:           m.court ?? null,
    scheduled_at:    m.scheduled_at ?? null,
    status:          m.status as MatchStatus,
    player_a1:       m.player_a1_id ? (profileMap[m.player_a1_id] ?? null) : null,
    player_a2:       m.player_a2_id ? (profileMap[m.player_a2_id] ?? null) : null,
    player_b1:       m.player_b1_id ? (profileMap[m.player_b1_id] ?? null) : null,
    player_b2:       m.player_b2_id ? (profileMap[m.player_b2_id] ?? null) : null,
    winner_team:     m.winner_team as 'A' | 'B' | null,
    sets:            ((m.match_sets as MatchSet[] | null) ?? [])
                       .sort((a, b) => a.set_number - b.set_number),
  }))
}

// ── Server queries ───────────────────────────────────────────

export async function getMatches(opts: {
  tournamentId?: string
  status?: MatchStatus
} = {}): Promise<MatchFull[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from('matches')
    .select('*, match_sets(*), tournaments(name)')
    .order('scheduled_at', { ascending: true, nullsFirst: false })

  if (opts.tournamentId) q = q.eq('tournament_id', opts.tournamentId)
  if (opts.status)       q = q.eq('status', opts.status)

  const { data: rows } = await q
  if (!rows?.length) return []

  const profileMap = await resolveProfiles(supabase, rows)
  return mapMatchRows(rows, profileMap)
}

export async function getLiveMatches(): Promise<MatchFull[]> {
  return getMatches({ status: 'live' })
}

export async function getMatch(id: string): Promise<MatchFull | null> {
  const supabase = await createClient()
  const { data: m } = await supabase
    .from('matches')
    .select('*, match_sets(*), tournaments(name)')
    .eq('id', id)
    .single()
  if (!m) return null
  const profileMap = await resolveProfiles(supabase, [m])
  return mapMatchRows([m], profileMap)[0] ?? null
}

// ── helper: fetch profiles for a set of match rows ───────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveProfiles(supabase: any, rows: any[]): Promise<Record<string, PlayerSnap>> {
  const ids = [...new Set(
    rows
      .flatMap((m: { player_a1_id: string | null; player_a2_id: string | null; player_b1_id: string | null; player_b2_id: string | null }) =>
        [m.player_a1_id, m.player_a2_id, m.player_b1_id, m.player_b2_id])
      .filter((id): id is string => !!id),
  )]

  const map: Record<string, PlayerSnap> = {}
  if (!ids.length) return map

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, short_name, avatar_url')
    .in('id', ids)

  for (const p of profiles ?? []) map[p.id] = p as PlayerSnap
  return map
}
