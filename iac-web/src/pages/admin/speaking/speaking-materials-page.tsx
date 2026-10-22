import {
  DocumentForward,
  DocumentUpload,
  Edit,
  ExportCurve,
  Microphone2,
  Warning2,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataExportDialog } from '@/components/admin/data-export-dialog'
import { serializeSpeakingToJSON } from '@/features/admin/export-utils'
import {
  getSpeakingMaterial,
  listSpeakingMaterials,
  speakingKeys,
} from '@/features/speaking/api'
import type { SpeakingMaterial } from '@/features/speaking/api'

export function SpeakingMaterialsPage() {
  const [exportMaterial, setExportMaterial] = useState<SpeakingMaterial | null>(
    null,
  )
  const [exportLoadingId, setExportLoadingId] = useState<string | null>(null)

  const materialsQuery = useQuery({
    queryKey: speakingKeys.adminMaterials,
    queryFn: ({ signal }) => listSpeakingMaterials(signal),
  })

  const handleExport = async (id: string) => {
    setExportLoadingId(id)
    try {
      const full = await getSpeakingMaterial(id)
      setExportMaterial(full)
    } catch (err) {
      console.error('Failed to load speaking material for export', err)
    } finally {
      setExportLoadingId(null)
    }
  }
  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-primary normal-case">
            Speaking
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Банк материалов
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Три части IELTS Speaking: вопросы Parts 1 и 3, cue-card для Part 2.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/speaking/import">
              <DocumentUpload aria-hidden />
              Импорт JSON
            </Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary-hover">
            <Link to="/admin/speaking/materials/new">
              <DocumentForward aria-hidden />
              Создать материал
            </Link>
          </Button>
        </div>
      </div>
      {materialsQuery.isPending ? (
        <Card className="shadow-none">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Загружаем материалы…
          </CardContent>
        </Card>
      ) : null}
      {materialsQuery.isError ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <Warning2 className="size-6 text-destructive" aria-hidden />
            <p className="mt-3 text-sm">Не удалось загрузить библиотеку.</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void materialsQuery.refetch()}
            >
              Повторить
            </Button>
          </CardContent>
        </Card>
      ) : null}
      {materialsQuery.data?.items.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <Microphone2 className="size-8 text-muted-foreground" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold">Материалов пока нет</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Создайте набор с тремя частями и опубликуйте его для студентов.
            </p>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-3">
        {materialsQuery.data?.items.map((material) => (
          <Card key={material.id} className="gap-0 py-0 shadow-none">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{material.examType}</Badge>
                  <Badge variant="outline">{material.difficulty}</Badge>
                  <Badge
                    className={
                      material.status === 'PUBLISHED'
                        ? 'bg-success-bg text-success'
                        : 'bg-muted text-muted-foreground'
                    }
                  >
                    {material.status}
                  </Badge>
                  {material.hasUnpublishedChanges ? (
                    <span className="text-xs text-warning-fg">
                      Есть неопубликованные изменения
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 truncate text-base font-semibold">
                  {material.title}
                </h2>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  /{material.slug} · версия {material.currentVersionNumber}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={exportLoadingId === material.id}
                  onClick={() => void handleExport(material.id)}
                >
                  <ExportCurve aria-hidden />
                  {exportLoadingId === material.id ? 'Загрузка…' : 'Экспорт'}
                </Button>
                <Button asChild variant="outline">
                  <Link
                    to="/admin/speaking/materials/$materialId"
                    params={{ materialId: material.id }}
                  >
                    <Edit aria-hidden />
                    Редактировать
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {exportMaterial ? (
        <DataExportDialog
          open={Boolean(exportMaterial)}
          onOpenChange={(open) => !open && setExportMaterial(null)}
          title={exportMaterial.title}
          formatLabel="JSON (IELTS_SPEAKING_IMPORT_V1)"
          filename={`${exportMaterial.slug || 'speaking-material'}.json`}
          content={serializeSpeakingToJSON(exportMaterial)}
        />
      ) : null}
    </div>
  )
}
