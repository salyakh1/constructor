import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Простая защита паролем для конструктора и админки
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Защищаем только конструктор и админку
  if (pathname.startsWith('/constructor') || pathname.startsWith('/admin')) {
    // Проверяем пароль из cookies или заголовков
    const authToken = request.cookies.get('auth_token')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '')
    
    // Простой пароль для демонстрации (в продакшене использовать более сложную систему)
    const correctPassword = process.env.ADMIN_PASSWORD || 'wedding2024'
    
    if (authToken !== correctPassword) {
      // Если нет авторизации, перенаправляем на страницу входа
      if (pathname.startsWith('/constructor')) {
        return NextResponse.redirect(new URL('/login?redirect=/constructor', request.url))
      }
      if (pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/login?redirect=/admin', request.url))
      }
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/constructor/:path*',
    '/admin/:path*'
  ]
}
