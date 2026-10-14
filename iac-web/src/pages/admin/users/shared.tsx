import { Button } from '@/components/ui/button'
import type { AdminUser } from '@/features/admin/users-api'

export const roles = {
  STUDENT: 'Студент',
  WRITER: 'Автор',
  EDITOR: 'Сотрудник',
  ADMIN: 'Администратор',
}
export const statusText: Record<string, string> = {
  REGISTERED: 'Зарегистрирован',
  WAITING: 'В очереди',
  INVITED: 'Приглашён',
  SUBMITTED: 'Завершён',
  IN_PROGRESS: 'В процессе',
  ABANDONED: 'Прерван',
}
export function date(value: string | null, time = false) {
  return value
    ? new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...(time ? ({ hour: '2-digit', minute: '2-digit' } as const) : {}),
        timeZone: 'Asia/Almaty',
      }).format(new Date(value))
    : '—'
}
export function UserAvatar({
  user,
}: {
  user: Pick<AdminUser, 'displayName' | 'role'>
}) {
  return (
    <span
      aria-hidden
      className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eff6ff] text-sm font-semibold text-[#2563eb]"
    >
      {user.displayName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0])
        .join('')
        .toUpperCase()}
    </span>
  )
}
export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number
  total: number
  onChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / 30))
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
      <span>
        {total
          ? `${(page - 1) * 30 + 1}–${Math.min(page * 30, total)} из ${total}`
          : '0'}
      </span>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="border-[#deded9]"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Назад
        </Button>
        <span>
          {page} / {pages}
        </span>
        <Button
          variant="outline"
          className="border-[#deded9]"
          size="sm"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Далее
        </Button>
      </div>
    </div>
  )
}
export function QueryError({
  message,
  retry,
}: {
  message: string
  retry: () => void
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-[#e7e7e4] bg-white p-6"
    >
      <p className="text-sm text-destructive">{message}</p>
      <Button
        className="mt-3 border-[#deded9]"
        variant="outline"
        onClick={retry}
      >
        Повторить
      </Button>
    </div>
  )
}
