'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { getToken, getEmail } from '@/lib/auth'

const POLL_INTERVAL = 3000

interface Message {
  id: string
  content: string
  userId: string
  nickname: string
  createdAt: string
}

interface RoomMeta {
  roomName: string
  createdBy: string
  reportCount: number
  isLocked: boolean
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` }
}

function reportTag(count: number) {
  if (count >= 10) return { label: `🔒 신고 ${count}회 — 읽기 전용`, cls: 'text-red-400' }
  if (count >= 5) return { label: `⚠️ 신고 ${count}회`, cls: 'text-yellow-400' }
  if (count > 0) return { label: `신고 ${count}회`, cls: 'text-slate-500' }
  return null
}

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const myEmail = getEmail()

  const [messages, setMessages] = useState<Message[]>([])
  const [meta, setMeta] = useState<RoomMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)
  const [reportMsg, setReportMsg] = useState('')

  const lastMsgTime = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 초기 로딩
  const fetchMessages = useCallback(async (after?: string) => {
    const url = `/api/chat/rooms/${id}/messages${after ? `?after=${encodeURIComponent(after)}` : ''}`
    const res = await axios.get(url, { headers: authHeaders() })
    return res.data as { messages: Message[]; roomName: string; createdBy: string; reportCount: number; isLocked: boolean }
  }, [id])

  useEffect(() => {
    fetchMessages()
      .then((data) => {
        setMessages(data.messages)
        setMeta({ roomName: data.roomName, createdBy: data.createdBy, reportCount: data.reportCount, isLocked: data.isLocked })
        if (data.messages.length > 0) {
          lastMsgTime.current = data.messages[data.messages.length - 1].createdAt
        }
      })
      .catch(() => router.replace('/discussion'))
      .finally(() => setLoading(false))
  }, [fetchMessages, router])

  // 폴링
  useEffect(() => {
    pollerRef.current = setInterval(async () => {
      try {
        const data = await fetchMessages(lastMsgTime.current ?? undefined)
        if (data.messages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id))
            const newMsgs = data.messages.filter((m) => !existingIds.has(m.id))
            return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev
          })
          lastMsgTime.current = data.messages[data.messages.length - 1].createdAt
        }
        setMeta((prev) => prev ? { ...prev, reportCount: data.reportCount, isLocked: data.isLocked } : prev)
      } catch { /* ignore */ }
    }, POLL_INTERVAL)

    return () => { if (pollerRef.current) clearInterval(pollerRef.current) }
  }, [fetchMessages])

  // 새 메시지 시 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const res = await axios.post(
        `/api/chat/rooms/${id}/messages`,
        { content: input.trim() },
        { headers: authHeaders() }
      )
      setMessages((prev) => [...prev, res.data])
      lastMsgTime.current = res.data.createdAt
      setInput('')
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? '전송 실패' : '전송 실패'
      alert(msg)
    } finally {
      setSending(false)
    }
  }

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportReason.trim()) return
    setReporting(true)
    try {
      const res = await axios.post(
        `/api/chat/rooms/${id}/report`,
        { reason: reportReason.trim() },
        { headers: authHeaders() }
      )
      setReportMsg(`신고가 접수되었습니다. (누적 ${res.data.reportCount}회)`)
      setReportReason('')
      setShowReport(false)
      setMeta((prev) => prev ? { ...prev, reportCount: res.data.reportCount, isLocked: res.data.reportCount >= 10 } : prev)
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? '신고 실패' : '신고 실패'
      setReportMsg(msg)
      setShowReport(false)
    } finally {
      setReporting(false)
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-8"><p className="text-slate-400">로딩 중...</p></main>
  }
  if (!meta) return null

  const tag = reportTag(meta.reportCount)

  return (
    <main className="mx-auto flex max-w-3xl flex-col px-4 sm:px-6 py-6" style={{ height: 'calc(100vh - 73px)' }}>
      {/* 헤더 */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/discussion" className="text-xs text-slate-500 hover:text-slate-300">← 목록</Link>
            <span className="text-slate-700">/</span>
            <h1 className="text-lg font-bold text-slate-100">{meta.roomName}</h1>
            {meta.isLocked && (
              <span className="rounded border border-red-700 bg-red-900/30 px-1.5 py-0.5 text-xs text-red-400">잠금</span>
            )}
          </div>
          {tag && <p className={`mt-0.5 text-xs ${tag.cls}`}>{tag.label}</p>}
          {reportMsg && <p className="mt-1 text-xs text-blue-400">{reportMsg}</p>}
        </div>
        <button
          onClick={() => { setShowReport((v) => !v); setReportMsg('') }}
          className="shrink-0 rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:border-red-700 hover:text-red-400"
        >
          {showReport ? '취소' : '신고'}
        </button>
      </div>

      {/* 신고 폼 */}
      {showReport && (
        <form onSubmit={handleReport} className="mb-4 rounded-lg border border-red-800/50 bg-red-950/20 p-3 space-y-2">
          <p className="text-xs text-red-400 font-medium">채팅방 신고 사유를 입력하세요</p>
          <input
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            required
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-red-700"
            placeholder="예: 리딩방 운영, 혐오 표현 등"
          />
          <button
            type="submit"
            disabled={reporting}
            className="rounded bg-red-700 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {reporting ? '제출 중...' : '신고 제출'}
          </button>
        </form>
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-700 bg-[#1e293b] p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">첫 번째 메시지를 보내보세요!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === myEmail || msg.nickname === myEmail
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs text-slate-500 shrink-0">{msg.nickname}</span>
                  <div className={`max-w-xs rounded-2xl px-3 py-2 text-sm break-words ${
                    isMe
                      ? 'rounded-br-sm bg-blue-600 text-white'
                      : 'rounded-bl-sm bg-slate-700 text-slate-100'
                  }`}>
                    {msg.content}
                  </div>
                </div>
                <span className="mt-0.5 text-xs text-slate-600">
                  {new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 메시지 입력 */}
      {meta.isLocked ? (
        <div className="mt-3 rounded-lg border border-red-800/50 bg-red-950/20 px-4 py-3 text-center text-sm text-red-400">
          🔒 신고가 누적되어 이 채팅방에서는 메시지를 보낼 수 없습니다.
        </div>
      ) : (
        <form onSubmit={handleSend} className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500"
            placeholder="메시지를 입력하세요 (최대 500자)"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? '...' : '전송'}
          </button>
        </form>
      )}
    </main>
  )
}
