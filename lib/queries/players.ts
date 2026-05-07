import { createClient } from '@/lib/supabase/server'
import type { MatchSet } from './tournaments'

export type PlayerProfile = {
  id: string
  full_name: string
  short_name: string | null
  role: 'player' | 'admin'
  club: string | null
  age: number | null
  country: string | null
  avatar_url: string | null
  created_at: string
}

export type PlayerStats = {
  id: string
  player_id: string
  season_id: string
  points: number
  wins: number
  losses: number
  rating: number
  rank: number | null
  prev_rank: number | null
  streak: number
}

export type PlayerWithStats = PlayerProfile & { stats: PlayerStats | null }

export type PlayerMatch = {
  id: string
  tournament_id: string
  tournament_name: string
  tournament_category: string
  round: string
  status: 'upcoming' | 'live' | 'done'
  scheduled_at: string | null
  team: 'A' | 'B'
  partner: { id: string; full_name: string; short_name: string | null } | null
  opponent1: { id: string; full_name: string; short_name: string | null } | null
  opponent2: { id: string; full_name: string; short_name: string | null } | null
  winner_team: 'A' | 'B' | null
  won: boolean | null
  sets: MatchSet[]
}

// ─── Queries ────────────────────────────────────────────────

export async function getPlayer(id: string): Promise<PlayerProfile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  return data ?? null
}

export async function getPlayerStats(
  playerId: string,
  seasonId: string,
): Promise<PlayerStats | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .eq('season_id', seasonId)
    .single()
  if (!data) return null
  return { ...data, rating: Number(data.rating) }
}

export async function getAllPlayers(): Promise<PlayerProfile[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'player')
    .order('full_name')
  return (data ?? []).map(p => ({ ...p, rating: Number(p.rating ?? 0) }))
}

export async function getAllPlayersWithStats(): Promise<PlayerWithStats[]> {
  const supabase = await createClient()

  const [{ data: players }, { data: season }] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'player').order('full_name'),
    supabase.from('seasons').select('id').eq('is_current', true).single(),
  ])

  if (!players?.length) return []

  const statsMap: Record<string, PlayerStats> = {}

  if (season) {
    const { data: statsRows } = await supabase
      .from('player_stats')
      .select('*')
      .eq('season_id', season.id)

    for (const s of statsRows ?? []) {
      statsMap[s.player_id] = { ...s, rating: Number(s.rating) }
    }
  }

  return players.map(p => ({ ...p, stats: statsMap[p.id] ?? null }))
}

export async function getPlayerMatches(
  playerId: string,
  limit = 15,
): Promise<PlayerMatch[]> {
  const supabase = await createClient()

  const { data: matches } = await supabase
    .from('matches')
    .select('*, match_sets(*), tournaments(name, category)')
    .or(
      `player_a1_id.eq.${playerId},player_a2_id.eq.${playerId},` +
      `player_b1_id.eq.${playerId},player_b2_id.eq.${playerId}`,
    )
    .order('scheduled_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (!matches?.length) return []

  // Collect all other player IDs we need names for
  const otherIds = [...new Set(
    matches.flatMap(m =>
      [m.player_a1_id, m.player_a2_id, m.player_b1_id, m.player_b2_id]
        .filter((id): id is string => !!id && id !== playerId),
    ),
  )]

  const profileMap: Record<string, { id: string; full_name: string; short_name: string | null }> = {}
  if (otherIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, short_name')
      .in('id', otherIds)
    for (const p of profiles ?? []) profileMap[p.id] = p
  }

  const snap = (id: string | null) =>
    id && id !== playerId ? (profileMap[id] ?? null) : null

  return matches.map(m => {
    const t = m.tournaments as { name: string; category: string } | null
    const onA = m.player_a1_id === playerId || m.player_a2_id === playerId
    const team: 'A' | 'B' = onA ? 'A' : 'B'

    const partnerId  = onA ? (m.player_a1_id === playerId ? m.player_a2_id : m.player_a1_id)
                           : (m.player_b1_id === playerId ? m.player_b2_id : m.player_b1_id)
    const opp1Id     = onA ? m.player_b1_id : m.player_a1_id
    const opp2Id     = onA ? m.player_b2_id : m.player_a2_id

    const won = m.winner_team
      ? m.winner_team === team
      : null

    return {
      id:                    m.id,
      tournament_id:         m.tournament_id,
      tournament_name:       t?.name ?? '—',
      tournament_category:   t?.category ?? '',
      round:                 m.round,
      status:                m.status as PlayerMatch['status'],
      scheduled_at:          m.scheduled_at ?? null,
      team,
      partner:               snap(partnerId),
      opponent1:             snap(opp1Id),
      opponent2:             snap(opp2Id),
      winner_team:           m.winner_team as 'A' | 'B' | null,
      won,
      sets:                  ((m.match_sets as MatchSet[] | null) ?? [])
                               .sort((a, b) => a.set_number - b.set_number),
    }
  })
}
