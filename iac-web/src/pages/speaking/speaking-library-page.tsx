import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { MicVocal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import {
  listPublicSpeakingMaterials,
  speakingKeys,
} from '@/features/speaking/api'
import { getErrorMessage } from '@/lib/api/client'

export function SpeakingLibraryPage() {
  const query = useQuery({
    queryKey: speakingKeys.publicMaterials,
    queryFn: ({ signal }) => listPublicSpeakingMaterials(signal),
  })

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.025em] text-[#111111]">
          Выберите Speaking-тренировку
        </h1>
        <p className="mt-1 text-sm leading-6 text-[#69696d]">
          Пройдите Parts 1–3 с таймерами, запишите ответы и получите расшифровку
          с разбором по критериям IELTS.
        </p>
      </div>
      {query.isPending ? <LoadingState label="Загружаем задания…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Не удалось загрузить Speaking-материалы"
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {query.data?.items.map((material) => (
          <Card key={material.id} className="shadow-none">
            <CardContent className="grid gap-3 p-5">
              <MicVocal className="size-6 text-[#3b82f6]" aria-hidden />
              <div>
                <h2 className="font-semibold">{material.title}</h2>
                <p className="mt-1 text-sm text-[#69696d]">
                  {material.examType === 'academic'
                    ? 'Academic'
                    : 'General Training'}{' '}
                  · {material.difficulty}
                </p>
                {material.description ? (
                  <p className="mt-2 text-sm text-[#69696d]">
                    {material.description}
                  </p>
                ) : null}
              </div>
              <Button asChild>
                <Link
                  to="/dashboard/speaking/$materialId"
                  params={{ materialId: material.id }}
                >
                  Начать Speaking
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {query.data?.items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-[#69696d]">
          Опубликованных Speaking-материалов пока нет.
        </p>
      ) : null}
    </div>
  )
}
