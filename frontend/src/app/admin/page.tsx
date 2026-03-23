'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { getToken, getEmail } from '@/lib/auth'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const MASTER_EMAIL = process.env.NEXT_PUBLIC_MASTER_EMAIL ?? ''

const SOURCES = ['WorldBank', 'FRED', 'ECOS', 'BLS', 'KOSIS', 'BEA']

interface User {
  id: string
  email: string
  nickname: string | null
  createdAt: string
  deletedAt: string | null
}

interface CollectorLog {
  source: string
  status: 'success' | 'failure' | 'partial'
  message: string | null
  recordsCount: number
  createdAt: string
}

interface ReportedRoom {
  id: string
  name: string
  creatorNickname: string
  reportCount: number
  isLocked: boolean
  reports: { reason: string; reporter: string; createdAt: string }[]
  createdAt: string
}

interface AllRoom {
  id: string
  name: string
  creatorNickname: string
  createdBy: string
  messageCount: number
  reportCount: number
  isLocked: boolean
  createdAt: string
}

interface Stats {
  briefing: {
    totalCalls: number
    aiCalls: number
    cacheHits: number
  }
  collectors: CollectorLog[]
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` }
}

const STATUS_STYLE: Record<string, string> = {
  success: 'text-green-400',
  failure: 'text-red-400',
  partial: 'text-yellow-400',
}

const STATUS_LABEL: Record<string, string> = {
  success: '성공',
  failure: '실패',
  partial: '부분 성공',
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [reportedRooms, setReportedRooms] = useState<ReportedRoom[]>([])
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null)
  const [allRooms, setAllRooms] = useState<AllRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [collecting, setCollecting] = useState<string | null>(null)
  const [collectMsg, setCollectMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [collectorHistory, setCollectorHistory] = useState<{ source: string; status: string; recordsCount: number; createdAt: string }[]>([])


  const fetchStats = useCallback(async () => {
    const [usersRes, statsRes, chatRes, allRoomsRes, historyRes] = await Promise.all([
      axios.get<User[]>(`/api/admin/users`, { headers: authHeaders() }),
      axios.get<Stats>(`/api/admin/stats`, { headers: authHeaders() }),
      axios.get<ReportedRoom[]>(`/api/admin/chat-reports`, { headers: authHeaders() }),
      axios.get<AllRoom[]>(`/api/chat/rooms`, { headers: authHeaders() }),
      axios.get<{ source: string; status: string; recordsCount: number; createdAt: string }[]>(`/api/admin/collector-history`, { headers: authHeaders() }),
    ])
    setUsers(usersRes.data)
    setStats(statsRes.data)
    setReportedRooms(chatRes.data)
    setAllRooms(allRoomsRes.data)
    setCollectorHistory(historyRes.data)
  }, [])

  useEffect(() => {
    const email = getEmail()
    if (email !== MASTER_EMAIL) {
      router.replace('/')
      return
    }

    fetchStats()
      .catch(() => setError('데이터를 불러오는 데 실패했습니다.'))
      .finally(() => setLoading(false))
  }, [router, fetchStats])

  const handleCollect = async (source?: string) => {
    const key = source ?? 'all'
    setCollecting(key)
    setCollectMsg(null)
    try {
      const res = await axios.post(
        `/api/admin/collect`,
        source ? { source } : {},
        { headers: authHeaders() }
      )
      setCollectMsg({ type: 'success', text: res.data.message })
      // 완료 후 통계 새로고침
      await fetchStats()
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? '수집 실패'
        : '수집 실패'
      setCollectMsg({ type: 'error', text: msg })
    } finally {
      setCollecting(null)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-slate-400">로딩 중...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-red-400">{error}</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">관리자 대시보드</h1>
          <p className="mt-1 text-sm text-slate-400">마스터 계정 전용 페이지</p>
        </div>
        <button
          onClick={() => handleCollect()}
          disabled={!!collecting}
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {collecting === 'all' ? '수집 중...' : '전체 수집'}
        </button>
      </div>

      {collectMsg && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          collectMsg.type === 'success'
            ? 'border-green-700 bg-green-900/30 text-green-300'
            : 'border-red-700 bg-red-900/30 text-red-300'
        }`}>
          {collectMsg.text}
        </div>
      )}

      {/* AI 브리핑 통계 */}
      {stats && (
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-200">AI 브리핑 호출 통계</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-100">{stats.briefing.totalCalls}</p>
              <p className="mt-1 text-xs text-slate-400">총 호출 횟수</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.briefing.aiCalls}</p>
              <p className="mt-1 text-xs text-slate-400">실제 AI 호출</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.briefing.cacheHits}</p>
              <p className="mt-1 text-xs text-slate-400">캐시 응답</p>
            </div>
          </div>
        </div>
      )}

      {/* 데이터 수집 현황 */}
      {stats && (
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-200">데이터 수집 현황</h2>
          <ul className="divide-y divide-slate-700">
            {SOURCES.map((source) => {
              const log = stats.collectors.find((c) => c.source === source)
              return (
                <li key={source} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium text-slate-300">{source}</span>
                    {log ? (
                      <>
                        <span className={`text-xs font-medium ${STATUS_STYLE[log.status]}`}>
                          {STATUS_LABEL[log.status]}
                        </span>
                        <span className="text-xs text-slate-500">{log.recordsCount}건</span>
                        <span className="text-xs text-slate-600">
                          {new Date(log.createdAt).toLocaleString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-600">수집 기록 없음</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleCollect(source)}
                    disabled={!!collecting}
                    className="w-fit rounded border border-slate-600 bg-slate-800 px-3 py-1 text-xs text-slate-400 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {collecting === source ? '수집 중...' : '지금 수집'}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* 수집기 모니터링 차트 */}
      {collectorHistory.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-200">수집기 모니터링 (최근 30일)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(() => {
                // 날짜별로 그룹핑하여 소스별 수집 건수 집계
                const grouped: Record<string, Record<string, number>> = {}
                for (const log of collectorHistory) {
                  const dateKey = new Date(log.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                  if (!grouped[dateKey]) grouped[dateKey] = {}
                  grouped[dateKey][log.source] = (grouped[dateKey][log.source] ?? 0) + (log.status === 'success' ? 1 : 0)
                }
                return Object.entries(grouped).map(([date, sources]) => ({ date, ...sources }))
              })()}>
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} labelStyle={{ color: '#e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {SOURCES.map((source, i) => (
                  <Line key={source} type="monotone" dataKey={source} stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* 실패 이력 */}
          {(() => {
            const failures = collectorHistory.filter((l) => l.status === 'failure')
            if (failures.length === 0) return null
            return (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-medium text-red-400">최근 실패 이력</h3>
                <ul className="space-y-1">
                  {failures.slice(-10).reverse().map((log, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs">
                      <span className="text-red-400 font-medium w-20">{log.source}</span>
                      <span className="text-slate-500">
                        {new Date(log.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })()}
        </div>
      )}

      {/* 채팅방 신고 관리 */}
      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-200">
          채팅방 신고 현황
          <span className="ml-2 text-sm font-normal text-slate-400">({reportedRooms.length}개)</span>
        </h2>
        {reportedRooms.length === 0 ? (
          <p className="text-sm text-slate-500">신고된 채팅방이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-700">
            {reportedRooms.map((room) => (
              <li key={room.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-200">{room.name}</span>
                    <span className="text-xs text-slate-500">by {room.creatorNickname}</span>
                    {room.isLocked ? (
                      <span className="rounded border border-red-700 bg-red-900/30 px-1.5 py-0.5 text-xs text-red-400">🔒 잠금 ({room.reportCount}회)</span>
                    ) : room.reportCount >= 5 ? (
                      <span className="rounded border border-yellow-700 bg-yellow-900/20 px-1.5 py-0.5 text-xs text-yellow-400">⚠️ 주의 ({room.reportCount}회)</span>
                    ) : (
                      <span className="rounded border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">신고 {room.reportCount}회</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
                      className="text-xs text-slate-500 hover:text-slate-300 transition"
                    >
                      {expandedRoom === room.id ? '▲ 접기' : '▼ 신고 내역'}
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`"${room.name}" 채팅방을 삭제하시겠습니까?`)) return
                        try {
                          await axios.delete(`/api/chat/rooms/${room.id}`, { headers: authHeaders() })
                          setReportedRooms((prev) => prev.filter((r) => r.id !== room.id))
                        } catch {
                          alert('삭제에 실패했습니다.')
                        }
                      }}
                      className="rounded border border-red-800 px-2 py-0.5 text-xs text-red-400 transition hover:bg-red-900/30"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                {expandedRoom === room.id && (
                  <ul className="mt-2 space-y-1 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                    {room.reports.map((rep, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span className="shrink-0 text-slate-500">{rep.reporter}</span>
                        <span className="text-slate-400">{rep.reason}</span>
                        <span className="ml-auto shrink-0 text-slate-600">
                          {new Date(rep.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 전체 채팅방 관리 */}
      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-200">
          전체 채팅방 관리
          <span className="ml-2 text-sm font-normal text-slate-400">({allRooms.length}개)</span>
        </h2>
        {allRooms.length === 0 ? (
          <p className="text-sm text-slate-500">채팅방이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-700">
            {allRooms.map((room) => (
              <li key={room.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-200 truncate">{room.name}</span>
                    {room.isLocked && (
                      <span className="rounded border border-red-700 bg-red-900/30 px-1.5 py-0.5 text-xs text-red-400">🔒 잠금</span>
                    )}
                    {room.reportCount > 0 && (
                      <span className={`rounded border px-1.5 py-0.5 text-xs ${
                        room.reportCount >= 10
                          ? 'border-red-700 bg-red-900/30 text-red-400'
                          : room.reportCount >= 5
                          ? 'border-yellow-700 bg-yellow-900/20 text-yellow-400'
                          : 'border-slate-600 bg-slate-800 text-slate-400'
                      }`}>
                        신고 {room.reportCount}회
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    <span>{room.creatorNickname}</span>
                    <span>·</span>
                    <span>메시지 {room.messageCount}개</span>
                    <span>·</span>
                    <span>{new Date(room.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm(`"${room.name}" 채팅방을 삭제하시겠습니까?`)) return
                    try {
                      await axios.delete(`/api/chat/rooms/${room.id}`, { headers: authHeaders() })
                      setAllRooms((prev) => prev.filter((r) => r.id !== room.id))
                      setReportedRooms((prev) => prev.filter((r) => r.id !== room.id))
                    } catch {
                      alert('삭제에 실패했습니다.')
                    }
                  }}
                  className="shrink-0 rounded border border-red-800 px-2 py-1 text-xs text-red-400 transition hover:bg-red-900/30"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 사용자 목록 */}
      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-200">
          사용자 목록 <span className="ml-2 text-sm font-normal text-slate-400">({users.length}명)</span>
        </h2>
        <ul className="divide-y divide-slate-700">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm ${user.deletedAt ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {user.email}
                </span>
                {user.nickname && (
                  <span className="text-xs text-slate-400">({user.nickname})</span>
                )}
                {user.email === MASTER_EMAIL && (
                  <span className="rounded border border-blue-700 bg-blue-900/50 px-1.5 py-0.5 text-xs text-blue-300">
                    마스터
                  </span>
                )}
                {user.deletedAt ? (
                  <span className="rounded border border-red-800 bg-red-900/30 px-1.5 py-0.5 text-xs text-red-400">
                    탈퇴
                  </span>
                ) : (
                  <span className="rounded border border-green-800 bg-green-900/30 px-1.5 py-0.5 text-xs text-green-400">
                    유효
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {!user.deletedAt && user.email !== MASTER_EMAIL && (
                  <button
                    onClick={async () => {
                      if (!confirm(`"${user.email}" 사용자를 강제 탈퇴하시겠습니까?`)) return
                      try {
                        await axios.delete(`/api/admin/users/${user.id}`, { headers: authHeaders() })
                        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, deletedAt: new Date().toISOString() } : u))
                      } catch {
                        alert('강제 탈퇴에 실패했습니다.')
                      }
                    }}
                    className="rounded border border-red-800 px-2 py-0.5 text-xs text-red-400 transition hover:bg-red-900/30"
                  >
                    강제 탈퇴
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
