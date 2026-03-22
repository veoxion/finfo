'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { getToken, clearAuth, saveNickname } from '@/lib/auth'

interface UserInfo {
  id: string
  email: string
  nickname: string | null
  createdAt: string
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` }
}

export default function MyPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const [nicknameInput, setNicknameInput] = useState('')
  const [nicknameLoading, setNicknameLoading] = useState(false)
  const [nicknameMsg, setNicknameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    axios
      .get<UserInfo>(`/api/user/me`, { headers: authHeaders() })
      .then((res) => {
        setUser(res.data)
        setNicknameInput(res.data.nickname ?? '')
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false))
  }, [router])

  const handleNicknameUpdate = async () => {
    setNicknameMsg(null)
    setNicknameLoading(true)
    try {
      const res = await axios.put(
        `/api/user/nickname`,
        { nickname: nicknameInput },
        { headers: authHeaders() }
      )
      setUser((prev) => prev ? { ...prev, nickname: res.data.nickname } : prev)
      saveNickname(res.data.nickname)
      setNicknameMsg({ type: 'success', text: '닉네임이 변경되었습니다.' })
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? '변경 실패' : '변경 실패'
      setNicknameMsg({ type: 'error', text: msg })
    } finally {
      setNicknameLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      await axios.delete(`/api/user`, { headers: authHeaders() })
      clearAuth()
      router.replace('/login')
    } catch {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-xl px-4 py-8">
        <p className="text-slate-400">로딩 중...</p>
      </main>
    )
  }

  if (!user) return null

  return (
    <main className="mx-auto max-w-xl px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">마이페이지</h1>
        <p className="mt-1 text-sm text-slate-400">내 계정 정보를 확인하고 수정할 수 있습니다.</p>
      </div>

      {/* 계정 정보 */}
      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-200">계정 정보</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500">이메일</p>
            <p className="mt-0.5 text-sm text-slate-200">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">가입일</p>
            <p className="mt-0.5 text-sm text-slate-200">
              {new Date(user.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* 닉네임 수정 */}
      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-200">닉네임 수정</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            minLength={2}
            className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500"
            placeholder="새 닉네임 (2자 이상)"
          />
          <button
            onClick={handleNicknameUpdate}
            disabled={nicknameLoading || nicknameInput.trim() === user.nickname}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {nicknameLoading ? '저장 중...' : '저장'}
          </button>
        </div>
        {nicknameMsg && (
          <p className={`text-xs ${nicknameMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {nicknameMsg.text}
          </p>
        )}
      </div>

      {/* 회원탈퇴 */}
      <div className="rounded-xl border border-red-900/50 bg-[#1e293b] p-6 space-y-3">
        <h2 className="text-base font-semibold text-red-400">회원탈퇴</h2>
        <p className="text-sm text-slate-400">탈퇴 시 계정에 더 이상 로그인할 수 없습니다.</p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-red-700 px-4 py-2 text-sm text-red-400 transition hover:bg-red-900/30"
          >
            탈퇴하기
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-300">정말 탈퇴하시겠습니까?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {deleteLoading ? '처리 중...' : '확인, 탈퇴합니다'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-400 transition hover:text-slate-200"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
