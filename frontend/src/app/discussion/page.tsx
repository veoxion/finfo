'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { getToken, getEmail } from '@/lib/auth'

interface Room {
  id: string
  name: string
  creatorNickname: string
  createdBy: string
  messageCount: number
  reportCount: number
  isLocked: boolean
  createdAt: string
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` }
}

function reportTag(count: number) {
  if (count === 0) return null
  if (count >= 10) return { label: `🔒 신고 ${count}회`, cls: 'border-red-700 bg-red-900/30 text-red-400' }
  if (count >= 5) return { label: `⚠️ 신고 ${count}회`, cls: 'border-yellow-700 bg-yellow-900/20 text-yellow-400' }
  return { label: `신고 ${count}회`, cls: 'border-slate-600 bg-slate-800 text-slate-400' }
}

export default function DiscussionPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [newRoomName, setNewRoomName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createError, setCreateError] = useState('')
  const myEmail = getEmail()

  const fetchRooms = async () => {
    const res = await axios.get<Room[]>(`/api/chat/rooms`, { headers: authHeaders() })
    setRooms(res.data)
  }

  useEffect(() => {
    fetchRooms().finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      await axios.post(`/api/chat/rooms`, { name: newRoomName }, { headers: authHeaders() })
      setNewRoomName('')
      setShowCreate(false)
      await fetchRooms()
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? '생성 실패' : '생성 실패'
      setCreateError(msg)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('채팅방을 삭제하시겠습니까?')) return
    try {
      await axios.delete(`/api/chat/rooms/${id}`, { headers: authHeaders() })
      setRooms((prev) => prev.filter((r) => r.id !== id))
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">토론방</h1>
          <p className="mt-1 text-sm text-slate-400">경제 이슈에 대해 자유롭게 토론하세요.</p>
        </div>
        <button
          onClick={() => { setShowCreate((v) => !v); setCreateError('') }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          {showCreate ? '취소' : '+ 방 만들기'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-slate-700 bg-[#1e293b] p-4 space-y-3">
          <label className="block text-sm text-slate-300">채팅방 이름 (2~30자)</label>
          <div className="flex gap-2">
            <input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              minLength={2}
              maxLength={30}
              required
              className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500"
              placeholder="예: 미국 금리 인상 토론"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {creating ? '생성 중...' : '생성'}
            </button>
          </div>
          {createError && <p className="text-xs text-red-400">{createError}</p>}
        </form>
      )}

      {loading ? (
        <p className="text-slate-400">로딩 중...</p>
      ) : rooms.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-12 text-center">
          <p className="text-slate-400">아직 채팅방이 없습니다.</p>
          <p className="mt-1 text-sm text-slate-500">첫 번째 토론방을 만들어보세요!</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rooms.map((room) => {
            const tag = reportTag(room.reportCount)
            const isOwner = room.createdBy === myEmail
            return (
              <li key={room.id} className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 transition hover:border-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/discussion/${room.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-medium text-slate-100 hover:text-blue-400 transition truncate">
                        {room.name}
                      </span>
                      {room.isLocked && (
                        <span className="shrink-0 rounded border border-red-700 bg-red-900/30 px-1.5 py-0.5 text-xs text-red-400">잠금</span>
                      )}
                      {tag && (
                        <span className={`shrink-0 rounded border px-1.5 py-0.5 text-xs ${tag.cls}`}>{tag.label}</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span>{room.creatorNickname}</span>
                      <span>·</span>
                      <span>메시지 {room.messageCount}개</span>
                      <span>·</span>
                      <span>{new Date(room.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </Link>
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="shrink-0 rounded border border-slate-700 px-2 py-1 text-xs text-slate-500 transition hover:border-red-700 hover:text-red-400"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
