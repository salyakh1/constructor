import Link from 'next/link'
import { Plus, Eye, Settings, QrCode } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <QrCode className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Конструктор приглашений</h1>
            </div>
            <nav className="flex space-x-8">
              <Link href="/constructor" className="text-gray-600 hover:text-blue-600 transition-colors">
                Создать
              </Link>
              <Link href="/admin" className="text-gray-600 hover:text-blue-600 transition-colors">
                Управление
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Создавайте красивые приглашения
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Простой и удобный конструктор для создания приглашений на любые события. 
            Добавляйте QR-коды, настраивайте дизайн и делитесь с гостями.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Создание */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Создать приглашение</h3>
              <p className="text-gray-600 mb-6">
                Используйте наш конструктор для создания уникальных приглашений
              </p>
              <Link 
                href="/constructor"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Начать создание
              </Link>
            </div>

            {/* Просмотр */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Просмотр приглашений</h3>
              <p className="text-gray-600 mb-6">
                Гости могут просматривать приглашения по уникальным ссылкам
              </p>
              <div className="text-sm text-gray-500">
                Пример: /invite/abc123
              </div>
            </div>

            {/* Управление */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Управление</h3>
              <p className="text-gray-600 mb-6">
                Администрируйте все созданные приглашения в удобной панели
              </p>
              <Link 
                href="/admin"
                className="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors"
              >
                Перейти в админку
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="mt-20">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Возможности</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">QR-коды</h4>
                <p className="text-sm text-gray-600">Автоматическая генерация QR-кодов</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Предпросмотр</h4>
                <p className="text-sm text-gray-600">Реальное время просмотра изменений</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Настройки</h4>
                <p className="text-sm text-gray-600">Гибкая настройка дизайна</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Шаблоны</h4>
                <p className="text-sm text-gray-600">Готовые шаблоны для быстрого старта</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Конструктор приглашений. Создано с Next.js и Supabase.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
