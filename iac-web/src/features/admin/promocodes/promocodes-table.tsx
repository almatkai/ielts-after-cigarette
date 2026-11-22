import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, TickCircle, Trash } from 'iconsax-react'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  deleteAdminPromocode,
  toggleAdminPromocodeStatus,
} from '@/features/admin/billing-api'
import type { AdminPromocode } from '@/features/admin/billing-api'
import { formatTenge } from '@/features/billing/api'
import { useLanguage } from '@/lib/i18n'
import { PromocodeRedemptionsDialog } from './promocode-redemptions-dialog'

export function PromocodesTable({
  promocodes,
  showPartnerColumn = true,
}: {
  promocodes: AdminPromocode[]
  showPartnerColumn?: boolean
}) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [selectedForRedemptions, setSelectedForRedemptions] = useState<{
    id: string
    code: string
  } | null>(null)

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleAdminPromocodeStatus(id, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'billing', 'promocodes'],
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminPromocode(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'billing', 'promocodes'],
      })
    },
  })

  if (promocodes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('Промокодов пока нет.')}
      </p>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="pb-3 pr-4 font-medium">{t('Промокод')}</th>
              <th className="pb-3 pr-4 font-medium">{t('Скидка')}</th>
              <th className="pb-3 pr-4 font-medium">{t('Условия')}</th>
              <th className="pb-3 pr-4 font-medium">{t('Использовано')}</th>
              <th className="pb-3 pr-4 font-medium">{t('Срок действия')}</th>
              {showPartnerColumn && (
                <th className="pb-3 pr-4 font-medium">{t('Партнёр')}</th>
              )}
              <th className="pb-3 pr-4 font-medium">{t('Статус')}</th>
              <th className="pb-3 text-right font-medium">{t('Действия')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {promocodes.map((promo) => {
              const now = new Date()
              const isExpired = promo.expiresAt && new Date(promo.expiresAt) < now
              const isNotStarted = new Date(promo.startsAt) > now

              return (
                <tr key={promo.id} className="hover:bg-muted/30">
                  {/* Code */}
                  <td className="py-3 pr-4 font-mono font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm tracking-wide text-foreground">
                        {promo.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(promo.code)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title={t('Копировать код')}
                      >
                        {copiedCode === promo.code ? (
                          <TickCircle size={14} className="text-success" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                    {promo.note && (
                      <span className="font-sans text-[11px] font-normal text-muted-foreground">
                        {promo.note}
                      </span>
                    )}
                  </td>

                  {/* Discount */}
                  <td className="py-3 pr-4">
                    {promo.discountType === 'FREE' && (
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                        {t('100% Бесплатно')}
                      </span>
                    )}
                    {promo.discountType === 'PERCENT' && (
                      <span className="inline-flex items-center rounded-md bg-success/10 px-2 py-0.5 font-semibold text-success">
                        −{promo.discountValue}%
                      </span>
                    )}
                    {promo.discountType === 'FIXED' && (
                      <span className="inline-flex items-center rounded-md bg-success/10 px-2 py-0.5 font-semibold text-success">
                        −{formatTenge(promo.discountValue)}
                      </span>
                    )}
                  </td>

                  {/* Conditions */}
                  <td className="py-3 pr-4 text-muted-foreground">
                    <div>
                      {promo.planCode ? (
                        <span className="text-foreground">{promo.planCode}</span>
                      ) : (
                        <span>{t('Все тарифы')}</span>
                      )}
                    </div>
                    {promo.minPriceKzt ? (
                      <div className="text-[10px]">
                        {t('от')} {formatTenge(promo.minPriceKzt)}
                      </div>
                    ) : null}
                    {!promo.allowOnSale && (
                      <div className="text-[10px] text-amber-500">
                        {t('Не для акций')}
                      </div>
                    )}
                  </td>

                  {/* Uses */}
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedForRedemptions({
                          id: promo.id,
                          code: promo.code,
                        })
                      }
                      className="font-medium text-primary hover:underline"
                      title={t('Посмотреть использования')}
                    >
                      {promo.usedCount}
                      {promo.maxUses !== null ? ` / ${promo.maxUses}` : ' / ∞'}
                    </button>
                    <div className="text-[10px] text-muted-foreground">
                      {promo.maxUsesPerUser} {t('на чел.')}
                    </div>
                  </td>

                  {/* Dates */}
                  <td className="py-3 pr-4 text-muted-foreground">
                    {isExpired ? (
                      <span className="inline-flex items-center rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive">
                        {t('Истёк')}
                      </span>
                    ) : isNotStarted ? (
                      <span className="inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-500">
                        {t('Скоро начнётся')}
                      </span>
                    ) : (
                      <span className="text-[11px]">
                        {promo.expiresAt
                          ? `${t('до')} ${new Date(promo.expiresAt).toLocaleDateString()}`
                          : t('Бессрочно')}
                      </span>
                    )}
                  </td>

                  {/* Partner */}
                  {showPartnerColumn && (
                    <td className="py-3 pr-4">
                      {promo.partnerName ? (
                        <span className="font-medium text-foreground">
                          {promo.partnerName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  )}

                  {/* Toggle Active */}
                  <td className="py-3 pr-4">
                    <Switch
                      checked={promo.isActive}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          id: promo.id,
                          isActive: checked,
                        })
                      }
                      disabled={toggleMutation.isPending}
                    />
                  </td>

                  {/* Actions */}
                  <td className="py-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (
                          window.confirm(
                            `${t('Удалить промокод')} ${promo.code}?`,
                          )
                        ) {
                          deleteMutation.mutate(promo.id)
                        }
                      }}
                      title={t('Удалить промокод')}
                    >
                      <Trash size={14} />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <PromocodeRedemptionsDialog
        open={Boolean(selectedForRedemptions)}
        onOpenChange={(open) => {
          if (!open) setSelectedForRedemptions(null)
        }}
        promocodeId={selectedForRedemptions?.id ?? null}
        code={selectedForRedemptions?.code ?? ''}
      />
    </>
  )
}
