import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getAdminPromocodeRedemptions } from '@/features/admin/billing-api'
import { formatTenge } from '@/features/billing/api'
import { useLanguage } from '@/lib/i18n'

export function PromocodeRedemptionsDialog({
  promocodeId,
  code,
  open,
  onOpenChange,
}: {
  promocodeId: string | null
  code: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useLanguage()

  const query = useQuery({
    queryKey: ['admin', 'billing', 'promocodes', promocodeId, 'redemptions'],
    queryFn: ({ signal }) =>
      promocodeId ? getAdminPromocodeRedemptions(promocodeId, signal) : Promise.resolve([]),
    enabled: open && Boolean(promocodeId),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t('Использования промокода')} <span className="font-mono text-primary">{code}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t('Список пользователей, применивших промокод к заказам')}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {query.isPending ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('Загрузка…')}</p>
          ) : query.isError ? (
            <p className="py-6 text-center text-sm text-destructive">{t('Ошибка загрузки')}</p>
          ) : !Array.isArray(query.data) || query.data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('Этот промокод ещё никто не использовал.')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="pb-2 font-medium">{t('Пользователь')}</th>
                    <th className="pb-2 font-medium">{t('Скидка')}</th>
                    <th className="pb-2 font-medium">{t('К оплате')}</th>
                    <th className="pb-2 font-medium">{t('Дата')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {query.data.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 pr-2">
                        <div className="font-medium text-foreground">{r.userName || '—'}</div>
                        <div className="text-[11px] text-muted-foreground">{r.userEmail || r.userId}</div>
                      </td>
                      <td className="py-2.5 pr-2 text-success font-medium">
                        −{formatTenge(r.discountAmount)}
                      </td>
                      <td className="py-2.5 pr-2 font-medium text-foreground">
                        {r.finalPrice === 0 ? (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                            {t('Бесплатно')}
                          </span>
                        ) : (
                          formatTenge(r.finalPrice)
                        )}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
