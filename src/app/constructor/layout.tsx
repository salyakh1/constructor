import type { Metadata } from 'next'

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Конструктор приглашений',
  description: 'Создайте красивое свадебное приглашение',
}

export default function ConstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
