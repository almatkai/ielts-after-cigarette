import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Lock } from 'iconsax-react'

import { LoginDialog } from './login-dialog'

const AccessContext = createContext<((trigger: HTMLElement) => void) | null>(
  null,
)

export function GuestResultsAccess({ children }: { children: ReactNode }) {
  const parentAccess = useContext(AccessContext)
  const router = useRouter()
  const client = useQueryClient()
  const [open, setOpen] = useState(false)
  const [trigger, setTrigger] = useState<HTMLElement | null>(null)
  if (parentAccess) return <>{children}</>
  return (
    <AccessContext.Provider
      value={(element) => {
        setTrigger(element)
        setOpen(true)
      }}
    >
      {children}
      <LoginDialog
        open={open}
        onOpenChange={setOpen}
        trigger={trigger}
        description="Войдите, чтобы увидеть оценки всех секций и полный разбор. Завершённый пробный тест сохранится в вашем аккаунте."
        onSuccess={async () => {
          setOpen(false)
          await router.invalidate()
          await Promise.all([
            client.invalidateQueries({ queryKey: ['attempts'] }),
            client.invalidateQueries({ queryKey: ['full-mock-sessions'] }),
          ])
        }}
      />
    </AccessContext.Provider>
  )
}

export function GuestSignInButton({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label?: string
}) {
  const requestAccess = useContext(AccessContext)
  return (
    <button
      type="button"
      aria-label={label}
      className={className}
      onClick={(event) => requestAccess?.(event.currentTarget)}
    >
      {children}
    </button>
  )
}

export function GuestLockedBand({ skill }: { skill: string }) {
  return (
    <GuestSignInButton
      label={`${skill}: войти, чтобы увидеть оценку`}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[#2563eb] transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span
        aria-hidden
        className="select-none text-2xl font-semibold blur-[5px]"
      >
        —.—
      </span>
      <Lock aria-hidden className="size-4" />
    </GuestSignInButton>
  )
}
