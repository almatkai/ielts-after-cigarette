import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n'

import { FreeAllowanceList } from './access-status'
import { openPaywall } from './paywall-store'
import { isOnFreeAllowance, useBillingAccess } from './use-billing'

/** Offer after a result, while the student still sees what to improve. */
export function ReportUpsell() {
  const { t } = useLanguage()
  const access = useBillingAccess()
  if (!isOnFreeAllowance(access.data) || !access.data) return null
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="grid gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          {t('Продолжите подготовку без ограничений')}
        </h2>
        <p className="text-xs leading-5 text-muted-foreground">
          {t('Бесплатных тестов осталось:')}
        </p>
        <FreeAllowanceList access={access.data} className="max-w-xs" />
      </div>
      <Button
        type="button"
        className="shrink-0"
        onClick={() => openPaywall(null)}
      >
        {t('Выбрать тариф')}
      </Button>
    </section>
  )
}
