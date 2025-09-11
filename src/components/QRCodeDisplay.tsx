'use client'

import React from 'react'
import { QRCodeCanvas } from "qrcode.react"

interface QRCodeDisplayProps {
  slug: string
  size?: number
}

export function QRCodeDisplay({ slug, size = 180 }: QRCodeDisplayProps) {
  // Формируем URL для QR-кода
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  const url = `${baseUrl}/invite/${slug}`
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <QRCodeCanvas 
          value={url} 
          size={size}
          level="M"
          includeMargin={true}
          fgColor="#000000"
          bgColor="#FFFFFF"
        />
      </div>
      <div className="text-sm text-gray-600 text-center max-w-xs">
        <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded">
          {url}
        </p>
      </div>
    </div>
  )
}