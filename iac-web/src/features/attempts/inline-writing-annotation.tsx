import { Popover as PopoverPrimitive } from 'radix-ui'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { WritingAnnotation } from './api'

export function InlineWritingAnnotation({
  annotation,
  text,
  selected,
  open,
  onOpenChange,
  label,
  closeLabel,
}: {
  annotation: WritingAnnotation
  text: string
  selected: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  label: string
  closeLabel: string
}) {
  const isError = annotation.severity === 'error'
  const feedbackLabel = `${label} ${annotation.id}`

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${feedbackLabel}: ${text}`}
          aria-pressed={selected}
          className={`inline text-left font-sans text-sm leading-6 cursor-pointer transition-all duration-150 rounded px-1 -mx-0.5 ${
            isError
              ? `underline decoration-wavy decoration-destructive decoration-2 underline-offset-4 text-destructive hover:bg-destructive-soft/90 ${
                  selected
                    ? 'bg-destructive-soft ring-2 ring-destructive'
                    : 'bg-destructive-soft/80'
                }`
              : `underline decoration-wavy decoration-warning-fg decoration-2 underline-offset-4 text-warning-fg hover:bg-warning-bg/90 ${
                  selected
                    ? 'bg-warning-bg ring-2 ring-warning-fg'
                    : 'bg-warning-bg/80'
                }`
          }`}
        >
          <span>{text}</span>
          <sup
            className={`ml-1 inline-flex items-center justify-center font-sans font-bold text-[10px] size-4 rounded-full text-primary-foreground align-top select-none shadow-none ${
              isError ? 'bg-destructive' : 'bg-warning-fg'
            }`}
          >
            {annotation.id}
          </sup>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        collisionPadding={12}
        aria-label={feedbackLabel}
        className="w-96 max-w-[calc(100vw-1.5rem)] max-h-(--radix-popover-content-available-height) overflow-y-auto p-4 font-sans text-sm whitespace-normal break-words"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <p
            className={`text-xs font-semibold ${
              isError ? 'text-destructive' : 'text-warning-fg'
            }`}
          >
            {feedbackLabel}
          </p>
          <PopoverPrimitive.Close
            aria-label={closeLabel}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-lg text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span aria-hidden>×</span>
          </PopoverPrimitive.Close>
        </div>
        <p className="font-sans text-sm font-semibold leading-5 text-success whitespace-pre-wrap">
          {annotation.replacement}
        </p>
        {annotation.explanationRu && (
          <p className="mt-2 text-foreground leading-relaxed">
            {annotation.explanationRu}
          </p>
        )}
        <PopoverPrimitive.Arrow className="fill-popover" />
      </PopoverContent>
    </Popover>
  )
}
