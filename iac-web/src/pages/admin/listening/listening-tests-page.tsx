import {
  Add,
  DocumentUpload,
  Edit,
  Eye,
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
import { useAuth } from '@/features/auth/auth-store'
import { useLanguage } from '@/lib/i18n'

export function ListeningTestsPage() {
  const { t } = useLanguage()
  const auth = useAuth()
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
          <p className="text-xs font-semibold normal-case text-primary">
            Listening
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            {t('Listening тесты')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('Аудио, части теста и группы вопросов.')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/listening/import">
              <DocumentUpload aria-hidden /> {t('Импортировать')}
            </Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary-hover">
            <Link to="/admin/listening/tests/new">
              <Add aria-hidden /> {t('Создать вручную')}
            </Link>
          </Button>
        </div>
      </div>
      {query.isPending ? <p>{t('Загружаем…')}</p> : null}
      {query.data?.items.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="grid place-items-center gap-3 p-16 text-center">
            <Headphone className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-semibold">{t('Listening тестов пока нет')}</p>
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
                {test.hasUnpublishedChanges ? (
                  <p className="mt-1 text-xs text-warning-fg">
                    {t('Есть неопубликованные изменения')}
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-muted-foreground">
                  {test.examType} · {test.durationMinutes} {t('минут')} ·
                  version {test.currentVersionNumber}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {auth.hasAnyPermission(['CONTENT_EDITOR']) ? (
                  <Button asChild variant="outline">
                    <Link
                      to="/admin/preview/listening/$testId"
                      params={{ testId: test.id }}
                      preload={false}
                    >
                      <Eye aria-hidden />
                      {t('Предпросмотр теста')}
                    </Link>
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  disabled={exportLoadingId === test.id}
                  onClick={() => void handleExport(test.id)}
                >
                  <ExportCurve aria-hidden />
                  {exportLoadingId === test.id ? t('Загрузка…') : t('Экспорт')}
                </Button>
                <Button asChild variant="outline">
                  <Link
                    to="/admin/listening/tests/$testId"
                    params={{ testId: test.id }}
                  >
                    <Edit aria-hidden /> {t('Редактировать')}
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
