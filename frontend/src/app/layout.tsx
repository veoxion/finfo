import type { Metadata } from 'next'
import './globals.css'
import QueryProvider from '@/components/QueryProvider'
import Header from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'finfo - 글로벌 경제 지표 대시보드',
  description: '한국·미국·글로벌 주요 경제 지표를 한눈에 비교하고 탐색하세요.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#0f172a] text-slate-100">
        <QueryProvider>
          <Header />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</main>
        </QueryProvider>
      </body>
    </html>
  )
}
