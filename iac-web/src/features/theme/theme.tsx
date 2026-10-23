import { useEffect, useSyncExternalStore } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'
export const THEME_STORAGE_KEY = 'yrys-theme'
const THEME_EVENT = 'yrys-theme-change'
let transientPreference: ThemePreference = 'system'

// Runs before HeadContent and the stylesheet, including when storage is blocked.
export const THEME_INIT_SCRIPT = `(function(){var t='system';try{var v=localStorage.getItem('yrys-theme');if(v==='light'||v==='dark')t=v}catch(e){}document.documentElement.classList.toggle('dark',t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))})();`

function readTheme(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return transientPreference
  }
}

function applyTheme() {
  const preference = readTheme()
  document.documentElement.classList.toggle(
    'dark',
    preference === 'dark' ||
      (preference === 'system' &&
        matchMedia('(prefers-color-scheme: dark)').matches),
  )
}

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener)
  window.addEventListener(THEME_EVENT, listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener(THEME_EVENT, listener)
  }
}

export function useThemePreference() {
  const preference = useSyncExternalStore(subscribe, readTheme, () => 'system')
  const setPreference = (value: ThemePreference) => {
    transientPreference = value
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value)
    } catch {
      /* Theme remains usable without persistent storage. */
    }
    document.documentElement.classList.toggle(
      'dark',
      value === 'dark' ||
        (value === 'system' &&
          matchMedia('(prefers-color-scheme: dark)').matches),
    )
    window.dispatchEvent(new Event(THEME_EVENT))
  }
  return { preference, setPreference }
}

export function ThemeSync() {
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    applyTheme()
    media.addEventListener('change', applyTheme)
    window.addEventListener('storage', applyTheme)
    return () => {
      media.removeEventListener('change', applyTheme)
      window.removeEventListener('storage', applyTheme)
    }
  }, [])
  return null
}
