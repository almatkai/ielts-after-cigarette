import { Link } from '@tanstack/react-router'

import { useLanguage } from '@/lib/i18n'

import type { PaywallReason } from './api'
import { RemainingFreeTests, paywallCopy } from './paywall-dialog'
import { PlanPicker } from './plan-picker'

/** Shown instead of an exam when the start request needs a paid plan. */
export function PaywallScreen({ reason }: { reason: PaywallReason }) {
  const { t } = useLanguage()
  const copy = paywallCopy(reason)
  return (
    <div className="flex min-h-dvh w-full items-start justify-center px-4 py-10 sm:items-center sm:py-16">
      <section className="grid w-full max-w-[520px] gap-4 rounded-[10px] border border-border bg-card p-5 sm:p-7">
        <header className="grid gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t(copy.title)}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {t(copy.description)}
          </p>
        </header>
        <RemainingFreeTests reason={reason} />
        <PlanPicker />
        <Link
          to="/practice"
          className="justify-self-center text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
        >
          {t('Вернуться к практике')}
        </Link>
      </section>
    </div>
  )
}
