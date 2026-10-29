import { Link } from '@tanstack/react-router'

import { useLanguage } from '@/lib/i18n'
import { cn } from '@/lib/utils'

import { billingSkills } from './api'
import type { BillingAccess } from './api'
import { isOnFreeAllowance, useBillingAccess } from './use-billing'

const skillNames = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
} as const

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatAccessDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

/** Days left until the access ends, rounded up; 0 once it has ended. */
export function daysLeft(endsAt: string) {
  const ms = new Date(endsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

export function FreeAllowanceList({
  access,
  className,
}: {
  access: BillingAccess
  className?: string
}) {
  const { t } = useLanguage()
  if (!access.free) return null
  return (
    <dl className={cn('grid grid-cols-2 gap-x-4 gap-y-2', className)}>
      {billingSkills.map((skill) => {
        const item = access.free?.[skill]
        if (!item) return null
        return (
          <div
            key={skill}
            className="flex items-baseline justify-between gap-2"
          >
            <dt className="text-xs text-muted-foreground">
              {skillNames[skill]}
            </dt>
            <dd
              className={cn(
                'text-xs font-semibold tabular-nums',
                item.remaining === 0
                  ? 'text-muted-foreground'
                  : 'text-foreground',
              )}
            >
              {item.remaining} {t('из')} {item.limit}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

/** Plan or free allowance summary for settings and the pricing page. */
export function AccessSummary({ access }: { access: BillingAccess }) {
  const { t } = useLanguage()
  if (access.staff) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        {t('У сотрудников платформы полный доступ без тарифа.')}
      </p>
    )
  }
  if (access.active && access.plan && access.endsAt) {
    const meetingsLeft =
      (access.meetingsTotal ?? 0) - (access.meetingsUsed ?? 0)
    return (
      <div className="grid gap-1.5 text-sm leading-6">
        <p className="font-semibold text-foreground">{t(access.plan.title)}</p>
        <p className="text-muted-foreground">
          {t('Доступ действует до')} {formatAccessDate(access.endsAt)} ·{' '}
          {t('осталось дней:')} {daysLeft(access.endsAt)}
        </p>
        {access.queuedUntil ? (
          <p className="text-muted-foreground">
            {t('Следующий оплаченный период продлит доступ до')}{' '}
            {formatAccessDate(access.queuedUntil)}
          </p>
        ) : null}
        {(access.meetingsTotal ?? 0) > 0 ? (
          <p className="text-muted-foreground">
            {t('Встреч с преподавателем осталось:')} {meetingsLeft} {t('из')}{' '}
            {access.meetingsTotal}
          </p>
        ) : null}
      </div>
    )
  }
  if (!access.paywallEnabled) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        {t('Сейчас все тесты доступны без оплаты.')}
      </p>
    )
  }
  return (
    <div className="grid gap-3">
      <p className="text-sm leading-6 text-muted-foreground">
        {t(
          'Тарифа нет. Бесплатные тесты по навыкам — Full Mock засчитывается как один тест каждого навыка:',
        )}
      </p>
      <FreeAllowanceList access={access} className="max-w-sm" />
    </div>
  )
}

/** Compact sidebar block: days left on a plan or free tests left. */
export function SidebarAccess({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage()
  const query = useBillingAccess()
  const access = query.data
  if (!access?.paywallEnabled || access.guest || access.staff) return null

  if (access.active && access.endsAt) {
    const left = daysLeft(access.endsAt)
    const ending = left <= 3 && !access.queuedUntil
    return (
      <section
        aria-label={t('Тариф')}
        className="mt-5 rounded-[10px] border border-border px-3.5 py-3"
      >
        <p className="text-xs font-semibold text-foreground">
          {access.plan ? t(access.plan.title) : t('Тариф')}
        </p>
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
          {t('Доступ до')} {formatAccessDate(access.endsAt)}
        </p>
        {ending ? (
          <Link
            to="/pricing"
            onClick={onNavigate}
            className="mt-2 inline-block text-xs font-semibold text-primary-hover hover:underline"
          >
            {t('Продлить доступ')}
          </Link>
        ) : null}
      </section>
    )
  }

  if (!isOnFreeAllowance(access)) return null
  return (
    <section
      aria-label={t('Бесплатные тесты')}
      className="mt-5 rounded-[10px] border border-border px-3.5 py-3"
    >
      <p className="text-xs font-semibold text-foreground">
        {t('Бесплатные тесты')}
      </p>
      <FreeAllowanceList access={access} className="mt-2" />
      <Link
        to="/pricing"
        onClick={onNavigate}
        className="mt-3 inline-block text-xs font-semibold text-primary-hover hover:underline"
      >
        {t('Выбрать тариф')}
      </Link>
    </section>
  )
}
