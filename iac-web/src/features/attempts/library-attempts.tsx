import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { attemptKeys, listAttempts } from './api'
import type { AttemptListItem } from './api'
import { bandChange, summarizeMaterialAttempts } from './attempt-history'
import { BandChange } from './band-change'
import { formatDateTime } from '@/lib/date'

export function useLibraryAttempts(skill: 'listening' | 'reading') {
  return useQuery({
    queryKey: attemptKeys.list(skill),
    queryFn: ({ signal }) => listAttempts(skill, signal),
  })
}

export function LibraryAttemptResult({ items }: { items: AttemptListItem[] }) {
  const { latest, previous, count } = summarizeMaterialAttempts(items)
  if (!latest) return null
  return (
    <div className="rounded-[10px] border border-[#dcece1] bg-[#f4faf6] px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-emerald-700">
          Пройден · попыток: {count}
        </span>
        <BandChange value={bandChange(latest, previous)} />
      </div>
      <div className="mt-1.5 flex items-baseline gap-3">
        <span className="text-lg font-semibold tracking-tight text-[#111111]">
          Band {latest.band?.toFixed(1) ?? '—'}
        </span>
        <span className="text-sm text-[#69696d]">
          {latest.score ?? '—'}/{latest.maxScore ?? '—'}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-[#808084]">
        Последняя попытка ·{' '}
        {formatDateTime(latest.submittedAt ?? latest.startedAt)}
      </p>
    </div>
  )
}

export function LibraryAttemptActions({
  skill,
  materialId,
  items,
  pending,
}: {
  skill: 'listening' | 'reading'
  materialId: string
  items: AttemptListItem[]
  pending: boolean
}) {
  const client = useQueryClient()
  const { latest, active } = summarizeMaterialAttempts(items)
  const prepareAttempt = () => {
    // The exam shell pins its start response. Re-enter through a fresh server
    // read so a completed cached attempt cannot replace a retake or draft.
    client.removeQueries({
      queryKey:
        skill === 'listening'
          ? ['listening', 'tests', materialId, 'attempt']
          : ['reading', 'materials', materialId, 'attempt'],
      exact: true,
    })
  }
  const label = pending
    ? 'Загружаем…'
    : active?.status === 'PROCESSING'
      ? 'На проверке'
      : active
        ? 'Продолжить попытку'
        : latest
          ? 'Новая попытка'
          : skill === 'listening'
            ? 'Открыть тест'
            : 'Открыть текст'
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-[#ededeb] pt-3">
      {latest ? (
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-[9px] px-4 shadow-none"
        >
          <Link to="/attempts/$attemptId" params={{ attemptId: latest.id }}>
            Результат
          </Link>
        </Button>
      ) : null}
      {active?.status === 'PROCESSING' ? (
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-[9px] px-4 shadow-none"
        >
          <Link to="/attempts/$attemptId" params={{ attemptId: active.id }}>
            На проверке
          </Link>
        </Button>
      ) : pending ? (
        <Button
          disabled
          className="h-10 rounded-[9px] bg-[#3b82f6] px-5 shadow-none"
        >
          {label}
        </Button>
      ) : (
        <Button
          asChild
          className="h-10 rounded-[9px] bg-[#3b82f6] px-5 shadow-none hover:bg-[#2563eb]"
        >
          {skill === 'listening' ? (
            <Link
              to="/exam/listening/$testId"
              params={{ testId: materialId }}
              onClick={prepareAttempt}
            >
              {label}
            </Link>
          ) : (
            <Link
              to="/exam/reading/$materialId"
              params={{ materialId }}
              onClick={prepareAttempt}
            >
              {label}
            </Link>
          )}
        </Button>
      )}
    </div>
  )
}
