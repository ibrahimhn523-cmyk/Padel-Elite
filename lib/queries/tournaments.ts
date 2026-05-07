import { createClient } from '@/lib/supabase/server'

export type TournamentCategory = 'ذهبية' | 'فضية' | 'برونزية'
export type TournamentStatus  = 'draft' | 'open' | 'live' | 'done'
export type SponsorTier       = 'ذهبي' | 'فضي' | 'برونزي'

export type Tournament = {
  id: string
  season_id: string | null
  name: string
  category: TournamentCategory
  status: TournamentStatus
  start_date: string | null
  end_date: string | null
  venue: string | null
  prize: string | null
  max_players: number
  cover_style: string | null
  description: string | null
  winner_id: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

export type Sponsor = {
  id: string
  tournament_id: string
  name: string
  tier: SponsorTier
  logo_url: string | null
  website_url: string | null
  display_order: number
}

export type PlayerSnap = {
  id: string
  full_name: string
  short_name: string | null
  avatar_url: string | null
}

export type MatchSet = { set_number: number; score_a: number; score_b: number }

export type MatchWithDetails = {
  id: string
  round: string
  court: string | null
  scheduled_at: string | null
  status: 'upcoming' | 'live' | 'done'
  player_a1: PlayerSnap | null
  player_a2: PlayerSnap | null
  player_b1: PlayerSnap | null
  player_b2: PlayerSnap | null
  winner_team: 'A' | 'B' | null
  sets: MatchSet[]
}

export type Registration = {
  id: string
  player_id: string
  status: 'pending' | 'confirmed' | 'withdrawn'
  registered_at: string
  player: PlayerSnap
}

// ─── Queries ────────────────────────────────────────────────

export async function getTournaments(onlyPublic = true): Promise<Tournament[]> {
  const supabase = await createClient()
  let query = supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })

  if (onlyPublic) query = query.neq('status', 'draft')

  const { data } = await query
  return (data ?? []) as Tournament[]
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single()
  return (data as Tournament) ?? null
}

export async function getSponsors(tournamentId: string): Promise<Sponsor[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('sponsors')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('display_order')
  return (data ?? []) as Sponsor[]
}

export async function getTournamentMatches(tournamentId: string): Promise<MatchWithDetails[]> {
  const supabase = await createClient()

  const { data: matches } = await supabase
    .from('matches')
    .select('*, match_sets(*)')
    .eq('tournament_id', tournamentId)
    .order('scheduled_at', { ascending: true, nullsFirst: true })

  if (!matches?.length) return []

  const playerIds = [...new Set(
    matches
      .flatMap(m => [m.player_a1_id, m.player_a2_id, m.player_b1_id, m.player_b2_id])
      .filter((id): id is string => !!id),
  )]

  const profileMap: Record<string, PlayerSnap> = {}
  if (playerIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, short_name, avatar_url')
      .in('id', playerIds)
    for (const p of profiles ?? []) profileMap[p.id] = p as PlayerSnap
  }

  return matches.map(m => ({
    id: m.id,
    round: m.round,
    court: m.court ?? null,
    scheduled_at: m.scheduled_at ?? null,
    status: m.status as 'upcoming' | 'live' | 'done',
    player_a1: m.player_a1_id ? (profileMap[m.player_a1_id] ?? null) : null,
    player_a2: m.player_a2_id ? (profileMap[m.player_a2_id] ?? null) : null,
    player_b1: m.player_b1_id ? (profileMap[m.player_b1_id] ?? null) : null,
    player_b2: m.player_b2_id ? (profileMap[m.player_b2_id] ?? null) : null,
    winner_team: m.winner_team as 'A' | 'B' | null,
    sets: ((m.match_sets as MatchSet[] | null) ?? []).sort((a, b) => a.set_number - b.set_number),
  }))
}

export async function getTournamentRegistrations(tournamentId: string): Promise<Registration[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tournament_registrations')
    .select('*, profiles(id, full_name, short_name, avatar_url)')
    .eq('tournament_id', tournamentId)
    .neq('status', 'withdrawn')
    .order('registered_at')

  return (data ?? []).map(r => ({
    id: r.id,
    player_id: r.player_id,
    status: r.status as Registration['status'],
    registered_at: r.registered_at,
    player: r.profiles as unknown as PlayerSnap,
  }))
}
