import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Add, TicketDiscount } from 'iconsax-react'

import { Button } from '@/components/ui/button'
import {
  adminPromocodesKey,
  listAdminPromocodes,
} from '@/features/admin/billing-api'
import type { UserDetail } from '@/features/admin/users-api'
import { CreatePromocodeDialog } from '@/features/admin/promocodes/create-promocode-dialog'
import { PromocodesTable } from '@/features/admin/promocodes/promocodes-table'
import { useLanguage } from '@/lib/i18n'

export function UserPromocodesCard({ user }: { user: UserDetail }) {
  const { t } = useLanguage()
  const [createOpen, setCreateOpen] = useState(false)

  const query = useQuery({
    queryKey: adminPromocodesKey(user.id),
    queryFn: ({ signal }) => listAdminPromocodes(user.id, undefined, signal),
  })

  const promocodes = query.data ?? []

  return (
    <section className="mt-5 rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TicketDiscount size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">{t('Промокоды')}</h2>
              {promocodes.length > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                  {promocodes.length}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('Персональные и партнёрские промокоды пользователя')}
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="gap-1.5 text-xs"
        >
          <Add size={16} />
          {t('Создать промокод')}
        </Button>
      </div>

      {query.isPending ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t('Загрузка промокодов…')}
        </p>
      ) : query.isError ? (
        <div className="py-4 text-center text-sm text-destructive">
          <p>{t('Не удалось загрузить промокоды')}</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="mt-1 text-xs text-primary hover:underline"
          >
            {t('Повторить')}
          </button>
        </div>
      ) : promocodes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
          <p>{t('У этого пользователя пока нет привязанных промокодов.')}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="mt-3 gap-1 text-xs"
          >
            <Add size={14} />
            {t('Создать промокод')}
          </Button>
        </div>
      ) : (
        <PromocodesTable promocodes={promocodes} showPartnerColumn={false} />
      )}

      <CreatePromocodeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        partnerUserId={user.id}
        partnerName={user.displayName || user.email}
      />
    </section>
  )
}
