import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TicketDiscount } from 'iconsax-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createAdminPromocode,
} from '@/features/admin/billing-api'
import type { CreatePromocodeInput } from '@/features/admin/billing-api'
import type { PlanCode } from '@/features/billing/api'
import { getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function CreatePromocodeDialog({
  open,
  onOpenChange,
  partnerUserId,
  partnerName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  partnerUserId?: string | null
  partnerName?: string | null
}) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'FREE' | 'PERCENT' | 'FIXED'>('FREE')
  const [discountValue, setDiscountValue] = useState<number>(100)
  const [planCode, setPlanCode] = useState<string>('all')
  const [minPriceKzt, setMinPriceKzt] = useState<string>('')
  const [allowOnSale, setAllowOnSale] = useState(true)
  const [maxUses, setMaxUses] = useState<string>('')
  const [maxUsesPerUser, setMaxUsesPerUser] = useState<string>('1')
  const [startsAt, setStartsAt] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setCode('')
    setDiscountType('FREE')
    setDiscountValue(100)
    setPlanCode('all')
    setMinPriceKzt('')
    setAllowOnSale(true)
    setMaxUses('')
    setMaxUsesPerUser('1')
    setStartsAt('')
    setExpiresAt('')
    setNote('')
    setError(null)
  }

  const createMutation = useMutation({
    mutationFn: (input: CreatePromocodeInput) => createAdminPromocode(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'billing', 'promocodes'],
      })
      resetForm()
      onOpenChange(false)
    },
    onError: (err) => {
      setError(getErrorMessage(err))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) {
      setError(t('Укажите код промокода'))
      return
    }

    const payload: CreatePromocodeInput = {
      code: cleanCode,
      discountType,
      discountValue:
        discountType === 'FREE'
          ? 100
          : Number(discountValue) || (discountType === 'PERCENT' ? 10 : 1000),
      planCode: planCode === 'all' ? null : (planCode as PlanCode),
      minPriceKzt: minPriceKzt ? Math.max(0, parseInt(minPriceKzt, 10)) : null,
      allowOnSale,
      maxUses: maxUses ? Math.max(1, parseInt(maxUses, 10)) : null,
      maxUsesPerUser: maxUsesPerUser ? Math.max(1, parseInt(maxUsesPerUser, 10)) : 1,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      partnerUserId: partnerUserId ?? null,
      note: note.trim(),
    }

    createMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TicketDiscount size={20} />
            </div>
            <div>
              <DialogTitle>{t('Создать промокод')}</DialogTitle>
              <DialogDescription className="text-xs">
                {partnerName
                  ? `${t('Для партнёра')}: ${partnerName}`
                  : t('Настройте условия, скидки и ограничения промокода')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 grid gap-4 text-sm">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              {t(error)}
            </div>
          )}

          {/* Promocode string */}
          <div>
            <Label htmlFor="promo-code">{t('Код промокода')} *</Label>
            <div className="mt-1 flex gap-2">
              <Input
                id="promo-code"
                placeholder="FREEACCESS, SALE50…"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="font-mono uppercase tracking-wider"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setCode(generateRandomCode())}
                className="shrink-0 text-xs"
              >
                {t('Сгенерировать')}
              </Button>
            </div>
          </div>

          {/* Discount Type */}
          <div>
            <Label>{t('Тип скидки / доступа')} *</Label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDiscountType('FREE')
                  setDiscountValue(100)
                }}
                className={`rounded-lg border p-2.5 text-center text-xs transition-colors ${
                  discountType === 'FREE'
                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-border-strong'
                }`}
              >
                <span className="block font-medium">{t('Бесплатно (100%)')}</span>
                <span className="mt-0.5 block text-[10px] opacity-80">
                  {t('Без оплаты')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDiscountType('PERCENT')
                  if (discountValue === 100) setDiscountValue(20)
                }}
                className={`rounded-lg border p-2.5 text-center text-xs transition-colors ${
                  discountType === 'PERCENT'
                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-border-strong'
                }`}
              >
                <span className="block font-medium">{t('Процент (%)')}</span>
                <span className="mt-0.5 block text-[10px] opacity-80">
                  {t('Скидка в %')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDiscountType('FIXED')
                  if (discountValue <= 100) setDiscountValue(2000)
                }}
                className={`rounded-lg border p-2.5 text-center text-xs transition-colors ${
                  discountType === 'FIXED'
                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-border-strong'
                }`}
              >
                <span className="block font-medium">{t('Сумма (₸)')}</span>
                <span className="mt-0.5 block text-[10px] opacity-80">
                  {t('Скидка в тенге')}
                </span>
              </button>
            </div>
          </div>

          {/* Discount Value */}
          {discountType !== 'FREE' && (
            <div>
              <Label htmlFor="promo-value">
                {discountType === 'PERCENT'
                  ? t('Размер скидки в процентах (%)')
                  : t('Сумма скидки в тенге (₸)')}{' '}
                *
              </Label>
              <Input
                id="promo-value"
                type="number"
                min={1}
                max={discountType === 'PERCENT' ? 100 : 1000000}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                required
                className="mt-1"
              />
            </div>
          )}

          {/* Applicable Plan */}
          <div>
            <Label htmlFor="promo-plan">{t('Применять к тарифу')}</Label>
            <select
              id="promo-plan"
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value="all">{t('Все тарифы')}</option>
              <option value="self">{t('1 месяц (30 дней)')}</option>
              <option value="month_2">{t('2 месяца (60 дней)')}</option>
              <option value="month_6">{t('6 месяцев (180 дней)')}</option>
              <option value="year_1">{t('1 год (365 дней)')}</option>
            </select>
          </div>

          {/* Limits & Rules */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="promo-min-price">
                {t('Мин. цена заказа (₸)')}
              </Label>
              <Input
                id="promo-min-price"
                type="number"
                placeholder={t('Не ограничено')}
                value={minPriceKzt}
                onChange={(e) => setMinPriceKzt(e.target.value)}
                className="mt-1"
              />
              <span className="mt-1 block text-[11px] text-muted-foreground">
                {t('Начиная с какой цены')}
              </span>
            </div>

            <div>
              <Label htmlFor="promo-max-uses">{t('Лимит использований')}</Label>
              <Input
                id="promo-max-uses"
                type="number"
                placeholder={t('Безлимитно')}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="mt-1"
              />
              <span className="mt-1 block text-[11px] text-muted-foreground">
                {t('Всего раз')}
              </span>
            </div>
          </div>

          {/* Max uses per user */}
          <div>
            <Label htmlFor="promo-max-per-user">
              {t('Использований на одного пользователя')}
            </Label>
            <Input
              id="promo-max-per-user"
              type="number"
              min={1}
              value={maxUsesPerUser}
              onChange={(e) => setMaxUsesPerUser(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Allow on sale */}
          <div className="rounded-lg border border-border bg-card/60 p-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={allowOnSale}
                onChange={(e) => setAllowOnSale(e.target.checked)}
                className="mt-0.5 size-4 rounded accent-primary"
              />
              <div>
                <span className="text-xs font-medium text-foreground">
                  {t('Разрешить применение к акционным тарифам')}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    'Если включено, промокод сработает даже если на тариф уже действует скидка.',
                  )}
                </p>
              </div>
            </label>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="promo-starts-at">{t('Дата начала')}</Label>
              <Input
                id="promo-starts-at"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="promo-expires-at">{t('Дата окончания')}</Label>
              <Input
                id="promo-expires-at"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="promo-note">{t('Примечание / Описание')}</Label>
            <Input
              id="promo-note"
              placeholder={t('Для блогеров, акции, партнёра…')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('Отмена')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('Создание…') : t('Создать промокод')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
