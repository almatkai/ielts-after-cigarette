import {
  Clock,
  Layer,
  PlayCircle,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fullMockKeys, listPublicFullMocks } from '@/features/fullmock/api'
import {
  EmptyState,
  ErrorState,
  LibraryCardsSkeleton,
} from '@/features/attempts/attempt-ui'
import { useAuth } from '@/features/auth/auth-store'
import { getErrorMessage } from '@/lib/api/client'

export function FullMockLibraryPage() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: fullMockKeys.publicTests,
    queryFn: ({ signal }) => listPublicFullMocks(signal),
  })
  const items = (query.data?.items ?? []).filter(
    (item) => !user?.examType || item.examType === user.examType,
  )
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-6">
      <div>
        <Badge variant="secondary">Full Mock</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Полный пробный IELTS
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69696d]">
          Пройдите Listening, Reading, Writing и Speaking в одной сессии. К
          следующей секции можно перейти только после сдачи текущей.
        </p>
      </div>
      {query.isPending ? (
        <LibraryCardsSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="Не удалось загрузить Full Mock"
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState title="Для выбранного формата экзамена пока нет опубликованных пробных экзаменов." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <Card
              key={item.id}
              className="group gap-0 rounded-[16px] border border-[#e7e7e4] bg-white py-0 shadow-[0_10px_36px_rgba(17,17,17,0.035)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_14px_40px_rgba(17,17,17,0.055)]"
            >
              <CardHeader className="border-b border-[#ededeb] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base font-semibold tracking-[-0.01em] text-[#111111] transition-colors group-hover:text-[#3b82f6]">
                    {item.title}
                  </CardTitle>
                  <Badge variant="outline" className="border-[#deded9] bg-slate-50 text-[11px] font-semibold text-slate-600">
                    {item.examType === 'academic' ? 'Academic' : 'General'}
                  </Badge>
                </div>
                {item.description ? (
                  <p className="mt-1 text-sm leading-6 text-[#69696d]">
                    {item.description}
                  </p>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                <p className="flex items-center gap-2 text-sm text-[#69696d]">
                  <Clock className="size-4 text-slate-400 transition-colors group-hover:text-[#3b82f6]" aria-hidden />
                  {item.durationMinutes} минут ·{' '}
                  <Layer className="size-4 text-slate-400 transition-colors group-hover:text-[#3b82f6]" aria-hidden />
                  4 секции
                </p>
                <Button asChild className="h-10 rounded-[9px] bg-[#3b82f6] px-5 shadow-none hover:bg-[#2563eb]">
                  <Link
                    to="/dashboard/full-mocks/$mockId"
                    params={{ mockId: item.id }}
                  >
                    <PlayCircle aria-hidden />
                    Начать
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
