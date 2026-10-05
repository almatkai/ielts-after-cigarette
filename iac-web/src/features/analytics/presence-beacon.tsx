import { useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { sendAnalyticsPing } from './api'

const HEARTBEAT_MS = 30_000
const VISITOR_KEY = 'iac.visitorId'

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return null
  }
}

function ping(path: string, view: boolean) {
  const id = visitorId()
  if (!id) return
  // Analytics is best effort: never surface failures to the visitor.
  sendAnalyticsPing({ visitorId: id, path, view }).catch(() => undefined)
}

// PresenceBeacon reports which page an open, visible tab is on so the admin
// dashboard can show who is online right now. Admin pages are excluded so
// watching the dashboard does not inflate it.
export function PresenceBeacon() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const pathRef = useRef(pathname)
  const tracked = !pathname.startsWith('/admin')

  useEffect(() => {
    pathRef.current = pathname
    if (tracked && document.visibilityState === 'visible') ping(pathname, true)
  }, [pathname, tracked])

  useEffect(() => {
    if (!tracked) return
    const beat = () => {
      if (document.visibilityState === 'visible') ping(pathRef.current, false)
    }
    const timer = window.setInterval(beat, HEARTBEAT_MS)
    document.addEventListener('visibilitychange', beat)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', beat)
    }
  }, [tracked])

  return null
}
