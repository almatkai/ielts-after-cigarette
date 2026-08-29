import { Link } from '@tanstack/react-router'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'

import { Brand } from '@/components/landing/brand'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#fafaf8] text-[#111111]">
      <header className="container-shell flex h-20 items-center">
        <Brand />
      </header>

      <main className="container-shell grid min-h-[calc(100vh-80px)] items-center gap-8 py-10 lg:grid-cols-12 lg:gap-14 lg:py-14">
        <div className="relative z-10 lg:col-span-6">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#3b82f6] uppercase">
            Ошибка 404
          </p>
          <h1 className="mt-5 max-w-[650px] text-[clamp(3.25rem,7vw,6.8rem)] leading-[0.92] font-medium tracking-[-0.07em] text-balance">
            Кажется, эта страница потерялась.
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#69696d] sm:text-lg sm:leading-8">
            Здесь ничего нет. Вернитесь на главную или продолжите подготовку в
            личном кабинете.
          </p>

          <div className="mt-9 flex flex-col gap-3 min-[430px]:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-[10px] bg-[#3b82f6] px-5 text-sm font-semibold text-white hover:bg-[#2563eb]"
            >
              <Link to="/">
                <ArrowLeft aria-hidden />
                На главную
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-[10px] border-[#dededb] bg-white px-5 text-sm font-semibold hover:bg-[#f4f4f1]"
            >
              <Link to="/dashboard">
                <LayoutDashboard aria-hidden />В личный кабинет
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[580px] items-center justify-center lg:col-span-6">
          <div
            className="pointer-events-none absolute size-[78%] rounded-full border border-[#e7e7e4]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute size-[58%] rounded-full border border-[#f2dcdc]"
            aria-hidden
          />
          <img
            src={`${import.meta.env.BASE_URL}fox_404_transparent.png`}
            alt="Растерянная красная лиса"
            width={1600}
            height={1600}
            className="relative z-10 h-auto w-full max-w-[520px] object-contain"
          />
        </div>
      </main>
    </div>
  )
}
