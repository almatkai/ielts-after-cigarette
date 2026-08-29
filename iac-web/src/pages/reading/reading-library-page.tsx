import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import {
  listPublicReadingMaterials,
  readingKeys,
} from '@/features/reading/api'
import { getErrorMessage } from '@/lib/api/client'

export function ReadingLibraryPage() {
  const query = useQuery({
    queryKey: readingKeys.publicMaterials,
    queryFn: ({ signal }) => listPublicReadingMaterials(signal),
  })
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#e23b3b]">
          Practice
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Reading
        </h1>
        <p className="mt-2 text-sm text-[#69696d]">
          Опубликованные тексты для тренировки.
        </p>
      </div>
      {query.isPending ? <LoadingState label="Загружаем материалы…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Не удалось загрузить материалы"
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {query.data?.items.map((material) => (
          <Card key={material.id} className="shadow-none">
            <CardContent className="grid gap-3 p-5">
              <BookOpen className="size-6 text-[#e23b3b]" aria-hidden />
              <div>
                <h2 className="font-semibold">{material.title}</h2>
                <p className="mt-1 text-sm text-[#69696d]">
                  {material.examType} · {material.difficulty}
                </p>
                {material.description ? (
                  <p className="mt-2 text-sm text-[#69696d]">
                    {material.description}
                  </p>
                ) : null}
              </div>
              <Button asChild>
                <Link
                  to="/dashboard/reading/$materialId"
                  params={{ materialId: material.id }}
                >
                  Открыть текст
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {query.data?.items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-[#69696d]">
          Опубликованных материалов пока нет.
        </p>
      ) : null}
    </div>
  )
}
