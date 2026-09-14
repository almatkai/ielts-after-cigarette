import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type EmptyStateProps = {
  title?: string
  description?: string
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  imageSrc?: string | null
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title = 'Для выбранного формата экзамена пока нет опубликованных тестов.',
  description,
  icon: Icon,
  imageSrc = `${import.meta.env.BASE_URL}thoughtful_arctic_fox.webp`,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[380px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#e2e8f0] bg-white px-6 py-12 text-center transition-colors sm:min-h-[440px] sm:py-16',
        className,
      )}
    >
      <div className="flex max-w-md flex-col items-center justify-center text-center">
        {imageSrc ? (
          <div className="relative mb-5 flex items-center justify-center">
            <img
              src={imageSrc}
              alt=""
              aria-hidden="true"
              className="size-36 select-none object-contain pointer-events-none sm:size-44"
              loading="lazy"
            />
          </div>
        ) : Icon ? (
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-400">
            <Icon className="size-5 stroke-[1.75]" aria-hidden="true" />
          </div>
        ) : null}

        <p className="text-base font-semibold tracking-tight text-[#0f172a] sm:text-lg">
          {title}
        </p>
        {description ? (
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-[#64748b] sm:text-sm">
            {description}
          </p>
        ) : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  )
}
