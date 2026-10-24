import { useLanguage } from '@/lib/i18n'

const languageNames = {
  ru: 'Русский',
  kk: 'Қазақша',
  en: 'English',
} as const

export function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <label className="grid gap-1.5 px-3.5">
      <span className="text-xs font-medium text-muted-foreground">
        {t('Язык')}
      </span>
      <select
        aria-label={t('Выберите язык')}
        value={language}
        onChange={(event) =>
          setLanguage(event.target.value as keyof typeof languageNames)
        }
        className={`w-full rounded-[9px] border border-border bg-card text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring ${compact ? 'h-9 px-2.5' : 'h-11 px-3'}`}
      >
        {Object.entries(languageNames).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </label>
  )
}
