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
    <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs text-xs font-bold">
            ★
          </span>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {'Образец абзаца на Band 8.0+'}
            </h4>
            <p className="text-xs text-slate-500">
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
          className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          {isOpen ? 'Скрыть' : 'Показать'}
        </Button>
      </div>

      {isOpen && (
        <div className="mt-3.5 rounded-xl border border-blue-200 bg-white/95 p-4 font-serif text-sm sm:text-base leading-relaxed text-slate-800 shadow-2xs">
          <p className="italic">“{modelParagraph}”</p>
        </div>
      )}
    </div>
  )
}
