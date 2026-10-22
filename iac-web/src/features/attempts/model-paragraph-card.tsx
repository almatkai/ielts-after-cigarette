import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ModelParagraphCard({
  modelParagraph,
}: {
  modelParagraph: string
}) {
  const [isOpen, setIsOpen] = useState(true)

  if (!modelParagraph) return null

  return (
    <div className="rounded-xl border border-border-strong/80 bg-primary-soft p-5 shadow-none">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-none text-xs font-bold">
            ★
          </span>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              {'Образец абзаца на Band 8.0+'}
            </h4>
            <p className="text-xs text-muted-foreground">
              Пример формулировки с точной лексикой и разнообразными
              конструкциями
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-primary hover:text-primary hover:bg-primary-soft"
        >
          {isOpen ? 'Скрыть' : 'Показать'}
        </Button>
      </div>

      {isOpen && (
        <div className="mt-3.5 rounded-xl border border-border-strong bg-card p-4 font-sans text-sm sm:text-base leading-relaxed text-foreground shadow-none">
          <p className="italic">“{modelParagraph}”</p>
        </div>
      )}
    </div>
  )
}
