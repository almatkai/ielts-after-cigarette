import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { SearchNormal1, ArrowRight2 } from 'iconsax-react'
import { Input } from '@/components/ui/input'
import { listUsers, usersKey } from '@/features/admin/users-api'
import { getErrorMessage } from '@/lib/api/client'
import {
  date,
  Pagination,
  QueryError,
  roles,
  statusText,
  UserAvatar,
} from './shared'

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
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
  return (
    <div className="grid gap-5">
      <div className="flex items-baseline gap-3">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">
          Пользователи
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
            placeholder="Имя, email или телефон"
            aria-label="Поиск пользователей"
            className="h-10 bg-white pl-10"
          />
        </div>
        <select
          aria-label="Роль"
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            setPage(1)
          }}
          className="h-10 rounded-lg border border-[#e7e7e4] bg-white px-3 text-sm"
        >
          <option value="">Все роли</option>
          {Object.entries(roles).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {query.isError ? (
        <QueryError
          message={getErrorMessage(query.error)}
          retry={() => void query.refetch()}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e7e7e4] bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-[#e7e7e4] bg-[#fafaf8] text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Пользователь</th>
                <th className="px-4 py-3 font-medium">Роль</th>
                <th className="px-4 py-3 font-medium">Тесты</th>
                <th className="px-4 py-3 font-medium">Активность</th>
                <th className="w-10">
                  <span className="sr-only">Открыть</span>
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
                    Загрузка…
                  </td>
                </tr>
              ) : (
                query.data.items.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[#eeeeeb] last:border-0 hover:bg-[#fafaf8]"
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
                          user.role === 'WRITER' ? 'text-[#2563eb]' : ''
                        }
                      >
                        {roles[user.role]}
                      </span>
                      {user.blocked ? (
                        <p className="mt-1 text-xs text-destructive">
                          Заблокирован
                        </p>
                      ) : user.status !== 'REGISTERED' ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {statusText[user.status]}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <p>{user.completedTests} завершено</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {user.unfinishedTests} в процессе
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {date(user.lastActiveAt)}
                    </td>
                    <td className="pr-4">
                      <Link
                        to="/admin/users/$userId"
                        params={{ userId: user.id }}
                        aria-label={`Открыть ${user.displayName}`}
                        className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-[#eff6ff] hover:text-primary"
                      >
                        <ArrowRight2 className="size-4" aria-hidden />
                      </Link>
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
                    Ничего не найдено
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
    </div>
  )
}
