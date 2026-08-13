import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Headphones } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  listeningKeys,
  listPublicListeningTests,
} from '@/features/listening/api'

export function ListeningLibraryPage() {
  const query = useQuery({
    queryKey: listeningKeys.publicTests,
    queryFn: ({ signal }) => listPublicListeningTests(signal),
  })
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#e23b3b]">
          Practice
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Listening
        </h1>
        <p className="mt-2 text-sm text-[#69696d]">
          Опубликованные тренировочные тесты.
        </p>
      </div>
      {query.isPending ? <p>Загружаем…</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {query.data?.items.map((test) => (
          <Card key={test.id} className="shadow-none">
            <CardContent className="grid gap-3 p-5">
              <Headphones className="size-6 text-[#e23b3b]" aria-hidden />
              <div>
                <h2 className="font-semibold">{test.title}</h2>
                <p className="mt-1 text-sm text-[#69696d]">
                  {test.examType} · {test.durationMinutes} минут
                </p>
              </div>
              <Button asChild>
                <Link
                  to="/dashboard/listening/$testId"
                  params={{ testId: test.id }}
                >
                  Открыть тест
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {query.data?.items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-[#69696d]">
          Опубликованных тестов пока нет.
        </p>
      ) : null}
    </div>
  )
}
