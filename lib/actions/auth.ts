'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function login(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

type CreatePlayerInput = {
  email: string
  password: string
  full_name: string
  short_name?: string
  club?: string
  age?: number
  country?: string
}

// Super-admin only — creates a new player account
export async function createPlayer(data: CreatePlayerInput) {
  const supabase = await createClient()

  // Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: caller } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (caller?.role !== 'admin') return { error: 'غير مصرح — أدمن فقط' }

  // Create auth user via service role
  const admin = createAdminClient()

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  })

  if (authError) return { error: authError.message }

  // Insert profile row
  const { error: profileError } = await admin.from('profiles').insert({
    id: created.user.id,
    full_name: data.full_name,
    short_name: data.short_name ?? null,
    club: data.club ?? null,
    age: data.age ?? null,
    country: data.country ?? 'KSA',
    role: 'player',
  })

  if (profileError) return { error: profileError.message }

  revalidatePath('/dashboard/players')
  return { success: true }
}
