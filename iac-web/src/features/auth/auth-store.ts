import { useSyncExternalStore } from 'react'

import { ApiError, apiClient, getErrorMessage } from '@/lib/api/client'

export type UserRole = 'STUDENT' | 'EDITOR' | 'ADMIN'

export type UserDto = {
  id: string
  email: string
  phone: string | null
  displayName: string
  role: UserRole
  currentBand: number | null
  targetBand: number | null
  examDate: string | null
  examType: 'academic' | 'general' | null
  timezone: string
  createdAt: string
  updatedAt: string
}

type AuthResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: UserDto
}

type LoginInput = {
  email: string
  password: string
  remember: boolean
}

type RegisterInput = {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  acceptedTerms: boolean
  verificationToken: string
}

type AuthSnapshot = {
  user: UserDto | null
  accessToken: string | null
  initialized: boolean
  loading: boolean
  error: string | null
}

const initialSnapshot: AuthSnapshot = {
  user: null,
  accessToken: null,
  initialized: false,
  loading: false,
  error: null,
}

export class AuthStore {
  private snapshot = initialSnapshot
  private listeners = new Set<() => void>()
  private restorePromise: Promise<boolean> | null = null

  constructor() {
    apiClient.configureAuth({
      getAccessToken: () => this.snapshot.accessToken,
      refreshAccessToken: this.refreshForRequest,
      onAuthenticationFailed: this.clear,
    })
  }

  getSnapshot = () => this.snapshot

  getServerSnapshot = () => initialSnapshot

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  isAuthenticated = () =>
    Boolean(this.snapshot.accessToken && this.snapshot.user)

  hasAnyRole = (roles: readonly UserRole[]) => {
    const role = this.snapshot.user?.role
    return role !== undefined && roles.includes(role)
  }

  initialize = async () => {
    if (this.snapshot.initialized) return this.isAuthenticated()
    if (!this.restorePromise) {
      this.restorePromise = this.restore().finally(() => {
        this.restorePromise = null
      })
    }
    return this.restorePromise
  }

  login = async (input: LoginInput) => {
    this.patch({ loading: true, error: null })
    try {
      const response = await apiClient.request<AuthResponse>(
        '/api/v1/auth/login',
        {
          method: 'POST',
          body: input,
          authenticated: false,
          retryAuthentication: false,
        },
      )
      this.accept(response)
      return response.user
    } catch (error) {
      this.patch({ loading: false, error: getErrorMessage(error) })
      throw error
    }
  }

  register = async (input: RegisterInput) => {
    this.patch({ loading: true, error: null })
    try {
      const response = await apiClient.request<AuthResponse>(
        '/api/v1/auth/register',
        {
          method: 'POST',
          body: input,
          authenticated: false,
          retryAuthentication: false,
        },
      )
      this.accept(response)
      return response.user
    } catch (error) {
      this.patch({ loading: false, error: getErrorMessage(error) })
      throw error
    }
  }

  logout = async () => {
    try {
      await apiClient.request<void>('/api/v1/auth/logout', {
        method: 'POST',
        authenticated: false,
        retryAuthentication: false,
      })
    } finally {
      this.clear()
    }
  }

  updateUser = (user: UserDto) => {
    this.patch({ user })
  }

  private restore = async () => {
    this.patch({ loading: true, error: null })
    const token = await this.refreshForRequest()
    this.patch({ initialized: true, loading: false })
    return Boolean(token)
  }

  private refreshForRequest = async () => {
    try {
      const response = await apiClient.request<AuthResponse>(
        '/api/v1/auth/refresh',
        {
          method: 'POST',
          authenticated: false,
          retryAuthentication: false,
        },
      )
      this.accept(response)
      return response.accessToken
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        this.patch({ error: getErrorMessage(error) })
      }
      this.clear({ initialized: true })
      return null
    }
  }

  private accept(response: AuthResponse) {
    this.set({
      user: response.user,
      accessToken: response.accessToken,
      initialized: true,
      loading: false,
      error: null,
    })
  }

  private clear = (overrides: Partial<AuthSnapshot> = {}) => {
    this.set({
      ...initialSnapshot,
      initialized: true,
      ...overrides,
    })
  }

  private patch(patch: Partial<AuthSnapshot>) {
    this.set({ ...this.snapshot, ...patch })
  }

  private set(snapshot: AuthSnapshot) {
    this.snapshot = snapshot
    for (const listener of this.listeners) listener()
  }
}

export const authStore = new AuthStore()

export function useAuth() {
  const snapshot = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getServerSnapshot,
  )
  return {
    ...snapshot,
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    hasAnyRole: authStore.hasAnyRole,
  }
}
