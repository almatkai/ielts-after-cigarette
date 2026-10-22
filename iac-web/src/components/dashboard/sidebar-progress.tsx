import { Link } from '@tanstack/react-router'
import {
  bandChange,
  completedAttempts,
  previousMaterialAttempt,
} from '@/features/attempts/attempt-history'
import { BandChange } from '@/features/attempts/band-change'
import { useAttemptHistory } from '@/features/attempts/use-attempt-history'
import { formatDateTime } from '@/lib/date'
import { useLanguage } from '@/lib/i18n'

export function SidebarProgress({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage()
  const query = useAttemptHistory()
  const items = completedAttempts(
    query.data?.pages.flatMap((page) => page.items) ?? [],
  )
  return (
    <section aria-label={t('История прогресса')} className="mt-auto pt-8 pb-4">
      <div className="flex items-center justify-between gap-2 px-3.5">
        <h2 className="text-[11px] font-semibold text-muted-foreground">
          {t('История прогресса')}
        </h2>
        <Link
          to="/progress"
          onClick={onNavigate}
          className="text-[11px] font-medium text-primary-hover hover:underline"
        >
          {t('Вся история')}
        </Link>
      </div>
      {query.isPending ? (
        <p className="px-3.5 pt-3 text-xs text-muted-foreground">
          {t('Загружаем результаты…')}
        </p>
      ) : query.isError ? (
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="px-3.5 pt-3 text-left text-xs text-muted-foreground hover:text-primary-hover"
        >
          {t('Не удалось загрузить. Повторить')}
        </button>
      ) : items.length === 0 ? (
        <p className="px-3.5 pt-3 text-xs leading-5 text-muted-foreground">
          {t(
            'После первого теста здесь появятся оценки и изменения результата.',
          )}
        </p>
      ) : (
        <div className="mt-2 space-y-1">
          {items.slice(0, 3).map((item, index) => (
            <Link
              key={item.id}
              to="/attempts/$attemptId"
              params={{ attemptId: item.id }}
              onClick={onNavigate}
              className="block rounded-[10px] px-3.5 py-2.5 transition-colors hover:bg-muted"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] capitalize text-muted-foreground">
                  {item.materialType}
                </span>
                <span className="text-xs font-semibold tabular-nums text-primary-hover">
                  Band {item.band?.toFixed(1) ?? '—'}
                </span>
              </div>
              <p
                className="mt-1 line-clamp-2 text-xs font-medium text-foreground"
                title={item.testTitle}
              >
                {item.testTitle}
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground">
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
