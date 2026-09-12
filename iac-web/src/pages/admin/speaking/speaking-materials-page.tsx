import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FilePlus2, MicVocal, PencilLine, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { listSpeakingMaterials, speakingKeys } from '@/features/speaking/api'

export function SpeakingMaterialsPage() {
  const materialsQuery = useQuery({
    queryKey: speakingKeys.adminMaterials,
    queryFn: ({ signal }) => listSpeakingMaterials(signal),
  })
  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-[#3b82f6] uppercase">
            Speaking
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Банк материалов
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#69696d]">
            Три части IELTS Speaking: вопросы Parts 1 и 3, cue-card для Part 2.
          </p>
        </div>
        <Button asChild className="bg-[#3b82f6] hover:bg-[#2563eb]">
          <Link to="/admin/speaking/materials/new">
            <FilePlus2 aria-hidden />
            Создать материал
          </Link>
        </Button>
      </div>
      {materialsQuery.isPending ? (
        <Card className="shadow-none">
          <CardContent className="p-8 text-center text-sm text-[#69696d]">
            Загружаем материалы…
          </CardContent>
        </Card>
      ) : null}
      {materialsQuery.isError ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <TriangleAlert className="size-6 text-[#e23b3b]" aria-hidden />
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
            <MicVocal className="size-8 text-[#9a9a9d]" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold">Материалов пока нет</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#69696d]">
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
              <Button asChild variant="outline">
                <Link
                  to="/admin/speaking/materials/$materialId"
                  params={{ materialId: material.id }}
                >
                  <PencilLine aria-hidden />
                  Редактировать
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
