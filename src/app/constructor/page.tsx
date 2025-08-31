'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Type, Heart, Calendar, Image, Video, Music, MapPin, Clock, Timer, Users, MessageSquare, Plus, Settings, Upload, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { nanoid } from 'nanoid'
import dynamic from 'next/dynamic'

const QRCodeDisplay = dynamic(() => import('@/components/QRCodeDisplay').then(mod => ({ default: mod.QRCodeDisplay })), {
  ssr: false,
  loading: () => <div className="w-[120px] h-[120px] bg-gray-200 rounded animate-pulse" />
})
import { useInView } from 'framer-motion'

interface Block {
  id: string
  type: 'text' | 'bride-groom' | 'wedding-date' | 'countdown' | 'photo' | 'video' | 'map' | 'timer' | 'rsvp' | 'write-wish' | 'show-wishes' | 'our-story' | 'wedding-team'
  customName?: string
  content: any
  position: { x: number; y: number }
  size: { width: number; height: number }
  opacity: number
  font: string
  fontSize: number
  color: string
  backgroundColor?: string
  backgroundOpacity: number
  animation: string
  zIndex: number
  shape?: 'circle' | 'square'
  layout?: 'vertical' | 'horizontal'
  separator?: 'heart' | 'infinity' | 'ampersand' | 'star' | 'diamond' | 'ornament'
  padding?: { top: number; right: number; bottom: number; left: number }
  photoSize?: number
  photoShape?: 'circle' | 'square'
}

interface BlockTemplate {
  type: Block['type']
  icon: any
  label: string
  defaultContent: any
  defaultSize: { width: number; height: number }
}

const defaultBlockTemplates: BlockTemplate[] = [
  {
    type: 'text',
    icon: Type,
    label: 'Текст',
    defaultContent: { 
      text: 'Добавьте текст',
      icon: '',
      iconSize: 24
    },
    defaultSize: { width: 280, height: 95 }
  },
  {
    type: 'bride-groom',
    icon: Heart,
    label: 'Жених и Невеста',
    defaultContent: { 
      bride: 'Невеста', 
      groom: 'Жених',
      icon: '',
      iconSize: 24
    },
    defaultSize: { width: 320, height: 180 }
  },
  {
    type: 'wedding-date',
    icon: Calendar,
    label: 'Дата свадьбы',
    defaultContent: { 
      weddingDate: '',
      text: ''
    },
    defaultSize: { width: 320, height: 120 }
  },
  {
    type: 'countdown',
    icon: Timer,
    label: 'Обратный отсчет',
    defaultContent: { 
      targetDate: '',
      text: '',
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true
    },
    defaultSize: { width: 350, height: 140 }
  },
  {
    type: 'photo',
    icon: Image,
    label: 'Фото',
    defaultContent: { url: '', alt: 'Фото' },
    defaultSize: { width: 240, height: 240 }
  },
  {
    type: 'video',
    icon: Video,
    label: 'Видео',
    defaultContent: { url: '', autoplay: false },
    defaultSize: { width: 280, height: 220 }
  },

  {
    type: 'map',
    icon: MapPin,
    label: 'Карта',
    defaultContent: { address: '', title: 'Место проведения' },
    defaultSize: { width: 320, height: 200 }
  },
  {
    type: 'timer',
    icon: Clock,
    label: 'Таймер',
    defaultContent: { duration: 3600, autostart: false },
    defaultSize: { width: 280, height: 120 }
  },
  {
    type: 'rsvp',
    icon: Users,
    label: 'RSVP',
    defaultContent: { question: 'Подтвердите участие' },
    defaultSize: { width: 320, height: 180 }
  },
  {
    type: 'write-wish',
    icon: MessageSquare,
    label: 'Написать пожелание',
    defaultContent: { placeholder: 'Оставьте пожелание' },
    defaultSize: { width: 280, height: 180 }
  },
  {
    type: 'show-wishes',
    icon: MessageSquare,
    label: 'Показать пожелания',
    defaultContent: { title: 'Пожелания гостей' },
    defaultSize: { width: 320, height: 200 }
  },
  {
    type: 'our-story',
    icon: Heart,
    label: 'Наша история',
    defaultContent: { 
      title: 'Наша история любви',
      story: 'Расскажите о том, как вы познакомились, ваших первых свиданиях и важных моментах...',
      photos: [],
      importantDates: [],
      places: [],
      photoSize: 80,
      photoShape: 'square',
      storyTextSize: 12,
      icon: '',
      iconSize: 24
    },
    defaultSize: { width: 350, height: 400 }
  },
  {
    type: 'wedding-team',
    icon: Users,
    label: 'Команда свадьбы',
    defaultContent: { 
      title: 'Наша команда',
      members: [],
      photoSize: 80,
      photoShape: 'circle',
      layout: 'grid'
    },
    defaultSize: { width: 380, height: 450 }
  }
]

export default function ConstructorPage() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showSuccess, setShowSuccess] = useState(false)
  const [savedInvite, setSavedInvite] = useState<any>(null)
  const [backgroundImage, setBackgroundImage] = useState<string>('')
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(1)
  const [showBackgroundModal, setShowBackgroundModal] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [selectedMapBlock, setSelectedMapBlock] = useState<Block | null>(null)
  const [customBlockLabels, setCustomBlockLabels] = useState<Record<string, string>>({})
  const [showLabelsModal, setShowLabelsModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())
  
  // Настройки анимаций
  const [globalAnimation, setGlobalAnimation] = useState('fadeIn')
  const [globalAnimationDelay, setGlobalAnimationDelay] = useState(0.2)
  const [globalAnimationDuration, setGlobalAnimationDuration] = useState(0.6)
  
  // Фоновая музыка
  const [backgroundMusic, setBackgroundMusic] = useState<{ url: string; title: string; isPlaying: boolean } | null>(null)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const backgroundMusicRef = useRef<HTMLAudioElement>(null)
  
  // Пожелания
  const [wishes, setWishes] = useState<{ id: string; name: string; message: string; createdAt: string }[]>([
    { id: '1', name: 'Анна', message: 'Желаю вам безграничного счастья и любви!', createdAt: new Date().toISOString() },
    { id: '2', name: 'Михаил', message: 'Пусть ваш союз будет крепким и долговечным', createdAt: new Date().toISOString() },
    { id: '3', name: 'Елена', message: 'Счастья, радости и взаимопонимания!', createdAt: new Date().toISOString() }
  ])
  const [currentWishIndex, setCurrentWishIndex] = useState(0)
  
  const phoneRef = useRef<HTMLDivElement>(null)
  const dragRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const backgroundInputRef = useRef<HTMLInputElement>(null)

  // Таймер для обновления обратного отсчета
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Функция для рендеринга иконок
  const renderIcon = (icon: string, size: number = 24) => {
    if (icon === 'dove') {
      return (
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 24 24" 
          fill="none" 
          className="dove-icon"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }}
        >
          <path 
            d="M12 2C8.5 2 6 4.5 6 8c0 3.5 6 12 6 12s6-8.5 6-12c0-3.5-2.5-6-6-6z" 
            fill="currentColor"
          />
          <path 
            d="M9 8c0-1.7 1.3-3 3-3s3 1.3 3 3-1.3 3-3 3-3-1.3-3-3z" 
            fill="currentColor"
          />
          <path 
            d="M8 6c-0.6 0-1 0.4-1 1s0.4 1 1 1 1-0.4 1-1-0.4-1-1-1z" 
            fill="currentColor"
          />
          <path 
            d="M16 6c-0.6 0-1 0.4-1 1s0.4 1 1 1 1-0.4 1-1-0.4-1-1-1z" 
            fill="currentColor"
          />
        </svg>
      )
    }
    if (icon === '') {
      return null
    }
    return icon
  }

  // Автопрокрутка пожеланий
  useEffect(() => {
    if (wishes.length > 1) {
      const interval = setInterval(() => {
        setCurrentWishIndex(prev => (prev + 1) % wishes.length)
      }, 4000) // Каждые 4 секунды
      return () => clearInterval(interval)
    }
  }, [wishes.length])

  // Функция сохранения приглашения
  const handleSaveInvite = async () => {
    try {
      const inviteData = {
        blocks,
        backgroundImage,
        backgroundOpacity,
        globalAnimation,
        globalAnimationDelay,
        globalAnimationDuration,
        backgroundMusic,
        metadata: {
          createdAt: new Date().toISOString(),
          version: '1.0.0'
        }
      }

      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: inviteData })
      })

      if (!response.ok) {
        throw new Error('Ошибка сохранения приглашения')
      }

      const result = await response.json()
      
      if (result.success) {
        setSavedInvite(result.data)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 5000)
      } else {
        throw new Error(result.error || 'Ошибка сохранения')
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      alert('Ошибка сохранения приглашения: ' + errorMessage)
    }
  }

  // Варианты анимаций
  const animationVariants = {
    none: {},
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    slideUp: {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0 }
    },
    slideDown: {
      hidden: { opacity: 0, y: -50 },
      visible: { opacity: 1, y: 0 }
    },
    slideLeft: {
      hidden: { opacity: 0, x: 50 },
      visible: { opacity: 1, x: 0 }
    },
    slideRight: {
      hidden: { opacity: 0, x: -50 },
      visible: { opacity: 1, x: 0 }
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 }
    },
    bounce: {
      hidden: { opacity: 0, scale: 0.3 },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: {
          type: "spring" as const,
          stiffness: 400,
          damping: 10
        }
      }
    },
    rotateIn: {
      hidden: { opacity: 0, rotate: -180 },
      visible: { opacity: 1, rotate: 0 }
    },
    flip: {
      hidden: { opacity: 0, rotateY: -90 },
      visible: { opacity: 1, rotateY: 0 }
    }
  }

  // Получаем названия блоков с учетом пользовательских настроек
  const getBlockLabel = (type: string) => {
    if (type === 'our-story') return 'Наша история'
    if (type === 'wedding-team') return 'Команда свадьбы'
    return customBlockLabels[type] || defaultBlockTemplates.find(t => t.type === type)?.label || type
  }

  // Получаем анимацию для блока
  const getBlockAnimation = (block: Block) => {
    return block.animation && block.animation !== '' ? block.animation : globalAnimation
  }

  // Функция для получения настроек анимации при скролле
  const getScrollAnimationSettings = (block: Block, blockIndex: number) => {
    const animation = getBlockAnimation(block)
    const baseDelay = block.animation && block.animation !== '' ? 0 : blockIndex * globalAnimationDelay
    
    return {
      animation,
      delay: baseDelay,
      duration: globalAnimationDuration,
      // Добавляем настройки для плавного скролла
      transition: {
        duration: globalAnimationDuration,
        delay: baseDelay,
        ease: "easeOut" as const,
        // Добавляем spring для более естественных движений
        type: animation === 'bounce' ? "spring" as const : "tween" as const
      }
    }
  }

  const calculateNewBlockPosition = (newBlockSize: { width: number; height: number }) => {
    const phoneWidth = 430
    const margin = 20
    const edgeMargin = 20

    if (blocks.length === 0) {
      const centerX = (phoneWidth - newBlockSize.width) / 2
      return { x: Math.max(edgeMargin, centerX), y: 100 }
    }

    const bottomMostBlock = blocks.reduce((lowest, block) => {
      const blockBottom = block.position.y + block.size.height
      const lowestBottom = lowest.position.y + lowest.size.height
      return blockBottom > lowestBottom ? block : lowest
    })

    const newY = bottomMostBlock.position.y + bottomMostBlock.size.height + margin
    let newX = (phoneWidth - newBlockSize.width) / 2
    
    if (newX + newBlockSize.width > phoneWidth - edgeMargin) {
      newX = phoneWidth - newBlockSize.width - edgeMargin
    }
    if (newX < edgeMargin) {
      newX = edgeMargin
    }

    return { x: newX, y: newY }
  }

  const calculateAdaptiveFontSize = (text: string, blockWidth: number, blockHeight: number, baseFontSize: number) => {
    if (!text) return baseFontSize
    
    const maxWidth = blockWidth * 0.8
    const maxHeight = blockHeight * 0.3
    const estimatedWidth = text.length * baseFontSize * 0.6
    
    if (estimatedWidth > maxWidth) {
      const widthRatio = maxWidth / estimatedWidth
      baseFontSize *= widthRatio
    }
    
    const maxFontSizeByHeight = maxHeight * 0.8
    if (baseFontSize > maxFontSizeByHeight) {
      baseFontSize = maxFontSizeByHeight
    }
    
    return Math.max(12, Math.min(baseFontSize, 32))
  }

  const getSeparatorSymbol = (separator: string) => {
    switch (separator) {
      case 'heart': return '♥'
      case 'infinity': return '∞'
      case 'ampersand': return '&'
      case 'star': return '✦'
      case 'diamond': return '◆'
      case 'ornament': return '❋'
      default: return '&'
    }
  }

  const addBlock = useCallback((template: BlockTemplate) => {
    const newPosition = calculateNewBlockPosition(template.defaultSize)
    
    const newBlock: Block = {
      id: nanoid(),
      type: template.type,
      customName: '',
      content: { ...template.defaultContent },
      position: newPosition,
      size: { ...template.defaultSize },
      opacity: 1,
      font: 'Inter',
      fontSize: 16,
      color: '#000000',
      backgroundColor: '#ffffff',
      backgroundOpacity: 0.8,
      animation: 'fadeIn',
      zIndex: blocks.length + 1,
      shape: (template.type === 'photo' || template.type === 'video') ? 'square' : undefined,
      layout: 'vertical',
      separator: 'ampersand',
      padding: { top: 0, right: 0, bottom: 0, left: 0 }
    }
    setBlocks(prev => [...prev, newBlock])
    setSelectedBlock(newBlock)
  }, [blocks])

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setBackgroundImage(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
    // Очищаем input для возможности повторной загрузки того же файла
    event.target.value = ''
  }

  const removeBackground = () => {
    setBackgroundImage('')
    setBackgroundOpacity(1)
  }

  // Управление фоновой музыкой
  const handleBackgroundMusicUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setBackgroundMusic({
            url: e.target.result as string,
            title: file.name.replace(/\.[^/.]+$/, ''),
            isPlaying: false
          })
          setIsMusicPlaying(false)
        }
      }
      reader.readAsDataURL(file)
    }
    event.target.value = ''
  }

  const toggleBackgroundMusic = () => {
    if (backgroundMusicRef.current && backgroundMusic) {
      if (isMusicPlaying) {
        backgroundMusicRef.current.pause()
        setIsMusicPlaying(false)
      } else {
        backgroundMusicRef.current.play()
        setIsMusicPlaying(true)
      }
    }
  }

  const pauseBackgroundMusic = () => {
    if (backgroundMusicRef.current && isMusicPlaying) {
      backgroundMusicRef.current.pause()
      setIsMusicPlaying(false)
    }
  }

  const resumeBackgroundMusic = () => {
    if (backgroundMusicRef.current && backgroundMusic && !isMusicPlaying) {
      backgroundMusicRef.current.play()
      setIsMusicPlaying(true)
    }
  }

  // Функция для открытия карт
  const openMap = (address: string) => {
    if (!address.trim()) return
    
    // Создаем URL для Google Maps с маршрутом
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    
    // Открываем в новой вкладке
    window.open(googleMapsUrl, '_blank')
  }

  // Функция для добавления пожелания
  const addWish = (name: string, message: string) => {
    const newWish = {
      id: nanoid(),
      name: name.trim() || 'Гость',
      message: message.trim(),
      createdAt: new Date().toISOString()
    }
    setWishes(prev => [newWish, ...prev])
    // Показываем новое пожелание
    setCurrentWishIndex(0)
  }

  // Функция для получения fallback шрифтов
  const getFontFallback = (fontName: string) => {
    const fontGroups: Record<string, string> = {
      // Романтические курсивные
      'Dancing Script': 'cursive',
      'Great Vibes': 'cursive', 
      'Allura': 'cursive',
      'Alex Brush': 'cursive',
      'Sacramento': 'cursive',
      'Satisfy': 'cursive',
      'Pacifico': 'cursive',
      'Kaushan Script': 'cursive',
      'Amatic SC': 'cursive',
      'Caveat': 'cursive',
      'Shadows Into Light': 'cursive',
      'Courgette': 'cursive',
      'Lobster': 'cursive',
      // Элегантные serif
      'Playfair Display': 'serif',
      'Crimson Text': 'serif',
      'Cormorant Garamond': 'serif',
      // Современные sans-serif
      'Roboto': 'sans-serif',
      'Open Sans': 'sans-serif',
      'Lato': 'sans-serif',
      'Montserrat': 'sans-serif',
      'Poppins': 'sans-serif',
      'Inter': 'sans-serif'
    }
    return fontGroups[fontName] || 'sans-serif'
  }

  // Функция для правильного склонения русских слов
  const getTimeLabel = (count: number, type: 'days' | 'hours' | 'minutes' | 'seconds') => {
    const lastDigit = count % 10
    const lastTwoDigits = count % 100
    
    // Исключения для 11-14
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      switch (type) {
        case 'days': return 'дней'
        case 'hours': return 'часов'
        case 'minutes': return 'минут'
        case 'seconds': return 'секунд'
      }
    }
    
    // Обычные правила склонения
    switch (lastDigit) {
      case 1:
        switch (type) {
          case 'days': return 'день'
          case 'hours': return 'час'
          case 'minutes': return 'минута'
          case 'seconds': return 'секунда'
        }
        break
      case 2:
      case 3:
      case 4:
        switch (type) {
          case 'days': return 'дня'
          case 'hours': return 'часа'
          case 'minutes': return 'минуты'
          case 'seconds': return 'секунды'
        }
        break
      default:
        switch (type) {
          case 'days': return 'дней'
          case 'hours': return 'часов'
          case 'minutes': return 'минут'
          case 'seconds': return 'секунд'
        }
    }
    
    return type
  }

  // Компонент формы пожеланий
  const WishForm = ({ onSubmit, blockWidth, placeholder }: { onSubmit: (name: string, message: string) => void, blockWidth: number, placeholder?: string }) => {
    const [name, setName] = useState('')
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!message.trim()) return

      setIsSubmitting(true)
      await new Promise(resolve => setTimeout(resolve, 500)) // Имитация отправки
      onSubmit(name, message)
      setShowSuccess(true)
      // НЕ очищаем поля - пользователь может отправить еще одно пожелание
      setIsSubmitting(false)
      
      // Скрываем сообщение об успехе через 3 секунды
      setTimeout(() => setShowSuccess(false), 3000)
    }

    return (
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          placeholder="Ваше имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: Math.max(11, blockWidth / 28) + 'px',
            outline: 'none',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)'
            e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)'
            e.target.style.transform = 'scale(1.02)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
            e.target.style.transform = 'scale(1)'
          }}
        />
        <textarea
          placeholder={placeholder || "Ваше пожелание..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={2}
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: Math.max(11, blockWidth / 28) + 'px',
            outline: 'none',
            resize: 'none',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)'
            e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)'
            e.target.style.transform = 'scale(1.02)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
            e.target.style.transform = 'scale(1)'
          }}
        />
        <button
          type="submit"
          disabled={!message.trim() || isSubmitting}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: 'none',
            background: isSubmitting 
              ? 'rgba(255, 255, 255, 0.3)' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: Math.max(11, blockWidth / 28) + 'px',
            fontWeight: '600',
            cursor: isSubmitting ? 'default' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: !message.trim() ? 0.5 : 1,
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting && message.trim()) {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)'
            }
          }}
        >
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </button>

        {/* Сообщение об успешной отправке */}
        {showSuccess && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(34, 197, 94, 0.9)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '20px',
            fontSize: Math.max(10, blockWidth / 30) + 'px',
            fontWeight: '600',
            boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)',
            animation: 'fadeInOut 3s ease-in-out'
          }}>
            ✅ Пожелание отправлено!
          </div>
        )}
      </form>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6'>
      <div className='max-w-7xl mx-auto'>
        <h1 className='text-3xl font-bold text-center mb-8 text-gray-800'>
          Конструктор Приглашений
        </h1>
        
        <div className='grid grid-cols-4 gap-6'>
          {/* Left Panel - Block Templates */}
          <div className='bg-white rounded-lg shadow-lg p-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>Блоки</h3>
              <Plus className='w-5 h-5 text-purple-600' />
            </div>
            
            {/* Фон приглашения */}
            <div className='mb-6 p-3 bg-gray-50 rounded-lg'>
              <h4 className='text-sm font-semibold text-gray-700 mb-3'>Фон приглашения</h4>
              
              {/* Скрытый input для загрузки фона */}
              <input
                type="file"
                accept="image/*"
                ref={backgroundInputRef}
                onChange={handleBackgroundUpload}
                className="hidden"
              />
              
              <div className='space-y-2'>
                <button
                  onClick={() => backgroundInputRef.current?.click()}
                  className='w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors duration-200 flex items-center justify-center space-x-2'
                >
                  <Upload className="w-4 h-4" />
                  <span>Загрузить фон</span>
                </button>
                
                {backgroundImage && (
                  <>
                    <button
                      onClick={removeBackground}
                      className='w-full p-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors duration-200'
                    >
                      Убрать фон
                    </button>
                    
                    <div>
                      <label className='block text-xs text-gray-600 mb-1'>Прозрачность фона</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={backgroundOpacity}
                        onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{Math.round(backgroundOpacity * 100)}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Фоновая музыка */}
            <div className='mb-6 p-3 bg-gray-50 rounded-lg'>
              <h4 className='text-sm font-semibold text-gray-700 mb-3'>Фоновая музыка</h4>
              
              <div className='space-y-2'>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleBackgroundMusicUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                {backgroundMusic && (
                  <div className='p-2 bg-white rounded border'>
                    <div className='text-sm font-medium text-gray-700'>
                      🎵 {backgroundMusic.title}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Автоматически включится при открытии приглашения
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className='space-y-2'>
              {defaultBlockTemplates.map((template) => {
                const IconComponent = template.icon
                return (
                  <button
                    key={template.type}
                    onClick={() => addBlock(template)}
                    className='w-full p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group'
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-purple-600 group-hover:text-purple-700" />
                      </div>
                      <div className="flex-1 text-left">
                        <span className='block font-medium text-gray-800 group-hover:text-purple-800 transition-colors'>
                          {template.label}
                        </span>
                        <span className='block text-xs text-gray-500 group-hover:text-gray-600 transition-colors'>
                          {template.type === 'text' && 'Добавить текстовый блок'}
                          {template.type === 'bride-groom' && 'Имена жениха и невесты'}
                          {template.type === 'wedding-date' && 'Красивая дата свадьбы'}
                          {template.type === 'countdown' && 'Обратный отсчет до события'}
                          {template.type === 'photo' && 'Загрузить фотографию'}
                          {template.type === 'video' && 'Добавить видео'}
                          {template.type === 'map' && 'Карта с адресом'}
                          {template.type === 'timer' && 'Таймер события'}
                          {template.type === 'rsvp' && 'Подтверждение участия'}
                          {template.type === 'write-wish' && 'Написать пожелание'}
                          {template.type === 'show-wishes' && 'Показать пожелания'}
                          {template.type === 'our-story' && 'История вашей любви с фотографиями и важными датами'}
                          {template.type === 'wedding-team' && 'Ведущие, организаторы, певцы и другие участники свадьбы'}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Center - iPhone Mockup */}
          <div className='col-span-2 flex justify-center'>
            <div className='relative'>
              <div
                ref={phoneRef}
                className='relative w-[430px] h-[932px] bg-white rounded-[60px] shadow-2xl border-8 border-gray-900 overflow-y-auto overflow-x-hidden'
                style={{
                  backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  scrollBehavior: 'smooth'
                }}
              >
                {/* Кнопка фоновой музыки */}
                {backgroundMusic && (
                  <button
                    onClick={toggleBackgroundMusic}
                    className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center text-lg shadow-lg hover:scale-110"
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                    title={isMusicPlaying ? 'Остановить музыку' : 'Включить музыку'}
                  >
                    {isMusicPlaying ? '⏸️' : '🎵'}
                  </button>
                )}

                {/* Скрытый audio элемент */}
                {backgroundMusic && (
                  <audio
                    ref={backgroundMusicRef}
                    src={backgroundMusic.url}
                    loop
                    preload="metadata"
                    onPlay={() => setIsMusicPlaying(true)}
                    onPause={() => setIsMusicPlaying(false)}
                  />
                )}

                {backgroundImage && (
                  <div 
                    className='absolute inset-0 bg-white'
                    style={{ opacity: 1 - backgroundOpacity }}
                  />
                )}
                
                {blocks.map((block, index) => {
                  const scrollSettings = getScrollAnimationSettings(block, index)
                  
                  return (
                    <motion.div
                      key={block.id}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ 
                        once: false, 
                        amount: 0.3,
                        margin: "0px 0px -100px 0px" // Триггер анимации немного раньше
                      }}
                      variants={animationVariants[scrollSettings.animation as keyof typeof animationVariants]}
                      transition={scrollSettings.transition}
                      style={{
                        position: 'absolute',
                        left: block.position.x,
                        top: block.position.y,
                        width: block.size.width,
                        height: block.size.height,
                        zIndex: block.zIndex,
                        cursor: 'move',
                        background: `rgba(255, 255, 255, ${block.backgroundOpacity})`,
                        backdropFilter: `blur(${24 * block.backgroundOpacity}px)`,
                        borderRadius: '20px',
                        border: selectedBlock?.id === block.id 
                          ? `1.5px solid rgba(59, 130, 246, ${block.backgroundOpacity})` 
                          : `1px solid rgba(255, 255, 255, ${0.3 * block.backgroundOpacity})`,
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => setSelectedBlock(block)}
                    >
                      <div style={{ 
                        opacity: 1, 
                        color: block.color, 
                        textAlign: 'center',
                        fontSize: Math.max(Math.min(block.fontSize, block.size.width / 8, block.size.height / 3), 10) + 'px',
                        fontFamily: `'${block.font}', ${getFontFallback(block.font)}`,
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        wordWrap: 'break-word'
                      }}>
                        {/* Рендеринг содержимого блоков */}
                        {block.type === 'text' && (
                          <div style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: 'inherit', 
                            fontFamily: 'inherit', 
                            color: 'inherit',
                            wordWrap: 'break-word',
                            textAlign: 'center'
                          }}>
                            {/* Иконка блока */}
                            {block.content.icon && block.content.icon !== '' && (
                              <div style={{
                                fontSize: (block.content.iconSize || 24) + 'px',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                                animation: block.content.icon === '❤️' ? 'heartbeat 1.5s ease-in-out infinite' : 
                                         block.content.icon === 'dove' ? 'doveWings 2s ease-in-out infinite' :
                                         block.content.icon === '⭐' ? 'starTwinkle 3s ease-in-out infinite' : 'none'
                              }}>
                                {renderIcon(block.content.icon, block.content.iconSize || 24)}
                              </div>
                            )}
                            {/* Текст блока */}
                            <div>
                              {block.content.text || 'Введите текст...'}
                            </div>
                          </div>
                        )}
                        
                        {block.type === 'bride-groom' && (
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            color: 'inherit',
                            textAlign: 'center'
                          }}>
                            {/* Иконка блока */}
                            {block.content.icon && block.content.icon !== '' && (
                              <div style={{
                                fontSize: (block.content.iconSize || 24) + 'px',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                                animation: block.content.icon === '❤️' ? 'heartbeat 1.5s ease-in-out infinite' : 
                                         block.content.icon === 'dove' ? 'doveWings 2s ease-in-out infinite' :
                                         block.content.icon === '⭐' ? 'starTwinkle 3s ease-in-out infinite' : 'none'
                              }}>
                                {renderIcon(block.content.icon, block.content.iconSize || 24)}
                              </div>
                            )}
                            {/* Имена жениха и невесты */}
                            <div style={{ 
                              display: 'flex', 
                              flexDirection: block.layout === 'horizontal' ? 'row' : 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}>
                              <span>{block.content.bride || 'Невеста'}</span>
                              <span>{getSeparatorSymbol(block.separator || 'ampersand')}</span>
                              <span>{block.content.groom || 'Жених'}</span>
                            </div>
                          </div>
                        )}
                        
                        {block.type === 'wedding-date' && (
                          <div style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: 'inherit', 
                            fontFamily: 'inherit', 
                            color: 'inherit',
                            textAlign: 'center'
                          }}>
                            {/* Дата свадьбы */}
                            <div style={{ fontWeight: 'bold' }}>
                              {block.content.weddingDate ? 
                                new Date(block.content.weddingDate).toLocaleDateString('ru-RU', {
                                  year: 'numeric',
                                  month: 'long', 
                                  day: 'numeric'
                                }) : 
                                'Выберите дату'
                              }
                            </div>
                            
                            {/* Дополнительный текст */}
                            {block.content.text && (
                              <div style={{ 
                                fontSize: '0.9em',
                                opacity: 0.8,
                                fontStyle: 'italic'
                              }}>
                                {block.content.text}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {block.type === 'countdown' && (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            color: 'inherit',
                            textAlign: 'center'
                          }}>
                            {/* Дополнительный текст */}
                            {block.content.text && (
                              <div style={{ 
                                fontSize: '0.9em',
                                opacity: 0.8,
                                fontStyle: 'italic',
                                marginBottom: '4px'
                              }}>
                                {block.content.text}
                              </div>
                            )}
                            
                            {/* Обратный отсчет */}
                            {(() => {
                              if (!block.content.targetDate) {
                                return <div style={{ fontSize: 'inherit', color: 'inherit', textAlign: 'center' }}>Настройте дату</div>
                              }
                              
                              const targetTime = new Date(block.content.targetDate).getTime()
                              const now = currentTime
                              const timeLeft = targetTime - now
                              
                              if (timeLeft <= 0) {
                                return <div style={{ fontSize: 'inherit', color: 'inherit', textAlign: 'center' }}>Событие наступило!</div>
                              }
                              
                              const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
                              const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                              const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
                              const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
                              
                              const parts = []
                              if (block.content.showDays !== false && days > 0) parts.push({ value: days, label: getTimeLabel(days, 'days') })
                              if (block.content.showHours !== false) parts.push({ value: hours, label: getTimeLabel(hours, 'hours') })
                              if (block.content.showMinutes !== false) parts.push({ value: minutes, label: getTimeLabel(minutes, 'minutes') })
                              if (block.content.showSeconds !== false) parts.push({ value: seconds, label: getTimeLabel(seconds, 'seconds') })
                              
                              return (
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: `repeat(${parts.length}, 1fr)`,
                                  gap: '4px',
                                  fontSize: 'inherit',
                                  fontFamily: 'inherit',
                                  color: 'inherit',
                                  textAlign: 'center'
                                }}>
                                  {parts.map((part, index) => (
                                    <div key={index}>
                                      <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{part.value}</div>
                                      <div style={{ fontSize: '0.7em', opacity: 0.8 }}>{part.label}</div>
                                    </div>
                                  ))}
                                </div>
                              )
                            })()}
                          </div>
                        )}
                        
                        {block.type === 'photo' && (
                          <div style={{ 
                            width: '100%', 
                            height: '100%', 
                            position: 'relative',
                            borderRadius: block.shape === 'circle' ? '50%' : '12px',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {block.content.url ? (
                              <img 
                                src={block.content.url} 
                                alt={block.content.alt || 'Фото'}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  borderRadius: block.shape === 'circle' ? '50%' : '12px'
                                }}
                                onError={(e) => console.log('Image load error:', e)}
                                onLoad={(e) => console.log('Image loaded:', e)}
                              />
                            ) : (
                              <div style={{ 
                                fontSize: 'inherit', 
                                color: 'inherit', 
                                textAlign: 'center' 
                              }}>
                                📸 Загрузите фото
                              </div>
                            )}
                          </div>
                        )}
                        
                        {block.type === 'video' && (
                          <div style={{ 
                            width: '100%', 
                            height: '100%', 
                            position: 'relative',
                            borderRadius: block.shape === 'circle' ? '50%' : '12px',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {block.content.url ? (
                              <video 
                                src={block.content.url}
                                controls={true}
                                autoPlay={block.content.autoplay || false}
                                preload="metadata"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  borderRadius: block.shape === 'circle' ? '50%' : '12px'
                                }}
                                onPlay={pauseBackgroundMusic}
                                onPause={resumeBackgroundMusic}
                                onEnded={resumeBackgroundMusic}
                                onError={(e) => console.log('Video load error:', e)}
                                onLoadedData={(e) => console.log('Video loaded:', e)}
                              />
                            ) : (
                              <div style={{ 
                                fontSize: 'inherit', 
                                color: 'inherit', 
                                textAlign: 'center' 
                              }}>
                                🎬 Загрузите видео
                              </div>
                            )}
                          </div>
                        )}
                        

                        
                        {block.type === 'map' && (
                          <div 
                            style={{ 
                              width: '100%',
                              height: '100%',
                              position: 'relative',
                              cursor: 'pointer',
                              borderRadius: '24px',
                              overflow: 'hidden',
                              background: block.content.mapImage ? `url(${block.content.mapImage})` : 'rgba(0, 0, 0, 0.7)',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              boxShadow: `0 20px 40px rgba(0, 0, 0, ${0.3 * (block.backgroundOpacity || 0.9)}), 0 10px 20px rgba(0, 0, 0, ${0.2 * (block.backgroundOpacity || 0.9)})`,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              textAlign: 'center',
                              fontSize: 'inherit',
                              fontFamily: 'inherit',
                              color: 'white',
                              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                              border: `2px solid rgba(255, 255, 255, ${0.2 * (block.backgroundOpacity || 0.9)})`,
                              opacity: block.opacity || 1
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              openMap(block.content.address || '')
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                              e.currentTarget.style.boxShadow = `0 30px 60px rgba(0, 0, 0, ${0.4 * (block.backgroundOpacity || 0.9)}), 0 15px 30px rgba(0, 0, 0, ${0.3 * (block.backgroundOpacity || 0.9)})`
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)'
                              e.currentTarget.style.boxShadow = `0 20px 40px rgba(0, 0, 0, ${0.3 * (block.backgroundOpacity || 0.9)}), 0 10px 20px rgba(0, 0, 0, ${0.2 * (block.backgroundOpacity || 0.9)})`
                            }}
                          >
                            {/* Dark overlay for better text readability */}
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: `rgba(0, 0, 0, ${0.4 * (block.backgroundOpacity || 0.9)})`,
                              borderRadius: '24px'
                            }} />
                            

                            
                            {/* Content container */}
                            <div style={{
                              position: 'relative',
                              zIndex: 3,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '16px',
                              padding: '24px',
                              textAlign: 'center',
                              maxWidth: '90%'
                            }}>
                              {/* Block title */}
                              <div style={{ 
                                fontSize: Math.max(20, (block.size.width / 15)) + 'px',
                                fontWeight: '800',
                                color: '#f97316',
                                lineHeight: '1.1',
                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                                marginBottom: '8px'
                              }}>
                                {block.content.blockTitle || 'Карта'}
                              </div>

                              
                              {/* Location title */}
                              {block.content.title && (
                                <div style={{ 
                                  fontSize: Math.max(18, (block.size.width / 18)) + 'px',
                                  fontWeight: '700',
                                  color: 'white',
                                  lineHeight: '1.2',
                                  textShadow: '0 2px 6px rgba(0, 0, 0, 0.8)',
                                  background: `rgba(0, 0, 0, ${0.6 * (block.backgroundOpacity || 0.9)})`,
                                  padding: '12px 20px',
                                  borderRadius: '16px',
                                  backdropFilter: `blur(${10 * (block.backgroundOpacity || 0.9)}px)`,
                                  border: `1px solid rgba(255, 255, 255, ${0.3 * (block.backgroundOpacity || 0.9)})`,
                                  marginBottom: '16px'
                                }}>
                                  {block.content.title}
                                </div>
                              )}
                              
                              {/* Address */}
                              {block.content.address && (
                                <div style={{ 
                                  fontSize: Math.max(13, (block.size.width / 24)) + 'px',
                                  color: 'rgba(255, 255, 255, 0.9)',
                                  lineHeight: '1.3',
                                  wordWrap: 'break-word',
                                  maxWidth: '100%',
                                  background: `rgba(0, 0, 0, ${0.5 * (block.backgroundOpacity || 0.9)})`,
                                  padding: '10px 16px',
                                  borderRadius: '12px',
                                  backdropFilter: `blur(${8 * (block.backgroundOpacity || 0.9)}px)`,
                                  border: `1px solid rgba(255, 255, 255, ${0.2 * (block.backgroundOpacity || 0.9)})`,
                                  boxShadow: `0 2px 8px rgba(0, 0, 0, ${0.3 * (block.backgroundOpacity || 0.9)})`
                                }}>
                                  {block.content.address}
                                </div>
                              )}
                            </div>
                            
                            {/* Bottom accent line */}
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: '10%',
                              right: '10%',
                              height: '3px',
                              background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, ${0.8 * (block.backgroundOpacity || 0.9)}), transparent)`,
                              borderRadius: '2px',
                              zIndex: 3
                            }} />
                          </div>
                        )}
                        
                        {block.type === 'timer' && (
                          <div style={{ 
                            fontSize: 'inherit', 
                            fontFamily: 'inherit', 
                            color: 'inherit',
                            textAlign: 'center'
                          }}>
                            ⏱️ Таймер: {Math.floor((block.content.duration || 3600) / 60)}м
                          </div>
                        )}
                        
                        {block.type === 'rsvp' && (
                          <div style={{ 
                            fontSize: 'inherit', 
                            fontFamily: 'inherit', 
                            color: 'inherit',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}>
                            <div>✉️</div>
                            <div style={{ fontSize: '0.9em' }}>
                              {block.content.question || 'Подтвердите участие'}
                            </div>
                          </div>
                        )}
                        
                        {/* Блок для написания пожеланий */}
                        {block.type === 'write-wish' && (
                          <div style={{ 
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            color: 'white'
                          }}>
                            {/* Заголовок */}
                            <div style={{
                              padding: '20px 24px 16px',
                              textAlign: 'center',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                              <div style={{
                                fontSize: Math.max(14, (block.size.width / 18)) + 'px',
                                fontWeight: '600',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                              }}>
                                {/* Ручная иконка пера */}
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {block.content.placeholder || 'Оставить пожелание'}
                              </div>
                            </div>

                            {/* Форма добавления пожелания */}
                            <div style={{
                              flex: 1,
                              padding: '24px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}>
                              <WishForm onSubmit={addWish} blockWidth={block.size.width} placeholder={block.content.placeholder} />
                            </div>
                          </div>
                        )}

                        {/* Блок для отображения пожеланий */}
                        {block.type === 'show-wishes' && (
                          <div style={{ 
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            color: 'white'
                          }}>
                            {/* Заголовок */}
                            <div style={{
                              padding: '20px 24px 16px',
                              textAlign: 'center',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                              <div style={{
                                fontSize: Math.max(14, (block.size.width / 18)) + 'px',
                                fontWeight: '600',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                              }}>
                                {/* Ручная иконка сердца */}
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {block.content.title || 'Пожелания гостей'}
                              </div>
                            </div>

                            {/* Слайдер пожеланий */}
                            <div style={{
                              flex: 1,
                              position: 'relative',
                              overflow: 'hidden',
                              padding: '16px'
                            }}>
                              {wishes.length > 0 ? (
                                <div style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: `translate(-50%, -50%) translateX(${currentWishIndex * -100}%)`,
                                  transition: 'transform 0.5s ease-out',
                                  display: 'flex',
                                  width: `${wishes.length * 100}%`
                                }}>
                                  {wishes.map((wish, index) => (
                                    <div
                                      key={wish.id}
                                      style={{
                                        width: `${100 / wishes.length}%`,
                                        padding: '0 8px',
                                        textAlign: 'center'
                                      }}
                                    >
                                      <div style={{
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: '16px',
                                        padding: '16px',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        minHeight: '90px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                                      }}>
                                        <div style={{
                                          fontSize: Math.max(11, (block.size.width / 24)) + 'px',
                                          lineHeight: '1.4',
                                          marginBottom: '8px',
                                          color: 'white',
                                          fontStyle: 'italic'
                                        }}>
                                          "{wish.message}"
                                        </div>
                                        <div style={{
                                          fontSize: Math.max(9, (block.size.width / 28)) + 'px',
                                          color: 'rgba(255, 255, 255, 0.8)',
                                          fontWeight: '500'
                                        }}>
                                          — {wish.name}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  textAlign: 'center',
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  fontSize: Math.max(11, (block.size.width / 24)) + 'px'
                                }}>
                                  Пока нет пожеланий
                                </div>
                              )}
                            </div>

                            {/* Индикаторы слайдера */}
                            {wishes.length > 1 && (
                              <div style={{
                                position: 'absolute',
                                bottom: '20px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: '6px'
                              }}>
                                {wishes.map((_, index) => (
                                                                      <div
                                      key={index}
                                      style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: index === currentWishIndex 
                                          ? 'rgba(255, 255, 255, 0.9)' 
                                          : 'rgba(255, 255, 255, 0.3)',
                                        transition: 'all 0.3s ease'
                                      }}
                                    />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Блок "Наша история" */}
                        {block.type === 'our-story' && (
                          <div style={{ 
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            color: 'white'
                          }}>
                            {/* Заголовок */}
                            <div style={{
                              padding: '20px 24px 16px',
                              textAlign: 'center',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                              <div style={{
                                fontSize: Math.max(14, (block.size.width / 18)) + 'px',
                                fontWeight: '600',
                                color: block.color || 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                              }}>
                                {/* Выбранная иконка */}
                                <div style={{
                                  fontSize: (block.content.iconSize || 24) + 'px',
                                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                                }}>
                                  {block.content.icon || '❤️'}
                                </div>
                                {block.content.title || 'Наша история любви'}
                              </div>
                            </div>

                            {/* Содержимое истории */}
                            <div style={{
                              flex: 1,
                              padding: '20px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '16px',
                              overflow: 'auto'
                            }}>
                              {/* Основной текст истории */}
                              <div style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '16px',
                                padding: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                minHeight: '60px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <div style={{
                                  fontSize: Math.max(block.content.storyTextSize || 12, (block.size.width / 28)) + 'px',
                                  lineHeight: '1.4',
                                  color: block.color || 'rgba(255, 255, 255, 0.9)',
                                  textAlign: 'center',
                                  fontStyle: 'italic'
                                }}>
                                  {block.content.story || 'Расскажите о том, как вы познакомились, ваших первых свиданиях и важных моментах...'}
                                </div>
                              </div>

                              {/* Фотографии с историей (вертикально) */}
                              {block.content.photos && block.content.photos.length > 0 ? (
                                block.content.photos.map((photo: any, index: number) => (
                                  <div
                                    key={index}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: '12px',
                                      padding: '16px',
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      borderRadius: '16px',
                                      border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}
                                  >
                                    {/* Фотография */}
                                    <div
                                      style={{
                                        width: block.content.photoSize || 80,
                                        height: block.content.photoSize || 80,
                                        borderRadius: block.content.photoShape === 'circle' ? '50%' : '12px',
                                        overflow: 'hidden',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                                      }}
                                    >
                                      <img
                                        src={photo.url}
                                        alt={photo.alt || 'Фото'}
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover'
                                        }}
                                      />
                                    </div>

                                    {/* История для этой фотографии */}
                                    <div style={{
                                      background: 'rgba(255, 255, 255, 0.1)',
                                      borderRadius: '12px',
                                      padding: '12px',
                                      border: '1px solid rgba(255, 255, 255, 0.2)',
                                      width: '100%',
                                      textAlign: 'center',
                                      minHeight: '40px'
                                    }}>
                                                                              <div style={{
                                          fontSize: Math.max(block.content.storyTextSize || 12, (block.size.width / 32)) + 'px',
                                          lineHeight: '1.4',
                                          color: block.color || 'rgba(255, 255, 255, 0.9)',
                                          fontStyle: 'italic'
                                        }}>
                                          {photo.story || 'Расскажите историю этой фотографии...'}
                                        </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '20px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  borderRadius: '16px',
                                  border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                  <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    fontSize: '12px'
                                  }}>
                                    📷
                                  </div>
                                  <div style={{
                                    fontSize: Math.max(9, (block.size.width / 32)) + 'px',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    textAlign: 'center'
                                  }}>
                                    Добавьте фотографии с историей
                                  </div>
                                </div>
                              )}

                              {/* Важные даты */}
                              {block.content.importantDates && block.content.importantDates.length > 0 && (
                                <div style={{
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  borderRadius: '12px',
                                  padding: '12px',
                                  border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}>
                                  <div style={{
                                    fontSize: Math.max(9, (block.size.width / 32)) + 'px',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    textAlign: 'center'
                                  }}>
                                    💕 {block.content.importantDates.length} важных дат
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Блок "Команда свадьбы" */}
                        {block.type === 'wedding-team' && (
                          <div style={{ 
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            color: 'white'
                          }}>
                            {/* Заголовок */}
                            <div style={{
                              padding: '20px 24px 16px',
                              textAlign: 'center',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                              <div style={{
                                fontSize: Math.max(14, (block.size.width / 18)) + 'px',
                                fontWeight: '600',
                                color: block.color || 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                              }}>
                                {/* Иконка команды */}
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={block.color || 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <circle cx="9" cy="7" r="4" stroke={block.color || 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={block.color || 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={block.color || 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {block.content.title || 'Наша команда'}
                              </div>
                            </div>

                            {/* Содержимое команды */}
                            <div style={{
                              flex: 1,
                              padding: '20px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '16px',
                              overflow: 'auto'
                            }}>
                              {/* Участники команды */}
                              {block.content.members && block.content.members.length > 0 ? (
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: block.content.layout === 'list' ? '1fr' : 'repeat(auto-fit, minmax(140px, 1fr))',
                                  gap: '16px',
                                  alignItems: 'start'
                                }}>
                                  {block.content.members.map((member: any, index: number) => (
                                    <div
                                      key={index}
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        textAlign: 'center'
                                      }}
                                    >
                                      {/* Фотография участника */}
                                      <div
                                        style={{
                                          width: block.content.photoSize || 80,
                                          height: block.content.photoSize || 80,
                                          borderRadius: block.content.photoShape === 'circle' ? '50%' : '12px',
                                          overflow: 'hidden',
                                          background: 'rgba(255, 255, 255, 0.1)',
                                          border: '1px solid rgba(255, 255, 255, 0.2)',
                                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                                        }}
                                      >
                                        {member.photo ? (
                                          <img
                                            src={member.photo}
                                            alt={member.name || 'Участник'}
                                            style={{
                                              width: '100%',
                                              height: '100%',
                                              objectFit: 'cover'
                                            }}
                                          />
                                        ) : (
                                          <div style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'rgba(255, 255, 255, 0.5)',
                                            fontSize: '24px'
                                          }}>
                                            👤
                                          </div>
                                        )}
                                      </div>

                                      {/* Имя участника */}
                                      <div style={{
                                        fontSize: Math.max(12, (block.size.width / 25)) + 'px',
                                        fontWeight: '600',
                                        color: block.color || 'white',
                                        lineHeight: '1.2'
                                      }}>
                                        {member.name || 'Имя участника'}
                                      </div>

                                      {/* Роль участника */}
                                      {member.role && (
                                        <div style={{
                                          fontSize: Math.max(10, (block.size.width / 30)) + 'px',
                                          color: 'rgba(255, 255, 255, 0.8)',
                                          fontStyle: 'italic',
                                          lineHeight: '1.2'
                                        }}>
                                          {member.role}
                                        </div>
                                      )}

                                      {/* Описание участника */}
                                      {member.description && (
                                        <div style={{
                                          fontSize: Math.max(9, (block.size.width / 35)) + 'px',
                                          color: 'rgba(255, 255, 255, 0.7)',
                                          lineHeight: '1.3',
                                          marginTop: '4px'
                                        }}>
                                          {member.description}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '16px',
                                  padding: '40px 20px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  borderRadius: '16px',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  textAlign: 'center'
                                }}>
                                  <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    fontSize: '32px'
                                  }}>
                                    👥
                                  </div>
                                  <div style={{
                                    fontSize: Math.max(12, (block.size.width / 25)) + 'px',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    lineHeight: '1.3'
                                  }}>
                                    Добавьте участников команды
                                  </div>
                                  <div style={{
                                    fontSize: Math.max(10, (block.size.width / 30)) + 'px',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    lineHeight: '1.3'
                                  }}>
                                    Ведущие, организаторы, певцы, фотографы
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}




              </div>
            </div>
          </div>

          {/* Right Panel - Block Settings */}
          <div className='bg-white rounded-lg shadow-lg p-4'>
            <h3 className='text-lg font-semibold mb-4'>Настройки</h3>
            
            {/* Общие настройки анимаций */}
            {!selectedBlock && (
              <div className='space-y-4'>
                <h4 className='text-md font-medium text-gray-800'>Общие настройки анимаций</h4>
                
                <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
                  <p className='text-sm text-blue-800'>
                    ✨ <strong>Новое!</strong> Анимации теперь срабатывают при каждом скролле и появлении блока в области видимости
                  </p>
                </div>
                
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Тип анимации</label>
                  <select 
                    value={globalAnimation}
                    onChange={(e) => setGlobalAnimation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="none">Без анимации</option>
                    <option value="fadeIn">Плавное появление</option>
                    <option value="slideUp">Появление снизу</option>
                    <option value="slideDown">Появление сверху</option>
                    <option value="slideLeft">Появление справа</option>
                    <option value="slideRight">Появление слева</option>
                    <option value="scaleIn">Увеличение</option>
                    <option value="bounce">Подпрыгивание</option>
                    <option value="rotateIn">Поворот</option>
                    <option value="flip">Переворот</option>
                  </select>
                </div>
                
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Задержка между блоками: {globalAnimationDelay}s
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={globalAnimationDelay}
                    onChange={(e) => setGlobalAnimationDelay(parseFloat(e.target.value))}
                    className="w-full slider"
                  />
                </div>
                
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Длительность анимации: {globalAnimationDuration}s
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="2"
                    step="0.1"
                    value={globalAnimationDuration}
                    onChange={(e) => setGlobalAnimationDuration(parseFloat(e.target.value))}
                    className="w-full slider"
                  />
                </div>
                
                <div className='p-3 bg-green-50 rounded-lg border border-green-200'>
                  <p className='text-xs text-green-700'>
                    🎯 <strong>Настройки скролла:</strong> Анимации срабатывают когда 30% блока видно, с отступом -100px снизу для более раннего триггера
                  </p>
                </div>
              </div>
            )}
            
            {selectedBlock ? (
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Название блока</label>
                  <input
                    type="text"
                    value={selectedBlock.customName || ''}
                    onChange={(e) => {
                      const updated = { ...selectedBlock, customName: e.target.value }
                      setSelectedBlock(updated)
                      setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder={`Название для ${getBlockLabel(selectedBlock.type)}`}
                  />
                </div>

                                    {/* Размеры блока */}
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Ширина</label>
                        <input
                          type="number"
                          min="50"
                          max="400"
                          value={selectedBlock.size.width}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              size: { ...selectedBlock.size, width: parseInt(e.target.value) || 50 } 
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Высота</label>
                        <input
                          type="number"
                          min="30"
                          max="300"
                          value={selectedBlock.size.height}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              size: { ...selectedBlock.size, height: parseInt(e.target.value) || 30 } 
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Перемещение блока */}
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Перемещение блока</label>
                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <label className='block text-xs text-gray-600 mb-1'>Вверх/Вниз</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={selectedBlock.padding?.top || 0}
                            onChange={(e) => {
                              const offset = parseInt(e.target.value) || 0
                              const updated = { 
                                ...selectedBlock, 
                                position: {
                                  ...selectedBlock.position,
                                  y: selectedBlock.position.y + (offset - (selectedBlock.padding?.top || 0))
                                },
                                padding: { 
                                  top: offset,
                                  right: selectedBlock.padding?.right || 0,
                                  bottom: selectedBlock.padding?.bottom || 0,
                                  left: selectedBlock.padding?.left || 0
                                } 
                              }
                              setSelectedBlock(updated)
                              setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className='block text-xs text-gray-600 mb-1'>Вверх/Вниз</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={selectedBlock.padding?.bottom || 0}
                            onChange={(e) => {
                              const offset = parseInt(e.target.value) || 0
                              const updated = { 
                                ...selectedBlock, 
                                position: {
                                  ...selectedBlock.position,
                                  y: selectedBlock.position.y - (offset - (selectedBlock.padding?.bottom || 0))
                                },
                                padding: { 
                                  top: selectedBlock.padding?.top || 0,
                                  right: selectedBlock.padding?.right || 0,
                                  bottom: offset,
                                  left: selectedBlock.padding?.left || 0
                                } 
                              }
                              setSelectedBlock(updated)
                              setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className='block text-xs text-gray-600 mb-1'>Влево/Вправо</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={selectedBlock.padding?.left || 0}
                            onChange={(e) => {
                              const offset = parseInt(e.target.value) || 0
                              const updated = { 
                                ...selectedBlock, 
                                position: {
                                  ...selectedBlock.position,
                                  x: selectedBlock.position.x + (offset - (selectedBlock.padding?.left || 0))
                                },
                                padding: { 
                                  top: selectedBlock.padding?.top || 0,
                                  right: selectedBlock.padding?.right || 0,
                                  bottom: selectedBlock.padding?.bottom || 0,
                                  left: offset
                                } 
                              }
                              setSelectedBlock(updated)
                              setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className='block text-xs text-gray-600 mb-1'>Влево/Вправо</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={selectedBlock.padding?.right || 0}
                            onChange={(e) => {
                              const offset = parseInt(e.target.value) || 0
                              const updated = { 
                                ...selectedBlock, 
                                position: {
                                  ...selectedBlock.position,
                                  x: selectedBlock.position.x - (offset - (selectedBlock.padding?.right || 0))
                                },
                                padding: { 
                                  top: selectedBlock.padding?.top || 0,
                                  right: offset,
                                  bottom: selectedBlock.padding?.bottom || 0,
                                  left: selectedBlock.padding?.left || 0
                                } 
                              }
                              setSelectedBlock(updated)
                              setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <p className='text-xs text-gray-500 mt-2'>
                        💡 Положительные значения перемещают блок в указанном направлении, отрицательные - в противоположном
                      </p>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Цвет текста</label>
                      <input
                        type="color"
                        value={selectedBlock.color}
                        onChange={(e) => {
                          const updated = { ...selectedBlock, color: e.target.value }
                          setSelectedBlock(updated)
                          setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                        }}
                        className="w-full h-10 rounded border border-gray-300"
                      />
                    </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Прозрачность фона</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedBlock.backgroundOpacity}
                    onChange={(e) => {
                      const updated = { ...selectedBlock, backgroundOpacity: parseFloat(e.target.value) }
                      setSelectedBlock(updated)
                      setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                    }}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500">{Math.round(selectedBlock.backgroundOpacity * 100)}%</span>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Шрифт</label>
                  <div className="relative">
                    <select
                      value={selectedBlock.font}
                      onChange={(e) => {
                        const updated = { ...selectedBlock, font: e.target.value }
                        setSelectedBlock(updated)
                        setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                      }}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm appearance-none cursor-pointer"
                      style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em'
                      }}
                    >
                      <optgroup label="💝 Романтические">
                        <option value="Dancing Script">Dancing Script</option>
                        <option value="Great Vibes">Great Vibes</option>
                        <option value="Allura">Allura</option>
                        <option value="Alex Brush">Alex Brush</option>
                        <option value="Sacramento">Sacramento</option>
                        <option value="Satisfy">Satisfy</option>
                      </optgroup>
                      <optgroup label="✨ Элегантные">
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Crimson Text">Crimson Text</option>
                        <option value="Cormorant Garamond">Cormorant Garamond</option>
                      </optgroup>
                      <optgroup label="🎨 Креативные">
                        <option value="Pacifico">Pacifico</option>
                        <option value="Kaushan Script">Kaushan Script</option>
                        <option value="Amatic SC">Amatic SC</option>
                        <option value="Caveat">Caveat</option>
                        <option value="Shadows Into Light">Shadows Into Light</option>
                        <option value="Courgette">Courgette</option>
                        <option value="Lobster">Lobster</option>
                      </optgroup>
                      <optgroup label="📝 Классические">
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Inter">Inter</option>
                      </optgroup>
                    </select>
                    
                    {/* Превью выбранного шрифта */}
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                      <div 
                        className="text-center text-lg"
                        style={{ 
                          fontFamily: `'${selectedBlock.font}', ${getFontFallback(selectedBlock.font)}`,
                          color: selectedBlock.color
                        }}
                      >
                        {selectedBlock.type === 'bride-groom' 
                          ? `${selectedBlock.content.bride || 'Анна'} & ${selectedBlock.content.groom || 'Иван'}`
                          : selectedBlock.type === 'text'
                          ? selectedBlock.content.text || 'Образец текста'
                          : 'Добро пожаловать!'
                        }
                      </div>
                      <div className="text-xs text-gray-500 text-center mt-1">
                        Превью: {selectedBlock.font}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Размер шрифта</label>
                  <input
                    type="range"
                    min="8"
                    max="48"
                    step="1"
                    value={selectedBlock.fontSize}
                    onChange={(e) => {
                      const updated = { ...selectedBlock, fontSize: parseInt(e.target.value) }
                      setSelectedBlock(updated)
                      setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                    }}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500">{selectedBlock.fontSize}px</span>
                </div>

                {/* Содержимое блока */}
                <div className='space-y-4 border-t border-gray-200 pt-4'>
                  <h4 className='text-md font-semibold text-gray-800'>Содержимое</h4>
                  
                  {/* Поля для текстового блока */}
                  {selectedBlock.type === 'text' && (
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Текст</label>
                        <textarea
                          value={selectedBlock.content.text || ''}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, text: e.target.value }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={3}
                          placeholder="Введите текст..."
                        />
                      </div>

                      {/* Выбор иконки */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Иконка блока</label>
                        <div className='grid grid-cols-6 gap-2'>
                          {[
                            { icon: '', name: 'Без иконки', type: 'none' },
                            { icon: '❤️', name: 'Сердце', type: 'emoji' },
                            { icon: '💍', name: 'Кольца', type: 'emoji' },
                            { icon: '🌹', name: 'Роза', type: 'emoji' },
                            { icon: '⭐', name: 'Звезда', type: 'emoji' },
                            { icon: 'dove', name: 'Голубь', type: 'svg' },
                            { icon: '🎭', name: 'Маски', type: 'emoji' },
                            { icon: '🎨', name: 'Палитра', type: 'emoji' },
                            { icon: '🎵', name: 'Ноты', type: 'emoji' },
                            { icon: '🕯️', name: 'Свеча', type: 'emoji' },
                            { icon: '🎪', name: 'Шатер', type: 'emoji' }
                          ].map((iconOption, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                const updated = { 
                                  ...selectedBlock, 
                                  content: { ...selectedBlock.content, icon: iconOption.icon }
                                }
                                setSelectedBlock(updated)
                                setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                              }}
                              className={`p-2 text-2xl rounded-lg border-2 transition-all ${
                                selectedBlock.content.icon === iconOption.icon
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              title={iconOption.name}
                            >
                              {iconOption.icon}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Размер иконки */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Размер иконки: {selectedBlock.content.iconSize || 24}px</label>
                        <input
                          type="range"
                          min="16"
                          max="48"
                          step="2"
                          value={selectedBlock.content.iconSize || 24}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, iconSize: parseInt(e.target.value) }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className='flex justify-between text-xs text-gray-500 mt-1'>
                          <span>16px</span>
                          <span>48px</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Поля для блока жених-невеста */}
                  {selectedBlock.type === 'bride-groom' && (
                    <div className='space-y-3'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Имя невесты</label>
                        <input
                          type="text"
                          value={selectedBlock.content.bride || ''}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, bride: e.target.value }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Имя невесты"
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Имя жениха</label>
                        <input
                          type="text"
                          value={selectedBlock.content.groom || ''}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, groom: e.target.value }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Имя жениха"
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Разделитель</label>
                        <select
                          value={selectedBlock.separator || 'ampersand'}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              separator: e.target.value as Block['separator']
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="ampersand">&</option>
                          <option value="heart">♥</option>
                          <option value="infinity">∞</option>
                          <option value="star">⭐</option>
                          <option value="diamond">♦</option>
                          <option value="ornament">❦</option>
                        </select>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Компоновка</label>
                        <select
                          value={selectedBlock.layout || 'vertical'}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              layout: e.target.value as Block['layout']
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="vertical">Вертикальная</option>
                          <option value="horizontal">Горизонтальная</option>
                        </select>
                      </div>

                      {/* Выбор иконки */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Иконка блока</label>
                        <div className='grid grid-cols-5 gap-2'>
                          {[
                            { icon: '❤️', name: 'Сердце', type: 'emoji' },
                            { icon: '💍', name: 'Кольца', type: 'emoji' },
                            { icon: '🌹', name: 'Роза', type: 'emoji' },
                            { icon: '⭐', name: 'Звезда', type: 'emoji' },
                            { icon: 'dove', name: 'Голубь', type: 'svg' },
                            { icon: '🎭', name: 'Маски', type: 'emoji' },
                            { icon: '🎨', name: 'Палитра', type: 'emoji' },
                            { icon: '🎵', name: 'Ноты', type: 'emoji' },
                            { icon: '🕯️', name: 'Свеча', type: 'emoji' },
                            { icon: '🎪', name: 'Шатер', type: 'emoji' }
                          ].map((iconOption, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                const updated = { 
                                  ...selectedBlock, 
                                  content: { ...selectedBlock.content, icon: iconOption.icon }
                                }
                                setSelectedBlock(updated)
                                setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                              }}
                              className={`p-2 text-2xl rounded-lg border-2 transition-all ${
                                selectedBlock.content.icon === iconOption.icon
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              title={iconOption.name}
                            >
                              {iconOption.icon}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Размер иконки */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Размер иконки: {selectedBlock.content.iconSize || 24}px</label>
                        <input
                          type="range"
                          min="16"
                          max="48"
                          step="2"
                          value={selectedBlock.content.iconSize || 24}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, iconSize: parseInt(e.target.value) }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className='flex justify-between text-xs text-gray-500 mt-1'>
                          <span>16px</span>
                          <span>48px</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Поля для даты свадьбы */}
                  {selectedBlock.type === 'wedding-date' && (
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Дата свадьбы</label>
                        <input
                          type="date"
                          value={selectedBlock.content.weddingDate || ''}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, weddingDate: e.target.value }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Дополнительный текст</label>
                        <textarea
                          value={selectedBlock.content.text || ''}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, text: e.target.value }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={3}
                          placeholder="Добавьте описание, например: 'Ждем вас на нашем празднике!' или 'Начало в 15:00'"
                        />
                      </div>
                    </div>
                  )}

                  {/* Поля для обратного отсчета */}
                  {selectedBlock.type === 'countdown' && (
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Целевая дата и время</label>
                        <input
                          type="datetime-local"
                          value={selectedBlock.content.targetDate || ''}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, targetDate: e.target.value }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Дополнительный текст</label>
                        <textarea
                          value={selectedBlock.content.text || ''}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, text: e.target.value }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={3}
                          placeholder="Добавьте описание, например: 'До нашей свадьбы осталось:' или 'Время до торжества'"
                        />
                      </div>
                      
                      <div className='grid grid-cols-2 gap-2'>
                        <label className='flex items-center space-x-2'>
                          <input
                            type="checkbox"
                            checked={selectedBlock.content.showDays !== false}
                            onChange={(e) => {
                              const updated = { 
                                ...selectedBlock, 
                                content: { ...selectedBlock.content, showDays: e.target.checked }
                              }
                              setSelectedBlock(updated)
                              setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">Дни</span>
                        </label>
                        <label className='flex items-center space-x-2'>
                          <input
                            type="checkbox"
                            checked={selectedBlock.content.showHours !== false}
                            onChange={(e) => {
                              const updated = { 
                                ...selectedBlock, 
                                content: { ...selectedBlock.content, showHours: e.target.checked }
                              }
                              setSelectedBlock(updated)
                              setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">Часы</span>
                        </label>
                        <label className='flex items-center space-x-2'>
                          <input
                            type="checkbox"
                            checked={selectedBlock.content.showMinutes !== false}
                            onChange={(e) => {
                              const updated = { 
                                ...selectedBlock, 
                                content: { ...selectedBlock.content, showMinutes: e.target.checked }
                              }
                              setSelectedBlock(updated)
                              setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">Минуты</span>
                        </label>
                        <label className='flex items-center space-x-2'>
                          <input
                            type="checkbox"
                            checked={selectedBlock.content.showSeconds !== false}
                            onChange={(e) => {
                              const updated = { 
                                ...selectedBlock, 
                                content: { ...selectedBlock.content, showSeconds: e.target.checked }
                              }
                              setSelectedBlock(updated)
                              setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">Секунды</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Поля для фото */}
                  {selectedBlock.type === 'photo' && (
                    <div className='space-y-3'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Фотография</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (result) => {
                                if (result.target?.result) {
                                  const updated = { 
                                    ...selectedBlock, 
                                    content: { ...selectedBlock.content, url: result.target.result as string }
                                  }
                                  setSelectedBlock(updated)
                                  setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                                }
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Форма</label>
                        <select
                          value={selectedBlock.shape || 'square'}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              shape: e.target.value as Block['shape']
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="square">Квадрат</option>
                          <option value="circle">Круг</option>
                        </select>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Описание</label>
                        <input
                          type="text"
                          value={selectedBlock.content.alt || ''}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, alt: e.target.value }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Описание фото"
                        />
                      </div>
                    </div>
                  )}

                  {/* Поля для видео */}
                  {selectedBlock.type === 'video' && (
                    <div className='space-y-3'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Видео</label>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (result) => {
                                if (result.target?.result) {
                                  const updated = { 
                                    ...selectedBlock, 
                                    content: { ...selectedBlock.content, url: result.target.result as string }
                                  }
                                  setSelectedBlock(updated)
                                  setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                                }
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Форма</label>
                        <select
                          value={selectedBlock.shape || 'square'}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              shape: e.target.value as Block['shape']
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="square">Квадрат</option>
                          <option value="circle">Круг</option>
                        </select>
                      </div>
                      <label className='flex items-center space-x-2'>
                        <input
                          type="checkbox"
                          checked={selectedBlock.content.autoplay || false}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, autoplay: e.target.checked }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">Автовоспроизведение</span>
                      </label>
                    </div>
                  )}



                  {/* Поля для карты */}
                  {selectedBlock.type === 'map' && (
                    <div className='space-y-3'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Заголовок блока</label>
                        <input
                          type="text"
                          value={selectedBlock.content.blockTitle || 'Карта'}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, blockTitle: e.target.value }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Карта"
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Загрузить карту</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const mapImage = URL.createObjectURL(file)
                              const updated = { 
                                ...selectedBlock, 
                                content: { ...selectedBlock.content, mapImage }
                              }
                              setSelectedBlock(updated)
                              setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className='text-xs text-gray-500 mt-1'>Загрузите скриншот карты для фона</p>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Адрес</label>
                        <input
                          type="text"
                          value={selectedBlock.content.address || ''}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, address: e.target.value }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 border-blue-500"
                          placeholder="Введите адрес"
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Название места</label>
                        <input
                          type="text"
                          value={selectedBlock.content.title || ''}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, title: e.target.value }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Название места"
                        />
                      </div>
                    </div>
                  )}

                  {/* Поля для таймера */}
                  {selectedBlock.type === 'timer' && (
                    <div className='space-y-3'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Продолжительность (секунды)</label>
                        <input
                          type="number"
                          min="1"
                          value={selectedBlock.content.duration || 3600}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, duration: parseInt(e.target.value) || 3600 }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <label className='flex items-center space-x-2'>
                        <input
                          type="checkbox"
                          checked={selectedBlock.content.autostart || false}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, autostart: e.target.checked }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">Автостарт</span>
                      </label>
                    </div>
                  )}

                  {/* Поля для RSVP */}
                  {selectedBlock.type === 'rsvp' && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Вопрос для гостей</label>
                      <textarea
                        value={selectedBlock.content.question || ''}
                        onChange={(e) => {
                          const updated = { 
                            ...selectedBlock, 
                            content: { ...selectedBlock.content, question: e.target.value }
                          }
                          setSelectedBlock(updated)
                          setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={2}
                        placeholder="Подтвердите участие"
                      />
                    </div>
                  )}

                  {/* Поля для блока написания пожеланий */}
                  {selectedBlock.type === 'write-wish' && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Текст-подсказка</label>
                      <input
                        type="text"
                        value={selectedBlock.content.placeholder || ''}
                        onChange={(e) => {
                          const updated = { 
                            ...selectedBlock, 
                            content: { ...selectedBlock.content, placeholder: e.target.value }
                          }
                          setSelectedBlock(updated)
                          setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Оставьте пожелание"
                      />
                    </div>
                  )}

                  {/* Поля для блока отображения пожеланий */}
                  {selectedBlock.type === 'show-wishes' && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Заголовок блока</label>
                      <input
                        type="text"
                        value={selectedBlock.content.title || 'Пожелания гостей'}
                        onChange={(e) => {
                          const updated = { 
                            ...selectedBlock, 
                            content: { ...selectedBlock.content, title: e.target.value }
                          }
                          setSelectedBlock(updated)
                          setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Пожелания гостей"
                      />
                    </div>
                  )}

                  {/* Поля для блока "Наша история" */}
                  {selectedBlock.type === 'our-story' && (
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Заголовок блока</label>
                        <input
                          type="text"
                          value={selectedBlock.content.title || 'Наша история любви'}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, title: e.target.value }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Наша история любви"
                        />
                      </div>

                      {/* Выбор иконки */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Иконка блока</label>
                        <div className='grid grid-cols-5 gap-2'>
                          {[
                            { icon: '❤️', name: 'Сердце', type: 'emoji' },
                            { icon: '💍', name: 'Кольца', type: 'emoji' },
                            { icon: '🌹', name: 'Роза', type: 'emoji' },
                            { icon: '⭐', name: 'Звезда', type: 'emoji' },
                            { icon: 'dove', name: 'Голубь', type: 'svg' },
                            { icon: '🎭', name: 'Маски', type: 'emoji' },
                            { icon: '🎨', name: 'Палитра', type: 'emoji' },
                            { icon: '🎵', name: 'Ноты', type: 'emoji' },
                            { icon: '🕯️', name: 'Свеча', type: 'emoji' },
                            { icon: '🎪', name: 'Шатер', type: 'emoji' }
                          ].map((iconOption, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                const updated = { 
                                  ...selectedBlock, 
                                  content: { ...selectedBlock.content, icon: iconOption.icon }
                                }
                                setSelectedBlock(updated)
                                setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                              }}
                              className={`p-2 text-2xl rounded-lg border-2 transition-all ${
                                selectedBlock.content.icon === iconOption.icon
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              title={iconOption.name}
                            >
                              {iconOption.icon}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Размер иконки */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Размер иконки: {selectedBlock.content.iconSize || 24}px</label>
                        <input
                          type="range"
                          min="16"
                          max="48"
                          step="2"
                          value={selectedBlock.content.iconSize || 24}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, iconSize: parseInt(e.target.value) }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className='flex justify-between text-xs text-gray-500 mt-1'>
                          <span>16px</span>
                          <span>48px</span>
                        </div>
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Текст истории</label>
                        <textarea
                          value={selectedBlock.content.story || ''}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, story: e.target.value }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={4}
                          placeholder="Расскажите о том, как вы познакомились, ваших первых свиданиях и важных моментах..."
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Добавить фотографии</label>
                        <div className='space-y-2'>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || [])
                              const newPhotos = files.map(file => ({
                                url: URL.createObjectURL(file),
                                alt: file.name,
                                story: '' // История для каждой фотографии
                              }))
                              const updated = { 
                                ...selectedBlock, 
                                content: { 
                                  ...selectedBlock.content, 
                                  photos: [...(selectedBlock.content.photos || []), ...newPhotos]
                                }
                              }
                              setSelectedBlock(updated)
                              setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className='text-xs text-gray-500'>Можно добавить несколько фотографий</p>
                        </div>
                      </div>

                      {/* Размер фотографий */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Размер фотографий: {selectedBlock.content.photoSize || 80}px</label>
                        <input
                          type="range"
                          min="60"
                          max="120"
                          step="10"
                          value={selectedBlock.content.photoSize || 80}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, photoSize: parseInt(e.target.value) }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className='flex justify-between text-xs text-gray-500 mt-1'>
                          <span>60px</span>
                          <span>120px</span>
                        </div>
                      </div>

                      {/* Форма фотографий */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Форма фотографий</label>
                        <div className='flex gap-3'>
                          <label className='flex items-center'>
                            <input
                              type="radio"
                              name="photoShape"
                              value="square"
                              checked={selectedBlock.content.photoShape !== 'circle'}
                              onChange={(e) => {
                                const updated = { 
                                  ...selectedBlock, 
                                  content: { ...selectedBlock.content, photoShape: 'square' }
                                }
                                setSelectedBlock(updated)
                                setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                              }}
                              className="mr-2"
                            />
                            <span className='text-sm'>Квадрат</span>
                          </label>
                          <label className='flex items-center'>
                            <input
                              type="radio"
                              name="photoShape"
                              value="circle"
                              checked={selectedBlock.content.photoShape === 'circle'}
                              onChange={(e) => {
                                const updated = { 
                                  ...selectedBlock, 
                                  content: { ...selectedBlock.content, photoShape: 'circle' }
                                }
                                setSelectedBlock(updated)
                                setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                              }}
                              className="mr-2"
                            />
                            <span className='text-sm'>Круг</span>
                          </label>
                        </div>
                      </div>

                      {/* Размер текста истории */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Размер текста истории: {selectedBlock.content.storyTextSize || 12}px</label>
                        <input
                          type="range"
                          min="8"
                          max="24"
                          step="1"
                          value={selectedBlock.content.storyTextSize || 12}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, storyTextSize: parseInt(e.target.value) }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className='flex justify-between text-xs text-gray-500 mt-1'>
                          <span>8px</span>
                          <span>24px</span>
                        </div>
                      </div>

                      {/* Редактирование истории для каждой фотографии */}
                      {selectedBlock.content.photos && selectedBlock.content.photos.length > 0 && (
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>История для фотографий</label>
                          <div className='space-y-3 max-h-40 overflow-y-auto'>
                            {selectedBlock.content.photos.map((photo: any, index: number) => (
                              <div key={index} className='space-y-2'>
                                <div className='text-xs text-gray-600 font-medium'>Фото {index + 1}: {photo.alt}</div>
                                <textarea
                                  value={photo.story || ''}
                                  onChange={(e) => {
                                    const updatedPhotos = [...selectedBlock.content.photos]
                                    updatedPhotos[index] = { ...photo, story: e.target.value }
                                    const updated = { 
                                      ...selectedBlock, 
                                      content: { ...selectedBlock.content, photos: updatedPhotos }
                                    }
                                    setSelectedBlock(updated)
                                    setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                  rows={2}
                                  placeholder="Расскажите историю этой фотографии..."
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Важные даты</label>
                        <div className='space-y-2'>
                          <input
                            type="date"
                            onChange={(e) => {
                              const newDate = e.target.value
                              if (newDate) {
                                const updated = { 
                                  ...selectedBlock, 
                                  content: { 
                                    ...selectedBlock.content, 
                                    importantDates: [...(selectedBlock.content.importantDates || []), newDate]
                                  }
                                }
                                setSelectedBlock(updated)
                                setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className='text-xs text-gray-500'>Добавьте важные даты в ваших отношениях</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Поля для блока "Команда свадьбы" */}
                  {selectedBlock.type === 'wedding-team' && (
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Заголовок блока</label>
                        <input
                          type="text"
                          value={selectedBlock.content.title || 'Наша команда'}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, title: e.target.value }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Наша команда"
                        />
                      </div>

                      {/* Добавление нового участника */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Добавить участника команды</label>
                        <div className='space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200'>
                          <div>
                            <label className='block text-xs text-gray-600 mb-1'>Имя участника</label>
                            <input
                              type="text"
                              id="newMemberName"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Имя участника"
                            />
                          </div>
                          <div>
                            <label className='block text-xs text-gray-600 mb-1'>Роль/Специализация</label>
                            <input
                              type="text"
                              id="newMemberRole"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ведущий, организатор, певец..."
                            />
                          </div>
                          <div>
                            <label className='block text-xs text-gray-600 mb-1'>Описание</label>
                            <textarea
                              id="newMemberDescription"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                              rows={2}
                              placeholder="Краткое описание участника..."
                            />
                          </div>
                          <div>
                            <label className='block text-xs text-gray-600 mb-1'>Фотография</label>
                            <input
                              type="file"
                              id="newMemberPhoto"
                              accept="image/*"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const nameInput = document.getElementById('newMemberName') as HTMLInputElement
                              const roleInput = document.getElementById('newMemberRole') as HTMLInputElement
                              const descInput = document.getElementById('newMemberDescription') as HTMLTextAreaElement
                              const photoInput = document.getElementById('newMemberPhoto') as HTMLInputElement
                              
                              if (nameInput && nameInput.value.trim()) {
                                const newMember = {
                                  name: nameInput.value.trim(),
                                  role: roleInput?.value.trim() || '',
                                  description: descInput?.value.trim() || '',
                                  photo: photoInput?.files?.[0] ? URL.createObjectURL(photoInput.files[0]) : null
                                }
                                
                                const updated = { 
                                  ...selectedBlock, 
                                  content: { 
                                    ...selectedBlock.content, 
                                    members: [...(selectedBlock.content.members || []), newMember]
                                  }
                                }
                                setSelectedBlock(updated)
                                setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                                
                                // Очищаем поля
                                nameInput.value = ''
                                if (roleInput) roleInput.value = ''
                                if (descInput) descInput.value = ''
                                if (photoInput) photoInput.value = ''
                              }
                            }}
                            className='w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors duration-200'
                          >
                            Добавить участника
                          </button>
                        </div>
                      </div>

                      {/* Размер фотографий */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Размер фотографий: {selectedBlock.content.photoSize || 80}px</label>
                        <input
                          type="range"
                          min="60"
                          max="120"
                          step="10"
                          value={selectedBlock.content.photoSize || 80}
                          onChange={(e) => {
                            const updated = { 
                              ...selectedBlock, 
                              content: { ...selectedBlock.content, photoSize: parseInt(e.target.value) }
                            }
                            setSelectedBlock(updated)
                            setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className='flex justify-between text-xs text-gray-500 mt-1'>
                          <span>60px</span>
                          <span>120px</span>
                        </div>
                      </div>

                      {/* Форма фотографий */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Форма фотографий</label>
                        <div className='flex gap-3'>
                          <label className='flex items-center'>
                            <input
                              type="radio"
                              name="teamPhotoShape"
                              value="square"
                              checked={selectedBlock.content.photoShape !== 'circle'}
                              onChange={(e) => {
                                const updated = { 
                                  ...selectedBlock, 
                                  content: { ...selectedBlock.content, photoShape: 'square' }
                                }
                                setSelectedBlock(updated)
                                setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                              }}
                              className="mr-2"
                            />
                            <span className='text-sm'>Квадрат</span>
                          </label>
                          <label className='flex items-center'>
                            <input
                              type="radio"
                              name="teamPhotoShape"
                              value="circle"
                              checked={selectedBlock.content.photoShape === 'circle'}
                              onChange={(e) => {
                                const updated = { 
                                  ...selectedBlock, 
                                  content: { ...selectedBlock.content, photoShape: 'circle' }
                                }
                                setSelectedBlock(updated)
                                setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                              }}
                              className="mr-2"
                            />
                            <span className='text-sm'>Круг</span>
                          </label>
                        </div>
                      </div>

                      {/* Расположение карточек */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Расположение карточек</label>
                        <div className='flex gap-3'>
                          <label className='flex items-center'>
                            <input
                              type="radio"
                              name="teamLayout"
                              value="grid"
                              checked={selectedBlock.content.layout !== 'list'}
                              onChange={(e) => {
                                const updated = { 
                                  ...selectedBlock, 
                                  content: { ...selectedBlock.content, layout: 'grid' }
                                }
                                setSelectedBlock(updated)
                                setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                              }}
                              className="mr-2"
                            />
                            <span className='text-sm'>Сетка</span>
                          </label>
                          <label className='flex items-center'>
                            <input
                              type="radio"
                              name="teamLayout"
                              value="list"
                              checked={selectedBlock.content.layout === 'list'}
                              onChange={(e) => {
                                const updated = { 
                                  ...selectedBlock, 
                                  content: { ...selectedBlock.content, layout: 'list' }
                                }
                                setSelectedBlock(updated)
                                setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                              }}
                              className="mr-2"
                            />
                            <span className='text-sm'>Список</span>
                          </label>
                        </div>
                      </div>

                      {/* Редактирование участников команды */}
                      {selectedBlock.content.members && selectedBlock.content.members.length > 0 && (
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>Участники команды</label>
                          <div className='space-y-3 max-h-40 overflow-y-auto'>
                            {selectedBlock.content.members.map((member: any, index: number) => (
                              <div key={index} className='p-3 bg-gray-50 rounded-lg border border-gray-200'>
                                <div className='flex justify-between items-start mb-2'>
                                  <div className='text-xs text-gray-600 font-medium'>Участник {index + 1}</div>
                                  <button
                                    onClick={() => {
                                      const updatedMembers = selectedBlock.content.members.filter((_: any, i: number) => i !== index)
                                      const updated = { 
                                        ...selectedBlock, 
                                        content: { ...selectedBlock.content, members: updatedMembers }
                                      }
                                      setSelectedBlock(updated)
                                      setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                                    }}
                                    className='text-red-500 hover:text-red-700 text-xs'
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className='space-y-2'>
                                  <input
                                    type="text"
                                    value={member.name || ''}
                                    onChange={(e) => {
                                      const updatedMembers = [...selectedBlock.content.members]
                                      updatedMembers[index] = { ...member, name: e.target.value }
                                      const updated = { 
                                        ...selectedBlock, 
                                        content: { ...selectedBlock.content, members: updatedMembers }
                                      }
                                      setSelectedBlock(updated)
                                      setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Имя участника"
                                  />
                                  <input
                                    type="text"
                                    value={member.role || ''}
                                    onChange={(e) => {
                                      const updatedMembers = [...selectedBlock.content.members]
                                      updatedMembers[index] = { ...member, role: e.target.value }
                                      const updated = { 
                                        ...selectedBlock, 
                                        content: { ...selectedBlock.content, members: updatedMembers }
                                      }
                                      setSelectedBlock(updated)
                                      setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Роль/Специализация"
                                  />
                                  <textarea
                                    value={member.description || ''}
                                    onChange={(e) => {
                                      const updatedMembers = [...selectedBlock.content.members]
                                      updatedMembers[index] = { ...member, description: e.target.value }
                                      const updated = { 
                                        ...selectedBlock, 
                                        content: { ...selectedBlock.content, members: updatedMembers }
                                      }
                                      setSelectedBlock(updated)
                                      setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    rows={2}
                                    placeholder="Описание участника"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Настройки анимации блока */}
                <div className='space-y-3'>
                  <h4 className='text-md font-medium text-gray-800'>Анимация блока</h4>
                  
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Тип анимации</label>
                    <select 
                      value={selectedBlock.animation || globalAnimation}
                      onChange={(e) => {
                        const updated = { 
                          ...selectedBlock, 
                          animation: e.target.value 
                        }
                        setSelectedBlock(updated)
                        setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? updated : b))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Использовать общую анимацию</option>
                      <option value="none">Без анимации</option>
                      <option value="fadeIn">Плавное появление</option>
                      <option value="slideUp">Появление снизу</option>
                      <option value="slideDown">Появление сверху</option>
                      <option value="slideLeft">Появление справа</option>
                      <option value="slideRight">Появление слева</option>
                      <option value="scaleIn">Увеличение</option>
                      <option value="bounce">Подпрыгивание</option>
                      <option value="rotateIn">Поворот</option>
                      <option value="flip">Переворот</option>
                    </select>
                  </div>
                </div>

                {/* Кнопка удаления блока */}
                <div className='pt-4 border-t border-gray-200'>
                  <button
                    onClick={() => {
                      setBlocks(prev => prev.filter(b => b.id !== selectedBlock.id))
                      setSelectedBlock(null)
                    }}
                    className='w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2'
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Убрать блок</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className='text-center text-gray-500 py-8'>
                <Settings className='w-12 h-12 mx-auto mb-3 text-gray-300' />
                <p>Выберите блок для настройки</p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className='text-center mt-8'>
          <button 
            onClick={handleSaveInvite}
            className='bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200'
          >
            Сохранить приглашение
          </button>
        </div>
      </div>

      {/* Модальное окно успешного сохранения */}
      {showSuccess && savedInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Приглашение сохранено! 🎉
              </h3>
              
              <p className="text-gray-600 mb-6">
                Теперь вы можете поделиться ссылкой с гостями
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ссылка для гостей:
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={`${window.location.origin}/invite/${savedInvite.slug}`}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/invite/${savedInvite.slug}`)
                        alert('Ссылка скопирована!')
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                    >
                      Копировать
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Или отсканируйте QR-код:</p>
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <QRCodeDisplay 
                      slug={savedInvite.slug}
                      size={120}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSuccess(false)}
                className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
