import { useLanguage } from '@/lib/i18n'

export function RoutingControls() {
  const { t } = useLanguage()
  return (
    <section
      aria-label={t('Распределение запросов')}
      className="rounded-xl border border-border bg-card p-5"
    >
      <h2 className="font-semibold text-foreground">
        {t('По очереди внутри уровня')}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {t(
          'Первый запрос — провайдеру A, следующий — B, затем C и снова A. Каждый запрос обслуживает один провайдер, без одновременной отправки всем участникам.',
        )}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {t(
          'При ошибке или таймауте запрос передаётся следующему провайдеру этого уровня. Если весь уровень недоступен — следующему уровню. Разные запросы могут обрабатываться разными провайдерами одновременно.',
        )}
      </p>
    </section>
  )
}
