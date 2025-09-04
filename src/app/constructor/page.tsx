'use client'

import { useState } from 'react'

export default function Page() {
  const [count, setCount] = useState(0)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Constructor Test</h1>
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-lg mb-4">This is a minimal test version</p>
          <button 
            onClick={() => setCount(count + 1)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Count: {count}
          </button>
        </div>
      </div>
    </div>
  )
}