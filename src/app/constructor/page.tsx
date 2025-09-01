export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

import { Suspense } from 'react'
import ConstructorContent from './ConstructorContent'

export default function ConstructorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка конструктора...</p>
        </div>
      </div>
    }>
      <ConstructorContent />
    </Suspense>
  )
}