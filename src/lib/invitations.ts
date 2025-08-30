import { supabase } from './supabase'
import { Invite, CreateInviteData, UpdateInviteData, InviteContent } from '@/types/invitation'

export async function createInvite(data: CreateInviteData): Promise<Invite | null> {
  try {
    // Генерируем slug на основе доступных данных
    const slug = generateSlug(data.content)
    
    const { data: invite, error } = await supabase
      .from('invites')
      .insert([
        {
          slug,
          content: data.content
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating invite:', error)
      return null
    }

    return invite
  } catch (error) {
    console.error('Error creating invite:', error)
    return null
  }
}

export async function getInviteBySlug(slug: string): Promise<Invite | null> {
  try {
    const { data: invite, error } = await supabase
      .from('invites')
      .select('*')
      .eq('slug', slug)
      .eq('is_deleted', false)
      .single()

    if (error) {
      console.error('Error fetching invite:', error)
      return null
    }

    return invite
  } catch (error) {
    console.error('Error fetching invite:', error)
    return null
  }
}

export async function getAllInvites(): Promise<Invite[]> {
  try {
    const { data: invites, error } = await supabase
      .from('invites')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invites:', error)
      return []
    }

    return invites || []
  } catch (error) {
    console.error('Error fetching invites:', error)
    return []
  }
}

export async function updateInvite(id: string, data: UpdateInviteData): Promise<Invite | null> {
  try {
    const { data: invite, error } = await supabase
      .from('invites')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating invite:', error)
      return null
    }

    return invite
  } catch (error) {
    console.error('Error updating invite:', error)
    return null
  }
}

export async function softDeleteInvite(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('invites')
      .update({ is_deleted: true })
      .eq('id', id)

    if (error) {
      console.error('Error deleting invite:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting invite:', error)
    return false
  }
}

export async function hardDeleteInvite(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('invites')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting invite:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting invite:', error)
    return false
  }
}

function generateSlug(content: InviteContent): string {
  // Используем доступные поля для генерации slug
  const title = content.title || content.bride || content.groom || 'invite'
  
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50) + '-' + Date.now().toString(36)
}
