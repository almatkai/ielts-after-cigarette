import { Monitor, Moon, Sun } from 'lucide-react'
import { useState } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  applyStoredTheme,
  getStoredTheme,
  setStoredTheme,
} from '@/features/theme/theme'

import type { ThemePreference } from '@/features/theme/theme'

const interFont = {
  fontFamily:
    '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
} as const

const cardClassName =
  'gap-0 rounded-xl border-slate-200 bg-white py-0 shadow-sm dark:border-slate-800 dark:bg-slate-900'

const themeOptions: Array<{
  value: ThemePreference
  label: string
  icon: typeof Sun
}> = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'system', label: 'Системная', icon: Monitor },
  { value: 'dark', label: 'Тёмная', icon: Moon },
]

export function SettingsPage() {
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredTheme())

  const handleSelect = (value: ThemePreference) => {
    setTheme(value)
    setStoredTheme(value)
    applyStoredTheme()
  }

  return (
    <div style={interFont} className="mx-auto w-full max-w-[760px]">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500 dark:text-blue-400">
          Настройки
        </p>
        <h1 className="mt-2.5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
          Внешний вид и аккаунт
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
          Управляйте темой интерфейса и параметрами кабинета.
        </p>
      </div>

      <Card className={cardClassName}>
        <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Тема оформления
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
            Системная тема подстраивается под настройки вашего устройства.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div
            role="radiogroup"
            aria-label="Тема оформления"
            className="inline-flex gap-1 rounded-full border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950"
          >
            {themeOptions.map((option) => {
              const isActive = theme === option.value
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => handleSelect(option.value)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#202D46] text-white dark:bg-slate-200 dark:text-slate-900'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="size-4" strokeWidth={1.9} aria-hidden />
                  {option.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
