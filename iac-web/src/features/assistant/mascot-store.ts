import { useSyncExternalStore } from 'react'

export const MASCOT_STORAGE_KEY = 'iac_show_mascot'
const MASCOT_CHANGE_EVENT = 'iac_mascot_visibility_change'

function readMascotVisibility(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const item = localStorage.getItem(MASCOT_STORAGE_KEY)
    if (item === null) return true
    return item !== 'false'
  } catch {
    return true
  }
}

class MascotStore {
  private isVisible: boolean = readMascotVisibility()
  private listeners = new Set<() => void>()

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === MASCOT_STORAGE_KEY) {
          this.isVisible = event.newValue !== 'false'
          this.notify()
        }
      })
      window.addEventListener(MASCOT_CHANGE_EVENT, () => {
        this.isVisible = readMascotVisibility()
        this.notify()
      })
    }
  }

  getSnapshot = () => this.isVisible

  getServerSnapshot = () => true

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  setVisible = (visible: boolean) => {
    this.isVisible = visible
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MASCOT_STORAGE_KEY, String(visible))
        window.dispatchEvent(new Event(MASCOT_CHANGE_EVENT))
      } catch {
        // ignore
      }
    }
    this.notify()
  }

  private notify() {
    for (const listener of this.listeners) {
      listener()
    }
  }
}

export const mascotStore = new MascotStore()

export function useMascotVisibility() {
  const isVisible = useSyncExternalStore(
    mascotStore.subscribe,
    mascotStore.getSnapshot,
    mascotStore.getServerSnapshot,
  )

  return {
    isVisible,
    setVisible: mascotStore.setVisible,
  }
}
