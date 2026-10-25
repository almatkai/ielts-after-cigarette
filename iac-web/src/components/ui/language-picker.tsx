import { useLanguage } from '@/lib/i18n'

const languageNames = {
  ru: 'Русский',
  kk: 'Қазақша',
  en: 'English',
} as const

export function LanguagePicker({
  compact = false,
  bare = false,
  className = '',
}: {
  compact?: boolean
  // Без подписи «Язык» — когда подпись уже есть у строки настроек.
  bare?: boolean
  className?: string
}) {
  const { language, setLanguage, t } = useLanguage()

  const select = (
    <select
      aria-label={t('Выберите язык')}
      value={language}
      onChange={(event) =>
        setLanguage(event.target.value as keyof typeof languageNames)
      }
      className={`w-full rounded-[9px] border border-border bg-card text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring ${compact || bare ? 'h-9 px-2.5' : 'h-11 px-3'} ${className}`}
    >
      {Object.entries(languageNames).map(([code, name]) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </select>
  )

  if (bare) return select

  return (
    <label className="grid gap-1.5 px-3.5">
      <span className="text-xs font-medium text-muted-foreground">
        {t('Язык')}
      </span>
      {select}
    </label>
  )
}
