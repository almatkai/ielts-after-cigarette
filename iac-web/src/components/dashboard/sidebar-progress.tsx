import { Link } from '@tanstack/react-router'
import {
  bandChange,
  completedAttempts,
  previousMaterialAttempt,
} from '@/features/attempts/attempt-history'
import { BandChange } from '@/features/attempts/band-change'
import { useAttemptHistory } from '@/features/attempts/use-attempt-history'
import { formatDateTime } from '@/lib/date'

export function SidebarProgress({ onNavigate }: { onNavigate?: () => void }) {
  const query = useAttemptHistory()
  const items = completedAttempts(
    query.data?.pages.flatMap((page) => page.items) ?? [],
  )
  return (
    <section aria-label="История прогресса" className="mt-auto pt-8 pb-4">
      <div className="flex items-center justify-between gap-2 px-3.5">
        <h2 className="text-[11px] font-semibold text-[#808084]">
          История прогресса
        </h2>
        <Link
          to="/progress"
          onClick={onNavigate}
          className="text-[11px] font-medium text-[#2563eb] hover:underline"
        >
          Вся история
        </Link>
      </div>
      {query.isPending ? (
        <p className="px-3.5 pt-3 text-xs text-[#808084]">
          Загружаем результаты…
        </p>
      ) : query.isError ? (
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="px-3.5 pt-3 text-left text-xs text-[#69696d] hover:text-[#2563eb]"
        >
          Не удалось загрузить. Повторить
        </button>
      ) : items.length === 0 ? (
        <p className="px-3.5 pt-3 text-xs leading-5 text-[#808084]">
          После первого теста здесь появятся оценки и изменения результата.
        </p>
      ) : (
        <div className="mt-2 space-y-1">
          {items.slice(0, 3).map((item, index) => (
            <Link
              key={item.id}
              to="/attempts/$attemptId"
              params={{ attemptId: item.id }}
              onClick={onNavigate}
              className="block rounded-[10px] px-3.5 py-2.5 transition-colors hover:bg-[#f0f0ec]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] capitalize text-[#808084]">
                  {item.materialType}
                </span>
                <span className="text-xs font-semibold tabular-nums text-[#2563eb]">
                  Band {item.band?.toFixed(1) ?? '—'}
                </span>
              </div>
              <p
                className="mt-1 line-clamp-2 text-xs font-medium text-[#333337]"
                title={item.testTitle}
              >
                {item.testTitle}
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-1">
                <span className="text-[10px] text-[#9a9a9d]">
                  {
                    formatDateTime(item.submittedAt ?? item.startedAt).split(
                      ',',
                    )[0]
                  }
                </span>
                <BandChange
                  value={bandChange(
                    item,
                    previousMaterialAttempt(items, index),
                  )}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
