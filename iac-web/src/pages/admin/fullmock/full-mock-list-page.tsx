import { ClipboardTick } from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import { fullMockKeys, listFullMocks } from '@/features/fullmock/api'
import { getErrorMessage } from '@/lib/api/client'

export function FullMockListPage() {
  const query = useQuery({
    queryKey: fullMockKeys.adminTests,
    queryFn: ({ signal }) => listFullMocks(signal),
  })
  if (query.isPending) return <LoadingState label="Загружаем Full Mock…" />
  if (query.isError)
    return (
      <ErrorState
        title="Не удалось загрузить Full Mock"
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.04em]">
            Full Mock
          </h1>
          <p className="mt-1 text-sm text-[#69696d]">
            Архив ручных наборов. Новые Full Mock собираются автоматически из
            опубликованных тестов Listening, Reading, Writing и Speaking.
          </p>
        </div>
      </div>
      {query.data.items.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="p-8 text-sm text-[#69696d]">
            В архиве нет ручных наборов. Создавать отдельные Full Mock больше не
            нужно.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {query.data.items.map((item) => (
            <Card key={item.id} className="shadow-none">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardTick
                      className="size-5 text-[#3b82f6]"
                      aria-hidden
                    />
                    {item.title}
                  </CardTitle>
                  <p className="mt-2 text-sm text-[#69696d]">
                    {item.examType} · {item.durationMinutes} минут · {item.slug}
                  </p>
                </div>
                <Badge
                  variant={item.status === 'PUBLISHED' ? 'default' : 'outline'}
                >
                  {item.status}
                </Badge>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
