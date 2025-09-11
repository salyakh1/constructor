'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Calendar,
  MapPin,
  User,
  Search,
  Filter,
  QrCode,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { QRCodeDisplay } from '@/components/QRCodeDisplay'

interface Invite {
  id: string
  slug: string
  content: {
    title: string
    description: string
    date: string
    time: string
    location: string
    hostName: string
    guestName: string
  }
  isDeleted: boolean
  createdAt: string
}

export default function AdminPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletedFilter, setDeletedFilter] = useState<'all' | 'active' | 'deleted'>('all')
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        // Fetch invitations from API
        const response = await fetch('/api/invites')
        
        if (response.ok) {
          const result = await response.json()
          setInvites(result.data || [])
        } else {
          // Fallback to mock data if API fails
          const mockInvites: Invite[] = [
          {
            id: '1',
            slug: 'birthday-anna-2024',
            content: {
              title: 'День рождения Анны',
              description: 'Приглашаем вас на празднование дня рождения!',
              date: '2024-12-25',
              time: '19:00',
              location: 'Ресторан "У Анны"',
              hostName: 'Анна',
              guestName: 'Дорогой друг'
            },
            isDeleted: false,
            createdAt: '2024-08-17'
          },
          {
            id: '2',
            slug: 'wedding-2024',
            content: {
              title: 'Свадьба Марии и Ивана',
              description: 'Торжественная церемония бракосочетания',
              date: '2024-09-15',
              time: '15:00',
              location: 'Дворец бракосочетаний',
              hostName: 'Мария и Иван',
              guestName: 'Уважаемые гости'
            },
            isDeleted: false,
            createdAt: '2024-08-10'
          },
          {
            id: '3',
            slug: 'corporate-2024',
            content: {
              title: 'Корпоративный ужин',
              description: 'Ежегодная встреча команды',
              date: '2024-11-20',
              time: '18:30',
              location: 'Офис компании',
              hostName: 'HR отдел',
              guestName: 'Сотрудники'
            },
            isDeleted: true,
            createdAt: '2024-08-05'
          }
          ]
          setInvites(mockInvites)
        }
        setLoading(false)
      } catch (err) {
        console.error('Error fetching invitations:', err)
        setLoading(false)
      }
    }

    fetchInvitations()
  }, [])

  const filteredInvites = invites.filter(invite => {
    const matchesSearch = invite.content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invite.content.hostName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDeleted = deletedFilter === 'all' || 
                          (deletedFilter === 'active' && !invite.isDeleted) ||
                          (deletedFilter === 'deleted' && invite.isDeleted)
    
    return matchesSearch && matchesDeleted
  })

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleCopyLink = async (slug: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      const link = `${baseUrl}/invite/${slug}`
      await navigator.clipboard.writeText(link)
      showNotification('success', 'Ссылка скопирована в буфер обмена!')
    } catch (err) {
      console.error('Error copying link:', err)
      showNotification('error', 'Ошибка копирования ссылки')
    }
  }

  const handleDelete = async (slug: string) => {
    if (confirm('Вы уверены, что хотите удалить это приглашение?')) {
      try {
        const response = await fetch(`/api/invites/${slug}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setInvites(prev => prev.map(inv => 
            inv.slug === slug ? { ...inv, isDeleted: true } : inv
          ))
          showNotification('success', 'Приглашение успешно удалено')
        } else {
          throw new Error('Failed to delete invite')
        }
      } catch (err) {
        console.error('Error deleting invite:', err)
        showNotification('error', 'Ошибка при удалении приглашения')
      }
    }
  }

  const handleShowQR = (invite: Invite) => {
    setSelectedInvite(invite)
    setShowQRModal(true)
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Settings className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Панель управления</h1>
                <p className="text-gray-600">Управляйте всеми созданными приглашениями</p>
              </div>
            </div>
            <a
              href="/constructor"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Создать новое
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{invites.length}</p>
                  <p className="text-sm text-blue-600">Всего приглашений</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {invites.filter(inv => !inv.isDeleted).length}
                  </p>
                  <p className="text-sm text-green-600">Активных</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Edit className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {invites.filter(inv => inv.isDeleted).length}
                  </p>
                  <p className="text-sm text-yellow-600">Удаленных</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">
                    {invites.length}
                  </p>
                  <p className="text-sm text-gray-600">Всего</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Поиск по названию или организатору..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
                             <select
                 value={deletedFilter}
                 onChange={(e) => setDeletedFilter(e.target.value as 'all' | 'active' | 'deleted')}
                 className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               >
                 <option value="all">Все</option>
                 <option value="active">Активные</option>
                 <option value="deleted">Удаленные</option>
               </select>
              <button className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Invitations List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Приглашение
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата события
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Статус
                   </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Создано
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                                 {filteredInvites.map((invite) => (
                   <tr key={invite.id} className="hover:bg-gray-50">
                     <td className="px-6 py-4">
                       <div>
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center">
                             <Calendar className="w-5 h-5 text-purple-600" />
                           </div>
                           <div>
                             <div className="text-sm font-medium text-gray-900">{invite.content.title}</div>
                             <div className="text-sm text-gray-500 flex items-center gap-2">
                               <User className="w-4 h-4" />
                               {invite.content.hostName}
                             </div>
                             {invite.content.location && (
                               <div className="text-sm text-gray-500 flex items-center gap-2">
                                 <MapPin className="w-4 h-4" />
                                 {invite.content.location}
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                         {invite.slug}
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="text-sm text-gray-900">
                         {new Date(invite.content.date).toLocaleDateString('ru-RU')}
                       </div>
                       {invite.content.time && (
                         <div className="text-sm text-gray-500">{invite.content.time}</div>
                       )}
                     </td>
                     <td className="px-6 py-4">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${invite.isDeleted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                         {invite.isDeleted ? 'Deleted' : 'Active'}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-sm text-gray-500">
                       {new Date(invite.createdAt).toLocaleDateString('ru-RU')}
                     </td>
                     <td className="px-6 py-4 text-right text-sm font-medium">
                       <div className="flex items-center justify-end gap-2">
                         <button
                           onClick={() => handleCopyLink(invite.slug)}
                           className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                           title="Скопировать ссылку"
                         >
                           <Copy className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => handleShowQR(invite)}
                           className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                           title="Показать QR-код"
                         >
                           <QrCode className="w-4 h-4" />
                         </button>
                         <a
                           href={`/invite/${invite.slug}`}
                           target="_blank"
                           className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                           title="Просмотреть"
                         >
                           <Eye className="w-4 h-4" />
                         </a>
                         <button
                           onClick={() => handleDelete(invite.slug)}
                           className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                           title="Удалить"
                           disabled={invite.isDeleted}
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQRModal && selectedInvite && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">QR-код приглашения</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">{selectedInvite.content.title}</h4>
                  <p className="text-sm text-gray-600">Slug: {selectedInvite.slug}</p>
                </div>

                <div className="mb-6">
                  <QRCodeDisplay 
                    slug={selectedInvite.slug}
                    size={200}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleCopyLink(selectedInvite.slug)}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Скопировать ссылку
                  </button>
                  <a
                    href={`/invite/${selectedInvite.slug}`}
                    target="_blank"
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Открыть
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`p-4 rounded-xl shadow-lg flex items-center gap-3 ${
              notification.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="text-gray-500 hover:text-gray-700 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
