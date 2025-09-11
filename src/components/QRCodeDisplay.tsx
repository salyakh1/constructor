'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QRCodeDisplayProps {
  value: string
  size?: number
  className?: string
}

function QRCodeDisplay({ 
  value, 
  size = 200, 
  className = '' 
}: QRCodeDisplayProps) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="transparent"
        fgColor="currentColor"
        level="M"
        includeMargin={false}
      />
    </div>
  )
}

export default QRCodeDisplay
export { QRCodeDisplay }