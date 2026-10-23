import { LineChart, formatNumber, seriesColors } from './charts'

import type { GuestConversion } from '@/features/analytics/api'

const percentFormat = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
})

function conversionRate(part: number, whole: number) {
  return whole > 0 ? `${percentFormat.format((part / whole) * 100)}%` : '—'
}

export function GuestConversionContent({
  conversion,
}: {
  conversion: GuestConversion | undefined
}) {
  if (!conversion) {
    return (
      <p className="text-sm text-muted-foreground">
        Гостевая воронка пока недоступна. Обновите API для расчёта конверсии.
      </p>
    )
  }

  const stages = [
    {
      key: 'guests',
      label: 'Открыли гостевой доступ',
      value: conversion.guests,
      detail: 'Гостевые профили, не все посетители сайта',
    },
    {
      key: 'started',
      label: 'Начали Full Mock',
      value: conversion.started,
      detail: `${conversionRate(conversion.started, conversion.guests)} от гостей`,
    },
    {
      key: 'completed',
      label: 'Завершили Full Mock',
      value: conversion.completed,
      detail: `${conversionRate(conversion.completed, conversion.started)} от начавших`,
    },
    {
      key: 'registered',
      label: 'Зарегистрировались после мока',
      value: conversion.registered,
      detail: `${conversionRate(conversion.registered, conversion.completed)} от завершивших`,
    },
  ] as const

  return (
    <section aria-label="Конверсия гостевого Full Mock" className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Сколько гостей дошли до регистрации после полного мока. Вход в
          существующий аккаунт не считается регистрацией.
        </p>
        <div className="sm:text-right">
          <p className="text-sm text-muted-foreground">Гость → новый аккаунт</p>
          <p className="mt-1 text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
            {conversionRate(conversion.registered, conversion.guests)}
          </p>
        </div>
      </div>

      {conversion.guests === 0 ? (
        <p className="rounded-[10px] bg-background p-4 text-sm text-muted-foreground">
          За выбранный период новых гостевых профилей нет. Воронка появится,
          когда посетители откроют гостевой доступ к Full Mock.
        </p>
      ) : null}

      <ol className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage, index) => (
          <li key={stage.label} className="grid content-start gap-2">
            <p className="text-sm font-medium">{stage.label}</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatNumber(stage.value)}
            </p>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              aria-hidden
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${conversion.guests > 0 ? (stage.value / conversion.guests) * 100 : 0}%`,
                  background: seriesColors[index],
                }}
              />
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {stage.detail}
            </p>
          </li>
        ))}
      </ol>

      <div className="grid gap-3 border-t border-border pt-5">
        <h3 className="text-sm font-medium">По дню первого гостевого входа</h3>
        <p className="text-xs leading-5 text-muted-foreground">
          В каждой точке — одна группа гостей, пришедших в этот день, и их
          дальнейшие шаги на момент обновления. Регистрация учитывается, если
          завершённый мок сохранён в новый аккаунт. У свежих групп ещё было
          меньше времени пройти тест и зарегистрироваться.
        </p>
        <LineChart
          days={conversion.daily.map((point) => point.day)}
          series={stages.map((stage) => ({
            label: stage.label,
            values: conversion.daily.map((point) => point[stage.key]),
          }))}
        />
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Гости определяются по cookie браузера, а не как уникальные люди.
        Повторные моки одного гостя не увеличивают воронку. Другой браузер или
        удаление cookie создают нового гостя.
      </p>
    </section>
  )
}
