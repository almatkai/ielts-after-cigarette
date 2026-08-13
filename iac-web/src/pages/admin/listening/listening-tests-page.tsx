import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FileInput, Headphones, PencilLine, Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  listeningKeys,
  listAdminListeningTests,
} from '@/features/listening/api'

export function ListeningTestsPage() {
  const query = useQuery({
    queryKey: listeningKeys.adminTests,
    queryFn: ({ signal }) => listAdminListeningTests(signal),
  })
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#e23b3b]">
            Listening
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Listening тесты
          </h1>
          <p className="mt-2 text-sm text-[#69696d]">
            Аудио, части теста и группы вопросов.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/listening/import">
              <FileInput aria-hidden /> Импортировать
            </Link>
          </Button>
          <Button asChild className="bg-[#e23b3b] hover:bg-[#c92f2f]">
            <Link to="/admin/listening/tests/new">
              <Plus aria-hidden /> Создать вручную
            </Link>
          </Button>
        </div>
      </div>
      {query.isPending ? <p>Загружаем…</p> : null}
      {query.data?.items.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="grid place-items-center gap-3 p-16 text-center">
            <Headphones className="size-8 text-[#999]" aria-hidden />
            <p className="font-semibold">Listening тестов пока нет</p>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-3">
        {query.data?.items.map((test) => (
          <Card key={test.id} className="shadow-none">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{test.title}</h2>
                  <Badge variant="outline">{test.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-[#69696d]">
                  {test.examType} · {test.durationMinutes} минут · version{' '}
                  {test.currentVersionNumber}
                </p>
              </div>
              <Button asChild variant="outline">
                <Link
                  to="/admin/listening/tests/$testId"
                  params={{ testId: test.id }}
                >
                  <PencilLine aria-hidden /> Редактировать
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
