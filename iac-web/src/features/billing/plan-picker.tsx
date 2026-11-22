import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { CloseCircle, TicketDiscount } from 'iconsax-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { landingHref } from '@/features/blog/links'
import { ApiError, getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'
import { cn } from '@/lib/utils'

import {
  createCheckout,
  formatTenge,
  planDiscountPercent,
  validatePromocode,
} from './api'
import type { BillingPlan, PlanCode, PromocodeValidation } from './api'
import { useBillingPlans } from './use-billing'

export const billingSupportEmail = 'kairatovalmat2003@gmail.com'

const planDescriptions: Record<string, string> = {
  month_1: '30 дней полного доступа: все тесты, пробные экзамены и AI-разборы.',
  month_2: '60 дней доступа. Оптимальный срок для спокойной подготовки.',
  month_6: '180 дней доступа. Полный курс от текущего уровня до целевого балла.',
  year_1: '365 дней доступа. Максимальная выгода для долгосрочной подготовки.',
  self: 'Все тесты, полные пробные экзамены и AI-разборы.',
  group: 'Платформа и 4 онлайн-занятия с преподавателем в мини-группе.',
  personal:
    'Платформа и 4 индивидуальные встречи с преподавателем по 30 минут.',
}

export function legalHref(slug: 'terms' | 'payment-refund', language: string) {
  return `${landingHref}${language === 'kk' ? 'kk/' : ''}${slug}/`
}

export function PlanPicker({
  initialPlan = 'month_1',
  className,
}: {
  initialPlan?: PlanCode
  className?: string
}) {
  const { t, language } = useLanguage()
  const plans = useBillingPlans()
  const [selected, setSelected] = useState<PlanCode>(initialPlan)
  const [accepted, setAccepted] = useState(false)
  const [promocodeInput, setPromocodeInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<PromocodeValidation | null>(
    null,
  )
  const [promoError, setPromoError] = useState<string | null>(null)

  const validateMutation = useMutation({
    mutationFn: ({ code, planCode }: { code: string; planCode: PlanCode }) =>
      validatePromocode(code, planCode),
    onSuccess: (data) => {
      setAppliedPromo(data)
      setPromoError(null)
    },
    onError: (err) => {
      setAppliedPromo(null)
      setPromoError(getErrorMessage(err))
    },
  })

  const checkout = useMutation({
    mutationFn: ({
      code,
      promocode,
    }: {
      code: PlanCode
      promocode?: string
    }) => createCheckout(code, promocode),
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

  const finalPrice = appliedPromo ? appliedPromo.finalPrice : current.price
  const isFree = Boolean(appliedPromo?.isFree || finalPrice === 0)

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = promocodeInput.trim()
    if (!clean) return
    setPromoError(null)
    validateMutation.mutate({ code: clean, planCode: current.code })
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromocodeInput('')
    setPromoError(null)
  }

  const handlePlanSelect = (code: PlanCode) => {
    setSelected(code)
    checkout.reset()
    if (appliedPromo) {
      validateMutation.mutate({ code: appliedPromo.code, planCode: code })
    }
  }

  return (
    <div className={cn('grid gap-4', className)}>
      <fieldset className="grid gap-2">
        <legend className="sr-only">{t('Тариф')}</legend>
        {list.map((plan) => (
          <PlanOption
            key={plan.code}
            plan={plan}
            checked={plan.code === current.code}
            onSelect={() => handlePlanSelect(plan.code)}
            description={t(
              planDescriptions[plan.code] ??
                'Все тесты, полные пробные экзамены и AI-разборы.',
            )}
          />
        ))}
      </fieldset>

      {/* Promocode input & status */}
      <div className="rounded-[10px] border border-border bg-card/60 p-3">
        {appliedPromo ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <TicketDiscount size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold tracking-wide text-foreground">
                    {appliedPromo.code}
                  </span>
                  <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                    {appliedPromo.isFree
                      ? t('100% скидка')
                      : appliedPromo.discountType === 'PERCENT'
                        ? `−${appliedPromo.discountValue}%`
                        : `−${formatTenge(appliedPromo.discountAmount)}`}
                  </span>
                </div>
                <p className="truncate text-[11px] text-muted-foreground">
                  {appliedPromo.isFree
                    ? t('Полный бесплатный доступ без оплаты')
                    : `${t('Скидка')} ${formatTenge(appliedPromo.discountAmount)}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemovePromo}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title={t('Отменить промокод')}
            >
              <CloseCircle size={18} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyPromo} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder={t('Промокод')}
                value={promocodeInput}
                onChange={(e) =>
                  setPromocodeInput(e.target.value.toUpperCase())
                }
                className="h-8 font-mono text-xs uppercase tracking-wider"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={!promocodeInput.trim() || validateMutation.isPending}
              className="h-8 shrink-0 text-xs"
            >
              {validateMutation.isPending ? t('Проверка…') : t('Применить')}
            </Button>
          </form>
        )}

        {promoError && (
          <p className="mt-1.5 text-xs text-destructive">{t(promoError)}</p>
        )}
      </div>

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
        onClick={() =>
          checkout.mutate({
            code: current.code,
            promocode: appliedPromo?.code,
          })
        }
        className="w-full"
      >
        {checkout.isPending
          ? t('Оформляем…')
          : isFree
            ? t('Получить доступ бесплатно')
            : `${t('Оплатить')} ${formatTenge(finalPrice)}`}
      </Button>
      <p className="text-center text-[11px] leading-4 text-muted-foreground">
        {isFree
          ? t('Доступ будет предоставлен моментально без перехода к оплате.')
          : t('Данные карты вводятся на защищённой странице банка.')}
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
