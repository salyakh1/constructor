import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{
    slug: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    // Получаем приглашение из Supabase
    const { data: invite, error } = await supabase
      .from('invites')
      .select('*')
      .eq('slug', slug)
      .eq('is_deleted', false)
      .single()

    if (error || !invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      )
    }

    // Проверяем, не удалено ли приглашение
    if (invite.is_deleted) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invite.id,
        slug: invite.slug,
        content: invite.content,
        createdAt: invite.created_at
      }
    })

  } catch (error) {
    console.error('Error in GET /api/invites/[slug]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    // Сначала найдем приглашение по slug
    const { data: invite, error: fetchError } = await supabase
      .from('invites')
      .select('id, is_deleted')
      .eq('slug', slug)
      .single()

    if (fetchError || !invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      )
    }

    // Проверяем, не удалено ли уже
    if (invite.is_deleted) {
      return NextResponse.json(
        { error: 'Invite already deleted' },
        { status: 400 }
      )
    }

    // Выполняем soft delete
    const { error: deleteError } = await supabase
      .from('invites')
      .update({ is_deleted: true })
      .eq('slug', slug)

    if (deleteError) {
      console.error('Error deleting invite:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete invite' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invite deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/invites/[slug]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
