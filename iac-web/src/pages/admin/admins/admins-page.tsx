import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Trash2, TriangleAlert, UserPlus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  addSuperAdmin,
  adminQueryKeys,
  listSuperAdmins,
  removeSuperAdmin,
} from '@/features/admin/api'
import { ApiError, getErrorMessage } from '@/lib/api/client'

import type { SuperAdminEntry } from '@/features/admin/api'

const interFont = {
  fontFamily:
    '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
} as const

const cardClassName =
  'rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'

const primaryButtonClassName =
  'rounded-lg bg-blue-500 font-bold text-white shadow-sm hover:bg-blue-600'

const outlineButtonClassName =
  'rounded-lg border-slate-300 bg-white text-slate-900 shadow-sm hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-100'

export function AdminsPage() {
  const queryClient = useQueryClient()
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const adminsQuery = useQuery({
    queryKey: adminQueryKeys.superAdmins,
    queryFn: ({ signal }) => listSuperAdmins(signal),
  })

  const addMutation = useMutation({
    mutationFn: (email: string) => addSuperAdmin(email),
    onSuccess: async () => {
      setNewAdminEmail('')
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.superAdmins,
      })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (email: string) => removeSuperAdmin(email),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.superAdmins,
      })
    },
  })

  const busy = addMutation.isPending || removeMutation.isPending

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = newAdminEmail.trim()
    if (!email) return
    setActionError(null)
    try {
      await addMutation.mutateAsync(email)
    } catch (error) {
      setActionError(
        error instanceof ApiError && error.status === 422
          ? 'Некорректный email.'
          : getErrorMessage(error),
      )
    }
  }

  const handleRemove = async (admin: SuperAdminEntry) => {
    setActionError(null)
    try {
      await removeMutation.mutateAsync(admin.email)
    } catch (error) {
      setActionError(
        error instanceof ApiError && error.status === 409
          ? 'Этот админ задан через env — удалите его там (правкой переменных окружения).'
          : getErrorMessage(error),
      )
    }
  }

  return (
    <div style={interFont} className="grid gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500 dark:text-blue-400">
          Администрирование
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Администраторы
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Эти аккаунты имеют доступ к waitlist и другим инструментам
          администрирования. Администратор из переменных окружения (env) не
          удаляется через интерфейс.
        </p>
      </div>

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => void handleAdd(event)}
      >
        <Input
          type="email"
          required
          value={newAdminEmail}
          onChange={(event) => setNewAdminEmail(event.target.value)}
          placeholder="email нового администратора"
          className="h-11 w-full max-w-xs rounded-lg border-slate-300 bg-white shadow-none focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
        />
        <Button
          type="submit"
          className={primaryButtonClassName}
          disabled={busy}
        >
          <UserPlus aria-hidden />
          Добавить
        </Button>
      </form>

      {actionError ? (
        <p className="text-sm text-red-500 dark:text-red-400" role="alert">
          {actionError}
        </p>
      ) : null}

      {adminsQuery.isPending ? (
        <Card className={cardClassName}>
          <CardContent className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Загружаем список администраторов…
          </CardContent>
        </Card>
      ) : adminsQuery.isError ? (
        <Card className={cardClassName}>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <TriangleAlert
              className="size-6 text-red-500 dark:text-red-400"
              aria-hidden
            />
            <p className="mt-3 text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {adminsQuery.error instanceof ApiError &&
              adminsQuery.error.status === 403
                ? 'Нет доступа: управление администраторами доступно только роли ADMIN.'
                : 'Не удалось загрузить список администраторов.'}
            </p>
            <Button
              type="button"
              variant="outline"
              className={`mt-4 ${outlineButtonClassName}`}
              onClick={() => void adminsQuery.refetch()}
            >
              Повторить
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Источник</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {adminsQuery.data.admins.map((admin) => (
                <tr
                  key={admin.email}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                      <ShieldCheck
                        className="size-4 text-slate-400 dark:text-slate-500"
                        aria-hidden
                      />
                      {admin.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {admin.source === 'env' ? 'env' : 'добавлен вручную'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {admin.source === 'env' ? (
                      <span
                        className="text-xs text-slate-400 dark:text-slate-500"
                        title="Задан в переменных окружения, удалить можно только правкой env"
                      >
                        недоступно
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-lg border-slate-300 bg-white text-red-500 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-red-400 dark:hover:border-red-500/20 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        disabled={busy}
                        onClick={() => void handleRemove(admin)}
                      >
                        <Trash2 aria-hidden />
                        Удалить
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {adminsQuery.data.admins.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    Список администраторов пуст.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
