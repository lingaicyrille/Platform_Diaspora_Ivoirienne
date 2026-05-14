import { create } from 'zustand'

export interface UserProfile {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  bio: string
  avatar: string | null
  country_of_residence: string
  city: string
  continent: string
  preferred_language: string
  is_verified: boolean
  trust_score: number
  date_joined: string
}

interface AuthState {
  accessToken: string | null
  user: UserProfile | null
  setAuth: (access: string, refresh: string, user: UserProfile) => void
  setUser: (user: UserProfile) => void
  setAccessToken: (token: string) => void
  clearAuth: () => void
  getRefreshToken: () => string | null
}

const COOKIE_NAME = 'pdi_refresh'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60

function writeRefreshCookie(token: string) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Strict${secure}`
}

function readRefreshCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function deleteRefreshCookie() {
  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/; SameSite=Strict`
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,

  setAuth: (access, refresh, user) => {
    writeRefreshCookie(refresh)
    set({ accessToken: access, user })
  },

  setUser: (user) => set({ user }),

  setAccessToken: (token) => set({ accessToken: token }),

  clearAuth: () => {
    deleteRefreshCookie()
    set({ accessToken: null, user: null })
  },

  getRefreshToken: () => readRefreshCookie(),
}))
