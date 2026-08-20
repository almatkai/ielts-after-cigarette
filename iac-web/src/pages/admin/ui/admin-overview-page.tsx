import { useQuery } from '@tanstack/react-query'
import { BookOpenText, CheckCircle2, Database, ShieldCheck } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminQueryKeys, getAdminAccess } from '@/features/admin/api'

const interFont = {
  fontFamily:
    '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
} as const

const cardClassName =
  'gap-0 rounded-xl border-slate-200 bg-white py-0 shadow-sm dark:border-slate-800 dark:bg-slate-900'

const cardTitleClassName =
  'text-base font-bold tracking-tight text-slate-900 dark:text-slate-100'

const milestones = [
  'Роли STUDENT, EDITOR и ADMIN',
  'Защита admin API на backend',
  'Проверка роли до отрисовки маршрута',
] as const

export function AdminOverviewPage() {
  const accessQuery = useQuery({
    queryKey: adminQueryKeys.access,
    queryFn: ({ signal }) => getAdminAccess(signal),
  })

  return (
    <div style={interFont} className="grid gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500 dark:text-blue-400">
          Администрирование
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Основа для управления контентом
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Ролевой доступ готовит безопасный контур, внутри которого появятся
          библиотека материалов и конструктор Reading.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={cardClassName}>
          <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
                <ShieldCheck
                  className="size-[18px]"
                  strokeWidth={1.8}
                  aria-hidden
                />
              </span>
              <CardTitle className={cardTitleClassName}>
                Проверка доступа
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {accessQuery.isPending ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Проверяем backend…
              </p>
            ) : accessQuery.isError ? (
              <p className="text-sm text-red-500 dark:text-red-400">
                Backend не подтвердил административный доступ.
              </p>
            ) : (
              <div className="flex items-center gap-3 text-sm text-slate-900 dark:text-slate-100">
                <CheckCircle2
                  className="size-5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                <span>
                  Доступ подтверждён сервером: <b>{accessQuery.data.role}</b>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={cardClassName}>
          <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <BookOpenText
                  className="size-[18px]"
                  strokeWidth={1.8}
                  aria-hidden
                />
              </span>
              <CardTitle className={cardTitleClassName}>
                Далее: Reading
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Следующий слой — миграции материалов, версии черновиков и первый
            конструктор True / False / Not Given.
          </CardContent>
        </Card>
      </div>

      <Card className={cardClassName}>
        <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Database
              className="size-5 text-slate-500 dark:text-slate-400"
              aria-hidden
            />
            <CardTitle className={cardTitleClassName}>
              Готово на этом этапе
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <ul className="grid gap-3">
            {milestones.map((milestone) => (
              <li
                key={milestone}
                className="flex items-center gap-3 text-sm text-slate-900 dark:text-slate-100"
              >
                <CheckCircle2
                  className="size-4 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                {milestone}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
