import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { landingHref } from '@/features/blog/links'
import { ApiError, getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'
import { cn } from '@/lib/utils'

import { createCheckout, formatTenge, planDiscountPercent } from './api'
import type { BillingPlan, PlanCode } from './api'
import { useBillingPlans } from './use-billing'

export const billingSupportEmail = 'kairatovalmat2003@gmail.com'

const planDescriptions: Record<PlanCode, string> = {
  self: 'Все тесты, полные пробные экзамены и AI-разборы.',
  group: 'Платформа и 4 онлайн-занятия с преподавателем в мини-группе.',
  personal:
    'Платформа и 4 индивидуальные встречи с преподавателем по 30 минут.',
}

export function legalHref(slug: 'terms' | 'payment-refund', language: string) {
  return `${landingHref}${language === 'kk' ? 'kk/' : ''}${slug}/`
}

export function PlanPicker({
  initialPlan = 'self',
  className,
}: {
  initialPlan?: PlanCode
  className?: string
}) {
  const { t, language } = useLanguage()
  const plans = useBillingPlans()
  const [selected, setSelected] = useState<PlanCode>(initialPlan)
  const [accepted, setAccepted] = useState(false)

  const checkout = useMutation({
    mutationFn: (code: PlanCode) => createCheckout(code),
    onSuccess: (result) => window.location.assign(result.redirectUrl),
  })

  if (plans.isPending) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('Загружаем тарифы…')}
      </p>
    )
  }
  if (plans.isError) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        <p>{t('Не удалось загрузить тарифы.')}</p>
        <button
          type="button"
          onClick={() => void plans.refetch()}
          className="mt-2 font-semibold text-primary-hover hover:underline"
        >
          {t('Повторить')}
        </button>
      </div>
    )
  }

  const list = plans.data.plans
  if (list.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('Тарифы временно недоступны.')}
      </p>
    )
  }
  const current = list.find((plan) => plan.code === selected) ?? list[0]
  const accessDays = current.accessDays
  const providerMissing =
    checkout.error instanceof ApiError &&
    checkout.error.code === 'PAYMENT_PROVIDER_UNAVAILABLE'

  return (
    <div className={cn('grid gap-4', className)}>
      <fieldset className="grid gap-2">
        <legend className="sr-only">{t('Тариф')}</legend>
        {list.map((plan) => (
          <PlanOption
            key={plan.code}
            plan={plan}
            checked={plan.code === current.code}
            onSelect={() => {
              setSelected(plan.code)
              checkout.reset()
            }}
            description={t(planDescriptions[plan.code])}
          />
        ))}
      </fieldset>

      <p className="text-xs leading-5 text-muted-foreground">
        {t('Доступ на')} {accessDays}{' '}
        {t('календарных дней с момента предоставления доступа.')}{' '}
        {t('Разовая оплата, без автопродления и скрытых комиссий.')}
      </p>

      <label className="flex items-start gap-2.5 text-xs leading-5 text-muted-foreground">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--primary-fill)]"
        />
        <span>
          {t('Я ознакомлен(а) с')}{' '}
          <a
            href={legalHref('terms', language)}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary-hover underline-offset-2 hover:underline"
          >
            {t('публичной офертой')}
          </a>{' '}
          {t('и')}{' '}
          <a
            href={legalHref('payment-refund', language)}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary-hover underline-offset-2 hover:underline"
          >
            {t('условиями оплаты и возврата')}
          </a>
        </span>
      </label>

      {checkout.isError ? (
        <p role="alert" className="text-sm leading-6 text-destructive">
          {providerMissing ? (
            <>
              {t(
                'Онлайн-оплата картой скоро заработает. Чтобы оформить доступ сейчас, напишите нам:',
              )}{' '}
              <a
                href={`mailto:${billingSupportEmail}`}
                className="font-medium underline underline-offset-2"
              >
                {billingSupportEmail}
              </a>
            </>
          ) : (
            t(getErrorMessage(checkout.error))
          )}
        </p>
      ) : null}

      <Button
        type="button"
        size="lg"
        disabled={!accepted || checkout.isPending}
        onClick={() => checkout.mutate(current.code)}
        className="w-full"
      >
        {checkout.isPending
          ? t('Переходим к оплате…')
          : `${t('Оплатить')} ${formatTenge(current.price)}`}
      </Button>
      <p className="text-center text-[11px] leading-4 text-muted-foreground">
        {t('Данные карты вводятся на защищённой странице банка.')}
      </p>
    </div>
  )
}

function PlanOption({
  plan,
  checked,
  onSelect,
  description,
}: {
  plan: BillingPlan
  checked: boolean
  onSelect: () => void
  description: string
}) {
  const { t } = useLanguage()
  const discount = planDiscountPercent(plan)
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-[10px] border p-3.5 transition-colors sm:p-4',
        checked
          ? 'border-primary bg-primary-soft'
          : 'border-border bg-card hover:border-border-strong',
      )}
    >
      <input
        type="radio"
        name="billing-plan"
        value={plan.code}
        checked={checked}
        onChange={onSelect}
        className="mt-1 size-4 shrink-0 accent-[var(--primary-fill)]"
      />
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="text-sm font-semibold text-foreground">
          {t(plan.title)}
        </span>
        <span className="text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-base font-semibold tabular-nums text-foreground sm:text-lg">
          {formatTenge(plan.price)}
        </span>
        {discount > 0 ? (
          <span className="block text-[11px] leading-4 text-muted-foreground">
            <span className="sr-only">{t('официальная цена')}: </span>
            <s className="tabular-nums">{formatTenge(plan.listPrice)}</s>{' '}
            <span className="text-foreground">−{discount}%</span>
          </span>
        ) : null}
      </span>
    </label>
  )
}
