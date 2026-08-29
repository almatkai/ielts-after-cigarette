import { useQuery } from '@tanstack/react-query'
import { BookOpenText, CheckCircle2, Database, ShieldCheck } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminQueryKeys, getAdminAccess } from '@/features/admin/api'

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
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.08em] text-[#3b82f6] uppercase">
          Администрирование
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Основа для управления контентом
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#69696d]">
          Ролевой доступ готовит безопасный контур, внутри которого появятся
          библиотека материалов и конструктор Reading.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none">
          <CardHeader className="border-b border-[#ededeb] p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-[9px] bg-[#eff6ff] text-[#3b82f6]">
                <ShieldCheck className="size-[18px]" aria-hidden />
              </span>
              <CardTitle className="text-base">Проверка доступа</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {accessQuery.isPending ? (
              <p className="text-sm text-[#69696d]">Проверяем backend…</p>
            ) : accessQuery.isError ? (
              <p className="text-sm text-[#c92f2f]">
                Backend не подтвердил административный доступ.
              </p>
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
                <span>
                  Доступ подтверждён сервером: <b>{accessQuery.data.role}</b>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none">
          <CardHeader className="border-b border-[#ededeb] p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-[9px] bg-[#f4f4f1] text-[#69696d]">
                <BookOpenText className="size-[18px]" aria-hidden />
              </span>
              <CardTitle className="text-base">Далее: Reading</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 text-sm leading-6 text-[#69696d]">
            Следующий слой — миграции материалов, версии черновиков и первый
            конструктор True / False / Not Given.
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none">
        <CardHeader className="border-b border-[#ededeb] p-5">
          <div className="flex items-center gap-3">
            <Database className="size-5 text-[#69696d]" aria-hidden />
            <CardTitle className="text-base">Готово на этом этапе</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <ul className="grid gap-3">
            {milestones.map((milestone) => (
              <li key={milestone} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                {milestone}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
