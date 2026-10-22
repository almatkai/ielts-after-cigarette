import type { ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'

import { useLanguage } from '@/lib/i18n'

export function PriorityLevel({
  priority,
  rank,
  count,
  children,
  disabled,
}: {
  priority: number | 'new'
  rank?: number
  count?: number
  children?: ReactNode
  disabled: boolean
}) {
  const { t } = useLanguage()
  const { setNodeRef, isOver } = useDroppable({
    id: `level:${priority}`,
    disabled,
  })
  return (
    <div
      ref={setNodeRef}
      data-priority-level={priority}
      className={`overflow-hidden rounded-xl border ${isOver ? 'border-primary bg-primary-soft ring-2 ring-primary' : 'border-border bg-card'}`}
    >
      <div className="border-b border-border bg-card px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          {priority === 'new' ? t('Новый уровень') : `${t('Уровень')} ${rank}`}
        </h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {priority === 'new'
            ? t(
                'Перетащите сюда провайдер, чтобы вынести его в отдельный резервный уровень.',
              )
            : `${t('Приоритет')} ${priority} · ${t('активных')}: ${count} · ${t('запросы по очереди')}`}
        </p>
      </div>
      {children}
    </div>
  )
}
