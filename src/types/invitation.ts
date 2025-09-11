export interface InviteContent {
  bride?: string
  groom?: string
  date: string
  time?: string
  location?: string
  blocks?: unknown[]
  style?: {
    font?: string
    colors?: Record<string, string>
  }
  // Обратная совместимость с предыдущим форматом
  title?: string
  description?: string
  hostName?: string
  guestName?: string
  template?: string
  customFields?: Record<string, unknown>
}

export interface Invite {
  id: string
  slug: string
  content: InviteContent
  isDeleted: boolean
  createdAt: string
}

export interface CreateInviteData {
  content: InviteContent
}

export interface UpdateInviteData {
  content?: Partial<InviteContent>
  isDeleted?: boolean
}
