import { createClient } from '@/lib/supabase/server'

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

export async function getPlayer(id: string): Promise<PlayerProfile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  if (!data) return null
  return {
    ...data,
    rating: Number(data.rating),
  }
}

export async function getPlayerStats(
  playerId: string,
  seasonId: string
): Promise<PlayerStats | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .eq('season_id', seasonId)
    .single()
  if (!data) return null
  return {
    ...data,
    rating: Number(data.rating),
  }
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
