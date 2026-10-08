import { useSyncExternalStore } from 'react'

import {
  isGoogleRegistrationRequired,
  requestCompleteGoogleRegistration,
  requestGoogleLogin,
} from '@/features/auth/google-auth'
import type { CompleteGoogleRegistrationInput } from '@/features/auth/google-auth'
import { ApiError, apiClient, getErrorMessage } from '@/lib/api/client'
import { claimGuestResults, getGuestSession } from '@/features/auth/guest'
import type { GuestSession } from '@/features/auth/guest'

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

export type AuthResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: UserDto
}

type AuthSnapshot = {
  user: UserDto | null
  guest: GuestSession | null
  accessToken: string | null
  initialized: boolean
  loading: boolean
  error: string | null
}

const initialSnapshot: AuthSnapshot = {
  user: null,
  guest: null,
  accessToken: null,
  initialized: false,
  loading: false,
  error: null,
}

export class AuthStore {
  private snapshot = initialSnapshot
  private listeners = new Set<() => void>()
  private restorePromise: Promise<boolean> | null = null
  private completedRegistration: {
    token: string
    response: AuthResponse
  } | null = null

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

  hasGuestSession = () => Boolean(this.snapshot.guest)

  restoreGuest = async () => {
    const guest = await getGuestSession()
    this.patch({ guest })
    return guest
  }

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

  loginWithGoogle = async (googleToken: string) => {
    this.patch({ loading: true, error: null })
    try {
      const response = await requestGoogleLogin(googleToken)
      if (isGoogleRegistrationRequired(response)) {
        this.patch({ loading: false })
        return response
      }
      await this.accept(response)
      return response
    } catch (error) {
      this.patch({ loading: false, error: getErrorMessage(error) })
      throw error
    }
  }

  completeGoogleRegistration = async (
    input: CompleteGoogleRegistrationInput,
  ) => {
    this.patch({ loading: true, error: null })
    try {
      // Registration is one-shot. If claiming fails afterwards, retry only
      // claiming rather than attempting to consume the registration token again.
      const response =
        this.completedRegistration?.token === input.registrationToken
          ? this.completedRegistration.response
          : await requestCompleteGoogleRegistration(input)
      this.completedRegistration = { token: input.registrationToken, response }
      await this.accept(response)
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
    if (!token) {
      try {
        await this.restoreGuest()
      } catch {
        // A visitor can browse the login/trial entry without a guest cookie.
      }
    }
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
      await this.accept(response)
      return response.accessToken
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        this.patch({ error: getErrorMessage(error) })
      }
      this.clear({ initialized: true })
      return null
    }
  }

  private async accept(response: AuthResponse) {
    // Finish ownership transfer before publishing the new identity and clearing
    // its query cache. Otherwise the report would refetch under the account too
    // early and turn into a 404. Explicit credentials avoid refresh recursion.
    const guest =
      this.snapshot.guest ??
      (await getGuestSession().catch((error: unknown) => {
        if (
          error instanceof ApiError &&
          [401, 403, 404].includes(error.status)
        ) {
          return null
        }
        throw error
      }))
    if (guest?.sessionId) await claimGuestResults(response.accessToken)
    this.completedRegistration = null
    this.set({
      user: response.user,
      guest: null,
      accessToken: response.accessToken,
      initialized: true,
      loading: false,
      error: null,
    })
  }

  private clear = (overrides: Partial<AuthSnapshot> = {}) => {
    this.completedRegistration = null
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
    loginWithGoogle: authStore.loginWithGoogle,
    completeGoogleRegistration: authStore.completeGoogleRegistration,
    logout: authStore.logout,
    hasAnyRole: authStore.hasAnyRole,
  }
}
