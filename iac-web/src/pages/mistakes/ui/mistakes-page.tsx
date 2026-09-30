import {
  ArrowLeft,
  ArrowRight,
  LampCharge,
  MessageQuestion,
} from 'iconsax-react'
import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ErrorState,
  LoadingState,
  formatAnswer,
} from '@/features/attempts/attempt-ui'
import {
  attemptKeys,
  getMistakeDetail,
  listMistakeAttempts,
} from '@/features/attempts/api'
import type {
  AttemptMaterialType,
  AttemptReviewItem,
  MistakeAttempt,
  MistakeDetail,
} from '@/features/attempts/api'
import { getErrorMessage } from '@/lib/api/client'
import { MistakeRetryDialog } from '@/features/attempts/mistake-retry-dialog'
import {
  mistakeDetailCache,
  mistakeListCache,
} from '@/features/attempts/mistake-cache'
import { hydrateMistake, mistakeCountLabel } from '../model'

const routeApi = getRouteApi('/_app/mistakes')
const cardClassName = 'gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none'
const materialTypeLabels: Record<AttemptMaterialType, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
}
const skills: AttemptMaterialType[] = [
  'reading',
  'listening',
  'writing',
  'speaking',
]
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function MistakesPage() {
  const { skill, page, attempt } = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const queryClient = useQueryClient()
  const isRefreshing = useIsFetching({ queryKey: attemptKeys.mistakes }) > 0
  const listQuery = useQuery({
    queryKey: attemptKeys.mistakeList(skill, page),
    queryFn: ({ signal }) => listMistakeAttempts(skill, page, signal),
    ...mistakeListCache,
  })
  const selected = listQuery.data?.items.find((item) => item.id === attempt)

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.025em] text-[#111111]">
            Банк ошибок
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#69696d]">
            Выберите попытку и разберите вопросы, которые вызвали трудности.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shadow-none"
          disabled={isRefreshing}
          aria-label="Обновить банк ошибок"
          onClick={() =>
            void queryClient.invalidateQueries({
              queryKey: attemptKeys.mistakes,
            })
          }
        >
          {isRefreshing ? 'Обновляем…' : 'Обновить'}
        </Button>
      </div>

      <nav
        aria-label="Навык"
        className="flex gap-1 overflow-x-auto rounded-[12px] bg-[#f0f0ed] p-1"
      >
        {skills.map((value) => (
          <Button
            key={value}
            variant="ghost"
            aria-current={skill === value ? 'page' : undefined}
            className={`min-w-0 flex-1 rounded-[9px] px-4 shadow-none ${skill === value ? 'bg-white text-[#111111] hover:bg-white' : 'text-[#69696d]'}`}
            onClick={() => void navigate({ search: { skill: value, page: 1 } })}
          >
            {materialTypeLabels[value]}
          </Button>
        ))}
      </nav>

      {attempt ? (
        <AttemptMistakes
          key={attempt}
          attemptId={attempt}
          selected={selected}
          skill={skill}
          onBack={() => void navigate({ search: { skill, page } })}
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 text-sm text-[#69696d]">
            <p>
              {skill === 'reading' || skill === 'listening'
                ? 'Попытки с ошибками'
                : 'Завершённые разборы'}
            </p>
            <p>Последние сначала</p>
          </div>
          {listQuery.isPending ? (
            <LoadingState label="Загружаем попытки…" />
          ) : listQuery.isError ? (
            <ErrorState
              title="Не удалось загрузить попытки"
              message={getErrorMessage(listQuery.error)}
              onRetry={() => void listQuery.refetch()}
            />
          ) : listQuery.data.items.length === 0 ? (
            page === 1 ? (
              <EmptyMistakesState skill={skill} />
            ) : (
              <Card className={cardClassName}>
                <CardContent className="grid gap-3 p-6">
                  <p className="text-sm text-[#69696d]">
                    На этой странице больше нет попыток.
                  </p>
                  <Button
                    variant="outline"
                    className="w-fit shadow-none"
                    onClick={() =>
                      void navigate({ search: { skill, page: 1 } })
                    }
                  >
                    К первой странице
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className={`${cardClassName} overflow-hidden`}>
              <CardContent className="divide-y divide-[#ededeb] p-0">
                {listQuery.data.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6"
                  >
                    <div className="min-w-0 flex-1 basis-[200px]">
                      <h3 className="break-words text-sm font-semibold text-[#111111]">
                        {item.testTitle || 'Без названия'}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-[#69696d]">
                        {dateFormatter.format(
                          new Date(item.submittedAt ?? item.startedAt),
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-sm font-medium ${item.mistakeCount !== null ? 'text-rose-700' : 'text-[#1d4ed8]'}`}
                      >
                        {item.mistakeCount !== null
                          ? mistakeCountLabel(item.mistakeCount)
                          : `Band ${item.band?.toFixed(1) ?? '—'}`}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-[9px] shadow-none"
                        onClick={() =>
                          void navigate({
                            search: { skill, page, attempt: item.id },
                          })
                        }
                      >
                        {item.mistakeCount !== null
                          ? 'Разобрать'
                          : 'Посмотреть разбор'}
                        <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {!listQuery.isPending &&
          !listQuery.isError &&
          (page > 1 || listQuery.data.hasNext) ? (
            <div
              className="flex items-center justify-between gap-3"
              aria-label="Страницы попыток"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                className="gap-2 shadow-none"
                onClick={() =>
                  void navigate({ search: { skill, page: page - 1 } })
                }
              >
                <ArrowLeft className="size-4" aria-hidden />
                Назад
              </Button>
              <p className="text-sm text-[#69696d]">Страница {page}</p>
              <Button
                variant="outline"
                size="sm"
                disabled={!listQuery.data.hasNext || page >= 100000}
                className="gap-2 shadow-none"
                onClick={() =>
                  void navigate({ search: { skill, page: page + 1 } })
                }
              >
                Далее
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function AttemptMistakes({
  attemptId,
  selected,
  skill,
  onBack,
}: {
  attemptId: string
  selected?: MistakeAttempt
  skill: AttemptMaterialType
  onBack: () => void
}) {
  const [retryIndex, setRetryIndex] = useState<number | null>(null)
  const detailQuery = useQuery({
    queryKey: attemptKeys.mistakeDetail(attemptId),
    queryFn: ({ signal }) => getMistakeDetail(attemptId, signal),
    ...mistakeDetailCache,
  })
  const detail = detailQuery.data
  const materialType = detail?.attempt.materialType ?? skill
  const retryItem =
    detail && retryIndex !== null ? hydrateMistake(detail, retryIndex) : null

  return (
    <section className="grid gap-4">
      <Button
        variant="ghost"
        className="w-fit gap-2 px-0 text-[#69696d] hover:bg-transparent hover:text-[#111111]"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" aria-hidden />К списку попыток
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold tracking-[-0.02em]">
            {selected?.testTitle || 'Разбор попытки'}
          </h3>
          <p className="mt-1 text-sm text-[#69696d]">
            {materialTypeLabels[materialType]}
            {detail &&
            (materialType === 'reading' || materialType === 'listening')
              ? ` · ${mistakeCountLabel(detail.review.length)}`
              : ''}
          </p>
        </div>
        <ReviewLink attemptId={attemptId} />
      </div>
      {detailQuery.isPending ? (
        <LoadingState label="Загружаем разбор этой попытки…" />
      ) : detailQuery.isError ? (
        <ErrorState
          title="Не удалось загрузить разбор"
          message={getErrorMessage(detailQuery.error)}
          onRetry={() => void detailQuery.refetch()}
        />
      ) : (
        <>
          {detailQuery.data.review.length > 0 ? (
            <Card className={cardClassName}>
              <CardContent className="grid gap-3 p-4 sm:p-5">
                {detailQuery.data.review.map((item, index) => (
                  <MistakeRow
                    key={item.questionId}
                    item={item}
                    onRetry={() => setRetryIndex(index)}
                  />
                ))}
              </CardContent>
            </Card>
          ) : null}
          <AIEvaluationCard detail={detailQuery.data} skill={materialType} />
          {detailQuery.data.review.length === 0 &&
          !detailQuery.data.writingEvaluation &&
          !detailQuery.data.speakingEvaluation ? (
            <p className="py-6 text-sm text-[#69696d]">
              В этой попытке нет ошибок для разбора.
            </p>
          ) : null}
        </>
      )}
      <MistakeRetryDialog
        item={retryItem}
        open={retryItem !== null}
        onOpenChange={(open) => {
          if (!open) setRetryIndex(null)
        }}
        testTitle={selected?.testTitle}
        attemptId={attemptId}
        materialType={materialType}
      />
    </section>
  )
}

function EmptyMistakesState({ skill }: { skill: AttemptMaterialType }) {
  const objective = skill === 'reading' || skill === 'listening'
  return (
    <Card className={cardClassName}>
      <CardContent className="grid justify-items-center gap-3 p-10 text-center">
        <p className="font-semibold">
          {objective
            ? `В ${materialTypeLabels[skill]} ошибок пока нет`
            : `Разборов ${materialTypeLabels[skill]} пока нет`}
        </p>
        <p className="max-w-md text-sm leading-6 text-[#69696d]">
          {objective
            ? 'Здесь появятся завершённые попытки с неверными или пропущенными ответами.'
            : 'Здесь появятся оценки и обратная связь по завершённым попыткам.'}
        </p>
        <Button asChild variant="outline" className="shadow-none">
          <Link to={`/${skill}`}>Перейти к {materialTypeLabels[skill]}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function AIEvaluationCard({
  detail,
  skill,
}: {
  detail: MistakeDetail
  skill: AttemptMaterialType
}) {
  const evaluation = detail.writingEvaluation ?? detail.speakingEvaluation
  if (!evaluation) return null
  const isSpeaking = skill === 'speaking' || Boolean(detail.speakingEvaluation)
  const isPronunciationAvailable = Boolean(
    detail.speakingEvaluation?.pronunciationAvailable &&
    detail.speakingEvaluation.criteria.pronunciation.band > 0,
  )
  const criteria = detail.writingEvaluation
    ? [
        {
          label: 'Task Response',
          criterion: detail.writingEvaluation.criteria.taskResponse,
          unavailable: false,
          feedback: detail.writingEvaluation.criteria.taskResponse.feedback,
        },
        {
          label: 'Coherence',
          criterion: detail.writingEvaluation.criteria.coherence,
          unavailable: false,
          feedback: detail.writingEvaluation.criteria.coherence.feedback,
        },
        {
          label: 'Lexical Resource',
          criterion: detail.writingEvaluation.criteria.lexicalResource,
          unavailable: false,
          feedback: detail.writingEvaluation.criteria.lexicalResource.feedback,
        },
        {
          label: 'Grammar',
          criterion: detail.writingEvaluation.criteria.grammar,
          unavailable: false,
          feedback: detail.writingEvaluation.criteria.grammar.feedback,
        },
      ]
    : [
        {
          label: 'Fluency & Coherence',
          criterion: detail.speakingEvaluation?.criteria.fluency,
          unavailable: false,
          feedback: detail.speakingEvaluation?.criteria.fluency.feedback,
        },
        {
          label: 'Lexical Resource',
          criterion: detail.speakingEvaluation?.criteria.lexicalResource,
          unavailable: false,
          feedback:
            detail.speakingEvaluation?.criteria.lexicalResource.feedback,
        },
        {
          label: 'Grammar Range & Accuracy',
          criterion: detail.speakingEvaluation?.criteria.grammar,
          unavailable: false,
          feedback: detail.speakingEvaluation?.criteria.grammar.feedback,
        },
        {
          label: 'Pronunciation',
          criterion: detail.speakingEvaluation?.criteria.pronunciation,
          unavailable: !isPronunciationAvailable,
          feedback: !isPronunciationAvailable
            ? 'Наша система пока не может определить Pronunciation (произношение). Оценка сформирована по беглости, словарному запасу и грамматической точности.'
            : detail.speakingEvaluation?.criteria.pronunciation.feedback,
        },
      ]

  return (
    <Card className={cardClassName}>
      <CardHeader className="border-b border-[#ededeb] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base tracking-[-0.02em]">
            <MessageQuestion className="size-4 text-[#3b82f6]" aria-hidden />
            {materialTypeLabels[skill]} · Band{' '}
            {evaluation.overallBand.toFixed(1)}
          </CardTitle>
          {isSpeaking && !isPronunciationAvailable ? (
            <span className="text-xs text-[#69696d]">
              Оценка по 3 критериям (произношение пока не определяется нашей
              системой)
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-5">
        <p className="text-sm leading-6 text-[#4b5563]">{evaluation.summary}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {criteria.map(({ label, criterion, unavailable, feedback }) =>
            criterion ? (
              <div
                key={label}
                className={`rounded-[10px] p-4 ${
                  unavailable
                    ? 'border border-amber-200/80 bg-amber-50/20'
                    : 'bg-[#fafaf8]'
                }`}
              >
                <p className="flex items-center justify-between gap-2 text-sm font-medium">
                  {label}
                  {unavailable ? (
                    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      Пока не определяется
                    </span>
                  ) : (
                    <span className="text-[#3b82f6]">
                      {criterion.band.toFixed(1)}
                    </span>
                  )}
                </p>
                {feedback ? (
                  <p className="mt-2 text-sm leading-6 text-[#69696d]">
                    {feedback}
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
      className="shrink-0 gap-1.5 rounded-[9px] shadow-none"
    >
      <Link to="/attempts/$attemptId" params={{ attemptId }}>
        Полный разбор
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
    <button
      type="button"
      onClick={onRetry}
      className="group grid w-full gap-2.5 rounded-[12px] border border-[#ededeb] bg-white p-4 text-left text-sm transition-colors hover:border-[#3b82f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b82f6]"
    >
      <span className="flex flex-wrap items-center justify-between gap-3">
        <span className="min-w-0 flex-1 basis-[200px] font-semibold text-slate-900 group-hover:text-blue-900">
          <span className="mr-2 text-[#3b82f6]">{item.number}.</span>
          {item.prompt.replace('{{answer}}', '_____')}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#1d4ed8]">
          <LampCharge className="size-4" aria-hidden />
          Разобрать ошибку
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
        Ваш ответ:{' '}
        <strong className="text-slate-900 line-through">
          {formatAnswer(item.answer, [])}
        </strong>
        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
          Ошибка
        </span>
      </span>
    </button>
  )
}
