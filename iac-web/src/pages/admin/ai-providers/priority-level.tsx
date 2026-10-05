import type { ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'

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
  const { setNodeRef, isOver } = useDroppable({
    id: `level:${priority}`,
    disabled,
  })
  return (
    <div
      ref={setNodeRef}
      data-priority-level={priority}
      className={`overflow-hidden rounded-xl border ${isOver ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 bg-white'}`}
    >
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">
          {priority === 'new' ? 'Новый уровень' : `Уровень ${rank}`}
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {priority === 'new'
            ? 'Перетащите сюда провайдер, чтобы вынести его в отдельный резервный уровень.'
            : `Приоритет ${priority} · активных: ${count} · запросы по очереди`}
        </p>
      </div>
      {children}
    </div>
  )
}
