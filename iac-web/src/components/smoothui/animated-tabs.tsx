import { motion } from 'motion/react'
import { useRef } from 'react'

import { cn } from '#/lib/utils'

type TabItem<T extends string> = {
  id: T
  label: string
}

type AnimatedTabsProps<T extends string> = {
  items: readonly TabItem<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}

export function AnimatedTabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: AnimatedTabsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return

    event.preventDefault()
    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % items.length
    if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + items.length) % items.length
    }
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = items.length - 1

    const nextItem = items[nextIndex]
    onChange(nextItem.id)
    refs.current[nextIndex]?.focus()
  }

  return (
    <div
      className={cn(
        'scrollbar-none flex max-w-full gap-1 overflow-x-auto border-b border-[#e2e8f0]',
        className,
      )}
      role="tablist"
      aria-label={label}
    >
      {items.map((item, index) => {
        const isActive = item.id === value
        return (
          <button
            key={item.id}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${item.id}`}
            id={`tab-${item.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'relative min-h-12 shrink-0 px-4 text-sm font-medium text-[#475569] transition-colors hover:text-[#0f172a]',
              isActive && 'text-[#0f172a]',
            )}
          >
            {item.label}
            {isActive ? (
              <motion.span
                layoutId="active-skill-tab"
                className="absolute right-3 bottom-[-1px] left-3 h-0.5 bg-[#3b82f6]"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
