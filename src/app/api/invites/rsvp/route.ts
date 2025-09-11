import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { inviteId, response, timestamp } = await request.json()

    if (!inviteId || !response) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Сохраняем RSVP в таблицу invites_rsvp
    const { data, error } = await supabase
      .from('invites_rsvp')
      .insert([
        {
          invite_id: inviteId,
          response: response,
          timestamp: timestamp,
          guest_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        }
      ])
      .select()

    if (error) {
      console.error('Error saving RSVP:', error)
      return NextResponse.json(
        { error: 'Failed to save RSVP' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data[0]
    })

  } catch (error) {
    console.error('Error in RSVP API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const inviteId = searchParams.get('inviteId')

    if (!inviteId) {
      return NextResponse.json(
        { error: 'Missing inviteId parameter' },
        { status: 400 }
      )
    }

    // Получаем все RSVP ответы для приглашения
    const { data, error } = await supabase
      .from('invites_rsvp')
      .select('*')
      .eq('invite_id', inviteId)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching RSVP:', error)
      return NextResponse.json(
        { error: 'Failed to fetch RSVP' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Error in RSVP GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
