import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Public OAuth client ID — identifies the app to Google, safe to ship in
// client-side code. The client secret must never be shipped.
const GOOGLE_CLIENT_ID =
  '525971866611-vk1derapc3opreb82i2ba2edeldsev8l.apps.googleusercontent.com'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '')

type WaitlistEntry = {
  id: string
  phone: string
  email: string | null
  firstName: string | null
  lastName: string | null
  source: string | null
  status: string
  createdAt: string
}

type WaitlistResponse = {
  entries: WaitlistEntry[]
  total: number
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string
            callback: (response: { credential?: string }) => void
          }) => void
          renderButton: (
            element: HTMLElement,
            options: Record<string, unknown>,
          ) => void
        }
      }
    }
  }
}

export const Route = createFileRoute('/waitlist-admin')({
  ssr: false,
  head: () => ({
    meta: [
      { title: 'Waitlist — администрирование IAC' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: WaitlistAdminPage,
})

function decodeEmail(credential: string): string | null {
  try {
    const payload = credential.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(json) as { email?: string }
    return claims.email ?? null
  } catch {
    return null
  }
}

function WaitlistAdminPage() {
  const buttonRef = useRef<HTMLDivElement>(null)
  const [credential, setCredential] = useState<string | null>(null)
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const email = credential ? decodeEmail(credential) : null

  const load = useCallback(async (token: string) => {
    if (!apiBaseUrl) {
      setError('Не настроен VITE_API_BASE_URL.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/waitlist`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.status === 401) {
        setCredential(null)
        setError('Сессия Google истекла. Войдите снова.')
        return
      }
      if (response.status === 403) {
        setError(
          'Этот Google-аккаунт не входит в список супер-админов. Войдите под другим аккаунтом.',
        )
        setCredential(null)
        return
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const body = (await response.json()) as WaitlistResponse
      setEntries(body.entries)
    } catch {
      setError('Не удалось загрузить список. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (credential) return

    const init = () => {
      if (!window.google || !buttonRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (!response.credential) return
          setCredential(response.credential)
          void load(response.credential)
        },
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 280,
      })
    }

    if (window.google) {
      init()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = init
    document.head.appendChild(script)
  }, [credential, load])

  if (!credential) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f5] p-5">
        <Card className="w-full max-w-md rounded-[16px] border-[#e7e7e4] shadow-none">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-[#fff0f0] text-[#e23b3b]">
              <ShieldCheck className="size-6" aria-hidden />
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
              Waitlist: вход для администратора
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#69696d]">
              Войдите через Google-аккаунт супер-админа, чтобы увидеть список
              заявок.
            </p>
            <div ref={buttonRef} className="mt-6" />
            {error && (
              <p className="mt-4 text-sm text-[#e23b3b]" role="alert">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] p-5">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.04em]">
              Заявки в waitlist
            </h1>
            <p className="mt-1 text-sm text-[#69696d]">
              {email} · всего: {entries.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-[#e7e7e4]"
              disabled={loading}
              onClick={() => void load(credential)}
            >
              <RefreshCw
                className={`size-4 ${loading ? 'animate-spin' : ''}`}
                aria-hidden
              />
              Обновить
            </Button>
            <Button
              variant="outline"
              className="border-[#e7e7e4]"
              onClick={() => setCredential(null)}
            >
              Выйти
            </Button>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-[#e23b3b]" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 overflow-x-auto rounded-[16px] border border-[#e7e7e4] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e7e7e4] text-xs uppercase tracking-wide text-[#69696d]">
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">Фамилия</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Телефон</th>
                <th className="px-4 py-3 font-medium">Источник</th>
                <th className="px-4 py-3 font-medium">Дата</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-[#f0f0ed] last:border-0"
                >
                  <td className="px-4 py-3">{entry.firstName ?? '—'}</td>
                  <td className="px-4 py-3">{entry.lastName ?? '—'}</td>
                  <td className="px-4 py-3">{entry.email ?? '—'}</td>
                  <td className="px-4 py-3">{entry.phone}</td>
                  <td className="px-4 py-3">{entry.source ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString('ru-RU')}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-[#69696d]"
                  >
                    Заявок пока нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
