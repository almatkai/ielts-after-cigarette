import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-store'
import { AccessSummary } from '@/features/billing/access-status'
import { formatTenge, planDiscountPercent } from '@/features/billing/api'
import {
  PlanPicker,
  billingSupportEmail,
  legalHref,
} from '@/features/billing/plan-picker'
import {
  useBillingAccess,
  useBillingPlans,
} from '@/features/billing/use-billing'
import { useLanguage } from '@/lib/i18n'

const included = [
  'Listening, Reading, Writing и Speaking без ограничений по количеству тестов',
  'Полные пробные экзамены с итоговым Band Score',
  'AI-оценка Writing и Speaking по критериям IELTS',
  'Разбор ошибок и история попыток',
]

export function PricingPage() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const access = useBillingAccess()

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[960px] gap-6">
      <header>
        <h1 className="text-[28px] font-semibold tracking-normal text-foreground sm:text-[36px]">
          {t('Тарифы')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t(
            'Оплата разовая, доступ на 30 дней. Тарифы со встречами добавляют занятия с преподавателем.',
          )}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section
          aria-label={t('Выбор тарифа')}
          className="rounded-[10px] border border-border bg-card p-5 sm:p-7"
        >
          {user && access.data?.active ? (
            <p className="mb-4 text-sm leading-6 text-muted-foreground">
              {t(
                'Новая оплата продлит доступ: следующий период начнётся после окончания текущего.',
              )}
            </p>
          ) : null}
          {user ? <PlanPicker /> : <GuestPlans />}
        </section>

        <aside className="grid gap-4">
          {user && access.data ? (
            <section className="rounded-[10px] border border-border bg-card p-5">
              <h2 className="mb-2 text-sm font-semibold text-foreground">
                {t('Ваш доступ')}
              </h2>
              <AccessSummary access={access.data} />
            </section>
          ) : null}

          <section className="rounded-[10px] border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">
              {t('Что входит в каждый тариф')}
            </h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
              {included.map((item) => (
                <li key={item}>{t(item)}</li>
              ))}
            </ul>
          </section>

          <section className="grid gap-2 px-1 text-xs leading-5 text-muted-foreground">
            <p>
              {t(
                'Если передумаете, вернём деньги за неиспользованные дни доступа.',
              )}{' '}
              <a
                href={legalHref('payment-refund', language)}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary-hover hover:underline"
              >
                {t('Оплата и возврат')}
              </a>
            </p>
            <p>
              {t('Для школ и учебных центров — отдельные условия. Пишите:')}{' '}
              <a
                href={`mailto:${billingSupportEmail}`}
                className="font-medium text-primary-hover hover:underline"
              >
                {billingSupportEmail}
              </a>
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}

/** Read-only plan list: paying needs an account the access is tied to. */
function GuestPlans() {
  const { t } = useLanguage()
  const plans = useBillingPlans()
  return (
    <div className="grid gap-4">
      {plans.data ? (
        <ul className="divide-y divide-border">
          {plans.data.plans.map((plan) => {
            const discount = planDiscountPercent(plan)
            return (
              <li
                key={plan.code}
                className="flex items-baseline justify-between gap-4 py-3"
              >
                <span className="text-sm font-semibold text-foreground">
                  {t(plan.title)}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-semibold tabular-nums">
                    {formatTenge(plan.price)}
                  </span>
                  {discount > 0 ? (
                    <span className="block text-[11px] text-muted-foreground">
                      <s className="tabular-nums">
                        {formatTenge(plan.listPrice)}
                      </s>{' '}
                      <span className="text-foreground">−{discount}%</span>
                    </span>
                  ) : null}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          {plans.isError
            ? t('Не удалось загрузить тарифы.')
            : t('Загружаем тарифы…')}
        </p>
      )}
      <p className="text-sm leading-6 text-muted-foreground">
        {t(
          'Доступ привязывается к аккаунту. Войдите, чтобы выбрать тариф и оплатить. После регистрации доступно по 3 бесплатных теста каждого навыка.',
        )}
      </p>
      <Button asChild className="w-full sm:w-fit">
        <Link to="/login">{t('Войти в аккаунт')}</Link>
      </Button>
    </div>
  )
}
