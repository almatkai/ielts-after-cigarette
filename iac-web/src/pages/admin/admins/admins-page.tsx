import { ShieldTick, Trash, UserAdd, Warning2 } from 'iconsax-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold text-primary normal-case">
          Администрирование
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          Администраторы
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
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
          className="h-11 w-full max-w-xs rounded-[9px] border-border bg-card shadow-none focus-visible:border-primary focus-visible:ring-0"
        />
        <Button
          type="submit"
          className="bg-primary hover:bg-primary-hover"
          disabled={busy}
        >
          <UserAdd aria-hidden />
          Добавить
        </Button>
      </form>

      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      {adminsQuery.isPending ? (
        <Card className="rounded-[10px] border-border shadow-none">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Загружаем список администраторов…
          </CardContent>
        </Card>
      ) : adminsQuery.isError ? (
        <Card className="rounded-[10px] border-border shadow-none">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <Warning2 className="size-6 text-destructive" aria-hidden />
            <p className="mt-3 text-sm">
              {adminsQuery.error instanceof ApiError &&
              adminsQuery.error.status === 403
                ? 'Нет доступа: управление администраторами доступно только роли ADMIN.'
                : 'Не удалось загрузить список администраторов.'}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void adminsQuery.refetch()}
            >
              Повторить
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs normal-case tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Источник</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {adminsQuery.data.admins.map((admin) => (
                <tr
                  key={admin.email}
                  className="border-b border-muted last:border-0"
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <ShieldTick
                        className="size-4 text-muted-foreground"
                        aria-hidden
                      />
                      {admin.email}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {admin.source === 'env' ? 'env' : 'добавлен вручную'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {admin.source === 'env' ? (
                      <span
                        className="text-xs text-muted-foreground"
                        title="Задан в переменных окружения, удалить можно только правкой env"
                      >
                        недоступно
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled={busy}
                        onClick={() => void handleRemove(admin)}
                      >
                        <Trash aria-hidden />
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
                    className="px-4 py-8 text-center text-muted-foreground"
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
