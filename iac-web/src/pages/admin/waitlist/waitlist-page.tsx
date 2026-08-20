import { useQuery } from '@tanstack/react-query'
import { Inbox, RefreshCw, Tags, TriangleAlert, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminQueryKeys, listWaitlistEntries } from '@/features/admin/api'
import { ApiError } from '@/lib/api/client'

import type { WaitlistEntry } from '@/features/admin/api'

const interFont = {
  fontFamily:
    '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
} as const

const cardClassName =
  'gap-0 rounded-xl border-slate-200 bg-white py-0 shadow-sm dark:border-slate-800 dark:bg-slate-900'

const cardTitleClassName =
  'text-base font-bold tracking-tight text-slate-900 dark:text-slate-100'

const badgeClassName =
  'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'

function displayName(entry: WaitlistEntry) {
  const name = [entry.firstName, entry.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()
  return name || entry.email || entry.phone
}

function topReferrers(entries: WaitlistEntry[], limit = 5) {
  return entries
    .filter((entry) => entry.referrals > 0)
    .sort((a, b) => b.referrals - a.referrals)
    .slice(0, limit)
}

function unknownRefTags(entries: WaitlistEntry[]) {
  const knownCodes = new Set(entries.map((entry) => entry.referralCode))
  const counts = new Map<string, number>()
  for (const entry of entries) {
    const code = entry.referredByCode
    if (!code || knownCodes.has(code)) continue
    counts.set(code, (counts.get(code) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
}

export function WaitlistPage() {
  const waitlistQuery = useQuery({
    queryKey: adminQueryKeys.waitlist,
    queryFn: ({ signal }) => listWaitlistEntries(signal),
  })

  return (
    <div style={interFont} className="grid gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500 dark:text-blue-400">
            Waitlist
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Заявки в waitlist
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {waitlistQuery.data
              ? `Всего заявок: ${waitlistQuery.data.total}`
              : 'Заявки с лендинга и реферальная статистика.'}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-lg border-slate-300 bg-white text-slate-900 shadow-sm hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-100"
          disabled={waitlistQuery.isFetching}
          onClick={() => void waitlistQuery.refetch()}
        >
          <RefreshCw
            className={waitlistQuery.isFetching ? 'animate-spin' : undefined}
            aria-hidden
          />
          Обновить
        </Button>
      </div>

      {waitlistQuery.isPending ? (
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Загружаем заявки…
          </CardContent>
        </Card>
      ) : waitlistQuery.isError ? (
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <TriangleAlert
              className="size-6 text-red-500 dark:text-red-400"
              aria-hidden
            />
            <p className="mt-3 text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {waitlistQuery.error instanceof ApiError &&
              waitlistQuery.error.status === 403
                ? 'Нет доступа: waitlist доступен только администраторам (роль ADMIN).'
                : 'Не удалось загрузить заявки.'}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 rounded-lg border-slate-300 bg-white text-slate-900 shadow-sm hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              onClick={() => void waitlistQuery.refetch()}
            >
              Повторить
            </Button>
          </CardContent>
        </Card>
      ) : waitlistQuery.data.entries.length === 0 ? (
        <Card className="rounded-xl border-dashed border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <Inbox
              className="size-8 text-slate-400 dark:text-slate-500"
              aria-hidden
            />
            <h2 className="mt-4 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Заявок пока нет
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Как только посетители начнут оставлять контакты, они появятся
              здесь вместе с реферальной статистикой.
            </p>
          </CardContent>
        </Card>
      ) : (
        <WaitlistContent entries={waitlistQuery.data.entries} />
      )}
    </div>
  )
}

function WaitlistContent({ entries }: { entries: WaitlistEntry[] }) {
  const referrers = topReferrers(entries)
  const tags = unknownRefTags(entries)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={cardClassName}>
          <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
                <Users className="size-[18px]" strokeWidth={1.8} aria-hidden />
              </span>
              <CardTitle className={cardTitleClassName}>
                Топ приглашающих
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {referrers.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Пока никто никого не пригласил.
              </p>
            ) : (
              <ul className="grid gap-3">
                {referrers.map((entry, index) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="w-5 text-xs font-semibold text-slate-400 tabular-nums dark:text-slate-500">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-900 dark:text-slate-100">
                      {displayName(entry)}
                    </span>
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                      {entry.referralCode}
                    </span>
                    <Badge variant="outline" className={badgeClassName}>
                      {entry.referrals} {pluralizeInvites(entry.referrals)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className={cardClassName}>
          <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Tags className="size-[18px]" strokeWidth={1.8} aria-hidden />
              </span>
              <CardTitle className={cardTitleClassName}>
                Внешние метки
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {tags.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Переходов по кодам, не принадлежащим пользователям waitlist,
                нет.
              </p>
            ) : (
              <>
                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Коды «приглашён по», которые не совпадают ни с одним кодом из
                  waitlist — так помечены внешние источники трафика.
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <li key={tag.code}>
                      <Badge variant="outline" className={badgeClassName}>
                        <span className="font-mono">{tag.code}</span> ·{' '}
                        {tag.count}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">Имя</th>
              <th className="px-4 py-3 font-medium">Фамилия</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Телефон</th>
              <th className="px-4 py-3 font-medium">Источник</th>
              <th className="px-4 py-3 font-medium">Код</th>
              <th className="px-4 py-3 font-medium">Приглашён по</th>
              <th className="px-4 py-3 font-medium">Приглашено</th>
              <th className="px-4 py-3 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
              >
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                  {entry.firstName ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                  {entry.lastName ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                  {entry.email ?? '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                  {entry.phone}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {entry.source ?? '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {entry.referralCode}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {entry.referredByCode ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-900 tabular-nums dark:text-slate-100">
                  {entry.referrals}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-500 tabular-nums dark:text-slate-400">
                  {new Date(entry.createdAt).toLocaleString('ru-RU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function pluralizeInvites(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'приглашение'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return 'приглашения'
  return 'приглашений'
}
