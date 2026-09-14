import {
  ArrowDown2,
  ArrowLeft2,
  ArrowRight2,
  Calendar,
} from 'iconsax-react'
import { useEffect, useMemo, useState } from 'react'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
] as const

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const

function formatIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseIsoDate(iso: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatRussianDate(iso: string): string {
  const date = parseIsoDate(iso)
  if (!date) return ''
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getDaysWord(days: number): string {
  const abs = Math.abs(days)
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod100 >= 11 && mod100 <= 19) return 'дней'
  if (mod10 === 1) return 'день'
  if (mod10 >= 2 && mod10 <= 4) return 'дня'
  return 'дней'
}

function getDaysRemaining(iso: string): number | null {
  const target = parseIsoDate(iso)
  if (!target) return null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffTime = target.getTime() - today.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

type ExamDatePickerProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
  className?: string
}

export function ExamDatePicker({
  value,
  onChange,
  disabled,
  error,
  className,
}: ExamDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Determine initial view month and year
  const initialDate = useMemo(() => {
    return parseIsoDate(value) || new Date()
  }, [value])

  const [viewYear, setViewYear] = useState(initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth())

  useEffect(() => {
    if (value) {
      const parsed = parseIsoDate(value)
      if (parsed) {
        setViewYear(parsed.getFullYear())
        setViewMonth(parsed.getMonth())
      }
    }
  }, [value])

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayIso = formatIsoDate(today)

  const isPrevMonthDisabled =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth <= today.getMonth())

  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const handleSelectDate = (iso: string) => {
    onChange(iso)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange('')
  }

  const selectPreset = (monthsToAdd: number) => {
    const target = new Date(today.getFullYear(), today.getMonth() + monthsToAdd, today.getDate())
    const iso = formatIsoDate(target)
    onChange(iso)
    setViewYear(target.getFullYear())
    setViewMonth(target.getMonth())
    setIsOpen(false)
  }

  // Generate calendar grid
  const daysGrid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    let dayOfWeek = firstDay.getDay()
    if (dayOfWeek === 0) dayOfWeek = 7 // Mon = 1 ... Sun = 7
    const leadingDaysCount = dayOfWeek - 1

    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

    const cells: Array<{
      day: number
      iso: string
      isCurrentMonth: boolean
      isToday: boolean
      isSelected: boolean
      disabled: boolean
    }> = []

    // Leading days (from previous month)
    for (let i = leadingDaysCount - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum)
      const iso = formatIsoDate(prevDate)
      cells.push({
        day: dayNum,
        iso,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        isSelected: iso === value,
        disabled: true,
      })
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const curDate = new Date(viewYear, viewMonth, dayNum)
      const iso = formatIsoDate(curDate)
      const isPast = iso < todayIso
      cells.push({
        day: dayNum,
        iso,
        isCurrentMonth: true,
        isToday: iso === todayIso,
        isSelected: iso === value,
        disabled: isPast,
      })
    }

    // Trailing days to fill 7 columns
    const remainder = cells.length % 7
    if (remainder > 0) {
      const trailingCount = 7 - remainder
      for (let dayNum = 1; dayNum <= trailingCount; dayNum++) {
        const nextDate = new Date(viewYear, viewMonth + 1, dayNum)
        const iso = formatIsoDate(nextDate)
        cells.push({
          day: dayNum,
          iso,
          isCurrentMonth: false,
          isToday: iso === todayIso,
          isSelected: iso === value,
          disabled: true,
        })
      }
    }

    return cells
  }, [viewYear, viewMonth, value, todayIso])

  const daysRemaining = value ? getDaysRemaining(value) : null

  const presets = [
    { label: '+1 мес.', months: 1 },
    { label: '+2 мес.', months: 2 },
    { label: '+3 мес.', months: 3 },
    { label: '+6 мес.', months: 6 },
  ]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'group/btn h-11 w-full rounded-[9px] border bg-white px-3.5 flex items-center justify-between text-left text-sm transition-all shadow-none cursor-pointer',
            error
              ? 'border-[#c92f2f] ring-1 ring-[#c92f2f]/30'
              : 'border-[#deded9] hover:border-[#3b82f6]/70 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20',
            disabled && 'opacity-60 cursor-not-allowed bg-slate-50',
            className,
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Calendar
              className="size-4 shrink-0 text-[#9a9a9d] transition-colors group-hover/btn:text-[#3b82f6]"
              aria-hidden
            />
            <span
              className={cn(
                'truncate',
                value ? 'font-medium text-[#111111]' : 'text-[#808084]',
              )}
            >
              {value ? formatRussianDate(value) : 'Выберите дату экзамена'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {daysRemaining !== null && daysRemaining >= 0 ? (
              <span className="hidden sm:inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#2563eb] border border-blue-100">
                {daysRemaining === 0
                  ? 'Сегодня'
                  : `через ${daysRemaining} ${getDaysWord(daysRemaining)}`}
              </span>
            ) : null}
            <ArrowDown2
              className={cn(
                'size-3.5 text-slate-400 transition-transform duration-200 group-hover/btn:text-slate-600',
                isOpen && 'rotate-180 text-blue-600',
              )}
            />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[316px] sm:w-[332px] p-3.5 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,23,42,0.14),0_0_0_1px_rgba(226,232,240,0.8)] z-[70] select-none"
      >
        {/* Header: Month & Year + Controls */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <span className="text-sm font-bold text-slate-900 tracking-tight">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isPrevMonthDisabled}
              onClick={handlePrevMonth}
              className={cn(
                'size-7 rounded-lg flex items-center justify-center transition-colors',
                isPrevMonthDisabled
                  ? 'text-slate-300 cursor-not-allowed opacity-50'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer',
              )}
              aria-label="Предыдущий месяц"
            >
              <ArrowLeft2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="size-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              aria-label="Следующий месяц"
            >
              <ArrowRight2 className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Presets for IELTS preparation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-2 no-scrollbar">
          <span className="text-[11px] text-slate-400 font-medium shrink-0">
            Быстро:
          </span>
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => selectPreset(preset.months)}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium border border-slate-200 bg-slate-50/70 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all shrink-0 cursor-pointer active:scale-95"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Weekday Names */}
        <div className="grid grid-cols-7 gap-1 text-center py-1 border-t border-slate-100">
          {WEEKDAYS.map((d) => (
            <span
              key={d}
              className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center py-1">
          {daysGrid.map((cell, idx) => (
            <button
              key={`${cell.iso}-${idx}`}
              type="button"
              disabled={cell.disabled}
              onClick={() => handleSelectDate(cell.iso)}
              className={cn(
                'size-8 mx-auto rounded-full text-xs flex items-center justify-center transition-all',
                cell.isCurrentMonth ? '' : 'text-slate-300 opacity-30',
                cell.disabled
                  ? 'text-slate-300 cursor-not-allowed pointer-events-none'
                  : 'cursor-pointer active:scale-95',
                cell.isSelected
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30 scale-105 hover:bg-blue-700'
                  : cell.isToday
                  ? 'text-blue-600 font-bold ring-1.5 ring-blue-500/40 hover:bg-blue-50'
                  : !cell.disabled && cell.isCurrentMonth
                  ? 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                  : '',
              )}
            >
              {cell.day}
            </button>
          ))}
        </div>

        {/* Footer: Remaining Days & Reset */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          {daysRemaining !== null ? (
            <span className="text-slate-600 text-[11px] font-medium flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {daysRemaining === 0
                ? 'Экзамен сегодня!'
                : daysRemaining > 0
                ? `Осталось ${daysRemaining} ${getDaysWord(daysRemaining)}`
                : 'Дата в прошлом'}
            </span>
          ) : (
            <span className="text-slate-400 text-[11px]">
              Выберите дату экзамена
            </span>
          )}

          {value ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-medium text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Очистить
            </button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
