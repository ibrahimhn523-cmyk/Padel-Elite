'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { TournamentCategory, TournamentStatus } from '@/lib/queries/tournaments'

const DEFAULT_COVERS: Record<TournamentCategory, string> = {
  'ذهبية':  'linear-gradient(135deg, #78350F 0%, #F59E0B 50%, #92400E 100%)',
  'فضية':   'linear-gradient(135deg, #1E293B 0%, #94A3B8 50%, #334155 100%)',
  'برونزية':'linear-gradient(135deg, #292524 0%, #CD7C3C 50%, #431407 100%)',
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return data?.role === 'admin' ? supabase : null
}

export type CreateTournamentInput = {
  name: string
  category: TournamentCategory
  season_id?: string
  start_date?: string
  end_date?: string
  venue?: string
  prize?: string
  max_players?: number
  description?: string
  cover_style?: string
}

export async function createTournament(input: CreateTournamentInput) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'غير مصرح — أدمن فقط' }

  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      name:        input.name.trim(),
      category:    input.category,
      season_id:   input.season_id   || null,
      start_date:  input.start_date  || null,
      end_date:    input.end_date    || null,
      venue:       input.venue?.trim()       || null,
      prize:       input.prize?.trim()       || null,
      max_players: input.max_players ?? 32,
      description: input.description?.trim() || null,
      cover_style: input.cover_style || DEFAULT_COVERS[input.category],
      status:      'draft',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/tournaments')
  revalidatePath('/tournaments')
  redirect(`/dashboard/tournaments/${data.id}`)
}

export async function updateTournamentStatus(id: string, status: TournamentStatus) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'غير مصرح — أدمن فقط' }

  const { error } = await supabase
    .from('tournaments')
    .update({ status })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/tournaments/${id}`)
  revalidatePath(`/tournament/${id}`)
  revalidatePath('/dashboard/tournaments')
  revalidatePath('/tournaments')
  return { success: true }
}
