import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  BookOpenText,
  FilePlus2,
  PencilLine,
  TriangleAlert,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { adminQueryKeys, listReadingMaterials } from '@/features/admin/api'

const interFont = {
  fontFamily:
    '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
} as const

const badgeClassName =
  'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'

const outlineButtonClassName =
  'rounded-lg border-slate-300 bg-white text-slate-900 shadow-sm hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-100'

const difficultyLabels = {
  foundation: 'Foundation',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const

export function ReadingMaterialsPage() {
  const materialsQuery = useQuery({
    queryKey: adminQueryKeys.readingMaterials,
    queryFn: ({ signal }) => listReadingMaterials(signal),
  })

  return (
    <div style={interFont} className="grid gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500 dark:text-blue-400">
            Reading
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Библиотека материалов
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Тексты, на основе которых будут собираться задания.
          </p>
        </div>
        <Button
          asChild
          className="rounded-lg bg-blue-500 font-bold text-white shadow-sm hover:bg-blue-600"
        >
          <Link to="/admin/reading/materials/new">
            <FilePlus2 aria-hidden />
            Новый материал
          </Link>
        </Button>
      </div>

      {materialsQuery.isPending ? (
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Загружаем материалы…
          </CardContent>
        </Card>
      ) : materialsQuery.isError ? (
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <TriangleAlert
              className="size-6 text-red-500 dark:text-red-400"
              aria-hidden
            />
            <p className="mt-3 text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Не удалось загрузить библиотеку.
            </p>
            <Button
              type="button"
              variant="outline"
              className={`mt-4 ${outlineButtonClassName}`}
              onClick={() => void materialsQuery.refetch()}
            >
              Повторить
            </Button>
          </CardContent>
        </Card>
      ) : materialsQuery.data.items.length === 0 ? (
        <Card className="rounded-xl border-dashed border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <BookOpenText
              className="size-8 text-slate-400 dark:text-slate-500"
              aria-hidden
            />
            <h2 className="mt-4 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Материалов пока нет
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Создайте первый passage. После него добавим группы вопросов и
              preview студенческого режима.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {materialsQuery.data.items.map((material) => (
            <Card
              key={material.id}
              className="gap-0 rounded-xl border-slate-200 bg-white py-0 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={badgeClassName}>
                      {material.examType}
                    </Badge>
                    <Badge variant="outline" className={badgeClassName}>
                      {difficultyLabels[material.difficulty]}
                    </Badge>
                    <Badge
                      className={
                        material.status === 'PUBLISHED'
                          ? 'border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'border-transparent bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }
                    >
                      {material.status}
                    </Badge>
                    {material.hasUnpublishedChanges ? (
                      <span className="text-xs text-amber-700 dark:text-amber-400">
                        Есть неопубликованные изменения
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 truncate text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {material.title}
                  </h2>
                  <p className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">
                    /{material.slug} · версия {material.currentVersionNumber}
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className={outlineButtonClassName}
                >
                  <Link
                    to="/admin/reading/materials/$materialId"
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
      )}
    </div>
  )
}
