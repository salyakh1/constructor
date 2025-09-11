import { supabase } from './supabase'

export interface Invitation {
  id: string
  slug: string
  title?: string
  description?: string
  blocks: any[]
  created_at: string
  updated_at: string
  is_published: boolean
  created_by?: string
  settings: any
}

export async function createInvitation(data: Partial<Invitation>) {
  const { data: invitation, error } = await supabase
    .from('invites')
    .insert([data])
    .select()
    .single()

  if (error) throw error
  return invitation
}

export async function getInvitationBySlug(slug: string) {
  const { data: invitation, error } = await supabase
    .from('invites')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) throw error
  return invitation
}

export async function updateInvitation(id: string, data: Partial<Invitation>) {
  const { data: invitation, error } = await supabase
    .from('invites')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return invitation
}

export async function deleteInvitation(id: string) {
  const { error } = await supabase
    .from('invites')
    .delete()
    .eq('id', id)

  if (error) throw error
}