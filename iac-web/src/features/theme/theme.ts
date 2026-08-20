import { useEffect } from 'react'

export type ThemePreference = 'light' | 'system' | 'dark'

const STORAGE_KEY = 'iac-theme'

export function getStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const value = window.localStorage.getItem(STORAGE_KEY)
  if (value === 'light' || value === 'dark' || value === 'system') return value
  return 'system'
}

export function setStoredTheme(preference: ThemePreference) {
  window.localStorage.setItem(STORAGE_KEY, preference)
}

export function resolveIsDark(preference: ThemePreference): boolean {
  if (preference === 'dark') return true
  if (preference === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyStoredTheme() {
  document.documentElement.classList.toggle(
    'dark',
    resolveIsDark(getStoredTheme()),
  )
}

/**
 * Applies the stored theme while the component is mounted and keeps it in
 * sync with the OS preference when the user picked «system». The `.dark`
 * class is removed on unmount so token-based pages outside the app shells
 * (landing, login) never flip to dark.
 */
export function useDashboardTheme() {
  useEffect(() => {
    applyStoredTheme()

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (getStoredTheme() === 'system') applyStoredTheme()
    }

    media.addEventListener('change', handleChange)
    return () => {
      media.removeEventListener('change', handleChange)
      document.documentElement.classList.remove('dark')
    }
  }, [])
}
