import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Clock3, Layers3, PlayCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fullMockKeys, listPublicFullMocks } from '@/features/fullmock/api'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import { useAuth } from '@/features/auth/auth-store'
import { getErrorMessage } from '@/lib/api/client'

export function FullMockLibraryPage() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: fullMockKeys.publicTests,
    queryFn: ({ signal }) => listPublicFullMocks(signal),
  })
  if (query.isPending)
    return <LoadingState label="Загружаем пробные экзамены…" />
  if (query.isError) {
    return (
      <ErrorState
        title="Не удалось загрузить Full Mock"
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  }
  const items = query.data.items.filter(
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
      {items.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="p-8 text-sm text-[#69696d]">
            Для выбранного формата экзамена пока нет опубликованных пробных экзаменов.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className="shadow-none">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{item.title}</CardTitle>
                  <Badge variant="outline">{item.examType}</Badge>
                </div>
                {item.description ? (
                  <p className="text-sm leading-6 text-[#69696d]">
                    {item.description}
                  </p>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <p className="flex items-center gap-2 text-sm text-[#69696d]">
                  <Clock3 className="size-4" aria-hidden />
                  {item.durationMinutes} минут ·{' '}
                  <Layers3 className="size-4" aria-hidden />4 секции
                </p>
                <Button asChild>
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
