import { useQuery } from '@tanstack/react-query'
import { Inbox, RefreshCw, Tags, TriangleAlert, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminQueryKeys, listWaitlistEntries } from '@/features/admin/api'
import { ApiError } from '@/lib/api/client'

import type { WaitlistEntry } from '@/features/admin/api'

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
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-[#e23b3b] uppercase">
            Waitlist
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Заявки в waitlist
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#69696d]">
            {waitlistQuery.data
              ? `Всего заявок: ${waitlistQuery.data.total}`
              : 'Заявки с лендинга и реферальная статистика.'}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
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
        <Card className="rounded-[16px] border-[#e7e7e4] shadow-none">
          <CardContent className="p-8 text-center text-sm text-[#69696d]">
            Загружаем заявки…
          </CardContent>
        </Card>
      ) : waitlistQuery.isError ? (
        <Card className="rounded-[16px] border-[#e7e7e4] shadow-none">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <TriangleAlert className="size-6 text-[#e23b3b]" aria-hidden />
            <p className="mt-3 text-sm">
              {waitlistQuery.error instanceof ApiError &&
              waitlistQuery.error.status === 403
                ? 'Нет доступа: waitlist доступен только администраторам (роль ADMIN).'
                : 'Не удалось загрузить заявки.'}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void waitlistQuery.refetch()}
            >
              Повторить
            </Button>
          </CardContent>
        </Card>
      ) : waitlistQuery.data.entries.length === 0 ? (
        <Card className="rounded-[16px] border-dashed border-[#d8d8d3] bg-white shadow-none">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <Inbox className="size-8 text-[#9a9a9d]" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold">Заявок пока нет</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#69696d]">
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
        <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none">
          <CardHeader className="border-b border-[#ededeb] p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-[9px] bg-[#fff0f0] text-[#e23b3b]">
                <Users className="size-[18px]" aria-hidden />
              </span>
              <CardTitle className="text-base">Топ приглашающих</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {referrers.length === 0 ? (
              <p className="text-sm text-[#69696d]">
                Пока никто никого не пригласил.
              </p>
            ) : (
              <ul className="grid gap-3">
                {referrers.map((entry, index) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="w-5 text-xs font-semibold text-[#a1a1a6]">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {displayName(entry)}
                    </span>
                    <span className="text-xs text-[#808084]">
                      {entry.referralCode}
                    </span>
                    <Badge variant="outline">
                      {entry.referrals} {pluralizeInvites(entry.referrals)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none">
          <CardHeader className="border-b border-[#ededeb] p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-[9px] bg-[#f4f4f1] text-[#69696d]">
                <Tags className="size-[18px]" aria-hidden />
              </span>
              <CardTitle className="text-base">Внешние метки</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {tags.length === 0 ? (
              <p className="text-sm text-[#69696d]">
                Переходов по кодам, не принадлежащим пользователям waitlist,
                нет.
              </p>
            ) : (
              <>
                <p className="text-sm leading-6 text-[#69696d]">
                  Коды «приглашён по», которые не совпадают ни с одним кодом из
                  waitlist — так помечены внешние источники трафика.
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <li key={tag.code}>
                      <Badge variant="outline">
                        {tag.code} · {tag.count}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-[16px] border border-[#e7e7e4] bg-white">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#e7e7e4] text-xs uppercase tracking-wide text-[#69696d]">
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
                className="border-b border-[#f0f0ed] last:border-0"
              >
                <td className="px-4 py-3">{entry.firstName ?? '—'}</td>
                <td className="px-4 py-3">{entry.lastName ?? '—'}</td>
                <td className="px-4 py-3">{entry.email ?? '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">{entry.phone}</td>
                <td className="px-4 py-3">{entry.source ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {entry.referralCode}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {entry.referredByCode ?? '—'}
                </td>
                <td className="px-4 py-3">{entry.referrals}</td>
                <td className="px-4 py-3 whitespace-nowrap">
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
