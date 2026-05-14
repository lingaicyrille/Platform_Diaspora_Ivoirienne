import axios from 'axios'
import { useAuthStore } from '../store/auth-store'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the access token from the in-memory store to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Queue of requests waiting for a token refresh to complete
let isRefreshing = false
let waitQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function drainQueue(error: unknown, token: string | null) {
  waitQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)))
  waitQueue = []
}

// On 401: attempt a single silent refresh, retry the original request once.
// If the refresh token is missing or the refresh call fails, redirect to login.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    const { getRefreshToken, setAccessToken, clearAuth } = useAuthStore.getState()
    const refresh = getRefreshToken()

    if (!refresh) {
      clearAuth()
      if (typeof window !== 'undefined') window.location.href = '/auth/login'
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/token/refresh/`,
        { refresh }
      )
      setAccessToken(data.access)
      drainQueue(null, data.access)
      original.headers.Authorization = `Bearer ${data.access}`
      return api(original)
    } catch (refreshError) {
      drainQueue(refreshError, null)
      clearAuth()
      if (typeof window !== 'undefined') window.location.href = '/auth/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
