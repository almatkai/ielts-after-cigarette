import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { PlayCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import {
  fullMockKeys,
  getPublicFullMock,
  startFullMockSession,
} from '@/features/fullmock/api'
import { getErrorMessage } from '@/lib/api/client'

export function FullMockStartPage({ mockId }: { mockId: string }) {
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: fullMockKeys.publicTest(mockId),
    queryFn: ({ signal }) => getPublicFullMock(mockId, signal),
  })
  const start = useMutation({
    mutationFn: (restart: boolean) => startFullMockSession(mockId, restart),
    onSuccess: (session) =>
      navigate({
        to: '/exam/full-mock-sessions/$sessionId',
        params: { sessionId: session.id },
      }),
  })
  if (query.isPending) return <LoadingState label="Готовим пробный экзамен…" />
  if (query.isError)
    return (
      <ErrorState
        title="Не удалось загрузить экзамен"
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  const mock = query.data
  return (
    <div className="mx-auto grid w-full max-w-[720px] gap-5">
      <h1 className="text-3xl font-semibold tracking-[-0.04em]">
        {mock.title}
      </h1>
      <Card className="shadow-none">
        <CardContent className="grid gap-5 p-6">
          <p className="text-sm leading-6 text-[#69696d]">
            {mock.description ||
              'Сессия состоит из четырёх секций и занимает около трёх часов. После старта запустится общий таймер.'}
          </p>
          <ol className="grid gap-2 text-sm">
            <li>1. Listening</li>
            <li>2. Reading</li>
            <li>3. Writing</li>
            <li>4. Speaking</li>
          </ol>
          {start.isError ? (
            <p className="text-sm text-[#e23b3b]">
              {getErrorMessage(start.error)}
            </p>
          ) : null}
          <Button disabled={start.isPending} onClick={() => start.mutate(false)}>
            <PlayCircle aria-hidden />
            {start.isPending ? 'Открываем сессию…' : 'Начать или продолжить'}
          </Button>
          <Button
            variant="outline"
            disabled={start.isPending}
            onClick={() => {
              if (
                window.confirm(
                  'Начать заново? Незавершённая сессия будет закрыта, а новая начнётся с Listening.',
                )
              ) {
                start.mutate(true)
              }
            }}
          >
            Начать заново
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
