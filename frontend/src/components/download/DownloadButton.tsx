'use client'

import { useState } from 'react'

interface DownloadButtonProps {
  code: string
  name: string
}

export default function DownloadButton({ code, name }: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/indicators/${code}/download?format=csv`
      )
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const today = new Date().toISOString().slice(0, 10)
      const filename = `${code}_${today}.csv`

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('CSV download error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded px-3 py-1.5 text-sm transition"
      title={`${name} CSV 다운로드`}
    >
      {isLoading ? '...' : '↓ CSV'}
    </button>
  )
}
