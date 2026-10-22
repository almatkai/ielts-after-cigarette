import { cn } from '@/lib/utils'

export function BandChange({ value }: { value: number | null }) {
  if (value === null) return null
  return (
    <span
      title="Изменение относительно предыдущей попытки этого теста"
      className={cn(
        'text-[11px] font-medium tabular-nums',
        value > 0
          ? 'text-success'
          : value < 0
            ? 'text-warning-fg'
            : 'text-muted-foreground',
      )}
    >
      {value === 0
        ? 'Без изменений'
        : `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(1)} band`}
    </span>
  )
}
