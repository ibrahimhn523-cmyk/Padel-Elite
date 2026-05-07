'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? supabase : null
}

export type CreatePlayerInput = {
  email: string
  password: string
  full_name: string
  short_name?: string
  club?: string
  age?: number
  country?: string
}

export async function createPlayer(input: CreatePlayerInput) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'غير مصرح — أدمن فقط' }

  const admin = createAdminClient()

  // 1. Create auth user (Supabase handles bcrypt)
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email:         input.email.trim(),
    password:      input.password,
    email_confirm: true,
  })
  if (authErr) return { error: authErr.message }

  const uid = created.user.id

  // 2. Insert profile
  const { error: profileErr } = await admin.from('profiles').insert({
    id:         uid,
    full_name:  input.full_name.trim(),
    short_name: input.short_name?.trim() || null,
    club:       input.club?.trim()       || null,
    age:        input.age                ?? null,
    country:    input.country            ?? 'KSA',
    role:       'player',
  })
  if (profileErr) {
    await admin.auth.admin.deleteUser(uid)
    return { error: profileErr.message }
  }

  // 3. Create player_stats for current season (if exists)
  const { data: season } = await supabase
    .from('seasons').select('id').eq('is_current', true).single()

  if (season) {
    await admin.from('player_stats').insert({
      player_id: uid,
      season_id: season.id,
      points: 0, wins: 0, losses: 0, rating: 6.0, streak: 0,
    })
  }

  revalidatePath('/dashboard/players')
  redirect(`/dashboard/players/${uid}`)
}

export type UpdateProfileInput = {
  id: string
  full_name?: string
  short_name?: string
  club?: string
  age?: number
  country?: string
}

export async function updateProfile(input: UpdateProfileInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  // Only self or admin can update
  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (user.id !== input.id && caller?.role !== 'admin')
    return { error: 'غير مصرح' }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...(input.full_name  && { full_name:  input.full_name.trim()  }),
      ...(input.short_name !== undefined && { short_name: input.short_name?.trim() || null }),
      ...(input.club       !== undefined && { club:       input.club?.trim()       || null }),
      ...(input.age        !== undefined && { age:        input.age ?? null        }),
      ...(input.country    && { country:    input.country }),
    })
    .eq('id', input.id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/players/${input.id}`)
  revalidatePath('/dashboard/profile')
  return { success: true }
}
