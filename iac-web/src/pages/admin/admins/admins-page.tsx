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
        <p className="text-xs font-semibold tracking-[0.08em] text-[#e23b3b] uppercase">
          Администрирование
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Администраторы
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69696d]">
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
          className="h-11 w-full max-w-xs rounded-[9px] border-[#deded9] bg-white shadow-none focus-visible:border-[#e23b3b] focus-visible:ring-0"
        />
        <Button
          type="submit"
          className="bg-[#e23b3b] hover:bg-[#c92f2f]"
          disabled={busy}
        >
          <UserPlus aria-hidden />
          Добавить
        </Button>
      </form>

      {actionError ? (
        <p className="text-sm text-[#c92f2f]" role="alert">
          {actionError}
        </p>
      ) : null}

      {adminsQuery.isPending ? (
        <Card className="rounded-[16px] border-[#e7e7e4] shadow-none">
          <CardContent className="p-8 text-center text-sm text-[#69696d]">
            Загружаем список администраторов…
          </CardContent>
        </Card>
      ) : adminsQuery.isError ? (
        <Card className="rounded-[16px] border-[#e7e7e4] shadow-none">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <TriangleAlert className="size-6 text-[#e23b3b]" aria-hidden />
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
        <div className="overflow-x-auto rounded-[16px] border border-[#e7e7e4] bg-white">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e7e7e4] text-xs uppercase tracking-wide text-[#69696d]">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Источник</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {adminsQuery.data.admins.map((admin) => (
                <tr
                  key={admin.email}
                  className="border-b border-[#f0f0ed] last:border-0"
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <ShieldCheck
                        className="size-4 text-[#a1a1a6]"
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
                        className="text-xs text-[#a1a1a6]"
                        title="Задан в переменных окружения, удалить можно только правкой env"
                      >
                        недоступно
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="text-[#e23b3b] hover:text-[#c92f2f]"
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
                    className="px-4 py-8 text-center text-[#69696d]"
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
