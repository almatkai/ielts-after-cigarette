import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'

export function ModelParagraphCard({
  modelParagraph,
}: {
  modelParagraph: string
}) {
  const contentId = useId()
  const [isOpen, setIsOpen] = useState(true)

  if (!modelParagraph) return null

  return (
    <section
      className="min-w-0 rounded-2xl border border-border bg-muted/30 p-4 sm:p-5"
      aria-label="Пример абзаца для сравнения"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold">
            Пример абзаца для сравнения
          </h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Сравните лексику и построение предложений со своим ответом.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-11 shrink-0"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? 'Hide' : 'Show'}
        </Button>
      </div>
      <div
        id={contentId}
        hidden={!isOpen}
        className="mt-4 whitespace-pre-wrap break-words text-sm leading-7"
      >
        {modelParagraph}
      </div>
    </section>
  )
}
