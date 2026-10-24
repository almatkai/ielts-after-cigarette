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
          className={`inline text-left text-sm leading-6 cursor-pointer transition-all duration-150 rounded px-1 -mx-0.5 ${
            isError
              ? `underline decoration-wavy decoration-red-500 decoration-2 underline-offset-4 text-red-950 hover:bg-red-100/90 ${
                  selected ? 'bg-red-100 ring-2 ring-red-400' : 'bg-red-50/80'
                }`
              : `underline decoration-wavy decoration-amber-500 decoration-2 underline-offset-4 text-amber-950 hover:bg-amber-100/90 ${
                  selected
                    ? 'bg-amber-100 ring-2 ring-amber-400'
                    : 'bg-amber-50/80'
                }`
          }`}
        >
          <span>{text}</span>
          <sup
            className={`ml-1 inline-flex items-center justify-center font-sans font-bold text-[10px] size-4 rounded-full text-white align-top select-none shadow-xs ${
              isError ? 'bg-red-500' : 'bg-amber-500'
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
              isError ? 'text-red-700' : 'text-amber-700'
            }`}
          >
            {feedbackLabel}
          </p>
          <PopoverPrimitive.Close
            aria-label={closeLabel}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <span aria-hidden>×</span>
          </PopoverPrimitive.Close>
        </div>
        <p className="text-sm font-semibold leading-5 text-foreground whitespace-pre-wrap">
          {annotation.replacement}
        </p>
        {annotation.explanationRu && (
          <p className="mt-2 text-slate-700 leading-relaxed">
            {annotation.explanationRu}
          </p>
        )}
        <PopoverPrimitive.Arrow className="fill-white" />
      </PopoverContent>
    </Popover>
  )
}
