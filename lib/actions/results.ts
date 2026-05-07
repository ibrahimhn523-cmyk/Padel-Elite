'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { updatePlayerStats } from '@/lib/utils/points'
import { recalculateRanking } from '@/lib/utils/ranking'

export type SetInput = { set_number: number; score_a: number; score_b: number }

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

function calcWinner(sets: SetInput[]): 'A' | 'B' {
  let winsA = 0, winsB = 0
  for (const s of sets) {
    if (s.score_a > s.score_b) winsA++
    else if (s.score_b > s.score_a) winsB++
  }
  return winsA >= winsB ? 'A' : 'B'
}

export async function submitResult(matchId: string, sets: SetInput[]) {
  const user = await requireAdmin()
  if (!user) return { error: 'غير مصرح — أدمن فقط' }

  if (!sets.length) return { error: 'يجب إدخال نتيجة شوط واحد على الأقل' }

  const admin = createAdminClient()

  // 1. Fetch match
  const { data: match } = await admin
    .from('matches')
    .select('id, round, status, player_a1_id, player_a2_id, player_b1_id, player_b2_id, tournament_id, tournaments(season_id)')
    .eq('id', matchId)
    .single()

  if (!match) return { error: 'المباراة غير موجودة' }
  if (match.status === 'done') return { error: 'هذه المباراة انتهت بالفعل' }

  const winnerTeam = calcWinner(sets)

  // 2. Update match status + winner
  const { error: matchErr } = await admin
    .from('matches')
    .update({ status: 'done', winner_team: winnerTeam })
    .eq('id', matchId)

  if (matchErr) return { error: matchErr.message }

  // 3. Replace sets (delete old → insert new)
  await admin.from('match_sets').delete().eq('match_id', matchId)

  const { error: setsErr } = await admin
    .from('match_sets')
    .insert(sets.map(s => ({ match_id: matchId, ...s })))

  if (setsErr) return { error: setsErr.message }

  // 4. Update player_stats (points, wins/losses, streak)
  const tournament = match.tournaments as unknown as { season_id: string | null } | null
  const seasonId   = tournament?.season_id ?? null

  if (seasonId) {
    const ids = (team: 'A' | 'B') =>
      (team === 'A'
        ? [match.player_a1_id, match.player_a2_id]
        : [match.player_b1_id, match.player_b2_id]
      ).filter((id): id is string => !!id)

    await updatePlayerStats(admin, {
      round:     match.round,
      seasonId,
      winnerIds: ids(winnerTeam),
      loserIds:  ids(winnerTeam === 'A' ? 'B' : 'A'),
    })

    // 5. Recalculate full season ranking
    await recalculateRanking(admin, seasonId)
  }

  revalidatePath('/dashboard/results')
  revalidatePath('/dashboard/matches')
  revalidatePath('/dashboard/leaderboard')
  revalidatePath('/leaderboard')

  return { success: true, winnerTeam }
}
