import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  adminBillingKey,
  getAdminUserBilling,
  grantEntitlement,
  revokeEntitlement,
  setMeetingsUsed,
} from '@/features/admin/billing-api'
import type { AdminEntitlement } from '@/features/admin/billing-api'
import { AccessSummary } from '@/features/billing/access-status'
import { formatTenge } from '@/features/billing/api'
import type { PlanCode } from '@/features/billing/api'
import { useBillingPlans } from '@/features/billing/use-billing'
import { getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'

import { date } from './shared'

const sourceText = {
  PAYMENT: 'Оплата',
  ADMIN: 'Выдан вручную',
  BONUS: 'Бонус',
} as const

const orderStatusText = {
  PENDING: 'Ожидает оплаты',
  PAID: 'Оплачен',
  FAILED: 'Ошибка оплаты',
  CANCELLED: 'Отменён',
  REFUNDED: 'Возврат',
} as const

export function UserBilling({ userId }: { userId: string }) {
  const { t } = useLanguage()
  const query = useQuery({
    queryKey: adminBillingKey(userId),
    queryFn: ({ signal }) => getAdminUserBilling(userId, signal),
  })
  if (query.isPending)
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {t('Загрузка…')}
      </p>
    )
  if (query.isError)
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm">
        <p className="text-destructive">{t(getErrorMessage(query.error))}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-3 border-border"
          onClick={() => void query.refetch()}
        >
          {t('Повторить')}
        </Button>
      </div>
    )
  const { access, entitlements, orders } = query.data
  return (
    <div className="grid gap-5">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">{t('Текущий доступ')}</h2>
        <AccessSummary access={access} />
      </section>

      <GrantForm userId={userId} />

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">{t('Периоды доступа')}</h2>
        {entitlements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('Доступ ещё не выдавался.')}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {entitlements.map((item) => (
              <EntitlementRow key={item.id} userId={userId} item={item} />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">{t('Заказы')}</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('Заказов нет.')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-medium">{t('Дата')}</th>
                  <th className="py-2 pr-4 font-medium">{t('Тариф')}</th>
                  <th className="py-2 pr-4 font-medium">{t('Сумма')}</th>
                  <th className="py-2 pr-4 font-medium">{t('Статус')}</th>
                  <th className="py-2 font-medium">{t('Номер в банке')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {date(order.createdAt, true)}
                    </td>
                    <td className="py-2 pr-4">{order.planCode}</td>
                    <td className="py-2 pr-4 tabular-nums whitespace-nowrap">
                      {formatTenge(order.amount)}
                    </td>
                    <td className="py-2 pr-4">
                      {t(orderStatusText[order.status])}
                    </td>
                    <td className="py-2 font-mono text-xs break-all text-muted-foreground">
                      {order.providerOrderId ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function GrantForm({ userId }: { userId: string }) {
  const { t } = useLanguage()
  const client = useQueryClient()
  const plans = useBillingPlans()
  const [planCode, setPlanCode] = useState<PlanCode>('self')
  const [days, setDays] = useState('')
  const [source, setSource] = useState<'ADMIN' | 'BONUS'>('ADMIN')
  const [note, setNote] = useState('')
  const grant = useMutation({
    mutationFn: () =>
      grantEntitlement(userId, {
        planCode,
        days: days ? Number(days) : undefined,
        source,
        note: note.trim(),
      }),
    onSuccess: async () => {
      setDays('')
      setNote('')
      await client.invalidateQueries({ queryKey: adminBillingKey(userId) })
    },
  })
  return (
    <form
      className="grid gap-4 rounded-xl border border-border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault()
        grant.mutate()
      }}
    >
      <div>
        <h2 className="text-sm font-semibold">{t('Выдать доступ')}</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {t(
            'Для оплаты по счёту, компенсаций и бонусов. Если доступ уже активен, новый период начнётся после текущего.',
          )}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="grantPlan" className="text-xs text-muted-foreground">
            {t('Тариф')}
          </Label>
          <select
            id="grantPlan"
            value={planCode}
            onChange={(e) => setPlanCode(e.target.value as PlanCode)}
            className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
          >
            {(plans.data?.plans ?? []).map((plan) => (
              <option key={plan.code} value={plan.code}>
                {t(plan.title)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="grantDays" className="text-xs text-muted-foreground">
            {t('Дней (по умолчанию — срок тарифа)')}
          </Label>
          <Input
            id="grantDays"
            type="number"
            min={1}
            max={366}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label
            htmlFor="grantSource"
            className="text-xs text-muted-foreground"
          >
            {t('Основание')}
          </Label>
          <select
            id="grantSource"
            value={source}
            onChange={(e) => setSource(e.target.value as 'ADMIN' | 'BONUS')}
            className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
          >
            <option value="ADMIN">{t('Выдан вручную')}</option>
            <option value="BONUS">{t('Бонус')}</option>
          </select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="grantNote" className="text-xs text-muted-foreground">
          {t('Комментарий (например, номер счёта)')}
        </Label>
        <Input
          id="grantNote"
          required
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {grant.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t(getErrorMessage(grant.error))}
        </p>
      ) : null}
      <Button
        type="submit"
        className="justify-self-start"
        disabled={grant.isPending || !note.trim()}
      >
        {grant.isPending ? t('Подождите…') : t('Выдать доступ')}
      </Button>
    </form>
  )
}

function EntitlementRow({
  userId,
  item,
}: {
  userId: string
  item: AdminEntitlement
}) {
  const { t } = useLanguage()
  const client = useQueryClient()
  const refresh = () =>
    client.invalidateQueries({ queryKey: adminBillingKey(userId) })
  const revoke = useMutation({
    mutationFn: (note: string) => revokeEntitlement(item.id, note),
    onSuccess: refresh,
  })
  const meetings = useMutation({
    mutationFn: (used: number) => setMeetingsUsed(item.id, used),
    onSuccess: refresh,
  })
  const ended = new Date(item.endsAt).getTime() <= Date.now()
  const error = revoke.error ?? meetings.error
  return (
    <li className="grid gap-2 py-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">
          {item.planCode} · {date(item.startsAt)} — {date(item.endsAt)}
        </span>
        <span className="text-xs text-muted-foreground">
          {t(sourceText[item.source])}
          {item.revokedAt
            ? ` · ${t('отозван')} ${date(item.revokedAt)}`
            : ended
              ? ` · ${t('истёк')}`
              : ''}
        </span>
      </div>
      {item.note ? (
        <p className="text-xs text-muted-foreground">{item.note}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        {item.meetingsTotal > 0 && !item.revokedAt ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              {t('Проведено встреч:')}
            </span>
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="border-border"
              disabled={meetings.isPending || item.meetingsUsed <= 0}
              onClick={() => meetings.mutate(item.meetingsUsed - 1)}
              aria-label={t('Уменьшить')}
            >
              −
            </Button>
            <span className="tabular-nums">
              {item.meetingsUsed} / {item.meetingsTotal}
            </span>
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="border-border"
              disabled={
                meetings.isPending || item.meetingsUsed >= item.meetingsTotal
              }
              onClick={() => meetings.mutate(item.meetingsUsed + 1)}
              aria-label={t('Увеличить')}
            >
              +
            </Button>
          </div>
        ) : null}
        {!item.revokedAt && !ended ? (
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className="text-destructive"
            disabled={revoke.isPending}
            onClick={() => {
              const note = window.prompt(
                t('Причина отзыва (например, возврат по заявлению):'),
              )
              if (note?.trim()) revoke.mutate(note.trim())
            }}
          >
            {t('Отозвать доступ')}
          </Button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {t(getErrorMessage(error))}
        </p>
      ) : null}
    </li>
  )
}
