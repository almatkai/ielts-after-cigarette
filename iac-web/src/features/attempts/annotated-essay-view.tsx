import { useId, useMemo, useState } from 'react'
import { InlineWritingAnnotation } from './inline-writing-annotation'
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
  const [openSegmentIndex, setOpenSegmentIndex] = useState<number | null>(null)
  // Previously saved evaluations may predate server-side quote validation.
  const annotations = useMemo(
    () =>
      suppliedAnnotations
        .filter((ann) => ann.quote.trim() !== '' && text.includes(ann.quote))
        .map((ann, index) => ({ ...ann, id: index + 1 })),
    [suppliedAnnotations, text],
  )

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
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <p className="text-xs font-medium text-muted-foreground">
            {'Your essay with feedback'}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-destructive" />
              {'Errors'}
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-warning-fg" />
              {'Suggestions'}
            </span>
          </div>
        </div>

        <div className="whitespace-pre-wrap text-sm leading-6 text-foreground">
          {segments.map((seg, idx) => {
            if (!seg.annotation) {
              return <span key={idx}>{seg.text}</span>
            }
            const ann = seg.annotation
            const isError = ann.severity === 'error'
            const isSelected = selectedId === ann.id

            return (
              <InlineWritingAnnotation
                key={idx}
                annotation={ann}
                text={seg.text}
                selected={isSelected}
                open={openSegmentIndex === idx}
                label={isError ? 'Error' : 'Suggestion'}
                closeLabel="Close"
                onOpenChange={(open) => {
                  if (open) setSelectedId(ann.id)
                  setOpenSegmentIndex((current) =>
                    open ? idx : current === idx ? null : current,
                  )
                }}
              />
            )
          })}
        </div>
      </div>

      {annotations.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          This assessment has no feedback on individual text passages.
        </p>
      ) : (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground">
            {'Feedback and improvements'} ({annotations.length})
          </p>
          <div className="grid divide-y divide-border">
            {annotations.map((ann) => {
              const isError = ann.severity === 'error'
              const isSelected = selectedId === ann.id
              return (
                <div
                  key={ann.id}
                  id={`annotation-card-${annotationPrefix}-${ann.id}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${isError ? 'Error' : 'Suggestion'} ${ann.id}`}
                  aria-pressed={isSelected}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedId(ann.id)
                    }
                  }}
                  onClick={() => setSelectedId(ann.id)}
                  className={`cursor-pointer rounded-lg px-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground shadow-none ${
                        isError ? 'bg-destructive' : 'bg-warning-fg'
                      }`}
                    >
                      {ann.id}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="text-sm text-muted-foreground line-through">
                          {ann.quote}
                        </span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-sm font-semibold text-success">
                          {ann.replacement}
                        </span>
                        <span
                          className={`ml-auto text-xs font-medium ${
                            isError ? 'text-destructive' : 'text-warning-fg'
                          }`}
                        >
                          {isError ? 'Error' : 'Suggestion'} · {ann.type}
                        </span>
                      </div>

                      {ann.explanationRu && (
                        <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                          {ann.explanationRu}
                        </p>
                      )}

                      {ann.alternatives && ann.alternatives.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1 pt-1.5 border-t border-border">
                          <span className="text-[11px] text-muted-foreground">
                            {'Alternatives'}:
                          </span>
                          {ann.alternatives.map((alt, i) => (
                            <span key={i} className="text-xs text-foreground">
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
