import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { inviteId, wishes, guestName, timestamp } = await request.json()

    if (!inviteId || !wishes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('invites_wishes')
      .insert([
        {
          invite_id: inviteId,
          wishes: wishes,
          guest_name: guestName || null,
          timestamp: timestamp,
          guest_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        }
      ])
      .select()

    if (error) {
      console.error('Error saving wishes:', error)
      return NextResponse.json(
        { error: 'Failed to save wishes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data[0]
    })

  } catch (error) {
    console.error('Error in wishes API:', error)
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

    const { data, error } = await supabase
      .from('invites_wishes')
      .select('*')
      .eq('invite_id', inviteId)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching wishes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch wishes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Error in wishes GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
