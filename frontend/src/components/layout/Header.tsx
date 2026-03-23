'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getEmail, getNickname, clearAuth } from '@/lib/auth'

const MASTER_EMAIL = process.env.NEXT_PUBLIC_MASTER_EMAIL ?? ''

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)

  useEffect(() => {
    setEmail(getEmail())
    setNickname(getNickname())
  }, [pathname])

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  const navLinkClass = (href: string) => {
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
    return `hover:text-slate-100 transition ${isActive ? 'text-slate-100 font-medium' : 'text-slate-400'}`
  }

  const isMaster = email === MASTER_EMAIL

  return (
    <header className="border-b border-slate-800 bg-[#0f172a]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
        <Link href="/" className="flex-shrink-0 text-lg sm:text-xl font-bold text-blue-400 hover:text-blue-300">
          finfo
        </Link>
        <nav className="flex flex-1 min-w-0 items-center gap-3 sm:gap-6 text-sm overflow-x-auto scrollbar-hide">
          <Link href="/" className={`${navLinkClass('/')} whitespace-nowrap`}>대시보드</Link>
          <Link href="/indicators" className={`${navLinkClass('/indicators')} whitespace-nowrap`}>지표 탐색</Link>
          <Link href="/favorites" className={`${navLinkClass('/favorites')} whitespace-nowrap`}>즐겨찾기</Link>
          <Link href="/compare" className={`${navLinkClass('/compare')} whitespace-nowrap`}>비교</Link>
          <Link href="/calendar" className={`${navLinkClass('/calendar')} whitespace-nowrap`}>캘린더</Link>
          <Link href="/briefing" className={`${navLinkClass('/briefing')} whitespace-nowrap`}>AI 브리핑</Link>
          <Link href="/discussion" className={`${navLinkClass('/discussion')} whitespace-nowrap`}>토론방</Link>

          {/* 로그인 상태에서만 보이는 탭 */}
          {email && (
            <>
              {isMaster && (
                <Link
                  href="/admin"
                  className={`hidden sm:block rounded px-2 py-0.5 text-xs font-medium transition ${
                    pathname.startsWith('/admin')
                      ? 'bg-blue-700 text-white'
                      : 'border border-blue-700 text-blue-400 hover:bg-blue-900/40'
                  }`}
                >
                  관리자
                </Link>
              )}
              <Link href="/mypage" className={navLinkClass('/mypage')}>
                {nickname ?? '마이페이지'}
              </Link>
            </>
          )}

          <button
            onClick={handleLogout}
            className="border-l border-slate-700 pl-3 text-xs text-slate-400 hover:text-slate-100 transition"
          >
            로그아웃
          </button>
        </nav>
      </div>
    </header>
  )
}
