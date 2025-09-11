import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Генерируем короткий slug
    const slug = nanoid(10) // 10 символов

    // Сохраняем в Supabase
    const { data: invite, error } = await supabase
      .from('invites')
      .insert([
        {
          slug,
          content
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating invite:', error)
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      )
    }

    // Формируем QR-code URL
    const qrCodeUrl = `${request.nextUrl.origin}/invite/${slug}`

    return NextResponse.json({
      success: true,
      data: {
        id: invite.id,
        slug: invite.slug,
        qrCodeUrl,
        createdAt: invite.created_at
      }
    })

  } catch (error) {
    console.error('Error in POST /api/invites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Получаем все приглашения из Supabase
    const { data: invites, error } = await supabase
      .from('invites')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invites:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invites' },
        { status: 500 }
      )
    }

    // Преобразуем данные для соответствия интерфейсу Invite
    const formattedInvites = invites.map(invite => ({
      id: invite.id,
      slug: invite.slug,
      content: invite.content,
      isDeleted: invite.is_deleted || false,
      createdAt: invite.created_at
    }))

    return NextResponse.json({
      success: true,
      data: formattedInvites
    })

  } catch (error) {
    console.error('Error in GET /api/invites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
