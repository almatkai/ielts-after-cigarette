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

export function ListeningLibraryPage() {
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
        <h2 className="text-lg font-semibold tracking-[-0.025em] text-[#111111]">
          Выберите тест для тренировки
        </h2>
      </div>
      {attemptsQuery.isError ? (
        <ErrorState
          title="Не удалось загрузить результаты"
          message={getErrorMessage(attemptsQuery.error)}
          onRetry={() => void attemptsQuery.refetch()}
        />
      ) : null}
      {query.isPending ? (
        <LibraryCardsSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="Не удалось загрузить тесты"
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : tests.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map((test) => (
            <Card
              key={test.id}
              className="group gap-0 rounded-[16px] border border-[#e7e7e4] bg-white py-0 shadow-[0_10px_36px_rgba(17,17,17,0.035)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_14px_40px_rgba(17,17,17,0.055)]"
            >
              <CardContent className="flex h-full flex-col justify-between gap-4 p-5 sm:p-6">
                <div className="flex items-start gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#f4f4f1] text-[#69696d] transition-all duration-200 group-hover:bg-[#eff6ff] group-hover:text-[#3b82f6] group-hover:scale-105">
                    <Headphone
                      className="size-5 transition-colors"
                      aria-hidden
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold tracking-[-0.01em] text-[#111111] transition-colors group-hover:text-[#3b82f6]">
                        {test.title}
                      </h3>
                      <span className="shrink-0 rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {test.examType === 'academic' ? 'Academic' : 'General'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#808084]">
                      Длительность: {test.durationMinutes} минут
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
