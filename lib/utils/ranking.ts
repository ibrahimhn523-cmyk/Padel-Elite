import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export async function recalculateRanking(admin: AdminClient, seasonId: string) {
  const { data: rows } = await admin
    .from('player_stats')
    .select('id, rank, points, wins')
    .eq('season_id', seasonId)

  if (!rows?.length) return

  // Sort: points desc → wins desc
  const sorted = [...rows].sort((a, b) =>
    b.points !== a.points ? b.points - a.points : b.wins - a.wins,
  )

  // Update each row: prev_rank = current rank, rank = new position
  await Promise.all(
    sorted.map((row, i) =>
      admin
        .from('player_stats')
        .update({ prev_rank: row.rank, rank: i + 1 })
        .eq('id', row.id),
    ),
  )
}
