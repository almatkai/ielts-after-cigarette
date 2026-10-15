import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

export function BandChange({ value }: { value: number | null }) {
  const { t } = useLanguage()
  if (value === null) return null
  return (
    <span
      title={t('Изменение относительно предыдущей попытки этого теста')}
      className={cn(
        'text-[11px] font-medium tabular-nums',
        value > 0
          ? 'text-emerald-700'
          : value < 0
            ? 'text-amber-700'
            : 'text-[#808084]',
      )}
    >
      {value === 0
        ? t('Без изменений')
        : `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(1)} band`}
    </span>
  )
}
