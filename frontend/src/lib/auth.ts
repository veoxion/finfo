const TOKEN_KEY = 'finfo_token'
const EMAIL_KEY = 'finfo_email'
const NICKNAME_KEY = 'finfo_nickname'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getEmail(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(EMAIL_KEY)
}

export function getNickname(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(NICKNAME_KEY)
}

export function saveAuth(token: string, email: string, nickname?: string | null) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EMAIL_KEY, email)
  if (nickname) localStorage.setItem(NICKNAME_KEY, nickname)
  const maxAge = 60 * 60 * 24 * 7
  document.cookie = `finfo_token=${token}; path=/; max-age=${maxAge}`
  document.cookie = `finfo_email=${encodeURIComponent(email)}; path=/; max-age=${maxAge}`
}

export function saveNickname(nickname: string) {
  localStorage.setItem(NICKNAME_KEY, nickname)
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EMAIL_KEY)
  localStorage.removeItem(NICKNAME_KEY)
  document.cookie = 'finfo_token=; path=/; max-age=0'
  document.cookie = 'finfo_email=; path=/; max-age=0'
}

export function isLoggedIn(): boolean {
  return !!getToken()
}
