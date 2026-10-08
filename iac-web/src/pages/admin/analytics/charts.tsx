import { useEffect, useRef, useState } from 'react'

// Validated categorical slots (light surface), assigned in fixed order.
export const seriesColors = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
] as const
// Sequential blue ramp, "near zero" → "most".
const blueRamp = [
  '#cde2fb',
  '#9ec5f4',
  '#6da7ec',
  '#3987e5',
  '#256abf',
  '#184f95',
  '#0d366b',
] as const
const emptyCell = '#f0efec'
const ink = { muted: '#898781', grid: '#e1e0d9', axis: '#c3c2b7' }

const numberFormat = new Intl.NumberFormat('ru-RU')
export const formatNumber = (value: number) => numberFormat.format(value)

export function formatDay(day: string, withYear = false) {
  const [year, month, date] = day.split('-')
  return withYear ? `${date}.${month}.${year}` : `${date}.${month}`
}

export function rampColor(value: number, max: number) {
  if (value <= 0 || max <= 0) return emptyCell
  const index = Math.min(
    blueRamp.length - 1,
    Math.floor((value / max) * blueRamp.length),
  )
  return blueRamp[index]
}

function niceTicks(maxValue: number, count = 4) {
  const raw = Math.max(maxValue, 1) / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step =
    [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ??
    10 * magnitude
  const ticks = []
  for (let value = 0; value <= step * count + 1e-9; value += step) {
    ticks.push(Math.round(value))
    if (value >= maxValue) break
  }
  return ticks
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

export type ChartSeries = { label: string; values: number[] }

export function Legend({ labels }: { labels: string[] }) {
  if (labels.length < 2) return null
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#52514e]">
      {labels.map((label, index) => (
        <li key={label} className="flex items-center gap-1.5">
          <span
            className="h-0.5 w-3 rounded-full"
            style={{ background: seriesColors[index] }}
            aria-hidden
          />
          {label}
        </li>
      ))}
    </ul>
  )
}

// LineChart: one shared y-axis, 2px lines, crosshair + tooltip on hover.
export function LineChart({
  days,
  series,
  height = 220,
}: {
  days: string[]
  series: ChartSeries[]
  height?: number
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const pad = { left: 40, right: 12, top: 12, bottom: 26 }
  const ticks = niceTicks(Math.max(0, ...series.flatMap((s) => s.values)))
  const max = ticks[ticks.length - 1] || 1
  const plotWidth = Math.max(0, width - pad.left - pad.right)
  const plotHeight = height - pad.top - pad.bottom
  const n = days.length
  const x = (i: number) =>
    pad.left + (n <= 1 ? plotWidth / 2 : (i * plotWidth) / (n - 1))
  const y = (v: number) => pad.top + plotHeight - (v / max) * plotHeight
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, plotWidth / 64)))

  const onMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const relative = event.clientX - bounds.left - pad.left
    const index = n <= 1 ? 0 : Math.round((relative / plotWidth) * (n - 1))
    setHover(Math.min(n - 1, Math.max(0, index)))
  }

  return (
    <div className="grid gap-3">
      <Legend labels={series.map((s) => s.label)} />
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={series.map((s) => s.label).join(', ')}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            className="touch-none select-none"
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke={tick === 0 ? ink.axis : ink.grid}
                  strokeWidth={1}
                />
                <text
                  x={pad.left - 8}
                  y={y(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize={11}
                  fill={ink.muted}
                  className="tabular-nums"
                >
                  {formatNumber(tick)}
                </text>
              </g>
            ))}
            {days.map((day, i) =>
              i % labelEvery === 0 || i === n - 1 ? (
                <text
                  key={day}
                  x={x(i)}
                  y={height - 6}
                  textAnchor={
                    i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'
                  }
                  fontSize={11}
                  fill={ink.muted}
                  className="tabular-nums"
                >
                  {formatDay(day)}
                </text>
              ) : null,
            )}
            {series.map((s, index) => (
              <g key={s.label}>
                {index === 0 && n > 1 && (
                  <path
                    d={`M${x(0)},${y(0)} ${s.values.map((v, i) => `L${x(i)},${y(v)}`).join(' ')} L${x(n - 1)},${y(0)}Z`}
                    fill={seriesColors[index]}
                    opacity={0.1}
                  />
                )}
                <path
                  d={s.values
                    .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`)
                    .join(' ')}
                  fill="none"
                  stroke={seriesColors[index]}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            ))}
            {hover !== null && (
              <g>
                <line
                  x1={x(hover)}
                  x2={x(hover)}
                  y1={pad.top}
                  y2={pad.top + plotHeight}
                  stroke={ink.axis}
                  strokeWidth={1}
                />
                {series.map((s, index) => (
                  <circle
                    key={s.label}
                    cx={x(hover)}
                    cy={y(s.values[hover] ?? 0)}
                    r={4}
                    fill={seriesColors[index]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </g>
            )}
          </svg>
        )}
        {hover !== null && width > 0 && (
          <div
            className="pointer-events-none absolute top-1 z-10 min-w-36 rounded-[10px] border border-[#e7e7e4] bg-white px-3 py-2 text-xs shadow-lg"
            style={{
              left: Math.min(Math.max(0, x(hover) + 12), width - 160),
            }}
          >
            <p className="font-semibold text-[#111]">
              {formatDay(days[hover], true)}
            </p>
            {series.map((s, index) => (
              <p
                key={s.label}
                className="mt-1 flex items-center justify-between gap-4 text-[#52514e]"
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: seriesColors[index] }}
                  />
                  {s.label}
                </span>
                <span className="font-semibold text-[#111] tabular-nums">
                  {formatNumber(s.values[hover] ?? 0)}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// BarList: horizontal bars for ranked categories (sources, funnel steps).
export function BarList({
  rows,
  color = seriesColors[0],
  suffix,
}: {
  rows: { label: string; value: number; note?: string }[]
  color?: string
  suffix?: (row: { value: number }, index: number) => string | null
}) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <ul className="grid gap-3">
      {rows.map((row, index) => (
        <li key={row.label} className="grid gap-1.5" title={row.note}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-[#111]">{row.label}</span>
            <span className="shrink-0 text-[#52514e] tabular-nums">
              <b className="font-semibold text-[#111]">
                {formatNumber(row.value)}
              </b>
              {suffix?.(row, index) ? (
                <span className="ml-2 text-xs text-[#898781]">
                  {suffix(row, index)}
                </span>
              ) : null}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#f0efec]">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${(row.value / max) * 100}%`,
                minWidth: row.value > 0 ? 4 : 0,
                background: color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// Heatmap: when students practise, weekday × hour, sequential blue.
export function ActivityHeatmap({
  cells,
}: {
  cells: { weekday: number; hour: number; attempts: number }[]
}) {
  const [hover, setHover] = useState<{
    weekday: number
    hour: number
    attempts: number
  } | null>(null)
  const grid = new Map(cells.map((c) => [`${c.weekday}:${c.hour}`, c.attempts]))
  const max = Math.max(0, ...cells.map((c) => c.attempts))

  return (
    <div className="grid gap-2">
      <div className="overflow-x-auto">
        <div className="grid min-w-[420px] grid-cols-[24px_repeat(24,minmax(0,1fr))] gap-[2px] text-[10px] text-[#898781]">
          <span />
          {Array.from({ length: 24 }, (_, hour) => (
            <span key={hour} className="text-center tabular-nums">
              {hour % 3 === 0 ? hour : ''}
            </span>
          ))}
          {weekdays.map((label, dayIndex) => (
            <div key={label} className="contents">
              <span className="self-center">{label}</span>
              {Array.from({ length: 24 }, (_, hour) => {
                const attempts = grid.get(`${dayIndex + 1}:${hour}`) ?? 0
                return (
                  <span
                    key={hour}
                    className="aspect-square rounded-[3px]"
                    style={{ background: rampColor(attempts, max) }}
                    onPointerEnter={() =>
                      setHover({ weekday: dayIndex, hour, attempts })
                    }
                    onPointerLeave={() => setHover(null)}
                    aria-label={`${label} ${hour}:00 — ${attempts}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="min-h-5 text-xs text-[#52514e]" aria-live="polite">
        {hover
          ? `${weekdays[hover.weekday]}, ${String(hover.hour).padStart(2, '0')}:00–${String(hover.hour + 1).padStart(2, '0')}:00 — ${formatNumber(hover.attempts)} попыток`
          : max > 0
            ? `Наведите на ячейку. Максимум — ${formatNumber(max)} попыток в час.`
            : 'Попыток за период нет.'}
      </p>
    </div>
  )
}
