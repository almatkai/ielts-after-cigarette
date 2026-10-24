import { Book1 } from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'

import { Card, CardContent } from '@/components/ui/card'
import {
  ErrorState,
  EmptyState,
  LibraryCardsSkeleton,
} from '@/features/attempts/attempt-ui'
import {
  LibraryAttemptActions,
  LibraryAttemptResult,
  useLibraryAttempts,
} from '@/features/attempts/library-attempts'
import { useAuth } from '@/features/auth/auth-store'
import { listPublicReadingMaterials, readingKeys } from '@/features/reading/api'
import { getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'

export function ReadingLibraryPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const attemptsQuery = useLibraryAttempts('reading')
  const query = useQuery({
    queryKey: readingKeys.publicMaterials,
    queryFn: ({ signal }) => listPublicReadingMaterials(signal),
  })
  const materials = (query.data?.items ?? []).filter(
    (material) => !user?.examType || material.examType === user.examType,
  )
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.025em] text-foreground">
          {t('Выберите текст для тренировки')}
        </h2>
      </div>
      {attemptsQuery.isError ? (
        <ErrorState
          title={t('Не удалось загрузить результаты')}
          message={t(getErrorMessage(attemptsQuery.error))}
          onRetry={() => void attemptsQuery.refetch()}
        />
      ) : null}
      {query.isPending ? (
        <LibraryCardsSkeleton />
      ) : query.isError ? (
        <ErrorState
          title={t('Не удалось загрузить материалы')}
          message={t(getErrorMessage(query.error))}
          onRetry={() => void query.refetch()}
        />
      ) : materials.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {materials.map((material) => (
            <Card
              key={material.id}
              className="group gap-0 rounded-[10px] border border-border bg-card py-0 shadow-none transition-all duration-200 hover:border-border-strong hover:shadow-none"
            >
              <CardContent className="flex h-full flex-col justify-between gap-4 p-5 sm:p-6">
                <div className="flex items-start gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary-soft group-hover:text-primary ">
                    <Book1 className="size-5 transition-colors" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
                        {material.title}
                      </h3>
                      <span className="shrink-0 rounded-sm border border-border/80 bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {material.examType === 'academic'
                          ? 'Academic'
                          : 'General'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('Сложность')}: {material.difficulty}
                    </p>
                    {material.description ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {material.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <LibraryAttemptResult
                  items={(attemptsQuery.data?.items ?? []).filter(
                    (item) => item.materialId === material.id,
                  )}
                />
                <LibraryAttemptActions
                  skill="reading"
                  materialId={material.id}
                  items={(attemptsQuery.data?.items ?? []).filter(
                    (item) => item.materialId === material.id,
                  )}
                  pending={attemptsQuery.isPending}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
