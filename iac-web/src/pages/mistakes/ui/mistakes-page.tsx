import {
  ArrowRight,
  LampCharge,
  MessageQuestion,
} from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ErrorState,
  LoadingState,
  formatAnswer,
} from '@/features/attempts/attempt-ui'
import { attemptKeys, getMistakes } from '@/features/attempts/api'
import type {
  AttemptMaterialType,
  AttemptReviewItem,
  MistakeReport,
} from '@/features/attempts/api'
import { getErrorMessage } from '@/lib/api/client'
import { MistakeRetryDialog } from '@/features/attempts/mistake-retry-dialog'

const cardClassName = 'gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none'

const materialTypeLabels: Record<AttemptMaterialType, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

type ObjectiveMistakes = {
  attemptId: string
  testTitle: string
  mistakes: AttemptReviewItem[]
}

export function MistakesPage() {
  const [retryItem, setRetryItem] = useState<{
    item: AttemptReviewItem
    testTitle: string
    attemptId?: string
    materialType?: AttemptMaterialType
  } | null>(null)

  const mistakesQuery = useQuery({
    queryKey: attemptKeys.mistakes,
    queryFn: ({ signal }) => getMistakes(signal),
  })

  if (mistakesQuery.isPending) {
    return <LoadingState label="Загружаем разборы…" />
  }
  if (mistakesQuery.isError) {
    return (
      <ErrorState
        title="Не удалось загрузить историю попыток"
        message={getErrorMessage(mistakesQuery.error)}
        onRetry={() => void mistakesQuery.refetch()}
      />
    )
  }

  const reports = mistakesQuery.data.items
  const objectiveGroups = groupObjectiveMistakes(reports)
  const aiReports = reports.filter(
    (report) => report.writingEvaluation || report.speakingEvaluation,
  )
  const totalMistakes = Array.from(objectiveGroups.values()).reduce(
    (sum, items) =>
      sum +
      items.reduce(
        (groupTotal, item) => groupTotal + item.mistakes.length,
        0,
      ),
    0,
  )

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.025em] text-[#111111]">
          Разберите свои ошибки
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#69696d]">
          Неверные ответы и подробный разбор критериев по всем завершённым попыткам.
        </p>
      </div>

      {totalMistakes === 0 && aiReports.length === 0 ? (
        <EmptyMistakesState />
      ) : (
        <>
          {Array.from(objectiveGroups.entries()).map(([materialType, items]) => (
            <section key={materialType} className="grid gap-3">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                {materialTypeLabels[materialType]}
              </h2>
              {items.map((entry) => (
                <Card key={entry.attemptId} className={cardClassName}>
                  <CardHeader className="border-b border-[#ededeb] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <CardTitle className="text-base tracking-[-0.02em]">
                        {entry.testTitle}
                      </CardTitle>
                      <ReviewLink attemptId={entry.attemptId} />
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 p-5">
                    {entry.mistakes.map((item) => (
                      <MistakeRow
                        key={item.questionId}
                        item={item}
                        onRetry={() =>
                          setRetryItem({
                            item,
                            testTitle: entry.testTitle,
                            attemptId: entry.attemptId,
                            materialType,
                          })
                        }
                      />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </section>
          ))}

          {aiReports.length > 0 ? (
            <section className="grid gap-3">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                Разбор критериев Writing и Speaking
              </h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {aiReports.map((report) => (
                  <AIEvaluationCard key={report.attempt.id} report={report} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {/* Интерактивное модальное окно разбора ошибки */}
      <MistakeRetryDialog
        item={retryItem?.item ?? null}
        open={Boolean(retryItem)}
        onOpenChange={(open) => {
          if (!open) setRetryItem(null)
        }}
        testTitle={retryItem?.testTitle}
        attemptId={retryItem?.attemptId}
        materialType={retryItem?.materialType}
      />
    </div>
  )
}

function groupObjectiveMistakes(reports: MistakeReport[]) {
  const groups = new Map<AttemptMaterialType, ObjectiveMistakes[]>()
  for (const report of reports) {
    const mistakes = report.review ?? []
    if (mistakes.length === 0) continue
    const materialType = report.attempt.materialType
    const items = groups.get(materialType) ?? []
    items.push({
      attemptId: report.attempt.id,
      testTitle: report.attempt.testTitle,
      mistakes,
    })
    groups.set(materialType, items)
  }
  return groups
}

function EmptyMistakesState() {
  return (
    <Card className={cardClassName}>
      <CardContent className="grid justify-items-center gap-3 p-10 text-center">
        <p className="font-semibold">Ошибок пока нет</p>
        <p className="text-sm text-[#69696d]">
          Пройдите первый тест, и сложные вопросы с подробным разбором появятся
          здесь.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="shadow-none">
            <Link to="/listening">Listening</Link>
          </Button>
          <Button asChild variant="outline" className="shadow-none">
            <Link to="/reading">Reading</Link>
          </Button>
          <Button asChild variant="outline" className="shadow-none">
            <Link to="/writing">Writing</Link>
          </Button>
          <Button asChild variant="outline" className="shadow-none">
            <Link to="/speaking">Speaking</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AIEvaluationCard({ report }: { report: MistakeReport }) {
  const evaluation = report.writingEvaluation ?? report.speakingEvaluation
  if (!evaluation) return null
  const isWriting = report.attempt.materialType === 'writing'
  const criteria: { label: string; criterion: { band: number; feedback: string } | undefined }[] = isWriting
    ? [
        { label: 'Task Response', criterion: report.writingEvaluation?.criteria.taskResponse },
        { label: 'Coherence', criterion: report.writingEvaluation?.criteria.coherence },
        { label: 'Lexical Resource', criterion: report.writingEvaluation?.criteria.lexicalResource },
        { label: 'Grammar', criterion: report.writingEvaluation?.criteria.grammar },
      ]
    : [
        { label: 'Fluency', criterion: report.speakingEvaluation?.criteria.fluency },
        { label: 'Lexical Resource', criterion: report.speakingEvaluation?.criteria.lexicalResource },
        { label: 'Grammar', criterion: report.speakingEvaluation?.criteria.grammar },
        { label: 'Pronunciation', criterion: report.speakingEvaluation?.criteria.pronunciation },
      ]

  return (
    <Card className={cardClassName}>
      <CardHeader className="border-b border-[#ededeb] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base tracking-[-0.02em]">
              <MessageQuestion className="size-4 text-[#3b82f6]" aria-hidden />
              {report.attempt.testTitle}
            </CardTitle>
            <p className="mt-1 text-sm text-[#69696d]">
              {materialTypeLabels[report.attempt.materialType]} · band{' '}
              {evaluation.overallBand.toFixed(1)}
            </p>
          </div>
          <ReviewLink attemptId={report.attempt.id} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-5">
        <p className="text-sm leading-6 text-[#4b5563]">{evaluation.summary}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {criteria.map(({ label, criterion }) =>
            criterion ? (
              <div key={label} className="rounded-[10px] bg-[#fafaf8] p-3">
                <p className="flex items-center justify-between gap-2 text-sm font-medium">
                  {label}
                  <span className="text-[#3b82f6]">{criterion.band.toFixed(1)}</span>
                </p>
                {criterion.feedback ? (
                  <p className="mt-1 text-xs leading-5 text-[#69696d]">
                    {criterion.feedback}
                  </p>
                ) : null}
              </div>
            ) : null,
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ReviewLink({ attemptId }: { attemptId: string }) {
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="shrink-0 shadow-none gap-1.5 rounded-[9px] border-[#dbeafe] bg-[#eff6ff] text-xs font-semibold text-[#1d4ed8] hover:bg-blue-100"
    >
      <Link to="/attempts/$attemptId" params={{ attemptId }}>
        Интерактивный разбор
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </Button>
  )
}

function MistakeRow({
  item,
  onRetry,
}: {
  item: AttemptReviewItem
  onRetry: () => void
}) {
  return (
    <div
      onClick={onRetry}
      className="group grid gap-2.5 rounded-[12px] border border-[#ededeb] bg-white p-4 text-sm transition-all hover:border-[#3b82f6] hover:shadow-xs cursor-pointer"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
          <span className="mr-2 text-[#3b82f6]">{item.number}.</span>
          {item.prompt.replace('{{answer}}', '_____')}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            onRetry()
          }}
          className="h-8 shrink-0 gap-1.5 rounded-[8px] border-blue-200 bg-blue-50/70 text-xs font-semibold text-[#1d4ed8] hover:bg-blue-100 shadow-none"
        >
          <LampCharge className="size-3.5 text-[#2563eb]" />
          Разобрать ошибку
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          Ваш ответ:{' '}
          <strong className="text-slate-900 line-through">
            {formatAnswer(item.answer, [])}
          </strong>
        </span>
        <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-700 border border-rose-200 text-[11px]">
          Ошибка (0 б.)
        </span>
      </div>
    </div>
  )
}
