import { Link, createFileRoute } from '@tanstack/react-router'
import { ShieldX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/forbidden')({
  head: () => ({
    meta: [
      { title: 'Доступ запрещён — IAC' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ForbiddenPage,
})

function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f5] p-5">
      <Card className="w-full max-w-md rounded-[16px] border-[#e7e7e4] shadow-none">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#fff0f0] text-[#e23b3b]">
            <ShieldX className="size-6" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
            Недостаточно прав
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#69696d]">
            Этот раздел доступен редакторам и администраторам платформы.
          </p>
          <Button asChild className="mt-6 bg-[#3b82f6] hover:bg-[#2563eb]">
            <Link to="/dashboard">Вернуться в кабинет</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
