import { useState } from 'react'
import { ArrowLeft2 } from 'iconsax-react'
import { Link, getRouteApi } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Disclosure } from '@/components/ui/disclosure'
import { useLearning } from '@/features/study-plan/learning-queries'
import type {
  Learning,
  LearningCycle,
} from '@/features/study-plan/learning-api'
import {
  LearningLoad,
  Limitations,
  ReadOnlyNotice,
  CycleState,
  RuleStatus,
  SourceWorkLink,
  SourceDate,
  learningLayout,
  learningLink,
  skillLabels,
} from '@/features/study-plan/learning-ui'
import { planCard } from '@/features/study-plan/summary'
import { learningSkillTitle } from '@/features/study-plan/learning-labels'
import { actionClass } from '@/features/study-plan/controls'
import { matchesTask, taskTitle } from '@/features/study-plan/task-performance'
import { TaskPerformancePanel } from './task-performance-panel'

const routeApi = getRouteApi('/_app/plan_/learning')

function CycleRow({
  cycle,
  data,
  primary,
  hideState = false,
}: {
  cycle: LearningCycle
  data: Learning
  primary?: boolean
  hideState?: boolean
}) {
  const nextDrill = data.drills.find((drill) => drill.id === cycle.nextDrillId)
  const isCheck =
    cycle.source.familyKnown &&
    !!cycle.source.familyId &&
    cycle.source.modality !== 'script' &&
    !!nextDrill?.masteryEligible &&
    nextDrill.skillId === cycle.skillId &&
    nextDrill.section === cycle.section &&
    !!nextDrill.familyId &&
    nextDrill.familyId !== cycle.source.familyId &&
    nextDrill.editorialStatus === 'reviewed' &&
    nextDrill.modality !== 'script' &&
    (nextDrill.section === 'reading' || nextDrill.section === 'listening')
  return (
    <article
      className={`grid min-w-0 items-center gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] ${cycle.skippedAt ? 'opacity-60' : ''}`}
      data-testid="learning-cycle-row"
    >
      <div className="min-w-0">
        <Disclosure
          title={`${skillLabels[cycle.section]} · ${learningSkillTitle(data, cycle.skillId)}`}
          className="min-w-0 text-sm"
        >
          <div className="grid gap-2 py-2 text-xs leading-5">
            {cycle.source.feedback ? (
              <p>Почему: {cycle.source.feedback}</p>
            ) : null}
            <SourceWorkLink data={data} source={cycle.source} />
            <p className="text-muted-foreground">
              Материал: {cycle.source.materialId} · вопрос:{' '}
              {cycle.source.questionId ?? 'разбор работы'} · версия:{' '}
              {cycle.source.versionId}
            </p>
            <RuleStatus
              data={data}
              skillId={cycle.skillId}
              section={cycle.section}
              sourceFamilyKnown={
                cycle.source.familyKnown && !!cycle.source.familyId
              }
              sourceModality={cycle.source.modality}
              complete={cycle.status === 'demonstrated'}
              remainingChecks={cycle.remainingChecks}
              delayed={cycle.checks.some(
                (check) => check.independent && check.passed && check.delayed,
              )}
            />
          </div>
        </Disclosure>
        <div className="flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
          <p className="min-w-0 flex-1 truncate" title={cycle.source.prompt}>
            {cycle.source.prompt}
          </p>
          <span className="shrink-0">
            <SourceDate value={cycle.source.occurredAt} />
          </span>
        </div>
        {!hideState ? <CycleState cycle={cycle} /> : null}
      </div>
      {cycle.status === 'awaiting-transfer' &&
      cycle.nextDrillId &&
      !data.readOnly &&
      !cycle.skippedAt ? (
        <Button asChild variant="outline" className={actionClass}>
          <Link
            to="/plan/learning/drills/$drillId"
            params={{ drillId: cycle.nextDrillId }}
            search={{ cycle: cycle.id }}
          >
            {isCheck ? 'Начать проверку' : 'Начать тренировку'}
          </Link>
        </Button>
      ) : (
        <Button
          asChild
          variant={primary ? 'default' : 'outline'}
          className={`${actionClass} ${primary ? 'bg-[#3b82f6] hover:bg-[#2563eb]' : ''}`}
        >
          <Link
            to="/plan/learning/cycles/$cycleId"
            params={{ cycleId: cycle.id }}
          >
            {!data.readOnly &&
            !cycle.skippedAt &&
            (cycle.status === 'needs-practice' ||
              cycle.correction?.verdict === 'incorrect')
              ? 'Исправить'
              : 'Открыть'}
          </Link>
        </Button>
      )}
    </article>
  )
}
export function LearningPage() {
  const query = useLearning()
  const search = routeApi.useSearch()
  const [more, setMore] = useState(false)
  if (query.isPending || query.isError)
    return (
      <LearningLoad
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
        label="Загружаем работу над ошибками…"
      />
    )
  const data = query.data
  const filtered = !!(search.section || search.type)
  const cycles = data.cycles.filter((cycle) => matchesTask(cycle, search))
  const selectedTask = data.taskPerformance.find(
    (task) =>
      task.section === search.section && task.questionType === search.type,
  )
  const priorities = cycles.filter(
    (c) =>
      !c.skippedAt &&
      (c.status === 'needs-practice' || c.correction?.verdict === 'incorrect'),
  )
  const waiting = cycles.filter(
    (c) =>
      !c.skippedAt &&
      c.correction?.verdict !== 'incorrect' &&
      ['correction-saved', 'awaiting-transfer'].includes(c.status),
  )
  const demonstrated = cycles.filter(
    (c) => !c.skippedAt && c.status === 'demonstrated',
  )
  return (
    <div className={learningLayout}>
      <header>
        <Button asChild variant="ghost" className="mb-2 min-h-11 -ml-3">
          <Link to="/plan" search={{ view: 'day' }}>
            <ArrowLeft2 size={16} aria-hidden="true" />
            План
          </Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
          Работа над ошибками
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Разберите ошибку, исправьте ответ и проверьте себя на новом задании.
        </p>
      </header>
      <dl
        className="grid grid-cols-3 gap-3 border-y border-border py-4"
        aria-label="Сводка исправлений"
      >
        {[
          {
            label: 'Ждут правки',
            value: data.cycles.filter(
              (c) =>
                !c.skippedAt &&
                (c.status === 'needs-practice' ||
                  c.correction?.verdict === 'incorrect'),
            ).length,
          },
          {
            label: 'Правок сохранено',
            value: data.cycles.filter((c) => !!c.correction).length,
          },
          {
            label: 'Проверено на новых',
            value: data.cycles.filter((c) =>
              c.checks.some((check) => check.independent && check.passed),
            ).length,
          },
        ].map((item) => (
          <div key={item.label} className="flex min-w-0 flex-col gap-1">
            <dd className="order-first text-[28px] font-semibold leading-8 tabular-nums">
              {item.value}
            </dd>
            <dt className="text-xs text-muted-foreground sm:text-sm">
              {item.label}
            </dt>
          </div>
        ))}
      </dl>
      <TaskPerformancePanel tasks={data.taskPerformance} />
      {data.readOnly ? <ReadOnlyNotice /> : null}
      <div id="skill-cycles" className={filtered ? 'scroll-mt-5' : 'hidden'}>
        {filtered ? (
          <div className="mt-2 text-sm" role="status">
            <p>
              Карточки:{' '}
              {search.section ? skillLabels[search.section] : 'Все разделы'}
              {search.type
                ? ` · ${taskTitle(selectedTask ?? { title: '', questionType: search.type })}`
                : ''}{' '}
              · найдено: {cycles.length}
            </p>
            <Button asChild variant="ghost" className="min-h-11">
              <Link to="/plan/learning" search={{}}>
                Сбросить фильтр
              </Link>
            </Button>
            {!cycles.length && selectedTask && selectedTask.incorrect > 0 ? (
              <p>Для этих ошибок карточек правки пока нет.</p>
            ) : null}
          </div>
        ) : null}
      </div>
      {!data.cycles.length ? (
        <section className={`${planCard} p-4 sm:p-5`}>
          <p>
            Ошибок для работы пока нет. Они появятся после проверенных работ
            Reading или Listening либо после разбора Writing/Speaking.
          </p>
          <Button asChild variant="outline" className="mt-3 min-h-11">
            <Link to="/reading">Пройти Reading</Link>
          </Button>
        </section>
      ) : null}
      <section className={`${planCard} p-4 sm:p-5`}>
        <h2 className="text-base font-semibold">
          Ждут правки ({priorities.length})
        </h2>
        <div className="divide-y divide-[#ededeb]">
          {(more || filtered ? priorities : priorities.slice(0, 2)).map(
            (cycle, i) => (
              <CycleRow
                key={cycle.id}
                cycle={cycle}
                data={data}
                hideState
                primary={i === 0 && !data.readOnly}
              />
            ),
          )}
        </div>
        {!priorities.length ? (
          <p className="mt-4">Ошибок, ожидающих правки, нет.</p>
        ) : null}
        {priorities.length > 2 && !filtered ? (
          <Button
            variant="outline"
            className={`${actionClass} mt-3`}
            onClick={() => setMore(!more)}
          >
            {more ? 'Свернуть' : `Показать ещё ${priorities.length - 2}`}
          </Button>
        ) : null}
      </section>
      {[
        { title: 'Ждут проверки', cycles: waiting },
        { title: 'Показано на новых заданиях', cycles: demonstrated },
      ].map((group) =>
        group.cycles.length ? (
          <section key={group.title} className={`${planCard} p-4 sm:p-5`}>
            <h2 className="text-base font-semibold">{group.title}</h2>
            <div className="divide-y divide-[#ededeb]">
              {group.cycles.map((cycle) => (
                <CycleRow key={cycle.id} cycle={cycle} data={data} />
              ))}
            </div>
          </section>
        ) : null,
      )}
      <Disclosure className={`${planCard} p-4 sm:p-5`} title="Мало данных">
        <div className="divide-y divide-[#ededeb]">
          {data.profiles
            .filter(
              (p) =>
                p.status === 'insufficient' &&
                (!search.section || p.section === search.section) &&
                (!search.type ||
                  cycles.some((cycle) => cycle.skillId === p.skillId)),
            )
            .map((profile) => (
              <div className="py-4" key={profile.skillId}>
                <p>
                  {skillLabels[profile.section]} ·{' '}
                  {learningSkillTitle(data, profile.skillId)}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {profile.rationale}
                </p>
              </div>
            ))}
        </div>
      </Disclosure>
      {cycles.some((c) => c.skippedAt) ? (
        <Disclosure
          className={`${planCard} p-4 sm:p-5`}
          title="Отложенные ошибки"
        >
          {cycles
            .filter((c) => c.skippedAt)
            .map((cycle) => (
              <CycleRow key={cycle.id} cycle={cycle} data={data} />
            ))}
        </Disclosure>
      ) : null}
      <Disclosure
        className={`${planCard} p-4 sm:p-5`}
        title="Материалы для тренировки"
      >
        <div className="divide-y divide-[#ededeb]">
          {data.inventory.sections.map((inventory) => (
            <div className="grid gap-2 py-4" key={inventory.section}>
              <h3 className="font-semibold">
                {skillLabels[inventory.section]}
              </h3>
              {!inventory.available ? (
                <p>Сейчас нет подходящих материалов.</p>
              ) : null}
              <p className="text-xs leading-5">
                Материалов каталога в ваши {data.inventory.dailyMinutes} мин:{' '}
                {inventory.fittingMaterials} · коротких тренировок:{' '}
                {inventory.shortDrills}, из них проверены редактором:{' '}
                {inventory.reviewedDrills}
              </p>
              <Limitations items={inventory.limitations} />
              {data.drills
                .filter((d) => d.section === inventory.section)
                .map((drill) => (
                  <Link
                    key={drill.id}
                    to="/plan/learning/drills/$drillId"
                    params={{ drillId: drill.id }}
                    className={learningLink}
                  >
                    {drill.title} · {drill.durationMinutes} мин
                  </Link>
                ))}
            </div>
          ))}
        </div>
        <Limitations items={data.inventory.limitations} />
      </Disclosure>
      <Disclosure className={`${planCard} p-4 sm:p-5`} title="Как мы считаем">
        <p className="mb-2 text-xs leading-5 text-muted-foreground">
          Навыки определяются по разбору конкретной работы. Рекомендации Writing
          и Speaking требуют проверки специалистом; тип задания сам по себе не
          объясняет причину ошибки.
        </p>
        <Limitations items={data.limitations} />
      </Disclosure>
      <p className="text-xs leading-5 text-muted-foreground">
        Учебные результаты не являются оценкой IELTS.
      </p>
    </div>
  )
}
