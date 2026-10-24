import { Headphone } from 'iconsax-react'
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
import {
  listeningKeys,
  listPublicListeningTests,
} from '@/features/listening/api'

import { getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'

export function ListeningLibraryPage() {
  const { language, t } = useLanguage()
  const { user } = useAuth()
  const attemptsQuery = useLibraryAttempts('listening')
  const query = useQuery({
    queryKey: listeningKeys.publicTests,
    queryFn: ({ signal }) => listPublicListeningTests(signal),
  })
  const tests = (query.data?.items ?? []).filter(
    (test) => !user?.examType || test.examType === user.examType,
  )
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.025em] text-foreground">
          {t('Выберите тест для тренировки')}
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
          title={t('Не удалось загрузить тесты')}
          message={t(getErrorMessage(query.error))}
          onRetry={() => void query.refetch()}
        />
      ) : tests.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map((test) => (
            <Card
              key={test.id}
              className="group gap-0 rounded-[10px] border border-border bg-card py-0 shadow-none transition-all duration-200 hover:border-border-strong hover:shadow-none"
            >
              <CardContent className="flex h-full flex-col justify-between gap-4 p-5 sm:p-6">
                <div className="flex items-start gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary-soft group-hover:text-primary ">
                    <Headphone
                      className="size-5 transition-colors"
                      aria-hidden
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
                        {test.title}
                      </h3>
                      <span className="shrink-0 rounded-sm border border-border/80 bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {test.examType === 'academic' ? 'Academic' : 'General'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('Длительность')}: {test.durationMinutes}{' '}
                      {language === 'en'
                        ? 'minutes'
                        : language === 'kk'
                          ? 'минут'
                          : 'минут'}
                    </p>
                  </div>
                </div>
                <LibraryAttemptResult
                  items={(attemptsQuery.data?.items ?? []).filter(
                    (item) => item.materialId === test.id,
                  )}
                />
                <LibraryAttemptActions
                  skill="listening"
                  materialId={test.id}
                  items={(attemptsQuery.data?.items ?? []).filter(
                    (item) => item.materialId === test.id,
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
