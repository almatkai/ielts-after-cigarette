import { useState } from 'react'
import { ArrowLeft2, Clock, CloseCircle, TickCircle } from 'iconsax-react'
import { Link, useParams } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Disclosure } from '@/components/ui/disclosure'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/features/auth/auth-store'
import {
  correctLearningCycle,
  skipLearningCycle,
  viewLearningCycle,
} from '@/features/study-plan/learning-api'
import type {
  Learning,
  LearningCycle,
} from '@/features/study-plan/learning-api'
import {
  useLearning,
  useLearningCycle,
  useLearningWriter,
} from '@/features/study-plan/learning-queries'
import { useLearningDraft } from '@/features/study-plan/learning-draft'
import {
  AnswerFields,
  LearningLoad,
  LearningSteps,
  VerdictNotice,
  Limitations,
  MutationError,
  PlainStimulus,
  ReadOnlyNotice,
  RuleStatus,
  SourceDate,
  SourceWorkLink,
  learningLayout,
  skillLabels,
} from '@/features/study-plan/learning-ui'
import { planCard } from '@/features/study-plan/summary'
import { actionClass } from '@/features/study-plan/controls'
import { formatCalendar } from '@/features/study-plan/calendar'
import {
  learningSkillTitle,
  sourceQuestionLabel,
  sourceStimulusText,
} from '@/features/study-plan/learning-labels'
import { useStudyPlan } from '@/features/study-plan/queries'

export function LearningCyclePage() {
  const { cycleId } = useParams({
    from: '/_app/plan_/learning_/cycles/$cycleId',
  })
  const { user } = useAuth()
  const learning = useLearning()
  const query = useLearningCycle(cycleId)
  if (!user) return null
  if (
    learning.isPending ||
    query.isPending ||
    learning.isError ||
    query.isError
  )
    return (
      <LearningLoad
        pending={learning.isPending || query.isPending}
        error={query.error ?? learning.error}
        retry={() => {
          void learning.refetch()
          void query.refetch()
        }}
        label="Загружаем цикл…"
      />
    )
  return (
    <CycleContent
      key={`${user.id}:${cycleId}`}
      userId={user.id}
      data={learning.data}
      cycle={query.data}
      refresh={() => void query.refetch()}
    />
  )
}
function CycleContent({
  userId,
  data,
  cycle,
  refresh,
}: {
  userId: string
  data: Learning
  cycle: LearningCycle
  refresh: () => void
}) {
  const writer = useLearningWriter()
  const { draft, edit, clear } = useLearningDraft(userId, `cycle:${cycle.id}`)
  const [skipOpen, setSkipOpen] = useState(false)
  const [skipKey] = useState(() => crypto.randomUUID())
  const [retryCorrection, setRetryCorrection] = useState(false)
  const plan = useStudyPlan()
  const scheduledDay = plan.data?.plan?.days.find(
    (day) =>
      day.date >= data.today &&
      day.assignments.some(
        (assignment) =>
          assignment.kind === 'DRILL' &&
          assignment.cycleId === cycle.id &&
          assignment.drillId === cycle.nextDrillId &&
          (assignment.status === 'PLANNED' ||
            assignment.status === 'IN_PROGRESS'),
      ),
  )
  const scheduledDate = scheduledDay?.date
  const scheduledAssignment = scheduledDay?.assignments.find(
    (assignment) =>
      assignment.kind === 'DRILL' &&
      assignment.cycleId === cycle.id &&
      assignment.drillId === cycle.nextDrillId &&
      (assignment.status === 'PLANNED' || assignment.status === 'IN_PROGRESS'),
  )
  const eligibilityDate = cycle.nextCheckDate
  const ws = cycle.section === 'writing' || cycle.section === 'speaking'
  const canRevise =
    !!cycle.correction &&
    (cycle.correction.verdict === 'incorrect' ||
      cycle.correction.assisted ||
      cycle.correction.verdict === 'unverified')
  const editable =
    !data.readOnly &&
    !cycle.skippedAt &&
    (!cycle.correction || (canRevise && retryCorrection))
  const source = cycle.source
  const stimulus = sourceStimulusText(source.stimulus)
  const answerFeedback = cycle.correction?.feedback
    .match(
      /(?:правильный ответ|верный ответ|правильно|correct answer)\s*:\s*([^\n]+)/i,
    )?.[1]
    ?.trim()
  const correctAnswer =
    answerFeedback?.match(/^(NOT GIVEN|TRUE|FALSE|YES|NO)\b/i)?.[1] ??
    answerFeedback
  async function submit() {
    if (
      draft.assisted === null ||
      !draft.text.trim() ||
      !draft.explanation.trim()
    )
      return
    const result = await writer.run(() =>
      correctLearningCycle(cycle.id, cycle.revision, draft.key, {
        text: draft.text,
        explanation: draft.explanation,
        assisted: draft.assisted!,
      }),
    )
    if (result) {
      clear()
      setRetryCorrection(false)
    }
  }
  return (
    <div className={learningLayout}>
      <header>
        <Button asChild variant="ghost" className="mb-2 min-h-11 -ml-3">
          <Link to="/plan/learning">
            <ArrowLeft2 size={16} aria-hidden="true" />
            Работа над ошибками
          </Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
          {skillLabels[cycle.section]} ·{' '}
          {learningSkillTitle(data, cycle.skillId)}
        </h1>
      </header>
      <LearningSteps
        targets={['#cycle-review', '#cycle-correction', '#cycle-transfer']}
        step={
          cycle.correction?.verdict === 'correct' &&
          !cycle.correction.assisted &&
          !retryCorrection
            ? 2
            : cycle.viewedAt ||
                cycle.correction ||
                draft.text.trim() ||
                draft.explanation.trim()
              ? 1
              : 0
        }
        complete={cycle.status === 'demonstrated'}
      />
      {data.readOnly ? <ReadOnlyNotice /> : null}
      <section className={`${planCard} grid min-w-0 lg:grid-cols-2`}>
        <div
          id="cycle-review"
          className="grid min-w-0 grid-cols-1 scroll-mt-5 gap-3 p-4 sm:p-5"
        >
          <h2 className="font-semibold">Разбор</h2>
          <p className="text-xs text-muted-foreground">
            {sourceQuestionLabel(data, source.questionType)} ·{' '}
            <SourceDate value={source.occurredAt} /> ·{' '}
            {source.modality === 'audio'
              ? 'Аудиозапись'
              : source.modality === 'typed'
                ? 'Текстовый ответ'
                : 'Ответ на вопрос'}
          </p>
          {cycle.section === 'speaking' && source.modality === 'typed' ? (
            <p>Текстовый ответ — не свидетельство речи и произношения.</p>
          ) : null}
          <p
            className="truncate text-xs text-muted-foreground"
            title={stimulus}
          >
            {stimulus.replace(/\s+/g, ' ')}
          </p>
          <p className="whitespace-pre-wrap font-medium leading-6">
            {source.prompt}
          </p>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Ваш исходный ответ (только просмотр)
            </p>
            <p
              className={`mt-2 whitespace-pre-wrap leading-6 text-muted-foreground ${ws ? 'line-clamp-4' : 'line-through'}`}
              data-testid="original-answer"
            >
              {source.originalAnswer || 'Ответ отсутствовал'}
            </p>
          </div>
          {source.feedback ? (
            <p className="whitespace-pre-wrap leading-6 line-clamp-3">
              {source.feedback}
            </p>
          ) : (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Clock size={16} aria-hidden="true" />
              Разбор ещё готовится
            </p>
          )}
          {cycle.viewedAt ? (
            <p>
              <TickCircle
                size={16}
                aria-hidden="true"
                className="mr-1.5 inline text-green-700 dark:text-green-400"
              />
              Разбор просмотрен <SourceDate value={cycle.viewedAt} />
            </p>
          ) : !data.readOnly && !cycle.skippedAt ? (
            <Button
              variant="outline"
              className={`${actionClass} justify-self-start`}
              disabled={writer.pending}
              onClick={() =>
                void writer.run(() =>
                  viewLearningCycle(cycle.id, cycle.revision),
                )
              }
            >
              Отметить: разбор просмотрен
            </Button>
          ) : (
            <p>Разбор ещё не отмечен как просмотренный.</p>
          )}
        </div>
        <div
          id="cycle-correction"
          className="grid min-w-0 content-start scroll-mt-5 gap-4 border-t border-border p-4 sm:p-5 lg:border-t-0 lg:border-l"
        >
          <h2 className="font-semibold">Ваша правка</h2>
          {cycle.correction ? (
            <div className="grid gap-3">
              <p className="whitespace-pre-wrap leading-6">
                <span className="font-medium">Ваш ответ: </span>
                {cycle.correction.text}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {cycle.correction.explanation}
              </p>
              <VerdictNotice
                verdict={cycle.correction.verdict}
                title={`${cycle.correction.verdict === 'incorrect' ? 'Не совпало с ключом' : cycle.correction.verdict === 'correct' ? 'Совпало с ключом' : 'Правка сохранена, не проверена'}${cycle.correction.assisted ? ' · с подсказкой' : ''}`}
              >
                {correctAnswer ? <p>Правильно: {correctAnswer}</p> : null}
              </VerdictNotice>
              <p className="text-xs text-muted-foreground">
                Сохранено <SourceDate value={cycle.correction.savedAt} />
              </p>
              {canRevise &&
              !data.readOnly &&
              !cycle.skippedAt &&
              !retryCorrection ? (
                <Button
                  variant="outline"
                  className={`${actionClass} justify-self-start`}
                  disabled={writer.pending}
                  onClick={() => {
                    clear()
                    setRetryCorrection(true)
                  }}
                >
                  {cycle.correction.verdict === 'incorrect'
                    ? 'Исправить ещё раз'
                    : cycle.correction.assisted
                      ? 'Попробовать самостоятельно'
                      : 'Переработать правку'}
                </Button>
              ) : null}
            </div>
          ) : null}
          {editable ? (
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                void submit()
              }}
            >
              <AnswerFields
                draft={draft}
                edit={edit}
                objective={!ws}
                questionType={source.questionType}
                section={cycle.section}
                correction
              />
              <Button
                type="submit"
                className={`${actionClass} justify-self-start bg-primary hover:bg-primary/90`}
                disabled={
                  writer.pending ||
                  !draft.text.trim() ||
                  !draft.explanation.trim() ||
                  draft.assisted === null
                }
              >
                {writer.pending
                  ? 'Сохраняем…'
                  : writer.error
                    ? 'Отправить снова'
                    : ws
                      ? 'Сохранить правку'
                      : 'Проверить'}
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">
                Исходная работа и её результат не изменятся.
                {ws ? ' Правка сохранится без проверки.' : ''}
              </p>
            </form>
          ) : !cycle.correction ? (
            <p>
              {cycle.skippedAt
                ? 'Отложено вами. Цикл сохранён в истории.'
                : 'Правки пока нет.'}
            </p>
          ) : null}
          <MutationError error={writer.error} />
          {!data.readOnly && !cycle.skippedAt ? (
            <Button
              variant="ghost"
              className="min-h-11 justify-self-start text-xs text-muted-foreground"
              onClick={() => setSkipOpen(true)}
            >
              Отложить эту ошибку
            </Button>
          ) : null}
        </div>
        <div
          id="cycle-transfer"
          className="grid min-w-0 grid-cols-1 scroll-mt-5 gap-3 border-t border-border p-4 sm:p-5 lg:col-span-2"
        >
          <h2 className="font-semibold">Проверка на новом задании</h2>
          <div className="divide-y divide-border">
            {cycle.checks.map((check) => (
              <div className="grid gap-2 py-3" key={check.sessionId}>
                <p className="text-xs text-muted-foreground">
                  <SourceDate value={check.occurredAt} /> ·{' '}
                  {check.independent ? 'новое семейство материала' : 'практика'}
                  {check.delayed ? ' · отложенная проверка' : ''}
                </p>
                <p className="flex items-start gap-2">
                  {check.independent ? (
                    check.passed ? (
                      <TickCircle
                        size={16}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-green-700 dark:text-green-400"
                      />
                    ) : (
                      <CloseCircle
                        size={16}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-red-700 dark:text-red-400"
                      />
                    )
                  ) : (
                    <Clock
                      size={16}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-muted-foreground"
                    />
                  )}
                  {check.independent
                    ? check.passed
                      ? 'Ответ верный — засчитано по правилу практики'
                      : 'Ошибка повторилась на новом задании'
                    : `Практика, не засчитано: ${check.reason}`}
                </p>
                <Button asChild variant="outline" className="min-h-11">
                  <Link
                    to="/plan/learning/drills/$drillId"
                    params={{
                      drillId:
                        cycle.nextDrillId ??
                        data.drills.find((d) => d.skillId === cycle.skillId)
                          ?.id ??
                        'session',
                    }}
                    search={{ session: check.sessionId }}
                  >
                    Посмотреть ответ проверки
                  </Link>
                </Button>
              </div>
            ))}
          </div>
          {!cycle.checks.length ? <p>Проверок пока нет</p> : null}
          {cycle.status === 'demonstrated' ? (
            <p>Новые проверки по этому циклу не требуются.</p>
          ) : !cycle.correction ? (
            <p>Сначала сохраните собственную правку исходной ошибки.</p>
          ) : cycle.nextDrillId ? (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {scheduledDate ? (
                  <p>Проверка назначена на {formatCalendar(scheduledDate)}</p>
                ) : eligibilityDate ? (
                  <p>
                    Отложенная проверка — не раньше{' '}
                    {formatCalendar(eligibilityDate)}
                  </p>
                ) : (
                  <p>Дата пока не назначена.</p>
                )}
                {scheduledDate && scheduledDate > data.today ? (
                  <p>Проверка откроется в день назначения.</p>
                ) : (
                  <Button asChild variant="outline" className="min-h-11">
                    <Link
                      to="/plan/learning/drills/$drillId"
                      params={{ drillId: cycle.nextDrillId }}
                      search={{
                        cycle: cycle.id,
                        ...(scheduledAssignment
                          ? { assignment: scheduledAssignment.id }
                          : {}),
                      }}
                    >
                      {data.readOnly
                        ? 'Посмотреть тренировку'
                        : 'Следующая тренировка этого навыка'}
                    </Link>
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p>Подходящего нового задания пока нет.</p>
          )}
        </div>
      </section>
      <Disclosure
        title="Подробнее о проверке и источниках"
        className="text-xs leading-6"
      >
        <div className="grid min-w-0 gap-3">
          <h2 className="font-semibold">Исходный материал</h2>
          <PlainStimulus text={stimulus} />
          {ws ? (
            <div>
              <h3 className="font-medium">Полный исходный ответ</h3>
              <p className="whitespace-pre-wrap">
                {source.originalAnswer || 'Ответ отсутствовал'}
              </p>
            </div>
          ) : null}
          {source.feedback ? (
            <div>
              <h3 className="font-medium">Полный разбор</h3>
              <p className="whitespace-pre-wrap">{source.feedback}</p>
            </div>
          ) : null}
          {cycle.correction?.feedback &&
          cycle.correction.feedback !== source.feedback ? (
            <div>
              <h3 className="font-medium">Комментарий к правке</h3>
              <p className="whitespace-pre-wrap">{cycle.correction.feedback}</p>
            </div>
          ) : null}
          {ws ? (
            <p>
              Автоматический разбор, не проверен специалистом. Для Writing и
              Speaking нужна проверка специалистом; сейчас её нет.
            </p>
          ) : null}
          {cycle.correction ? (
            <p>
              Повторная правка начнёт проверки заново. Введите свой ответ и
              объяснение заново, укажите подсказки. Для правила нужны новые
              независимые проверки; прежние проверки сбросятся, а срок
              отложенной проверки начнётся заново.
            </p>
          ) : null}
          <RuleStatus
            data={data}
            section={cycle.section}
            skillId={cycle.skillId}
            sourceFamilyKnown={
              cycle.source.familyKnown && !!cycle.source.familyId
            }
            sourceModality={cycle.source.modality}
            complete={cycle.status === 'demonstrated'}
            remainingChecks={cycle.remainingChecks}
            delayed={cycle.checks.some(
              (c) => c.independent && c.passed && c.delayed,
            )}
          />
          <Limitations items={cycle.limitations} />
          <SourceWorkLink data={data} source={source} />
          <p>
            Материал: {source.materialId} · версия: {source.versionId} · вопрос:{' '}
            {source.questionId ?? 'разбор работы'}
          </p>
          <p>
            Модель: {source.provenance.model ?? 'Не указана'} · версия промпта:{' '}
            {source.provenance.promptVersion ?? 'Не указана'} · рубрика:{' '}
            {source.provenance.rubricVersion ?? 'Не указана'}
          </p>
          {!source.familyKnown ? (
            <p>Семейство материала не размечено.</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className={`${actionClass} justify-self-start`}
              onClick={refresh}
            >
              Обновить разбор
            </Button>
            <SourceWorkLink data={data} source={source}>
              Открыть разбор работы
            </SourceWorkLink>
          </div>
        </div>
      </Disclosure>
      <p className="text-xs leading-5 text-muted-foreground">
        Учебные результаты не являются оценкой IELTS.
      </p>
      <Dialog
        open={skipOpen}
        onOpenChange={(open) => {
          if (!writer.pending) setSkipOpen(open)
        }}
      >
        <DialogContent>
          <DialogTitle>Отложить эту ошибку?</DialogTitle>
          <DialogDescription>
            Цикл сохранится в истории. Новая такая же ошибка создаст новый цикл.
          </DialogDescription>
          <Button
            variant="outline"
            className={actionClass}
            disabled={writer.pending}
            onClick={() => setSkipOpen(false)}
          >
            Продолжить правку
          </Button>
          <Button
            className={actionClass}
            disabled={writer.pending || data.readOnly}
            onClick={() =>
              void writer
                .run(() => skipLearningCycle(cycle.id, cycle.revision, skipKey))
                .then((result) => {
                  if (result) setSkipOpen(false)
                })
            }
          >
            Отложить
          </Button>
          <MutationError error={writer.error} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
