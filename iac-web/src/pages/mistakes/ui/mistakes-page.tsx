import { AttemptLearningBridge } from '@/features/study-plan/attempt-learning-bridge'
import { WritingReview } from '@/features/attempts/writing-review'
import { ArrowLeft, ArrowRight, MessageQuestion } from 'iconsax-react'
import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import {
  attemptKeys,
  getMistakeDetail,
  listMistakeAttempts,
} from '@/features/attempts/api'
import type {
  AttemptMaterialType,
  MistakeAttempt,
  MistakeDetail,
} from '@/features/attempts/api'
import { getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'
import { MistakeRow } from '@/features/attempts/mistake-list'
import { MistakeRetryDialog } from '@/features/attempts/mistake-retry-dialog'
import {
  mistakeDetailCache,
  mistakeListCache,
} from '@/features/attempts/mistake-cache'
import { hydrateMistake, mistakeCountLabel } from '../model'

const routeApi = getRouteApi('/_app/mistakes')
const cardClassName = 'gap-0 rounded-[10px] border-border py-0 shadow-none'
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
  const { t } = useLanguage()
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
          <h2 className="text-lg font-semibold tracking-[-0.025em] text-foreground">
            {t('Банк ошибок')}
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shadow-none"
          disabled={isRefreshing}
          aria-label={t('Обновить банк ошибок')}
          onClick={() =>
            void queryClient.invalidateQueries({
              queryKey: attemptKeys.mistakes,
            })
          }
        >
          {isRefreshing ? t('Обновляем…') : t('Обновить')}
        </Button>
      </div>

      <nav
        aria-label={t('Навык')}
        className="flex gap-1 overflow-x-auto rounded-[10px] bg-muted p-1"
      >
        {skills.map((value) => (
          <Button
            key={value}
            variant="ghost"
            aria-current={skill === value ? 'page' : undefined}
            className={`min-w-0 flex-1 rounded-[9px] px-4 shadow-none ${skill === value ? 'bg-card text-foreground hover:bg-card' : 'text-muted-foreground'}`}
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
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>
              {skill === 'reading' || skill === 'listening'
                ? 'Попытки с ошибками'
                : 'Сохранённые работы'}
            </p>
            <p>{t('Последние сначала')}</p>
          </div>
          {listQuery.isPending ? (
            <LoadingState label={t('Загружаем попытки…')} />
          ) : listQuery.isError ? (
            <ErrorState
              title={t('Не удалось загрузить попытки')}
              message={getErrorMessage(listQuery.error)}
              onRetry={() => void listQuery.refetch()}
            />
          ) : listQuery.data.items.length === 0 ? (
            page === 1 ? (
              <EmptyMistakesState skill={skill} />
            ) : (
              <Card className={cardClassName}>
                <CardContent className="grid gap-3 p-6">
                  <p className="text-sm text-muted-foreground">
                    {t('На этой странице больше нет попыток.')}
                  </p>
                  <Button
                    variant="outline"
                    className="w-fit shadow-none"
                    onClick={() =>
                      void navigate({ search: { skill, page: 1 } })
                    }
                  >
                    {t('К первой странице')}
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className={`${cardClassName} overflow-hidden`}>
              <CardContent className="divide-y divide-border p-0">
                {listQuery.data.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-3 sm:px-6 sm:py-4"
                  >
                    <div className="min-w-0 flex-1 basis-[180px]">
                      <h3 className="break-words text-xs sm:text-sm font-semibold text-foreground">
                        {item.testTitle || t('Без названия')}
                      </h3>
                      <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs leading-4 sm:leading-5 text-muted-foreground">
                        {dateFormatter.format(
                          new Date(item.submittedAt ?? item.startedAt),
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-sm font-medium ${item.mistakeCount !== null ? 'text-destructive' : 'text-primary'}`}
                      >
                        {skill === 'writing' || skill === 'speaking'
                          ? 'Работа сохранена · без подтверждённой оценки IELTS'
                          : item.mistakeCount !== null
                            ? mistakeCountLabel(item.mistakeCount)
                            : 'Результат сохранён'}
                        {(skill === 'reading' || skill === 'listening') &&
                        typeof item.score === 'number' &&
                        typeof item.maxScore === 'number'
                          ? ` · ${item.score}/${item.maxScore}`
                          : ''}
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
                          ? t('Разобрать')
                          : t('Посмотреть разбор')}
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
              aria-label={t('Страницы попыток')}
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
                {t('Назад')}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t('Страница')} {page}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={!listQuery.data.hasNext || page >= 100000}
                className="gap-2 shadow-none"
                onClick={() =>
                  void navigate({ search: { skill, page: page + 1 } })
                }
              >
                {t('Далее')}
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
  const { t, language } = useLanguage()
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
  const nextIndex =
    detail && retryIndex !== null
      ? detail.review.findIndex(
          (item, index) =>
            index > retryIndex && !item.locked && Boolean(item.correctAnswer),
        )
      : -1

  return (
    <section className="grid gap-4">
      <Button
        variant="ghost"
        className="w-fit gap-2 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t('К списку попыток')}
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold tracking-[-0.02em]">
            {selected?.testTitle || t('Разбор попытки')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {materialTypeLabels[materialType]}
            {detail &&
            (materialType === 'reading' || materialType === 'listening')
              ? ` · ${mistakeCountLabel(detail.review.length, language)}`
              : ''}
          </p>
        </div>
        <ReviewLink attemptId={attemptId} />
      </div>
      {detailQuery.isPending ? (
        <LoadingState label={t('Загружаем разбор этой попытки…')} />
      ) : detailQuery.isError ? (
        <ErrorState
          title={t('Не удалось загрузить разбор')}
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
                    attemptId={attemptId}
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
            <p className="py-6 text-sm text-muted-foreground">
              {materialType === 'writing' || materialType === 'speaking'
                ? 'Разбор пока недоступен'
                : 'В этой попытке нет ошибок для разбора.'}
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
        onNext={nextIndex >= 0 ? () => setRetryIndex(nextIndex) : undefined}
      />
    </section>
  )
}

function EmptyMistakesState({ skill }: { skill: AttemptMaterialType }) {
  const { t } = useLanguage()
  const objective = skill === 'reading' || skill === 'listening'
  return (
    <Card className={cardClassName}>
      <CardContent className="grid justify-items-center gap-3 p-10 text-center">
        <p className="font-semibold">
          {objective
            ? t(`В ${materialTypeLabels[skill]} ошибок пока нет`)
            : t(`Разборов ${materialTypeLabels[skill]} пока нет`)}
        </p>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          {objective
            ? 'Здесь появятся завершённые попытки с неверными или пропущенными ответами.'
            : 'Здесь появятся комментарии к завершённым работам.'}
        </p>
        <Button asChild variant="outline" className="shadow-none">
          <Link to={`/${skill}`}>
            {t(`Перейти к ${materialTypeLabels[skill]}`)}
          </Link>
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
  if (detail.writingEvaluation) {
    return (
      <WritingReview
        attempt={{ ...detail.attempt, answers: detail.answers }}
        evaluation={detail.writingEvaluation}
      />
    )
  }
  const evaluation = detail.speakingEvaluation
  if (!evaluation) return null
  const criteria = [
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
      feedback: detail.speakingEvaluation?.criteria.lexicalResource.feedback,
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
      unavailable: !evaluation.pronunciationAvailable,
      feedback: evaluation.pronunciationAvailable
        ? evaluation.criteria.pronunciation.feedback
        : 'Произношение в этом разборе не определяется. Текст и расшифровка не подтверждают произношение.',
    },
  ]

  return (
    <Card className={cardClassName}>
      <CardHeader className="border-b border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base tracking-[-0.02em]">
            <MessageQuestion className="size-4 text-primary" aria-hidden />
            {materialTypeLabels[skill]} · учебный разбор
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-5">
        <section
          aria-label="Ограничения учебного разбора"
          className="grid gap-2 text-sm leading-6 text-muted-foreground"
        >
          <p>
            Автоматические комментарии не проверены специалистом и не являются
            оценкой IELTS.
          </p>
          <p>
            Текстовый ответ и расшифровка не подтверждают беглость и
            произношение. Наличие аудиозаписи и её анализ смотрите в полном
            разборе работы.
          </p>
        </section>
        <p className="text-sm leading-6 text-muted-foreground">
          {evaluation.summary}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {criteria.map(({ label, criterion, unavailable, feedback }) =>
            criterion ? (
              <div
                key={label}
                className={`rounded-[10px] p-4 ${
                  unavailable
                    ? 'border border-warning-bg/80 bg-warning-bg/20'
                    : 'bg-background'
                }`}
              >
                <p className="flex items-center justify-between gap-2 text-sm font-medium">
                  {label}
                  {unavailable ? (
                    <span className="text-xs text-muted-foreground">
                      Пока не определяется
                    </span>
                  ) : null}
                </p>
                {feedback ? (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {feedback}
                  </p>
                ) : null}
              </div>
            ) : null,
          )}
        </div>
        <AttemptLearningBridge attemptId={detail.attempt.id} />
      </CardContent>
    </Card>
  )
}

function ReviewLink({ attemptId }: { attemptId: string }) {
  const { t } = useLanguage()
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="shrink-0 gap-1.5 rounded-[9px] shadow-none"
    >
      <Link to="/attempts/$attemptId" params={{ attemptId }}>
        {t('Полный разбор')}
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </Button>
  )
}
