import { useId, useMemo, useState } from 'react'
import type { WritingAnnotation } from './api'

export function AnnotatedEssayView({
  text,
  annotations: suppliedAnnotations,
}: {
  text: string
  annotations: WritingAnnotation[]
}) {
  const annotationPrefix = useId()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // Previously saved evaluations may predate server-side quote validation.
  const annotations = useMemo(
    () =>
      suppliedAnnotations
        .filter((ann) => ann.quote.trim() !== '' && text.includes(ann.quote))
        .map((ann, index) => ({ ...ann, id: index + 1 })),
    [suppliedAnnotations, text],
  )

  const handleSelect = (id: number) => {
    setSelectedId(id)
    const el = document.getElementById(
      `annotation-card-${annotationPrefix}-${id}`,
    )
    if (el) {
      el.focus({ preventScroll: true })
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  const segments = useMemo(() => {
    if (!text || !annotations.length) {
      return [{ text, annotation: null }]
    }

    type Match = {
      start: number
      end: number
      annotation: WritingAnnotation
    }

    const matches: Match[] = []

    for (const ann of annotations) {
      const quote = ann.quote.trim()
      if (!quote) continue
      let searchIdx = 0
      while (searchIdx < text.length) {
        const found = text.indexOf(quote, searchIdx)
        if (found === -1) break
        matches.push({
          start: found,
          end: found + quote.length,
          annotation: ann,
        })
        searchIdx = found + quote.length
      }
    }

    matches.sort(
      (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start),
    )

    const filtered: Match[] = []
    let lastEnd = 0
    for (const m of matches) {
      if (m.start >= lastEnd) {
        filtered.push(m)
        lastEnd = m.end
      }
    }

    const res: { text: string; annotation: WritingAnnotation | null }[] = []
    let cur = 0
    for (const m of filtered) {
      if (m.start > cur) {
        res.push({ text: text.slice(cur, m.start), annotation: null })
      }
      res.push({
        text: text.slice(m.start, m.end),
        annotation: m.annotation,
      })
      cur = m.end
    }
    if (cur < text.length) {
      res.push({ text: text.slice(cur), annotation: null })
    }
    return res
  }, [text, annotations])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#e7e7e4] bg-[#fbfbf9] p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200/70">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {'Текст вашего эссе с замечаниями'}
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-red-500" />
              {'Ошибки'}
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-500" />
              {'Рекомендации'}
            </span>
          </div>
        </div>

        <div className="font-serif text-base sm:text-lg leading-relaxed sm:leading-loose text-slate-800 whitespace-pre-wrap">
          {segments.map((seg, idx) => {
            if (!seg.annotation) {
              return <span key={idx}>{seg.text}</span>
            }
            const ann = seg.annotation
            const isError = ann.severity === 'error'
            const isSelected = selectedId === ann.id

            return (
              <button
                key={idx}
                type="button"
                aria-label={`${isError ? 'Ошибка' : 'Рекомендация'} ${ann.id}: ${seg.text}`}
                aria-controls={`annotation-card-${annotationPrefix}-${ann.id}`}
                aria-pressed={isSelected}
                onClick={() => handleSelect(ann.id)}
                title={
                  ann.replacement
                    ? `Исправление: ${ann.replacement}`
                    : undefined
                }
                className={`inline text-left font-serif text-base sm:text-lg cursor-pointer transition-all duration-150 rounded px-1 -mx-0.5 ${
                  isError
                    ? `underline decoration-wavy decoration-red-500 decoration-2 underline-offset-4 text-red-950 hover:bg-red-100/90 ${
                        isSelected
                          ? 'bg-red-100 ring-2 ring-red-400'
                          : 'bg-red-50/80'
                      }`
                    : `underline decoration-wavy decoration-amber-500 decoration-2 underline-offset-4 text-amber-950 hover:bg-amber-100/90 ${
                        isSelected
                          ? 'bg-amber-100 ring-2 ring-amber-400'
                          : 'bg-amber-50/80'
                      }`
                }`}
              >
                <span>{seg.text}</span>
                <sup
                  className="ml-1 inline-flex items-center justify-center font-sans font-bold text-[10px] size-4 rounded-full text-white align-top select-none shadow-xs"
                  style={{ backgroundColor: isError ? '#ef4444' : '#f59e0b' }}
                >
                  {ann.id}
                </sup>
              </button>
            )
          })}
        </div>
      </div>

      {annotations.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          Замечаний к отдельным фрагментам в этой проверке нет.
        </p>
      ) : (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {'Разбор ошибок и улучшений'} ({annotations.length})
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {annotations.map((ann) => {
              const isError = ann.severity === 'error'
              const isSelected = selectedId === ann.id
              return (
                <div
                  key={ann.id}
                  id={`annotation-card-${annotationPrefix}-${ann.id}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${isError ? 'Ошибка' : 'Рекомендация'} ${ann.id}`}
                  aria-pressed={isSelected}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedId(ann.id)
                    }
                  }}
                  onClick={() => setSelectedId(ann.id)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    isSelected
                      ? isError
                        ? 'border-red-400 bg-red-50/50 shadow-xs ring-1 ring-red-400'
                        : 'border-amber-400 bg-amber-50/50 shadow-xs ring-1 ring-amber-400'
                      : 'border-[#e7e7e4] bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-2xs ${
                        isError ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                    >
                      {ann.id}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="font-serif text-sm line-through text-slate-400">
                          {ann.quote}
                        </span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="font-serif text-sm font-bold text-emerald-700">
                          {ann.replacement}
                        </span>
                        <span
                          className={`ml-auto text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isError
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isError ? 'Ошибка' : 'Рекомендация'} · {ann.type}
                        </span>
                      </div>

                      {ann.explanationRu && (
                        <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                          {ann.explanationRu}
                        </p>
                      )}

                      {ann.alternatives && ann.alternatives.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1 pt-1.5 border-t border-slate-100">
                          <span className="text-[11px] text-slate-400">
                            {'Варианты'}:
                          </span>
                          {ann.alternatives.map((alt, i) => (
                            <span
                              key={i}
                              className="rounded bg-slate-100 px-1.5 py-0.2 text-[11px] font-medium text-slate-700"
                            >
                              {alt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
