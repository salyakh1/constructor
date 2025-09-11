export interface BlockContent {
  id: string
  type: string
  content: Record<string, unknown>
  position: { x: number; y: number }
  size: { width: number; height: number }
  style?: Record<string, unknown>
}

export interface Block {
  id: string
  type: 'text' | 'bride-groom' | 'wedding-date' | 'countdown' | 'photo' | 'video' | 'map' | 'timer' | 'rsvp' | 'write-wish' | 'show-wishes' | 'our-story' | 'wedding-team'
  content: BlockContent
  position: { x: number; y: number }
  size: { width: number; height: number }
  style?: Record<string, unknown>
}

export interface Invitation {
  id: string
  slug: string
  title?: string
  description?: string
  blocks: Block[]
  created_at: string
  updated_at: string
  is_published: boolean
  created_by?: string
  settings: Record<string, unknown>
}

export interface Wish {
  id: string
  invite_id: string
  guest_name: string
  message: string
  created_at: string
}

export interface RSVP {
  id: string
  invite_id: string
  guest_name: string
  email?: string
  phone?: string
  attending: boolean
  guests_count: number
  dietary_requirements?: string
  message?: string
  created_at: string
  updated_at: string
}