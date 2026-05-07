// Pure transform — no server imports.
// Usable in both Server Components and Client Components.

export type PlayerSnap = {
  id: string
  full_name: string
  short_name: string | null
  avatar_url: string | null
}

export type MatchSet = {
  set_number: number
  score_a: number
  score_b: number
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMatchRows(rows: any[], profileMap: Record<string, PlayerSnap>): MatchFull[] {
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
