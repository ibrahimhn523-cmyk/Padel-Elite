import { createClient } from '@/lib/supabase/server'
import {
  mapMatchRows,
  type MatchFull,
  type MatchStatus,
  type PlayerSnap,
} from '@/lib/utils/match-mapper'

// Re-export so server components can still import from here
export type { MatchFull, MatchStatus } from '@/lib/utils/match-mapper'
export { mapMatchRows } from '@/lib/utils/match-mapper'

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

// ── helper ───────────────────────────────────────────────────

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
