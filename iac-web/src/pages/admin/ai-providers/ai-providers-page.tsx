import { useCallback, useEffect, useState } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { PriorityLevel } from './priority-level'
import { SortableProviderCard } from './sortable-provider-card'
import { RoutingControls } from './routing-controls'
import { DailyLimitsControls } from './daily-limits-controls'
import { ProviderStats } from './provider-stats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api/client'
import {
  deleteAIProvider,
  listAIProviders,
  saveAIProvider,
  testAIProvider,
} from '@/features/ai-providers/api'
import type {
  AIProvider,
  AIProviderInput,
  AIProviderList,
  AIScope,
  ProviderTestResult,
} from '@/features/ai-providers/api'

const blank = (): AIProviderInput => ({
  name: '',
  endpoint: '',
  model: '',
  speakingModel: '',
  apiKey: '',
  scopes: ['assistant', 'writing', 'speaking'],
  enabled: false,
  priority: 100,
  timeoutSeconds: 20,
  revision: 0,
})
const scopeNames: Record<AIScope, string> = {
  assistant: 'Юки',
  writing: 'Writing',
  speaking: 'Speaking',
}
const errorText = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : 'Не удалось выполнить действие. Попробуйте ещё раз.'

export function AIProvidersPage() {
  const [data, setData] = useState<AIProviderList | null>(null)
  const telemetryUnavailable =
    data?.errorReportingRequired !== false && !data?.errorReportingConfigured
  const [input, setInput] = useState<AIProviderInput>(blank)
  const [editing, setEditing] = useState<string | null>(null)
  const editingEnv = !!data?.items.find((provider) => provider.id === editing)
    ?.fromEnv
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [results, setResults] = useState<
    Partial<Record<string, ProviderTestResult>>
  >({})
  const [formResult, setFormResult] = useState<ProviderTestResult | null>(null)
  const [statsRevision, setStatsRevision] = useState(0)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  const reload = useCallback(async () => {
    setData(await listAIProviders())
  }, [])
  useEffect(() => {
    void reload().catch((err: unknown) => setError(errorText(err)))
  }, [reload])

  const edit = (provider?: AIProvider) => {
    setInput(
      provider
        ? {
            name: provider.name,
            endpoint: provider.endpoint,
            model: provider.model,
            speakingModel: provider.speakingModel,
            apiKey: '',
            scopes: [...provider.scopes],
            enabled: provider.enabled,
            priority: provider.priority,
            timeoutSeconds: provider.timeoutSeconds,
            revision: provider.revision,
          }
        : blank(),
    )
    setEditing(provider?.id ?? null)
    setShowForm(true)
    setFormResult(null)
    setError('')
    setNotice('')
  }
  const perform = async (action: () => Promise<void>) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }
  const levels = [
    ...new Set(data?.items.map(({ priority }) => priority) ?? []),
  ].sort((a, b) => a - b)
  let newPriority = Math.min(10000, (levels.at(-1) ?? -10) + 10)
  while (levels.includes(newPriority) && newPriority > 0) newPriority--
  const moveToLevel = (provider: AIProvider, priority: number) => {
    if (provider.priority === priority || busy) return
    void perform(async () => {
      try {
        const {
          id,
          hasKey: _hasKey,
          updatedAt: _updatedAt,
          fromEnv: _fromEnv,
          ...settings
        } = provider
        await saveAIProvider(id, { ...settings, priority, apiKey: '' })
        await reload()
        setNotice('Уровень сохранён')
      } catch (err) {
        await reload().catch(() => undefined)
        throw err
      }
    })
  }
  const toggleScope = (scope: AIScope) =>
    setInput((current) => ({
      ...current,
      scopes: current.scopes.includes(scope)
        ? current.scopes.filter((item) => item !== scope)
        : [...current.scopes, scope],
    }))
  const resultLabel = (result: ProviderTestResult) => {
    if (result.ok) return `Работает · ${result.latencyMs} мс`
    const hint =
      result.httpStatus === 401 || result.httpStatus === 403
        ? 'Проверьте API-ключ и доступ к модели.'
        : result.httpStatus === 404
          ? 'Проверьте URL и ID модели.'
          : result.httpStatus === 429
            ? 'У провайдера исчерпан лимит запросов.'
            : result.code === 'timeout'
              ? 'Провайдер не ответил вовремя.'
              : 'Проверьте настройки провайдера.'
    return `Проверка не пройдена${result.httpStatus ? ` (HTTP ${result.httpStatus})` : ''}. ${hint} Подробности ${data?.errorReportingConfigured ? 'в GlitchTip' : 'в локальных логах backend'}.`
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            AI-провайдеры
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            Собери провайдеров в уровни. Запросы по очереди распределяются между
            участниками одного уровня: A, B, C, снова A. Каждый запрос идёт
            одному провайдеру, следующий уровень — резерв.
          </p>
        </div>
        <Button
          onClick={() => edit()}
          disabled={
            busy ||
            !data?.encryptionConfigured ||
            data.migrationRequired ||
            data.items.filter((provider) => !provider.fromEnv).length >=
              data.maxProviders
          }
        >
          Добавить провайдера
        </Button>
      </header>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
          <Button
            variant="outline"
            className="ml-3"
            disabled={busy}
            onClick={() =>
              void perform(async () => {
                await reload()
                setShowForm(false)
                setInput(blank())
                setEditing(null)
              })
            }
          >
            Обновить
          </Button>
        </div>
      )}
      {notice && (
        <p role="status" className="text-sm text-emerald-700">
          {notice}
        </p>
      )}
      {data?.migrationRequired && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
        >
          <p>
            База ещё не обновлена. Примените миграции до 000031, чтобы добавлять
            и сохранять AI-провайдеров.
          </p>
          {data.envFallbackConfigured && (
            <p>Настроенный .env-резерв продолжает использоваться.</p>
          )}
        </div>
      )}
      {data && (!data.encryptionConfigured || telemetryUnavailable) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {!data.encryptionConfigured && (
            <p>
              Для хранения ключей настройте AI_PROVIDER_ENCRYPTION_KEY на API и
              worker. Ключ шифрования хранится отдельно от базы.
            </p>
          )}
          {telemetryUnavailable && (
            <p>
              Для тестирования и включения провайдеров настройте GlitchTip
              (SENTRY_DSN).
            </p>
          )}
        </div>
      )}
      <div
        className={`grid items-start gap-6 ${showForm ? 'xl:grid-cols-[1fr_420px]' : ''}`}
      >
        <section
          aria-label="Цепочка провайдеров"
          className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Уровни провайдеров</h2>
            <p className="mt-1 text-xs text-slate-500">
              Перетащи провайдер в нужный стек или выбери уровень в его
              карточке. Одинаковый приоритет объединяет провайдеров. Отключённые
              пропускаются; изменения действуют для новых запросов.
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Один запрос не дублируется всем участникам. Другой провайдер
              получает его только при ошибке или таймауте.
            </p>
          </div>
          {!data && !error && (
            <p className="p-5 text-sm text-slate-500">Загрузка…</p>
          )}
          {data?.items.length === 0 && !data.migrationRequired && (
            <p className="p-5 text-sm leading-6 text-slate-600">
              Добавьте первый провайдер, проверьте подключение и включите его.
              Отдельный ключ нужен только при сохранении — существующий ключ не
              раскрывается.
            </p>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
            onDragEnd={({ active, over }) => {
              if (!data || busy || !over || active.id === over.id) return
              const provider = data.items.find((item) => item.id === active.id)
              const target = data.items.find((item) => item.id === over.id)
              const level = String(over.id).startsWith('level:')
                ? String(over.id).slice(6)
                : undefined
              const priority =
                level === 'new'
                  ? newPriority
                  : level !== undefined
                    ? Number(level)
                    : target?.priority
              if (provider && priority !== undefined)
                moveToLevel(provider, priority)
            }}
          >
            <SortableContext
              items={data?.items.map(({ id }) => id) ?? []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4 p-4">
                {levels.map((priority, index) => (
                  <PriorityLevel
                    key={priority}
                    priority={priority}
                    rank={index + 1}
                    count={
                      data?.items.filter(
                        (p) => p.priority === priority && p.enabled,
                      ).length ?? 0
                    }
                    disabled={busy || !data?.encryptionConfigured}
                  >
                    {data?.items
                      .filter((p) => p.priority === priority)
                      .map((provider) => {
                        const providerResult = results[provider.id]
                        return (
                          <SortableProviderCard
                            key={provider.id}
                            id={provider.id}
                            name={provider.name}
                            disabled={
                              busy ||
                              !!data.migrationRequired ||
                              !data.encryptionConfigured
                            }
                          >
                            <div className="flex items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-semibold text-slate-900">
                                    {provider.name}
                                  </h3>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs ${provider.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                                  >
                                    {provider.enabled ? 'Включён' : 'Выключен'}
                                  </span>
                                  {provider.fromEnv && (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                      .env
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 break-all text-sm text-slate-700">
                                  {provider.model}
                                </p>
                                <p className="mt-1 break-all text-xs text-slate-500">
                                  {provider.endpoint}
                                </p>
                                <p className="mt-2 text-xs text-slate-600">
                                  {provider.scopes
                                    .map((scope) => scopeNames[scope])
                                    .join(', ')}{' '}
                                  · Таймаут {provider.timeoutSeconds} с ·{' '}
                                  {provider.hasKey
                                    ? provider.fromEnv
                                      ? 'Ключ из .env'
                                      : 'Ключ зашифрован'
                                    : 'Нет ключа'}
                                </p>
                              </div>
                            </div>
                            {providerResult && (
                              <p
                                role="status"
                                className={`mt-3 text-sm ${providerResult.ok ? 'text-emerald-700' : 'text-amber-800'}`}
                              >
                                {resultLabel(providerResult)}
                              </p>
                            )}
                            <div className="mt-3">
                              <label className="text-xs text-slate-500">
                                Уровень
                                <select
                                  aria-label={`Уровень ${provider.name}`}
                                  value={provider.priority}
                                  disabled={
                                    busy ||
                                    !data.encryptionConfigured ||
                                    data.migrationRequired
                                  }
                                  className="ml-2 max-w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
                                  onChange={(event) =>
                                    moveToLevel(
                                      provider,
                                      event.target.value === 'new'
                                        ? newPriority
                                        : Number(event.target.value),
                                    )
                                  }
                                >
                                  {levels.map((value, levelIndex) => (
                                    <option key={value} value={value}>
                                      Уровень {levelIndex + 1} · приоритет{' '}
                                      {value}
                                    </option>
                                  ))}
                                  <option value="new">
                                    Новый отдельный уровень
                                  </option>
                                </select>
                              </label>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy || telemetryUnavailable}
                                onClick={() =>
                                  void perform(async () => {
                                    const result = await testAIProvider(
                                      provider.id,
                                    )
                                    setStatsRevision((value) => value + 1)
                                    setResults((current) => ({
                                      ...current,
                                      [provider.id]: result,
                                    }))
                                  })
                                }
                              >
                                Проверить
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={
                                  busy ||
                                  !data.encryptionConfigured ||
                                  data.migrationRequired
                                }
                                onClick={() => edit(provider)}
                              >
                                Изменить
                              </Button>
                              {!provider.fromEnv && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={busy}
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Удалить провайдера «${provider.name}»?`,
                                      )
                                    )
                                      void perform(async () => {
                                        await deleteAIProvider(provider)
                                        if (editing === provider.id) {
                                          setShowForm(false)
                                          setInput(blank())
                                        }
                                        await reload()
                                        setNotice('Провайдер удалён')
                                      })
                                  }}
                                >
                                  Удалить
                                </Button>
                              )}
                            </div>
                          </SortableProviderCard>
                        )
                      })}
                  </PriorityLevel>
                ))}
                {!!data?.items.length && (
                  <PriorityLevel
                    priority="new"
                    disabled={busy || !data.encryptionConfigured}
                  />
                )}
              </div>
            </SortableContext>
          </DndContext>
          {data && !data.items.some((provider) => provider.fromEnv) && (
            <div className="border-t border-dashed border-slate-200 bg-slate-50 px-5 py-4">
              <h3 className="text-sm font-medium text-slate-700">
                Последний резерв: .env
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {data.envFallbackConfigured
                  ? 'Уже настроен на сервере. Используется, если остальные провайдеры не ответили.'
                  : 'Не настроен. Добавьте резервного провайдера или настройте AI_* на сервере.'}
              </p>
            </div>
          )}
        </section>
        {showForm && (
          <form
            aria-label={editing ? 'Изменить провайдера' : 'Новый провайдер'}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault()
              void perform(async () => {
                await saveAIProvider(editing, input)
                setInput(blank())
                setShowForm(false)
                setEditing(null)
                await reload()
                setNotice('Провайдер сохранён')
              })
            }}
          >
            <h2 className="font-semibold text-slate-900">
              {editing ? 'Изменить провайдера' : 'Новый провайдер'}
            </h2>
            <div className="space-y-1.5">
              <Label htmlFor="ai-provider-name">Название</Label>
              <Input
                id="ai-provider-name"
                required
                maxLength={120}
                value={input.name}
                onChange={(event) =>
                  setInput({ ...input, name: event.target.value })
                }
                placeholder="Например, OpenRouter"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ai-provider-endpoint">
                {editingEnv
                  ? 'URL completions из .env'
                  : 'HTTPS URL completions'}
              </Label>
              <Input
                id="ai-provider-endpoint"
                readOnly={editingEnv}
                type="url"
                required
                value={input.endpoint}
                onChange={(event) =>
                  setInput({ ...input, endpoint: event.target.value })
                }
                placeholder="https://api.example.com/v1/chat/completions"
              />
              <p className="text-xs leading-5 text-slate-500">
                {editingEnv
                  ? 'URL и модели берутся из .env. Название и приоритет сохраняются в админке; ключ остаётся на сервере.'
                  : 'OpenAI-совместимый API, полный URL. Только публичный HTTPS без перенаправлений.'}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ai-provider-model">Модель</Label>
              <Input
                id="ai-provider-model"
                readOnly={editingEnv}
                required
                maxLength={200}
                value={input.model}
                onChange={(event) =>
                  setInput({ ...input, model: event.target.value })
                }
                placeholder="ID модели у провайдера"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ai-provider-speaking-model">
                Модель для Speaking (необязательно)
              </Label>
              <Input
                id="ai-provider-speaking-model"
                readOnly={editingEnv}
                maxLength={200}
                value={input.speakingModel}
                onChange={(event) =>
                  setInput({ ...input, speakingModel: event.target.value })
                }
                placeholder="По умолчанию — та же модель"
              />
            </div>
            {!editingEnv && (
              <div className="space-y-1.5">
                <Label htmlFor="ai-provider-key">API-ключ</Label>
                <Input
                  id="ai-provider-key"
                  type="password"
                  autoComplete="new-password"
                  required={!editing}
                  maxLength={8192}
                  value={input.apiKey}
                  onChange={(event) =>
                    setInput({ ...input, apiKey: event.target.value })
                  }
                  placeholder={
                    editing
                      ? 'Пусто — сохранить текущий ключ'
                      : 'Будет зашифрован при сохранении'
                  }
                />
                <p className="text-xs leading-5 text-slate-500">
                  Ключ никогда не возвращается из API и не сохраняется в
                  браузере.
                </p>
              </div>
            )}
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">
                Использовать для
              </legend>
              <div className="flex flex-wrap gap-4">
                {(Object.keys(scopeNames) as AIScope[]).map((scope) => (
                  <label
                    key={scope}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-blue-600"
                      checked={input.scopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                    />
                    {scopeNames[scope]}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ai-provider-priority">Приоритет</Label>
                <Input
                  id="ai-provider-priority"
                  type="number"
                  min={0}
                  max={10000}
                  required
                  value={input.priority}
                  onChange={(event) =>
                    setInput({ ...input, priority: Number(event.target.value) })
                  }
                />
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Одинаковый приоритет = один уровень и ротация запросов между
                  провайдерами. Меньшее число — более ранний уровень.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ai-provider-timeout">Таймаут, секунды</Label>
                <Input
                  id="ai-provider-timeout"
                  type="number"
                  min={5}
                  max={60}
                  required
                  value={input.timeoutSeconds}
                  onChange={(event) =>
                    setInput({
                      ...input,
                      timeoutSeconds: Number(event.target.value),
                    })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-blue-600"
                checked={input.enabled}
                disabled={telemetryUnavailable}
                onChange={(event) =>
                  setInput({ ...input, enabled: event.target.checked })
                }
              />
              Включить в цепочку
            </label>
            {formResult && (
              <p
                role="status"
                className={`text-sm ${formResult.ok ? 'text-emerald-700' : 'text-amber-800'}`}
              >
                {resultLabel(formResult)}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={
                  busy || telemetryUnavailable || (!editing && !input.apiKey)
                }
                onClick={() =>
                  void perform(async () =>
                    setFormResult(await testAIProvider(editing, input)),
                  )
                }
              >
                Проверить подключение
              </Button>
              <Button
                type="submit"
                disabled={
                  busy ||
                  !data?.encryptionConfigured ||
                  data.migrationRequired ||
                  !input.scopes.length
                }
              >
                {busy ? 'Подождите…' : 'Сохранить'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setShowForm(false)
                  setInput(blank())
                  setEditing(null)
                }}
              >
                Отмена
              </Button>
            </div>
          </form>
        )}
      </div>
      <DailyLimitsControls />
      {data && <RoutingControls />}
      <ProviderStats revision={statsRevision} />
      <p className="max-w-3xl text-xs leading-5 text-slate-500">
        {data?.errorReportingRequired === false &&
        !data.errorReportingConfigured
          ? 'Локальный режим: GlitchTip отключён. Попытки пишутся в логи backend, замеры — в статистику. '
          : 'Каждая ошибка провайдера отправляется в GlitchTip, даже если резерв ответил успешно. '}
        При переходе к резерву незавершённый ответ Юки заменяется новым — ответы
        разных моделей не склеиваются. Если никто не доступен, пользователь
        увидит спокойное предложение попробовать позже.
      </p>
    </div>
  )
}
