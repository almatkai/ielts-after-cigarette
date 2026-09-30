import {
  Add,
  DocumentUpload,
  Edit,
  ExportCurve,
  Headphone,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataExportDialog } from '@/components/admin/data-export-dialog'
import { serializeListeningToV1 } from '@/features/admin/export-utils'
import {
  getAdminListeningTest,
  listeningKeys,
  listAdminListeningTests,
} from '@/features/listening/api'
import type { ListeningTest } from '@/features/listening/api'

export function ListeningTestsPage() {
  const [exportTest, setExportTest] = useState<ListeningTest | null>(null)
  const [exportLoadingId, setExportLoadingId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: listeningKeys.adminTests,
    queryFn: ({ signal }) => listAdminListeningTests(signal),
  })

  const handleExport = async (id: string) => {
    setExportLoadingId(id)
    try {
      const full = await getAdminListeningTest(id)
      setExportTest(full)
    } catch (err) {
      console.error('Failed to load listening test for export', err)
    } finally {
      setExportLoadingId(null)
    }
  }
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#3b82f6]">
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
              <DocumentUpload aria-hidden /> Импортировать
            </Link>
          </Button>
          <Button asChild className="bg-[#3b82f6] hover:bg-[#2563eb]">
            <Link to="/admin/listening/tests/new">
              <Add aria-hidden /> Создать вручную
            </Link>
          </Button>
        </div>
      </div>
      {query.isPending ? <p>Загружаем…</p> : null}
      {query.data?.items.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="grid place-items-center gap-3 p-16 text-center">
            <Headphone className="size-8 text-[#999]" aria-hidden />
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
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={exportLoadingId === test.id}
                  onClick={() => void handleExport(test.id)}
                >
                  <ExportCurve aria-hidden />
                  {exportLoadingId === test.id ? 'Загрузка…' : 'Экспорт'}
                </Button>
                <Button asChild variant="outline">
                  <Link
                    to="/admin/listening/tests/$testId"
                    params={{ testId: test.id }}
                  >
                    <Edit aria-hidden /> Редактировать
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {exportTest ? (
        <DataExportDialog
          open={Boolean(exportTest)}
          onOpenChange={(open) => !open && setExportTest(null)}
          title={exportTest.title}
          formatLabel="IELTS_LISTENING_IMPORT_V1"
          filename={`${exportTest.slug || 'listening-test'}.v1.txt`}
          content={serializeListeningToV1(exportTest)}
        />
      ) : null}
    </div>
  )
}
