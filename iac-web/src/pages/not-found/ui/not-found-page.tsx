import { ArrowLeft, Category } from 'iconsax-react'
import { Link } from '@tanstack/react-router'

import { BrandLogo } from '@/components/landing/brand'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="container-shell flex h-20 items-center">
        <BrandLogo />
      </header>

      <main className="container-shell grid min-h-[calc(100vh-80px)] items-center gap-8 py-10 lg:grid-cols-12 lg:gap-14 lg:py-14">
        <div className="relative z-10 lg:col-span-6">
          <p className="text-xs font-semibold text-primary normal-case">
            Ошибка 404
          </p>
          <h1 className="text-[28px] sm:text-[36px] mt-5 max-w-[650px] leading-tight font-semibold text-balance">
            Кажется, эта страница потерялась.
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Здесь ничего нет. Вернитесь на главную или продолжите подготовку в
            личном кабинете.
          </p>

          <div className="mt-9 flex flex-col gap-3 min-[430px]:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-[10px] bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
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
              className="h-12 rounded-[10px] border-border bg-card px-5 text-sm font-semibold hover:bg-muted"
            >
              <Link to="/">
                <Category aria-hidden />В личный кабинет
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[580px] items-center justify-center lg:col-span-6">
          <BrandLogo variant="stacked" className="h-[120px]" />
        </div>
      </main>
    </div>
  )
}
