import { createClient } from '@/lib/supabase/server'

export type Season = {
  id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
}

export type LeaderboardEntry = {
  rank: number
  prev_rank: number | null
  player_id: string
  full_name: string
  short_name: string | null
  avatar_url: string | null
  club: string | null
  country: string | null
  points: number
  wins: number
  losses: number
  rating: number
  streak: number
}

export async function getCurrentSeason(): Promise<Season | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_current', true)
    .single()
  return data ?? null
}

export async function getLeaderboard(seasonId: string): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('player_stats')
    .select(`
      rank,
      prev_rank,
      points,
      wins,
      losses,
      rating,
      streak,
      player_id,
      profiles (
        full_name,
        short_name,
        avatar_url,
        club,
        country
      )
    `)
    .eq('season_id', seasonId)
    .not('rank', 'is', null)
    .order('rank', { ascending: true })

  if (error || !data) return []

  return data.map(row => {
    const p = row.profiles as unknown as {
      full_name: string
      short_name: string | null
      avatar_url: string | null
      club: string | null
      country: string | null
    } | null

    return {
      rank: row.rank as number,
      prev_rank: row.prev_rank ?? null,
      player_id: row.player_id,
      points: row.points,
      wins: row.wins,
      losses: row.losses,
      rating: Number(row.rating),
      streak: row.streak,
      full_name: p?.full_name ?? '—',
      short_name: p?.short_name ?? null,
      avatar_url: p?.avatar_url ?? null,
      club: p?.club ?? null,
      country: p?.country ?? null,
    }
  })
}
