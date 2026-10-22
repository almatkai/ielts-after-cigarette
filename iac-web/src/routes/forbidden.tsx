import { ShieldCross } from 'iconsax-react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage, tr } from '@/lib/i18n'

export const Route = createFileRoute('/forbidden')({
  head: () => ({
    meta: [
      { title: tr('Доступ запрещён — Yrys Academy') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ForbiddenPage,
})

function ForbiddenPage() {
  const { t } = useLanguage()
  return (
    <main className="grid min-h-screen place-items-center bg-background p-5">
      <Card className="w-full max-w-md rounded-[10px] border-border shadow-none">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-destructive-soft text-destructive">
            <ShieldCross className="size-6" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-normal">
            {t('Недостаточно прав')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t('Этот раздел доступен редакторам и администраторам платформы.')}
          </p>
          <Button asChild className="mt-6 bg-primary hover:bg-primary-hover">
            <Link to="/">{t('Вернуться в кабинет')}</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
