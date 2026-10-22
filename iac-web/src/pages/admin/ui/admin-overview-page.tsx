import { Book, Data, ShieldTick, TickCircle } from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminQueryKeys, getAdminAccess } from '@/features/admin/api'

const milestones = [
  'Доступ к блогу отдельно от тестов',
  'Права проверяются на сервере',
  'Публикация материалов доступна редакторам тестов',
] as const

export function AdminOverviewPage() {
  const accessQuery = useQuery({
    queryKey: adminQueryKeys.access,
    queryFn: ({ signal }) => getAdminAccess(signal),
  })

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold text-primary normal-case">
          Администрирование
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          Рабочее пространство
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Материалы, статьи и пользователи доступны по выданным правам.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="gap-0 rounded-[10px] border-border py-0 shadow-none">
          <CardHeader className="border-b border-border p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-[9px] bg-primary-soft text-primary">
                <ShieldTick className="size-[18px]" aria-hidden />
              </span>
              <CardTitle className="text-base">Проверка доступа</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {accessQuery.isPending ? (
              <p className="text-sm text-muted-foreground">
                Проверяем backend…
              </p>
            ) : accessQuery.isError ? (
              <p className="text-sm text-destructive">
                Backend не подтвердил административный доступ.
              </p>
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <TickCircle className="size-5 text-success" aria-hidden />
                <span>
                  Доступ подтверждён сервером: <b>{accessQuery.data.role}</b>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-[10px] border-border py-0 shadow-none">
          <CardHeader className="border-b border-border p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-[9px] bg-muted text-muted-foreground">
                <Book className="size-[18px]" aria-hidden />
              </span>
              <CardTitle className="text-base">Раздельные доступы</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 text-sm leading-6 text-muted-foreground">
            Редактор тестов работает с учебными материалами. Модератор блога — с
            авторами и статьями.
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 rounded-[10px] border-border py-0 shadow-none">
        <CardHeader className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <Data className="size-5 text-muted-foreground" aria-hidden />
            <CardTitle className="text-base">Готово на этом этапе</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <ul className="grid gap-3">
            {milestones.map((milestone) => (
              <li key={milestone} className="flex items-center gap-3 text-sm">
                <TickCircle className="size-4 text-success" aria-hidden />
                {milestone}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
