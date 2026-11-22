import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Add, SearchNormal1, TicketDiscount } from 'iconsax-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  adminPromocodesKey,
  listAdminPromocodes,
} from '@/features/admin/billing-api'
import type { AdminPromocode } from '@/features/admin/billing-api'
import { CreatePromocodeDialog } from '@/features/admin/promocodes/create-promocode-dialog'
import { PromocodesTable } from '@/features/admin/promocodes/promocodes-table'
import { useLanguage } from '@/lib/i18n'

export function PromocodesPage() {
  const { t } = useLanguage()
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState<boolean | undefined>(undefined)

  const query = useQuery({
    queryKey: adminPromocodesKey('all'),
    queryFn: ({ signal }) => listAdminPromocodes(undefined, undefined, signal),
  })

  const rawData = query.data
  const promocodes = Array.isArray(rawData) ? rawData : []
  const list = useQueryData(promocodes, search, activeOnly)

  return (
    <div className="mx-auto max-w-[1280px] p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TicketDiscount size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {t('Промокоды')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t('Управление скидками, бесплатными доступами и акциями')}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="gap-2"
        >
          <Add size={18} />
          {t('Создать промокод')}
        </Button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
          <SearchNormal1
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder={t('Поиск по коду или примечанию…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex gap-1.5 rounded-lg border border-border bg-card p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveOnly(undefined)}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              activeOnly === undefined
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('Все')}
          </button>
          <button
            type="button"
            onClick={() => setActiveOnly(true)}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              activeOnly === true
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('Активные')}
          </button>
          <button
            type="button"
            onClick={() => setActiveOnly(false)}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              activeOnly === false
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('Неактивные')}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        {query.isPending ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t('Загрузка промокодов…')}
          </p>
        ) : query.isError ? (
          <div className="py-8 text-center text-sm text-destructive">
            <p>{t('Не удалось загрузить список промокодов')}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
              className="mt-3"
            >
              {t('Повторить')}
            </Button>
          </div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <p>{t('Промокоды не найдены.')}</p>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch('')}
                className="mt-2 text-xs"
              >
                {t('Сбросить поиск')}
              </Button>
            )}
          </div>
        ) : (
          <PromocodesTable promocodes={list} showPartnerColumn={true} />
        )}
      </div>

      <CreatePromocodeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}

function useQueryData(
  promocodes: AdminPromocode[],
  search: string,
  activeOnly?: boolean,
) {
  return useMemo(() => {
    if (!Array.isArray(promocodes)) return []
    const term = search.trim().toLowerCase()
    return promocodes.filter((promo) => {
      if (activeOnly !== undefined && promo.isActive !== activeOnly) {
        return false
      }
      if (term) {
        const codeMatches = promo.code.toLowerCase().includes(term)
        const noteMatches = promo.note.toLowerCase().includes(term)
        const partnerMatches =
          promo.partnerName?.toLowerCase().includes(term) ?? false
        return codeMatches || noteMatches || partnerMatches
      }
      return true
    })
  }, [promocodes, search, activeOnly])
}
