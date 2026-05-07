import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

const ROUND_POINTS: Record<string, { win: number; lose: number }> = {
  'ربع النهائي': { win: 50,  lose: 10 },
  'نصف النهائي': { win: 100, lose: 20 },
  'النهائي':     { win: 200, lose: 50 },
}
const DEFAULT_PTS = { win: 30, lose: 5 }

export async function updatePlayerStats(
  admin: AdminClient,
  {
    round,
    seasonId,
    winnerIds,
    loserIds,
  }: {
    round: string
    seasonId: string
    winnerIds: string[]
    loserIds: string[]
  },
) {
  const pts = ROUND_POINTS[round] ?? DEFAULT_PTS

  await Promise.all([
    ...winnerIds.map(id => applyResult(admin, id, seasonId, 'win',  pts.win)),
    ...loserIds .map(id => applyResult(admin, id, seasonId, 'lose', pts.lose)),
  ])
}

async function applyResult(
  admin: AdminClient,
  playerId: string,
  seasonId: string,
  result: 'win' | 'lose',
  pts: number,
) {
  const { data: row } = await admin
    .from('player_stats')
    .select('id, wins, losses, points, streak')
    .eq('player_id', playerId)
    .eq('season_id', seasonId)
    .single()

  if (!row) {
    await admin.from('player_stats').insert({
      player_id: playerId,
      season_id: seasonId,
      wins:   result === 'win' ? 1 : 0,
      losses: result === 'lose' ? 1 : 0,
      points: pts,
      streak: result === 'win' ? 1 : -1,
      rating: 6.0,
    })
    return
  }

  const newStreak = result === 'win'
    ? (row.streak > 0 ? row.streak + 1 : 1)
    : (row.streak < 0 ? row.streak - 1 : -1)

  await admin.from('player_stats').update({
    wins:   result === 'win' ? row.wins + 1 : row.wins,
    losses: result === 'lose' ? row.losses + 1 : row.losses,
    points: row.points + pts,
    streak: newStreak,
  }).eq('id', row.id)
}
