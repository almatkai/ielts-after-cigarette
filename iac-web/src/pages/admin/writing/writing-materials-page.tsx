import {
  DocumentForward,
  DocumentUpload,
  Edit,
  Edit2,
  ExportCurve,
  Warning2,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataExportDialog } from '@/components/admin/data-export-dialog'
import { serializeWritingToJSON } from '@/features/admin/export-utils'
import {
  getWritingMaterial,
  listWritingMaterials,
  writingKeys,
} from '@/features/writing/api'
import type { WritingMaterial } from '@/features/writing/api'

export function WritingMaterialsPage() {
  const [exportMaterial, setExportMaterial] = useState<WritingMaterial | null>(null)
  const [exportLoadingId, setExportLoadingId] = useState<string | null>(null)

  const materialsQuery = useQuery({
    queryKey: writingKeys.adminMaterials,
    queryFn: ({ signal }) => listWritingMaterials(signal),
  })

  const handleExport = async (id: string) => {
    setExportLoadingId(id)
    try {
      const full = await getWritingMaterial(id)
      setExportMaterial(full)
    } catch (err) {
      console.error('Failed to load writing material for export', err)
    } finally {
      setExportLoadingId(null)
    }
  }
  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-[#3b82f6] uppercase">
            Writing
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Библиотека материалов
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#69696d]">
            По два задания: Academic Task 1 с визуалом или General letter, и
            общий Task 2.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline">
            <Link to="/admin/writing/import">
              <DocumentUpload aria-hidden /> Импорт JSON
            </Link>
          </Button>
          <Button asChild className="bg-[#3b82f6] hover:bg-[#2563eb]">
            <Link to="/admin/writing/materials/new">
              <DocumentForward aria-hidden /> Создать вручную
            </Link>
          </Button>
        </div>
      </div>
      {materialsQuery.isPending ? (
        <Card className="shadow-none">
          <CardContent className="p-8 text-center text-sm text-[#69696d]">
            Загружаем материалы…
          </CardContent>
        </Card>
      ) : materialsQuery.isError ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <Warning2 className="size-6 text-[#e23b3b]" aria-hidden />
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
      ) : materialsQuery.data.items.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <Edit2 className="size-8 text-[#9a9a9d]" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold">Материалов пока нет</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#69696d]">
              Создайте первый набор из Task 1 и Task 2, затем опубликуйте его
              для студентов.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {materialsQuery.data.items.map((material) => (
            <Card key={material.id} className="gap-0 py-0 shadow-none">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{material.examType}</Badge>
                    <Badge variant="outline">{material.difficulty}</Badge>
                    <Badge
                      className={
                        material.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-[#f4f4f1] text-[#69696d]'
                      }
                    >
                      {material.status}
                    </Badge>
                    {material.hasUnpublishedChanges ? (
                      <span className="text-xs text-amber-700">
                        Есть неопубликованные изменения
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 truncate text-base font-semibold">
                    {material.title}
                  </h2>
                  <p className="mt-1 truncate text-xs text-[#808084]">
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
                      to="/admin/writing/materials/$materialId"
                      params={{ materialId: material.id }}
                    >
                      <Edit aria-hidden /> Редактировать
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {exportMaterial ? (
        <DataExportDialog
          open={Boolean(exportMaterial)}
          onOpenChange={(open) => !open && setExportMaterial(null)}
          title={exportMaterial.title}
          formatLabel="JSON (writing_import_envelope)"
          filename={`${exportMaterial.slug || 'writing-material'}.json`}
          content={serializeWritingToJSON(exportMaterial)}
        />
      ) : null}
    </div>
  )
}
