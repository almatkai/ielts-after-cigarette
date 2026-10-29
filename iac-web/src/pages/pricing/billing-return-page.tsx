import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { formatAccessDate } from '@/features/billing/access-status'
import {
  billingKeys,
  formatTenge,
  getBillingOrder,
} from '@/features/billing/api'
import { billingSupportEmail } from '@/features/billing/plan-picker'
import { useBillingAccess } from '@/features/billing/use-billing'
import { getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'

// The bank confirms payment with a server callback, which can land a little
// after the student is redirected back. Poll for a while before giving up.
const pollMs = 2_000
const pollLimitMs = 2 * 60_000

export function BillingReturnPage({ orderId }: { orderId?: string }) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [startedAt] = useState(() => Date.now())
  const order = useQuery({
    queryKey: billingKeys.order(orderId ?? ''),
    queryFn: ({ signal }) => getBillingOrder(orderId ?? '', signal),
    enabled: Boolean(orderId),
    refetchInterval: (query) =>
      query.state.data?.status === 'PENDING' &&
      Date.now() - startedAt < pollLimitMs
        ? pollMs
        : false,
  })
  const status = order.data?.status
  const access = useBillingAccess()

  useEffect(() => {
    if (status === 'PAID')
      void queryClient.invalidateQueries({ queryKey: billingKeys.all })
  }, [status, queryClient])

  let title: string
  let body: React.ReactNode
  let action: React.ReactNode = null

  if (!orderId) {
    title = 'Заказ не найден'
    body = t('В ссылке нет номера заказа. Откройте тарифы и попробуйте снова.')
    action = <PricingButton />
  } else if (order.isError) {
    title = 'Не удалось проверить оплату'
    body = t(getErrorMessage(order.error))
    action = (
      <Button type="button" onClick={() => void order.refetch()}>
        {t('Проверить ещё раз')}
      </Button>
    )
  } else if (!order.data || status === 'PENDING') {
    const waitedTooLong = Date.now() - startedAt >= pollLimitMs
    title = waitedTooLong ? 'Ждём подтверждение от банка' : 'Проверяем оплату…'
    body = waitedTooLong ? (
      <>
        {t(
          'Банк ещё не подтвердил платёж. Обычно это занимает пару минут. Если доступ не появится в течение 15 минут, напишите нам на',
        )}{' '}
        <a
          href={`mailto:${billingSupportEmail}`}
          className="font-medium text-primary-hover hover:underline"
        >
          {billingSupportEmail}
        </a>{' '}
        {t('и укажите номер заказа:')} {orderId}
      </>
    ) : (
      t('Не закрывайте страницу, это займёт несколько секунд.')
    )
    if (waitedTooLong)
      action = (
        <Button type="button" onClick={() => void order.refetch()}>
          {t('Проверить ещё раз')}
        </Button>
      )
  } else if (status === 'PAID') {
    title = 'Оплата прошла'
    const endsAt = access.data?.queuedUntil ?? access.data?.endsAt
    body = (
      <>
        {t('Списано')} {formatTenge(order.data.amount)}.{' '}
        {endsAt
          ? `${t('Доступ открыт до')} ${formatAccessDate(endsAt)}.`
          : t('Доступ открыт.')}
        {order.data.planCode !== 'self'
          ? ` ${t('Мы свяжемся с вами в WhatsApp, чтобы согласовать расписание встреч.')}`
          : ''}
      </>
    )
    action = (
      <Button asChild>
        <Link to="/practice">{t('Перейти к практике')}</Link>
      </Button>
    )
  } else {
    title = 'Оплата не прошла'
    body = t(
      'Деньги не списаны или будут возвращены банком. Попробуйте ещё раз или выберите другую карту.',
    )
    action = <PricingButton />
  }

  return (
    <section className="mx-auto grid w-full max-w-[520px] gap-3 rounded-[10px] border border-border bg-card p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {t(title)}
      </h1>
      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </section>
  )
}

function PricingButton() {
  const { t } = useLanguage()
  return (
    <Button asChild>
      <Link to="/pricing">{t('К тарифам')}</Link>
    </Button>
  )
}
