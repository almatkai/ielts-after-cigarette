export function RoutingControls() {
  return (
    <section
      aria-label="Распределение запросов"
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <h2 className="font-semibold text-slate-900">По очереди внутри уровня</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Первый запрос — провайдеру A, следующий — B, затем C и снова A. Каждый
        запрос обслуживает один провайдер, без одновременной отправки всем
        участникам.
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        При ошибке или таймауте запрос передаётся следующему провайдеру этого
        уровня. Если весь уровень недоступен — следующему уровню. Разные запросы
        могут обрабатываться разными провайдерами одновременно.
      </p>
    </section>
  )
}
