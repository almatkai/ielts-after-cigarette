import { Link } from '@tanstack/react-router'
import { ArrowRight, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const interFont = {
  fontFamily:
    '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
} as const

const cardClassName =
  'gap-0 rounded-xl border-slate-200 bg-white py-0 shadow-sm dark:border-slate-800 dark:bg-slate-900'

export function MistakesPage() {
  return (
    <div
      style={interFont}
      className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5"
    >
      <header className="max-w-[720px] pt-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500 dark:text-blue-400">
          Ошибки
        </p>
        <h1 className="mt-3 text-[2.1rem] leading-[1.08] font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
          Разберите ошибки до экзамена
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg dark:text-slate-400">
          Задания, где вы ошиблись, собираются здесь — вернитесь к каждому и
          закрепите материал перед экзаменом.
        </p>
      </header>

      <Card className={cardClassName}>
        <CardContent className="flex flex-col items-center px-5 py-12 text-center sm:px-8 sm:py-16">
          <span className="grid size-14 place-items-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
            <TriangleAlert className="size-6" strokeWidth={1.8} aria-hidden />
          </span>
          <h2 className="mt-5 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Ошибок пока нет
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Задания, где вы ошиблись, появятся здесь — разберите каждое и не
            повторяйте на экзамене.
          </p>
          <Button
            asChild
            className="mt-6 h-11 rounded-lg bg-blue-500 px-6 font-bold text-white shadow-sm hover:bg-blue-600"
          >
            <Link to="/dashboard/practice">
              Перейти к практике
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
