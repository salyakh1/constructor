'use client'

import { useEffect, useState, useRef } from 'react'
import { Calendar, Clock, MapPin, User, Gift, QrCode, Volume2, VolumeX, Play, Pause } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { motion, useInView } from 'framer-motion'

interface Block {
  id: string
  type: 'text' | 'photo' | 'video' | 'music' | 'map' | 'timer' | 'rsvp' | 'wishes'
  customName?: string
  content: any
  position: { x: number; y: number }
  size: { width: number; height: number }
  opacity: number
  font: string
  fontSize: number
  color: string
  backgroundColor?: string
  animation: string
  zIndex: number
}

interface InviteContent {
  blocks?: Block[]
  backgroundImage?: string
  backgroundOpacity?: number
  metadata?: {
    createdAt: string
    version: string
  }
  // Backward compatibility
  title?: string
  description?: string
  date?: string
  time?: string
  location?: string
  hostName?: string
  guestName?: string
}

interface Invite {
  id: string
  slug: string
  content: InviteContent
  isDeleted: boolean
  createdAt: string
}

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default function InvitePage({ params }: PageProps) {
  const [slug, setSlug] = useState<string>('')
  
  useEffect(() => {
    params.then(({ slug }) => setSlug(slug))
  }, [params])
  const [invite, setInvite] = useState<Invite | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMusicMuted, setIsMusicMuted] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [rsvpResponse, setRsvpResponse] = useState<string>('')
  const [wishesText, setWishesText] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invites/${slug}`)
        
        if (response.status === 404) {
          setError('Приглашение не найдено')
          setLoading(false)
          return
        }

        if (!response.ok) {
          throw new Error('Ошибка загрузки приглашения')
        }

        const result = await response.json()
        const inviteData = result.data

        // Проверяем, не удалено ли приглашение
        if (inviteData.isDeleted) {
          setError('Приглашение удалено')
          setLoading(false)
          return
        }

        setInvite(inviteData)
        setLoading(false)

        // Автовоспроизведение музыки
        if (inviteData.content.blocks) {
          const musicBlock = inviteData.content.blocks.find((block: Block) => block.type === 'music')
          if (musicBlock && musicBlock.content.url) {
            audioRef.current = new Audio(musicBlock.content.url)
            audioRef.current.loop = true
            audioRef.current.volume = 0.5
            audioRef.current.play().then(() => {
              setIsMusicPlaying(true)
            }).catch(() => {
              // Автовоспроизведение заблокировано браузером
              setIsMusicPlaying(false)
            })
          }
        }
      } catch (err) {
        console.error('Error fetching invitation:', err)
        setError('Ошибка загрузки приглашения')
        setLoading(false)
      }
    }

    if (slug) {
      fetchInvitation()
    }
  }, [slug])

  // Очистка аудио при размонтировании
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const toggleMusic = () => {
    if (!audioRef.current) return

    if (isMusicPlaying) {
      audioRef.current.pause()
      setIsMusicPlaying(false)
    } else {
      audioRef.current.play()
      setIsMusicPlaying(true)
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return

    if (isMusicMuted) {
      audioRef.current.volume = 0.5
      setIsMusicMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMusicMuted(true)
    }
  }

  const handleRsvpSubmit = async (response: string) => {
    if (!invite) return
    
    setIsSubmitting(true)
    try {
      const rsvpData = {
        inviteId: invite.id,
        response: response,
        timestamp: new Date().toISOString()
      }

      const result = await fetch('/api/invites/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rsvpData),
      })

      if (result.ok) {
        setRsvpResponse(response)
        // Показываем уведомление об успехе
        alert('Ваш ответ сохранен!')
      } else {
        throw new Error('Ошибка сохранения RSVP')
      }
    } catch (error) {
      console.error('Error saving RSVP:', error)
      alert('Ошибка сохранения ответа')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWishesSubmit = async () => {
    if (!invite || !wishesText.trim()) return
    
    setIsSubmitting(true)
    try {
      const wishesData = {
        inviteId: invite.id,
        wishes: wishesText.trim(),
        timestamp: new Date().toISOString()
      }

      const result = await fetch('/api/invites/wishes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wishesData),
      })

      if (result.ok) {
        // Показываем уведомление об успехе
        alert('Ваши пожелания сохранены!')
        setWishesText('')
      } else {
        throw new Error('Ошибка сохранения пожеланий')
      }
    } catch (error) {
      console.error('Error saving wishes:', error)
      alert('Ошибка сохранения пожеланий')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderBlock = (block: Block) => {
    const blockStyle = {
      position: 'absolute' as const,
      left: block.position.x,
      top: block.position.y,
      width: block.size.width,
      height: block.size.height,
      opacity: block.opacity,
      zIndex: block.zIndex,
      fontFamily: block.font,
      fontSize: block.fontSize,
      color: block.color,
      backgroundColor: block.backgroundColor || 'transparent',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px',
      boxSizing: 'border-box' as const
    }

    switch (block.type) {
      case 'text':
        return (
          <div key={block.id} style={blockStyle}>
            <span style={{ fontSize: block.fontSize, fontFamily: block.font, color: block.color }}>
              {block.content.text}
            </span>
          </div>
        )

      case 'photo':
        return (
          <div key={block.id} style={blockStyle}>
            {block.content.url ? (
              <img 
                src={block.content.url} 
                alt={block.content.alt || 'Фото'} 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                📷
              </div>
            )}
          </div>
        )

      case 'video':
        return (
          <div key={block.id} style={blockStyle}>
            {block.content.url ? (
              <video 
                src={block.content.url} 
                controls 
                autoPlay={block.content.autoplay}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                🎥
              </div>
            )}
          </div>
        )

      case 'music':
        return (
          <div key={block.id} style={blockStyle}>
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center justify-center rounded-lg border border-purple-200">
              <div className="text-2xl mb-2">🎵</div>
              <div className="text-xs text-purple-800 text-center px-2">
                {block.content.title || 'Музыка'}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={toggleMusic}
                  className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700"
                >
                  {isMusicPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700"
                >
                  {isMusicMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )

      case 'map':
        return (
          <div key={block.id} style={blockStyle}>
            <div 
              className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex flex-col items-center justify-center cursor-pointer hover:from-blue-200 hover:to-blue-300 transition-all duration-200 rounded-lg border border-blue-300"
              onClick={() => {
                if (block.content.address) {
                  const encodedAddress = encodeURIComponent(block.content.address)
                  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
                  window.open(mapUrl, '_blank')
                }
              }}
            >
              <div className="text-2xl mb-1">🗺️</div>
              <div className="text-xs text-blue-800 text-center px-2 leading-tight">
                {block.content.address || 'Укажите адрес'}
              </div>
              <div className="text-xs text-blue-600 mt-1 text-center">
                Нажмите для маршрута
              </div>
            </div>
          </div>
        )

      case 'timer':
        return (
          <div key={block.id} style={blockStyle}>
            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex flex-col items-center justify-center rounded-lg border border-orange-200">
              <div className="text-2xl mb-2">⏰</div>
              <div className="text-xs text-orange-800 text-center px-2">
                {block.content.targetDate ? (
                  <div>
                    <div className="font-semibold">До события:</div>
                    <div className="text-lg font-bold">
                      {Math.ceil((new Date(block.content.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} дней
                    </div>
                  </div>
                ) : (
                  'Таймер'
                )}
              </div>
            </div>
          </div>
        )

      case 'rsvp':
        return (
          <motion.div 
            key={block.id} 
            style={blockStyle}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 flex flex-col items-center justify-center rounded-lg border border-green-200">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-xs text-green-800 text-center px-2">
                <div className="font-semibold mb-1">{block.content.question || 'Придете?'}</div>
                {rsvpResponse ? (
                  <div className="text-green-700 font-medium">
                    Ваш ответ: {rsvpResponse}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {block.content.options?.map((option: string, index: number) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRsvpSubmit(option)}
                        disabled={isSubmitting}
                        className="block w-full px-2 py-1 bg-green-200 hover:bg-green-300 rounded text-xs transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? 'Сохранение...' : option}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )

      case 'wishes':
        return (
          <motion.div 
            key={block.id} 
            style={blockStyle}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-amber-100 flex flex-col items-center justify-center rounded-lg border border-yellow-200">
              <div className="text-2xl mb-2">💭</div>
              <div className="text-xs text-amber-800 text-center px-2">
                <div className="font-semibold mb-1">Пожелания</div>
                <textarea
                  value={wishesText}
                  onChange={(e) => setWishesText(e.target.value)}
                  placeholder={block.content.placeholder || 'Оставьте пожелание'}
                  className="w-full h-16 p-2 text-xs border border-yellow-300 rounded resize-none mb-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleWishesSubmit}
                  disabled={isSubmitting || !wishesText.trim()}
                  className="w-full px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Сохранение...' : 'Отправить пожелания'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )

      default:
        return <div key={block.id} style={blockStyle}>Блок</div>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка приглашения...</p>
        </div>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error === 'Приглашение удалено' ? 'Приглашение удалено' : 'Приглашение не найдено'}
          </h1>
          <p className="text-gray-600">
            {error === 'Приглашение удалено' 
              ? 'Данное приглашение было удалено организатором' 
              : 'Возможно, ссылка устарела или была удалена'
            }
          </p>
        </div>
      </div>
    )
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: invite.content.backgroundImage ? `url(${invite.content.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background overlay for opacity control */}
      {invite.content.backgroundImage && (
        <div 
          className="absolute inset-0 bg-white"
          style={{ opacity: 1 - (invite.content.backgroundOpacity || 1) }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div 
            className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Header */}
            <motion.div 
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-8 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h1 className="text-3xl font-bold mb-2">
                {invite.content.title || 'Приглашение'}
              </h1>
              {invite.content.description && (
                <p className="text-pink-100 text-lg">{invite.content.description}</p>
              )}
            </motion.div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Date & Time */}
              {invite.content.date && (
                <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-xl">
                  <Calendar className="w-6 h-6 text-pink-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(invite.content.date).toLocaleDateString('ru-RU', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {invite.content.time && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {invite.content.time}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              {invite.content.location && (
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                  <MapPin className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Место проведения</p>
                    <p className="text-gray-600">{invite.content.location}</p>
                  </div>
                </div>
              )}

              {/* Host */}
              {invite.content.hostName && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                  <User className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Организатор</p>
                    <p className="text-gray-600">{invite.content.hostName}</p>
                  </div>
                </div>
              )}

              {/* Guest */}
              {invite.content.guestName && (
                <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                  <Gift className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-lg font-semibold text-gray-900">{invite.content.guestName}</p>
                  <p className="text-gray-600">Вы приглашены на это мероприятие!</p>
                </div>
              )}

              {/* QR Code */}
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <QrCode className="w-6 h-6 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">QR-код приглашения</h3>
                </div>
                <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
                  <QRCodeSVG 
                    value={currentUrl} 
                    size={120}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Отсканируйте для быстрого доступа к приглашению
                </p>
              </div>

              {/* Footer */}
              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Приглашение создано в конструкторе приглашений
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(invite.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Rendered Blocks Overlay */}
      {invite.content.blocks && invite.content.blocks.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-20">
          {invite.content.blocks.map(renderBlock)}
        </div>
      )}
    </div>
  )
}