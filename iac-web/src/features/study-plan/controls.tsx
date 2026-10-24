import { useState } from 'react'
import { Disclosure } from '@/components/ui/disclosure'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { setWeeklyMock } from './api'
import type {
  StudySettings,
  StudyWeek,
  StudyResponse,
  StartResult,
} from './api'
import { addDays, formatCalendar, weeklyOfferDate } from './calendar'
import { TargetLink } from './summary'

export const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const actionClass =
  'min-h-11 rounded-[10px] border-border shadow-none'
export type Operation = () => Promise<StudyResponse | StartResult>
export type Run = (
  operation: Operation,
) => Promise<StudyResponse | StartResult | undefined>

export function SettingsForm({
  settings,
  pending,
  onSave,
  create = false,
  onCancel,
  examDate = '',
  onExamDateChange,
  minDate,
}: {
  settings: StudySettings
  pending: boolean
  onSave: (settings: StudySettings) => void
  create?: boolean
  onCancel?: () => void
  examDate?: string
  onExamDateChange?: (date: string) => void
  minDate?: string
}) {
  const [draft, setDraft] = useState(settings)
  return (
    <form
      className="grid gap-6 text-sm"
      onSubmit={(e) => {
        e.preventDefault()
        if (draft.studyDays.length && !pending) onSave(draft)
      }}
    >
      <fieldset>
        <legend className="mb-3 font-medium">Минут в день</legend>
        <div
          role="radiogroup"
          aria-label="Минут в учебный день"
          className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1"
        >
          {[30, 45, 60, 90].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={draft.dailyMinutes === n}
              className={`min-h-11 rounded-lg focus-visible:outline-2 focus-visible:outline-primary ${draft.dailyMinutes === n ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setDraft({ ...draft, dailyMinutes: n })}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 font-medium">Учебные дни</legend>
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((day, i) => (
            <button
              key={day}
              type="button"
              aria-label={day}
              aria-pressed={draft.studyDays.includes(i + 1)}
              className="flex min-h-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() =>
                setDraft({
                  ...draft,
                  studyDays: draft.studyDays.includes(i + 1)
                    ? draft.studyDays.filter((n) => n !== i + 1)
                    : [...draft.studyDays, i + 1].sort(),
                })
              }
            >
              <span
                className={`flex size-8 items-center justify-center rounded-full border sm:size-10 ${draft.studyDays.includes(i + 1) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}
              >
                {day}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex min-h-11 items-center justify-between gap-4">
        <span>
          Пробный экзамен раз в неделю
          <span className="mt-1 block text-xs text-muted-foreground">
            Отдельное окно времени, по желанию
          </span>
        </span>
        <Switch
          aria-label="Пробный экзамен раз в неделю"
          checked={draft.weeklyMockEnabled}
          onCheckedChange={(checked) =>
            setDraft({ ...draft, weeklyMockEnabled: checked })
          }
        />
      </label>
      {onExamDateChange ? (
        <label className="grid gap-2 font-medium">
          Дата экзамена{' '}
          <span className="text-xs font-normal text-muted-foreground">
            Необязательно
          </span>
          <span className="relative block">
            <Input
              type="date"
              lang="ru"
              aria-describedby="exam-date-format"
              className={`peer min-h-11 ${!examDate ? '[&::-webkit-datetime-edit]:text-transparent focus:[&::-webkit-datetime-edit]:text-foreground' : ''}`}
              min={minDate}
              value={examDate}
              onChange={(e) => onExamDateChange(e.target.value)}
            />
            {!examDate ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-normal text-muted-foreground peer-focus:invisible"
              >
                ДД.ММ.ГГГГ
              </span>
            ) : null}
          </span>
          <span id="exam-date-format" className="sr-only">
            Формат даты: ДД.ММ.ГГГГ
          </span>
        </label>
      ) : null}
      {!draft.studyDays.length ? (
        <p role="alert" className="text-destructive">
          Выберите хотя бы один день.
        </p>
      ) : null}
      <p className="text-xs leading-5 text-muted-foreground">
        Изменения касаются будущих заданий. Выполненное сохранится.
      </p>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            className={actionClass}
            onClick={onCancel}
          >
            Отмена
          </Button>
        ) : null}
        <Button
          disabled={pending || !draft.studyDays.length}
          className={actionClass}
          type="submit"
        >
          {pending ? 'Сохраняем…' : create ? 'Создать план' : 'Сохранить'}
        </Button>
      </div>
    </form>
  )
}

export function MockOffer({
  week,
  data,
  readonly,
  pending,
  run,
}: {
  week: StudyWeek
  data: StudyResponse
  readonly: boolean
  pending: boolean
  run: Run
}) {
  const offer = week.mockOffer
  readonly =
    readonly || !!(data.goal.examDate && data.today >= data.goal.examDate)
  const dates = Array.from({ length: 7 }, (_, i) =>
    addDays(data.today, i + 1),
  ).filter((date) => !data.plan || date <= data.plan.endDate)
  const [date, setDate] = useState(dates[0] ?? '')
  const [minutes, setMinutes] = useState(offer.durationMinutes)
  const offerDay = weeklyOfferDate(week, data.settings.studyDays)
  if (offer.status === 'DISABLED') return null
  if (offer.status === 'DECLINED')
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        Полный пробный экзамен: не на этой неделе. Решение сохранено.
      </p>
    )
  if (offer.status === 'SCHEDULED')
    return (
      <div className="mt-4 grid gap-2">
        <h3 className="font-semibold">
          Длинное окно · Full Mock · {offer.windowMinutes} мин
        </h3>
        <p>
          {offer.scheduledDate && formatCalendar(offer.scheduledDate, true)} ·
          вне обычного лимита {data.settings.dailyMinutes} мин
        </p>
        <p className="text-xs text-muted-foreground">
          Это расписание. Доступность полного комплекта и начало экзамена
          подтверждаются отдельно.
        </p>
        {readonly ? (
          <p className="text-xs leading-5 text-muted-foreground">
            Начало Full Mock в этот день недоступно. Сохранённые работы доступны
            в истории.
          </p>
        ) : (
          <TargetLink
            target={offer.target}
            className="inline-flex min-h-11 items-center text-primary hover:underline"
          >
            Открыть Full Mock
          </TargetLink>
        )}
      </div>
    )
  return (
    <Disclosure
      className="mt-4"
      aria-label="Полный пробный экзамен"
      title="Полный пробный экзамен · необязательно"
    >
      <p className="text-xs leading-5 text-muted-foreground">
        Разбор Mock будет в следующий учебный день в пределах вашего времени.
      </p>
      <div className="grid gap-3 pt-2">
        <p className="max-w-[70ch] text-sm leading-6 text-muted-foreground">
          Займёт {offer.durationMinutes} мин подряд: Listening, Reading, Writing
          и Speaking в одном окне. Это дольше обычного занятия (
          {data.settings.dailyMinutes} мин), поэтому нужно отдельное длинное
          окно.
        </p>
        {data.today < offerDay ? (
          <p className="text-xs leading-5 text-muted-foreground">
            Предложение станет доступно в конце учебной недели —{' '}
            {formatCalendar(offerDay, true)}. Отдельное длинное окно выбирается
            после обзора.
          </p>
        ) : readonly ? (
          <p className="text-xs text-muted-foreground">
            Обзор за прошедший период · только чтение
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs">
                День длинного окна
                <select
                  className="min-h-11 w-full rounded-[10px] border border-border bg-card px-3 text-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                >
                  {dates.map((d) => (
                    <option key={d} value={d}>
                      {formatCalendar(d, true)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs">
                Непрерывное окно, минут
                <input
                  className="min-h-11 w-full rounded-[10px] border border-border px-3 text-sm"
                  type="number"
                  min="1"
                  max="1440"
                  step="1"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                />
              </label>
            </div>
            {!dates.length ? (
              <p className="text-xs leading-5 text-muted-foreground">
                В этом цикле не осталось дат для длинного окна. Следующий цикл
                можно начать после завершения текущего.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Выберите дату в ближайшие 7 дней, до окончания цикла{' '}
                {data.plan && formatCalendar(data.plan.endDate)}.
              </p>
            )}
            {minutes < offer.durationMinutes ? (
              <p className="text-sm text-[#e23b3b]" role="alert">
                На {offer.durationMinutes} мин не хватает окна. Добавьте время
                или выберите другой день на следующей неделе.
              </p>
            ) : null}
            <p className="text-xs leading-5 text-muted-foreground">
              Выделите всё окно в этот день. Обычные задания будут заменены;
              пропущенные минуты не станут долгом. Планирование не запускает
              экзамен.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className={actionClass}
                variant="outline"
                disabled={
                  pending ||
                  !dates.includes(date) ||
                  !Number.isInteger(minutes) ||
                  minutes < offer.durationMinutes ||
                  minutes > 1440
                }
                onClick={() =>
                  void run(() =>
                    setWeeklyMock(week.week, {
                      expectedRevision: data.plan!.revision,
                      action: 'schedule',
                      scheduledDate: date,
                      windowMinutes: minutes,
                    }),
                  )
                }
              >
                Запланировать окно
              </Button>
              <Button
                className={actionClass}
                variant="outline"
                disabled={pending}
                onClick={() =>
                  void run(() =>
                    setWeeklyMock(week.week, {
                      expectedRevision: data.plan!.revision,
                      action: 'decline',
                    }),
                  )
                }
              >
                Не на этой неделе
              </Button>
            </div>
          </>
        )}
      </div>
    </Disclosure>
  )
}
