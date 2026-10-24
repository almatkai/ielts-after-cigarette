import { useState } from 'react'
import { ArrowLeft2 } from 'iconsax-react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Disclosure } from '@/components/ui/disclosure'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/features/auth/auth-store'
import {
  useLearning,
  useLearningSession,
  useLearningWriter,
} from '@/features/study-plan/learning-queries'
import {
  startLearningDrill,
  submitLearningSession,
} from '@/features/study-plan/learning-api'
import type {
  Learning,
  LearningDrill,
  LearningSession,
} from '@/features/study-plan/learning-api'
import { useLearningDraft } from '@/features/study-plan/learning-draft'
import {
  AnswerFields,
  LearningAudio,
  LearningLoad,
  LearningSteps,
  SourceDate,
  VerdictNotice,
  MutationError,
  OwnedRecordingChoice,
  PlainStimulus,
  ReadOnlyNotice,
  learningLayout,
  learningLink,
  skillLabels,
} from '@/features/study-plan/learning-ui'
import { planCard } from '@/features/study-plan/summary'
import { actionClass } from '@/features/study-plan/controls'

type DrillContext = { cycle?: string; assignment?: string; session?: string }
export function parseLearningSearch(
  search: Record<string, unknown>,
): DrillContext {
  const id = (value: unknown) =>
    typeof value === 'string' && /^[a-zA-Z0-9_-]{1,200}$/.test(value)
      ? value
      : undefined
  return {
    cycle: id(search.cycle),
    assignment: id(search.assignment),
    session: id(search.session),
  }
}
export function LearningDrillPage() {
  const { drillId } = useParams({
    from: '/_app/plan_/learning_/drills/$drillId',
  })
  const search = useSearch({ from: '/_app/plan_/learning_/drills/$drillId' })
  const { user } = useAuth()
  const learning = useLearning()
  const session = useLearningSession(search.session)
  if (!user) return null
  if (
    learning.isPending ||
    learning.isError ||
    (search.session && (session.isPending || session.isError))
  )
    return (
      <LearningLoad
        pending={learning.isPending || (!!search.session && session.isPending)}
        error={learning.error ?? session.error}
        retry={() => {
          void learning.refetch()
          if (search.session) void session.refetch()
        }}
        label="Загружаем тренировку…"
      />
    )
  const drill =
    session.data?.drill ?? learning.data.drills.find((d) => d.id === drillId)
  if (!drill)
    return (
      <div className={learningLayout}>
        <p>Тренировка не найдена или принадлежит другому аккаунту.</p>
        <Button asChild variant="ghost" className="mb-2 min-h-11 -ml-3">
          <Link to="/plan/learning">
            <ArrowLeft2 size={16} aria-hidden="true" />
            Работа над ошибками
          </Link>
        </Button>
      </div>
    )
  return (
    <DrillContent
      key={`${user.id}:${drill.id}:${search.session ?? 'intro'}:${search.cycle ?? ''}:${search.assignment ?? ''}`}
      userId={user.id}
      data={learning.data}
      drill={drill}
      session={session.data}
      context={search}
    />
  )
}
function DrillContent({
  userId,
  data,
  drill,
  session,
  context,
}: {
  userId: string
  data: Learning
  drill: LearningDrill
  session?: LearningSession
  context: DrillContext
}) {
  const writer = useLearningWriter()
  const navigate = useNavigate()
  const { draft, edit, clear } = useLearningDraft(
    userId,
    session
      ? `session:${session.id}`
      : `start:${drill.id}:${context.cycle ?? ''}:${context.assignment ?? ''}`,
  )
  const [freeStartOpen, setFreeStartOpen] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const needsListeningAudio =
    drill.section === 'listening' && drill.modality === 'audio'
  const objective = drill.section === 'reading' || drill.section === 'listening'
  const needsRecording =
    drill.section === 'speaking' && drill.modality === 'audio'
  const ws = drill.section === 'writing' || drill.section === 'speaking'
  const cycleId = session?.cycleId ?? context.cycle
  const requiresFreeStartConfirmation =
    drill.masteryEligible && !context.cycle && !context.assignment
  async function start(confirmed = false) {
    if (data.readOnly || session) return
    if (requiresFreeStartConfirmation && !confirmed) {
      setFreeStartOpen(true)
      return
    }
    const result = await writer.run(() =>
      startLearningDrill(drill.id, data.revision, draft.key, {
        ...(context.cycle ? { cycleId: context.cycle } : {}),
        ...(context.assignment ? { assignmentId: context.assignment } : {}),
      }),
    )
    if (result) {
      clear()
      await navigate({
        to: '/plan/learning/drills/$drillId',
        params: { drillId: result.drill.id },
        search: { ...context, session: result.id },
        replace: true,
      })
    }
  }
  async function submit() {
    if (
      !session ||
      draft.assisted === null ||
      !draft.text.trim() ||
      (needsRecording && !draft.audioAttemptId) ||
      (needsListeningAudio && !audioReady)
    )
      return
    const result = await writer.run(() =>
      submitLearningSession(session.id, session.revision, draft.key, {
        text: draft.text,
        explanation: draft.explanation,
        assisted: draft.assisted!,
        ...(needsRecording ? { audioAttemptId: draft.audioAttemptId } : {}),
      }),
    )
    if (result) clear()
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
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
            {drill.title}
          </h1>
          <span className="shrink-0 text-xs text-muted-foreground">
            ≈ {drill.durationMinutes} мин
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {skillLabels[drill.section]}
        </p>
      </header>
      <LearningSteps
        step={2}
        complete={
          session?.status === 'submitted' &&
          session.independent &&
          session.verdict === 'correct'
        }
      />
      {data.readOnly ? <ReadOnlyNotice /> : null}
      <section className={`${planCard} grid gap-4 p-4 sm:p-6`}>
        {!/IELTS|валидирован/i.test(drill.introduction) ? (
          <p className="leading-6">{drill.introduction}</p>
        ) : null}
        {!session ? (
          <>
            <p className="font-medium">Проверок пока нет</p>
            {data.readOnly ? (
              <>
                <PlainStimulus text={drill.stimulus} />
                <p className="whitespace-pre-wrap">{drill.task}</p>
              </>
            ) : (
              <Button
                className={`${actionClass} justify-self-start bg-[#3b82f6] hover:bg-[#2563eb]`}
                disabled={writer.pending}
                onClick={() => void start()}
              >
                {writer.pending
                  ? 'Открываем…'
                  : writer.error
                    ? 'Отправить снова'
                    : 'Начать'}
              </Button>
            )}
            <MutationError error={writer.error} />
          </>
        ) : (
          <>
            <PlainStimulus text={drill.stimulus} />
            <p className="whitespace-pre-wrap font-medium leading-7">
              {drill.task}
            </p>
            {drill.section === 'listening' && drill.modality === 'audio' ? (
              drill.audioUrl ? (
                <LearningAudio
                  url={drill.audioUrl}
                  onReadyChange={setAudioReady}
                />
              ) : (
                <p>
                  Для этого задания аудио сейчас недоступно. Вернитесь к нему
                  позже.
                </p>
              )
            ) : null}
            {session.status === 'submitted' ? (
              <div className="grid gap-3 border-t border-[#ededeb] pt-5">
                <VerdictNotice
                  verdict={session.verdict}
                  title={
                    session.verdict === 'correct'
                      ? 'Ответ верный'
                      : session.verdict === 'incorrect'
                        ? 'Ответ не совпал с ключом'
                        : 'Ответ сохранён, не проверен'
                  }
                >
                  <p>
                    {session.independent && session.verdict === 'correct'
                      ? 'Засчитано как независимая проверка.'
                      : `Практика: ${session.independenceReason || 'независимая проверка не подтверждена'}`}
                  </p>
                  <p className="whitespace-pre-wrap leading-6">
                    {session.feedback ?? 'Разбор ещё готовится'}
                  </p>
                </VerdictNotice>
                <p className="text-xs text-muted-foreground">
                  Отправлено <SourceDate value={session.submittedAt ?? ''} />
                </p>
                <h3 className="font-medium">Ваш сохранённый ответ</h3>
                <p className="whitespace-pre-wrap leading-6">{session.text}</p>
                {session.explanation ? (
                  <p className="whitespace-pre-wrap text-xs leading-6">
                    {session.explanation}
                  </p>
                ) : null}
                <p className="text-xs">
                  {session.assisted ? 'С подсказкой' : 'Сам, без подсказок'}
                </p>
                {session.audioAttemptId ? (
                  <Link
                    to="/attempts/$attemptId"
                    params={{ attemptId: session.audioAttemptId }}
                    className={learningLink}
                  >
                    Ваша связанная аудиозапись
                  </Link>
                ) : null}
                {cycleId ? (
                  <Link
                    to="/plan/learning/cycles/$cycleId"
                    params={{ cycleId }}
                    className={learningLink}
                  >
                    Вернуться к циклу
                  </Link>
                ) : (
                  <Link
                    to="/plan"
                    search={{ view: 'day' }}
                    className={learningLink}
                  >
                    Вернуться к плану
                  </Link>
                )}
              </div>
            ) : data.readOnly ? (
              <div className="grid gap-3">
                <p>Незавершённый ответ доступен только для просмотра.</p>
                <p className="whitespace-pre-wrap leading-6">
                  {draft.text || session.text || 'Ответ пока не введён.'}
                </p>
                {draft.explanation ? (
                  <p className="whitespace-pre-wrap text-xs leading-6">
                    {draft.explanation}
                  </p>
                ) : null}
              </div>
            ) : (
              <form
                className="grid gap-4 border-t border-[#ededeb] pt-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  void submit()
                }}
              >
                {needsRecording ? (
                  <OwnedRecordingChoice
                    value={draft.audioAttemptId}
                    onChange={(audioAttemptId) => {
                      if (audioAttemptId !== draft.audioAttemptId)
                        edit({ audioAttemptId })
                    }}
                  />
                ) : null}
                <AnswerFields
                  draft={draft}
                  edit={edit}
                  objective={objective}
                  questionType={drill.skillId}
                  section={drill.section}
                />
                <MutationError error={writer.error} />
                <p className="text-xs leading-5 text-[#69696d]">
                  Черновик сохраняется на этом устройстве для вашего аккаунта до
                  отправки.
                </p>
                <Button
                  type="submit"
                  className={`${actionClass} justify-self-start bg-[#3b82f6] hover:bg-[#2563eb]`}
                  disabled={
                    writer.pending ||
                    !draft.text.trim() ||
                    draft.assisted === null ||
                    (needsRecording && !draft.audioAttemptId) ||
                    (needsListeningAudio && !audioReady)
                  }
                >
                  {writer.pending
                    ? 'Отправляем…'
                    : writer.error
                      ? 'Отправить снова'
                      : objective
                        ? 'Проверить'
                        : 'Отправить ответ'}
                </Button>
              </form>
            )}
          </>
        )}
      </section>
      <Disclosure
        title="Подробнее о проверке и источниках"
        className="text-xs leading-6 text-muted-foreground"
      >
        <div className="grid gap-3">
          <p>Время — ориентир, оно ничего не блокирует.</p>

          <div className="space-y-2 pb-2">
            {/IELTS|валидирован/i.test(drill.introduction) ? (
              <p>{drill.introduction}</p>
            ) : null}

            {ws ? (
              <p>
                Короткая тренировка, не полный Writing/Speaking. Балл не
                выставляется. Автоматический разбор не проверен специалистом.
              </p>
            ) : null}
            {drill.editorialStatus === 'draft' ? (
              <p>
                Материал ещё не проверен редактором — результат считается
                практикой.
              </p>
            ) : null}
            {!drill.masteryEligible ? (
              <p className="text-xs leading-5 text-[#69696d]">
                Не засчитывается в правило проверки.
              </p>
            ) : null}
            {drill.modality === 'script' ? (
              <p>
                Аудио отсутствует. Это чтение сценария, практика, не
                свидетельство Listening.
              </p>
            ) : null}
            {drill.section === 'speaking' && drill.modality === 'typed' ? (
              <p>Текстовый ответ — не свидетельство речи и произношения.</p>
            ) : null}
            <p>Учебные результаты не являются оценкой IELTS.</p>
          </div>

          <p>{drill.rightsProvenance}</p>
          <p>
            Версия: {drill.version} · семейство:{' '}
            {drill.familyId ?? 'не размечено'}
          </p>
          {drill.sourceMaterialId ? (
            <p>
              Материал: {drill.sourceMaterialId} · версия источника:{' '}
              {drill.sourceVersionId ?? 'не указана'} · вопрос:{' '}
              {drill.sourceQuestionId ?? 'не указан'}
            </p>
          ) : null}
        </div>
      </Disclosure>
      <AlertDialog open={freeStartOpen} onOpenChange={setFreeStartOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Начать этот материал как свободную практику?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Эта работа может понадобиться для независимой проверки. После
              просмотра/начала семейство перестанет считаться новым.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={actionClass}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              className={actionClass}
              disabled={writer.pending || data.readOnly}
              onClick={() => void start(true)}
            >
              Начать свободную практику
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
