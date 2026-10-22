import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function SortableProviderCard({
  id,
  name,
  disabled,
  children,
}: {
  id: string
  name: string
  disabled: boolean
  children: ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })
  return (
    <article
      ref={setNodeRef}
      data-provider-id={id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : undefined,
      }}
      className={`relative border-b border-border py-5 pl-14 pr-5 last:border-0 ${isDragging ? 'rounded-xl bg-primary-soft shadow-none ring-1 ring-primary' : 'bg-card'}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label={`Переместить ${name}`}
        title="Перетащите; с клавиатуры: пробел, стрелки, пробел"
        className="absolute left-3 top-6 flex h-9 w-8 touch-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 cursor-grab active:cursor-grabbing"
      >
        <svg
          aria-hidden="true"
          width="16"
          height="22"
          viewBox="0 0 16 22"
          fill="currentColor"
        >
          {[5, 11, 17].flatMap((y) =>
            [5, 11].map((x) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />
            )),
          )}
        </svg>
      </button>
      {children}
    </article>
  )
}
