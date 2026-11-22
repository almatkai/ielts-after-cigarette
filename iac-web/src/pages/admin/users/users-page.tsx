import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight2, SearchNormal1, Trash } from 'iconsax-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteUser, listUsers, usersKey } from '@/features/admin/users-api'
import type { AdminUser } from '@/features/admin/users-api'
import { getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'
import {
  date,
  Pagination,
  QueryError,
  roles,
  statusText,
  UserAvatar,
} from './shared'

export function UsersPage() {
  const { t } = useLanguage()
  const client = useQueryClient()
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState<AdminUser | null>(null)
  const [email, setEmail] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search)
      setPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [search])
  const query = useQuery({
    queryKey: [...usersKey, { q, role, page }],
    queryFn: ({ signal }) => listUsers(q, role, page, signal),
  })
  const remove = useMutation({
    mutationFn: (user: AdminUser) => deleteUser(user.id, email),
    onSuccess: async () => {
      setTarget(null)
      setEmail('')
      await client.invalidateQueries({ queryKey: usersKey })
    },
  })
  const openDelete = (user: AdminUser) => {
    remove.reset()
    setEmail('')
    setTarget(user)
  }
  return (
    <div className="grid gap-5">
      <div className="flex items-baseline gap-3">
        <h1 className="text-3xl font-semibold tracking-normal">
          {t('Пользователи')}
        </h1>
        {query.data && (
          <span className="text-sm text-muted-foreground">
            {query.data.total}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchNormal1
            className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Имя, email или телефон')}
            aria-label={t('Поиск пользователей')}
            className="h-10 bg-card pl-10"
          />
        </div>
        <select
          aria-label={t('Роль')}
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            setPage(1)
          }}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">{t('Все роли')}</option>
          {Object.entries(roles).map(([value, label]) => (
            <option key={value} value={value}>
              {t(label)}
            </option>
          ))}
        </select>
      </div>
      {query.isError ? (
        <QueryError
          message={t(getErrorMessage(query.error))}
          retry={() => void query.refetch()}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-background text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">{t('Пользователь')}</th>
                <th className="px-4 py-3 font-medium">{t('Роль')}</th>
                <th className="px-4 py-3 font-medium">{t('Тесты')}</th>
                <th className="px-4 py-3 font-medium">{t('Активность')}</th>
                <th className="w-24">
                  <span className="sr-only">{t('Действия')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {query.isPending ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-muted-foreground"
                  >
                    {t('Загрузка…')}
                  </td>
                </tr>
              ) : (
                query.data.items.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0 hover:bg-background"
                  >
                    <td className="px-5 py-4">
                      <Link
                        to="/admin/users/$userId"
                        params={{ userId: user.id }}
                        className="flex items-center gap-3 no-underline"
                      >
                        <UserAvatar user={user} />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {user.displayName}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {user.email}
                          </p>
                          {user.phone && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          user.role === 'WRITER' ? 'text-primary-hover' : ''
                        }
                      >
                        {t(roles[user.role])}
                      </span>
                      {user.blocked ? (
                        <p className="mt-1 text-xs text-destructive">
                          {t('Заблокирован')}
                        </p>
                      ) : user.status !== 'REGISTERED' ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t(statusText[user.status])}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <p>
                        {user.completedTests} {t('завершено')}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {user.unfinishedTests} {t('в процессе')}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {date(user.lastActiveAt)}
                    </td>
                    <td className="pr-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${t('Удалить')} ${user.displayName}`}
                          className="text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                          onClick={() => openDelete(user)}
                        >
                          <Trash className="size-4" aria-hidden />
                        </Button>
                        <Link
                          to="/admin/users/$userId"
                          params={{ userId: user.id }}
                          aria-label={`${t('Открыть')} ${user.displayName}`}
                          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary-soft hover:text-primary"
                        >
                          <ArrowRight2 className="size-4" aria-hidden />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {query.data?.items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-muted-foreground"
                  >
                    {t('Ничего не найдено')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {query.data && (
        <Pagination page={page} total={query.data.total} onChange={setPage} />
      )}
      <Dialog
        open={target !== null}
        onOpenChange={(value) => {
          if (!value && !remove.isPending) setTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Удалить аккаунт?')}</DialogTitle>
            <DialogDescription>
              {t(
                'Профиль, тесты, записи и статьи будут удалены без восстановления.',
              )}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (target) remove.mutate(target)
            }}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="confirmDeleteEmail" className="text-xs text-muted-foreground">
                {`${t('Введите')} ${target?.email ?? ''}`}
              </Label>
              <Input
                id="confirmDeleteEmail"
                type="email"
                autoComplete="off"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {remove.isError && (
              <p role="alert" className="text-sm text-destructive">
                {t(getErrorMessage(remove.error))}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-border"
                disabled={remove.isPending}
                onClick={() => setTarget(null)}
              >
                {t('Отмена')}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  remove.isPending ||
                  email.trim().toLowerCase() !== (target?.email ?? '').toLowerCase()
                }
              >
                {remove.isPending ? t('Подождите…') : t('Удалить навсегда')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
