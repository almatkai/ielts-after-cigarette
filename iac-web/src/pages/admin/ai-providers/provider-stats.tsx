import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getAIStats } from '@/features/ai-providers/api'
import type { AIStats } from '@/features/ai-providers/api'

const duration = (ms: number | null) =>
  ms === null
    ? '—'
    : ms < 1000
      ? `${Math.round(ms)} мс`
      : `${(ms / 1000).toFixed(2)} с`
const purposes: Record<string, string> = {
  assistant: 'Юки',
  writing: 'Writing',
  speaking: 'Speaking',
  test: 'Проверка',
}
const outcomes: Record<string, string> = {
  success: 'Корректный ответ',
  failure: 'Ошибка',
  timeout: 'Таймаут',
  cancelled: 'Отменён',
}
const triggers: Record<string, string> = {
  primary: 'Первый',
  fallback: 'После ошибки',
  slow_hedge: 'Медленный предыдущий',
  test: 'Проверка',
}

export function ProviderStats({ revision }: { revision: number }) {
  const [data, setData] = useState<AIStats | null>(null)
  const [days, setDays] = useState(7)
  const [purpose, setPurpose] = useState('all')
  const [refresh, setRefresh] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let live = true
    setBusy(true)
    setError('')
    void getAIStats(days)
      .then((value) => {
        if (live) setData(value)
      })
      .catch(() => {
        if (live)
          setError('Не удалось загрузить статистику. Попробуйте обновить.')
      })
      .finally(() => {
        if (live) setBusy(false)
      })
    return () => {
      live = false
    }
  }, [days, refresh, revision])
  const models = (data?.models ?? [])
    .filter((row) => purpose === 'all' || row.purpose === purpose)
    .sort(
      (a, b) =>
        a.purpose.localeCompare(b.purpose) ||
        (a.p50Ms ?? Infinity) - (b.p50Ms ?? Infinity),
    )
  const recent = (data?.recent ?? []).filter(
    (row) => purpose === 'all' || row.purpose === purpose,
  )
  return (
    <section
      aria-label="Статистика провайдеров"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Скорость и надёжность
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Сравнивайте модели на одинаковых задачах. Успех означает корректный
            формат ответа, не оценку качества IELTS.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Период статистики"
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            <option value={1}>24 часа</option>
            <option value={7}>7 дней</option>
            <option value={30}>30 дней</option>
          </select>
          <select
            aria-label="Задача для статистики"
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
          >
            <option value="all">Все задачи</option>
            {Object.entries(purposes).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => setRefresh((value) => value + 1)}
          >
            {busy ? 'Загрузка…' : 'Обновить статистику'}
          </Button>
        </div>
      </header>
      {error && (
        <p role="alert" className="p-5 text-sm text-red-700">
          {error}
        </p>
      )}
      {data?.migrationRequired ? (
        <p className="p-5 text-sm text-slate-500">
          История запросов начнёт сохраняться после миграции 000032. Ключи,
          промпты и ответы в статистику не попадают.
        </p>
      ) : (
        <>
          {!busy && !models.length && (
            <p className="p-5 text-sm text-slate-500">
              Пока нет измерений за этот период. Нажмите «Проверить» у
              провайдера или используйте Юки / проверку работы.
            </p>
          )}
          {models.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    {[
                      'Провайдер / модель',
                      'Задача',
                      'Попытки',
                      'Успех',
                      'Победы',
                      'Ответ p50',
                      'Ответ p95',
                      'Первый токен',
                      'Отмены',
                    ].map((title) => (
                      <th key={title} className="px-4 py-3 font-medium">
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {models.map((row) => {
                    const completed = row.successes + row.failures
                    const rate = completed
                      ? `${Math.round((row.successes / completed) * 100)}%`
                      : '—'
                    return (
                      <tr
                        key={`${row.providerId}:${row.model}:${row.purpose}`}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="max-w-64 px-4 py-4">
                          <p className="font-medium text-slate-900">
                            {row.providerName}
                          </p>
                          <p className="mt-1 break-all text-xs text-slate-500">
                            {row.model}
                          </p>
                        </td>
                        <td className="px-4 py-4">{purposes[row.purpose]}</td>
                        <td className="px-4 py-4 tabular-nums">
                          {row.calls}
                          <p className="mt-1 text-xs text-slate-500">
                            {row.successes < 5
                              ? 'Мало данных'
                              : `${row.failures} ошибок · ${row.timeouts} таймаутов`}
                          </p>
                        </td>
                        <td className="px-4 py-4 tabular-nums">{rate}</td>
                        <td className="px-4 py-4 tabular-nums text-emerald-700">
                          {row.wins}
                        </td>
                        <td className="px-4 py-4 font-medium tabular-nums">
                          {duration(row.p50Ms)}
                        </td>
                        <td className="px-4 py-4 tabular-nums">
                          {duration(row.p95Ms)}
                        </td>
                        <td className="px-4 py-4 tabular-nums">
                          {duration(row.firstTokenMs)}
                        </td>
                        <td className="px-4 py-4 tabular-nums text-slate-500">
                          {row.cancelled}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="border-t border-slate-100 px-5 py-3 text-xs leading-5 text-slate-500">
            p50 — медиана, p95 — задержка для 95% корректных ответов. Отменённые
            пользователем запросы не считаются ошибками и не входят в эти
            задержки. Первый токен измеряется для streaming; «Проверить»
            измеряет короткий ответ, не полноценную оценку работы. Задержки
            отражают только успешные ответы, отдельно от ошибок и таймаутов.
          </p>
          {recent.length > 0 && (
            <details className="border-t border-slate-100">
              <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-800">
                Последние попытки ({recent.length})
              </summary>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      {[
                        'Время',
                        'Провайдер / модель',
                        'Задача',
                        'Почему запущен',
                        'Результат',
                        'Время ответа',
                      ].map((title) => (
                        <th key={title} className="px-4 py-3 font-medium">
                          {title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((row) => (
                      <tr key={row.id} className="border-b border-slate-100">
                        <td className="whitespace-nowrap px-4 py-3">
                          {new Date(row.startedAt).toLocaleString('ru-RU')}
                        </td>
                        <td className="max-w-56 px-4 py-3">
                          <p className="font-medium">{row.providerName}</p>
                          <p className="mt-1 break-all text-slate-500">
                            {row.model}
                          </p>
                          <p
                            className="mt-1 break-all text-[10px] text-slate-400"
                            title="ID гонки / запроса"
                          >
                            {row.runId}
                          </p>
                        </td>
                        <td className="px-4 py-3">{purposes[row.purpose]}</td>
                        <td className="px-4 py-3">
                          {triggers[row.trigger] ?? row.trigger}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              row.won
                                ? 'text-emerald-700'
                                : row.outcome === 'failure' ||
                                    row.outcome === 'timeout'
                                  ? 'text-amber-700'
                                  : 'text-slate-500'
                            }
                          >
                            {row.won ? 'Победитель' : outcomes[row.outcome]}
                          </span>
                          {row.code && (
                            <p className="mt-1 text-slate-400">
                              {row.code}
                              {row.httpStatus
                                ? ` · HTTP ${row.httpStatus}`
                                : ''}
                            </p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                          {duration(row.durationMs)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      )}
    </section>
  )
}
