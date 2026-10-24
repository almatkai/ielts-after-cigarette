import { Disclosure } from '@/components/ui/disclosure'
import { useRef, useState } from 'react'
import {
  ArrowLeft2,
  ArrowRight2,
  Clock,
  Forbidden,
  TickCircle,
} from 'iconsax-react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import { LearningAudio } from '@/features/study-plan/learning-ui'
import { LearningStimulus } from '@/features/study-plan/learning-stimulus'
import { authStore, useAuth } from '@/features/auth/auth-store'
import { ApiError, getErrorMessage } from '@/lib/api/client'
import {
  editorialHistory,
  listEditorialContent,
  reviewEditorialContent,
} from '@/features/study-plan/editorial-api'
import type {
  EditorialCandidate,
  EditorialDecision,
  EditorialStatus,
} from '@/features/study-plan/editorial-api'

const labels = { draft: 'Черновик', reviewed: 'Проверено', withdrawn: 'Снято' }
const fieldClass =
  'min-h-11 w-full rounded-[10px] border border-[#e7e7e4] bg-white px-3 py-2 text-base sm:text-sm'
const cardClass = 'rounded-[14px] border-[#e7e7e4] p-4 shadow-none sm:p-5'
function status(item: EditorialCandidate) {
  return item.metadata?.status === 'reviewed' &&
    item.metadata.contentHash !== item.contentHash
    ? 'changed'
    : (item.metadata?.status ?? 'draft')
}
export function LearningContentPage() {
  const { user, hasAnyRole } = useAuth()
  const search = useSearch({ from: '/admin/learning-content' })
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['learning-editorial', user?.id],
    enabled: hasAnyRole(['ADMIN']),
    queryFn: ({ signal }) => listEditorialContent(signal),
  })
  const items = query.data?.items ?? []
  const filtered = items
    .filter(
      (item) =>
        (!search.section || item.section === search.section) &&
        (!search.kind || item.kind === search.kind) &&
        (!search.status || status(item) === search.status) &&
        (!search.q ||
          `${item.title} ${item.id}`
            .toLowerCase()
            .includes(search.q.toLowerCase())),
    )
    .sort((a, b) =>
      `${a.section}:${a.metadata?.familyId ?? ''}:${a.id}`.localeCompare(
        `${b.section}:${b.metadata?.familyId ?? ''}:${b.id}`,
      ),
    )
  const selected = items.find(
    (item) =>
      `${item.kind}:${item.id}` === search.ref &&
      item.version === search.version,
  )
  const setSearch = (patch: Partial<typeof search>) =>
    void navigate({
      to: '/admin/learning-content',
      search: { ...search, ...patch },
      replace: true,
    })
  if (query.isPending)
    return (
      <LoadingState label="Загружаем материалы для редакторской проверки…" />
    )
  if (query.isError)
    return (
      <ErrorState
        title="Материалы не загружены"
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl">
          Редакторская проверка
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#69696d]">
          Допуск объективных заданий Reading и Listening к практическим
          проверкам. Это не калибровка балла IELTS.
        </p>
      </header>
      <div
        className={`grid min-w-0 gap-4 ${selected ? '' : 'lg:grid-cols-[320px_minmax(0,1fr)]'}`}
      >
        <Card className={`${cardClass} ${selected ? 'hidden' : ''}`}>
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm">
              Раздел
              <select
                aria-label="Раздел"
                className={fieldClass}
                value={search.section ?? ''}
                onChange={(e) =>
                  setSearch({ section: e.target.value || undefined })
                }
              >
                <option value="">Все разделы</option>
                {['reading', 'listening', 'writing', 'speaking'].map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Статус
              <select
                aria-label="Статус"
                className={fieldClass}
                value={search.status ?? ''}
                onChange={(e) =>
                  setSearch({ status: e.target.value || undefined })
                }
              >
                <option value="">Все статусы</option>
                {Object.entries(labels).map(([v, l]) => (
                  <option value={v} key={v}>
                    {l}
                  </option>
                ))}
                <option value="changed">Изменено после проверки</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Источник
              <select
                aria-label="Источник"
                className={fieldClass}
                value={search.kind ?? ''}
                onChange={(e) =>
                  setSearch({ kind: e.target.value || undefined })
                }
              >
                <option value="">Все источники</option>
                <option value="drill">Короткое задание</option>
                <option value="material">Опубликованный материал</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Поиск
              <input
                className={fieldClass}
                value={search.q ?? ''}
                onChange={(e) => setSearch({ q: e.target.value || undefined })}
              />
            </label>
            <p className="text-sm text-[#69696d]">Найдено: {filtered.length}</p>
            {!filtered.length ? (
              <Button
                variant="outline"
                onClick={() =>
                  void navigate({ to: '/admin/learning-content', search: {} })
                }
              >
                Сбросить фильтры
              </Button>
            ) : null}
            <div className="max-h-[65vh] divide-y divide-[#ededeb] overflow-y-auto overscroll-contain">
              {filtered.map((item) => (
                <button
                  type="button"
                  key={`${item.kind}:${item.id}:${item.version}`}
                  aria-current={selected === item ? 'true' : undefined}
                  className="grid min-h-11 w-full min-w-0 gap-1 py-3 text-left aria-current:bg-[#f4f4f1]"
                  onClick={() =>
                    setSearch({
                      ref: `${item.kind}:${item.id}`,
                      version: item.version,
                    })
                  }
                >
                  <span className="break-words text-sm font-semibold">
                    {item.title}
                  </span>
                  <span className="break-all text-xs text-[#69696d]">
                    {item.id} · {item.version}
                  </span>
                  <span className="text-sm">
                    {status(item) === 'changed'
                      ? 'Изменено после проверки — не используется'
                      : labels[status(item) as EditorialStatus]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>
        {selected ? (
          <div className="grid min-w-0 content-start gap-3">
            <Button
              className="min-h-11 justify-self-start"
              variant="ghost"
              onClick={() => setSearch({ ref: undefined, version: undefined })}
            >
              <ArrowLeft2 size={16} aria-hidden="true" />К списку
            </Button>
            <EditorialDetail
              key={`${selected.kind}:${selected.id}:${selected.version}`}
              item={selected}
              items={items}
              reload={() => query.refetch()}
            />
          </div>
        ) : (
          <p className="text-sm text-[#69696d]">
            Выберите версию, прочитайте стимул и ключ перед решением.
          </p>
        )}
      </div>
      <Disclosure
        className="text-sm"
        title={<> Ограничения редакторского допуска </>}
      >
        <ul className="grid gap-2 pl-5">
          {query.data.limitations.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </Disclosure>
    </div>
  )
}

function EditorialDetail({
  item,
  items,
  reload,
}: {
  item: EditorialCandidate
  items: EditorialCandidate[]
  reload: () => Promise<unknown>
}) {
  const { user } = useAuth()
  const client = useQueryClient()
  const lock = useRef(false)
  const sourceMaterial = items.find(
    (c) =>
      c.kind === 'material' &&
      c.id === item.drill?.sourceMaterialId &&
      c.version === item.drill.sourceVersionId,
  )
  const sourceFamily =
    sourceMaterial?.metadata?.status === 'reviewed' &&
    sourceMaterial.metadata.contentHash === sourceMaterial.contentHash
      ? sourceMaterial.metadata.familyId
      : ''
  const [family, setFamily] = useState(
    sourceFamily || item.metadata?.familyId || item.drill?.familyId || '',
  )
  const [notes, setNotes] = useState('')
  const [keys, setKeys] = useState(false)
  const [families, setFamilies] = useState(false)
  const [sources, setSources] = useState(false)
  const [opened, setOpened] = useState({
    hash: item.contentHash,
    revision: item.metadata?.revision ?? 0,
  })
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [withdraw, setWithdraw] = useState(false)
  const current = () => authStore.getSnapshot().user?.id === user?.id
  const history = useQuery({
    queryKey: [
      'learning-editorial-history',
      user?.id,
      item.kind,
      item.id,
      item.version,
    ],
    queryFn: ({ signal }) => editorialHistory(item, signal),
    enabled: !!user,
  })
  const stale =
    opened.hash !== item.contentHash ||
    opened.revision !== (item.metadata?.revision ?? 0)
  const objective =
    item.kind === 'material' ||
    item.drill?.modality === 'objective' ||
    (item.section === 'listening' &&
      item.drill?.modality === 'audio' &&
      !!item.drill.audioUrl)
  const reason = stale
    ? 'Сначала загрузите актуальную версию'
    : item.drill?.sourceMaterialId && (!sourceFamily || family !== sourceFamily)
      ? 'Сначала подтвердите семейство исходного материала; упражнение использует то же семейство'
      : !objective
        ? 'Свободный ответ или сценарий без аудио не допускается к независимой проверке'
        : !family.trim()
          ? 'Укажите семейство'
          : !keys || !families || !sources
            ? 'Подтвердите все три проверки'
            : notes.trim().length < 20
              ? 'Заметка должна содержать не менее 20 символов'
              : ''
  async function save(decision: EditorialStatus) {
    if (lock.current || !current() || stale) return
    lock.current = true
    setPending(true)
    setMessage('')
    setError('')
    const input: EditorialDecision = {
      version: item.version,
      contentHash: opened.hash,
      expectedRevision: opened.revision,
      familyId: family.trim(),
      status: decision,
      reviewNotes: notes.trim(),
      keysChecked: keys,
      familyChecked: families,
      sourceChecked: sources,
    }
    try {
      const result = await reviewEditorialContent(item, input)
      if (!current()) return
      await reload()
      if (!current()) return
      setOpened({ hash: result.contentHash, revision: result.revision })
      setKeys(false)
      setFamilies(false)
      setSources(false)
      setWithdraw(false)
      setMessage(`Решение сохранено (ревизия ${result.revision})`)
      await client.invalidateQueries({
        queryKey: [
          'learning-editorial-history',
          user?.id,
          item.kind,
          item.id,
          item.version,
        ],
      })
    } catch (e) {
      if (!current()) return
      setError(
        e instanceof ApiError && e.status === 409
          ? 'Содержимое или решение изменились. Заметка осталась в поле; загрузите версию и проверьте заново.'
          : getErrorMessage(e),
      )
      if (e instanceof ApiError && e.status === 409) {
        setWithdraw(false)
        setKeys(false)
        setFamilies(false)
        setSources(false)
        await reload()
      }
    } finally {
      lock.current = false
      if (current()) setPending(false)
    }
  }
  return (
    <Card className={`${cardClass} grid min-w-0 gap-5`}>
      <header>
        <h2 className="break-words text-lg font-semibold">{item.title}</h2>
      </header>
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2">
        <div className="grid min-w-0 gap-5">
          <section className="grid gap-3">
            <h3 className="text-base font-semibold">Разметка материала</h3>
            <label className="grid gap-2 text-sm">
              Семейство
              <input
                className={fieldClass}
                list="editorial-family-options"
                value={family}
                maxLength={120}
                onChange={(e) => setFamily(e.target.value)}
              />
            </label>
            <datalist id="editorial-family-options">
              {Array.from(
                new Set(
                  items
                    .filter((c) => c.section === item.section)
                    .map((c) => c.metadata?.familyId)
                    .filter(Boolean),
                ),
              ).map((id) => (
                <option key={id} value={id} />
              ))}
            </datalist>
            <p className="text-sm leading-6 text-[#69696d]">
              Семейство объединяет связанные стимулы и шаблоны. Два задания
              одного семейства не являются независимыми проверками. Предложение
              черновика нужно подтвердить или изменить.
            </p>
            {item.drill?.sourceMaterialId ? (
              <p className="break-words text-sm leading-6">
                Исходный материал: {item.drill.sourceMaterialId}. Семейство
                проверенной версии: {sourceFamily || 'пока не подтверждено'}.
                Новая метка не делает повтор того же текста, вопроса или аудио
                независимой проверкой.
              </p>
            ) : null}
            <p className="break-words text-xs text-[#69696d]">
              В этом семействе:{' '}
              {items
                .filter(
                  (c) =>
                    (c.metadata?.familyId || c.drill?.familyId) === family &&
                    c.id !== item.id,
                )
                .map((c) => c.id)
                .join(', ') || 'других позиций не найдено'}
            </p>
          </section>
          <section className="grid gap-3">
            <h3 className="text-base font-semibold">
              Проверка перед публикацией
            </h3>
            <p className="text-xs leading-5 text-muted-foreground">
              Публикация допускает эту версию к учебным проверкам.
            </p>
            <label className="flex min-h-11 items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={keys}
                onChange={(e) => setKeys(e.target.checked)}
                className="mt-1 size-4 shrink-0"
              />
              Ключи и объяснения сверены со стимулом, допустимые варианты и
              ограничения ответа проверены
            </label>
            <label className="flex min-h-11 items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={families}
                onChange={(e) => setFamilies(e.target.checked)}
                className="mt-1 size-4 shrink-0"
              />
              Семейство назначено после сравнения связанных стимулов и шаблонов
            </label>
            <label className="flex min-h-11 items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={sources}
                onChange={(e) => setSources(e.target.checked)}
                className="mt-1 size-4 shrink-0"
              />
              Источник и права проверены
            </label>
            <label className="grid gap-2 text-sm">
              Заметка редактора
              <textarea
                className={`${fieldClass} min-h-28`}
                value={notes}
                maxLength={4000}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <p className="text-sm text-[#69696d]">
              Решение будет записано от имени {user?.displayName || user?.email}
              .
            </p>
            {reason ? <p className="text-sm text-[#69696d]">{reason}</p> : null}
            {stale ? (
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() => {
                  setOpened({
                    hash: item.contentHash,
                    revision: item.metadata?.revision ?? 0,
                  })
                  setKeys(false)
                  setFamilies(false)
                  setSources(false)
                  setError('')
                }}
              >
                Загрузить актуальную версию
              </Button>
            ) : null}
            {error ? (
              <p role="alert" className="text-sm text-[#e23b3b]">
                {error}
              </p>
            ) : null}
            {message ? (
              <p role="status" className="text-sm">
                {message}
              </p>
            ) : null}
          </section>
        </div>
        <aside
          className="grid min-w-0 gap-4 border-t border-border pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5"
          aria-label="Предпросмотр материала"
        >
          <section aria-label="Статус материала">
            <h3 className="text-base font-semibold">Статус</h3>
            <p className="mt-2 break-all text-xs text-[#69696d]">
              {item.kind} · {item.id} · версия {item.version} · ревизия{' '}
              {item.metadata?.revision ?? 0} · hash{' '}
              {item.contentHash.slice(0, 12)}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm">
              <EditorialStatusIcon item={item} />
              {item.metadata
                ? `${labels[item.metadata.status]} · ${item.metadata.reviewedAt} · ${item.metadata.reviewerId}`
                : 'Ещё не проверялось'}
            </p>
            {status(item) === 'changed' ? (
              <p className="mt-2 text-sm text-amber-700">
                Прошлый допуск относится к другому содержимому. Сейчас задание
                не допускается к проверкам.
              </p>
            ) : null}
          </section>
          <h3 className="text-base font-semibold">Предпросмотр</h3>
          {item.drill ? (
            <>
              <section>
                <h3 className="text-sm font-semibold">Стимул и задание</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                  {item.drill.introduction}
                </p>
                <div className="mt-3 text-sm">
                  <LearningStimulus text={item.drill.stimulus} />
                </div>
                {item.section === 'listening' && item.drill.audioUrl ? (
                  <LearningAudio url={item.drill.audioUrl} />
                ) : null}
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">
                  {item.drill.task}
                </p>
                {item.drill.modality === 'script' ? (
                  <p className="mt-2 text-sm text-amber-700">
                    Аудио нет. Чтение сценария не подтверждает аудирование.
                  </p>
                ) : null}
              </section>
              <section>
                <h3 className="text-sm font-semibold">
                  Ключ (видят только администраторы)
                </h3>
                {item.answerKey &&
                typeof item.answerKey === 'object' &&
                !Array.isArray(item.answerKey) &&
                Object.keys(item.answerKey).length === 1 &&
                'value' in item.answerKey &&
                ['string', 'number', 'boolean'].includes(
                  typeof item.answerKey.value,
                ) ? (
                  <p className="mt-2 text-sm">
                    Ответ:{' '}
                    <span className="font-semibold">
                      {String(item.answerKey.value)}
                    </span>
                  </p>
                ) : (
                  <pre className="mt-2 whitespace-pre-wrap break-all text-sm">
                    {item.answerKey
                      ? JSON.stringify(item.answerKey, null, 2)
                      : 'Объективного ключа нет'}
                  </pre>
                )}
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                  {item.explanation}
                </p>
              </section>
              <p className="break-words text-sm text-[#69696d]">
                Права и источник: {item.drill.rightsProvenance || 'Не указано'}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm leading-6">
                Для разметки семейства проверьте опубликованную версию в
                редакторе материала. Разметка не подтверждает шкалу IELTS или
                качество оценивания.
              </p>
              <MaterialLink item={item} />
            </>
          )}
          <Disclosure className="text-sm" title={<> История решений </>}>
            {history.isPending ? (
              <p>Загружаем историю…</p>
            ) : history.isError ? (
              <p role="alert">Не удалось загрузить историю.</p>
            ) : history.data.items.length ? (
              <ol className="grid gap-3">
                {history.data.items.map((event) => (
                  <li
                    key={event.revision}
                    className="grid gap-1 border-t border-[#ededeb] py-3"
                  >
                    <p>
                      {event.createdAt} · ревизия {event.revision} ·{' '}
                      {labels[event.decision.status]}
                    </p>
                    <p className="break-all text-xs text-[#69696d]">
                      {event.reviewerId} · hash{' '}
                      {event.decision.contentHash.slice(0, 12)}
                    </p>
                    <p className="whitespace-pre-wrap break-words">
                      {event.decision.reviewNotes}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p>Решений пока нет.</p>
            )}
          </Disclosure>
        </aside>
      </div>
      <div className="sticky bottom-0 z-10 -mx-4 -mb-4 flex flex-wrap items-center gap-2 rounded-b-[14px] border-t border-border bg-card p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] sm:-mx-5 sm:-mb-5 sm:p-4">
        <Button
          className="min-h-11 bg-[#3b82f6] hover:bg-[#2563eb]"
          disabled={!!reason || pending}
          onClick={() => void save('reviewed')}
        >
          Опубликовать
        </Button>
        <Button
          variant="outline"
          className="min-h-11"
          disabled={pending || stale || notes.trim().length < 20}
          onClick={() => void save('draft')}
        >
          Сохранить черновик
        </Button>
        <Button
          variant="outline"
          className="min-h-11 border-[#f5b9b9] text-[#b91c1c] hover:bg-[#fef2f2] hover:text-[#991b1b]"
          disabled={pending || stale}
          onClick={() => setWithdraw(true)}
        >
          Снять
        </Button>
      </div>
      <Dialog open={withdraw} onOpenChange={setWithdraw}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Снять допуск задания?</DialogTitle>
            <DialogDescription>
              Задание перестанет предлагаться для новых коротких тренировок.
              Сохранённые ответы останутся; допуск практических проверок будет
              пересмотрен.
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-2 text-sm">
            Причина
            <textarea
              className={`${fieldClass} min-h-24`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={4000}
            />
          </label>
          <p className="text-xs text-muted-foreground">Не менее 20 символов.</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              className="min-h-11"
              disabled={pending}
              onClick={() => setWithdraw(false)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              className="min-h-11 bg-[#b91c1c] hover:bg-[#991b1b]"
              disabled={pending || stale || notes.trim().length < 20}
              onClick={() => void save('withdrawn')}
            >
              Подтвердить снятие
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
function EditorialStatusIcon({ item }: { item: EditorialCandidate }) {
  const value = status(item)
  const Icon =
    value === 'reviewed'
      ? TickCircle
      : value === 'withdrawn'
        ? Forbidden
        : Clock
  return (
    <Icon
      size={16}
      aria-hidden="true"
      className={
        value === 'reviewed'
          ? 'shrink-0 text-[#15803d]'
          : 'shrink-0 text-muted-foreground'
      }
    />
  )
}
function MaterialLink({ item }: { item: EditorialCandidate }) {
  const cls =
    'inline-flex min-h-11 items-center gap-2 text-sm text-primary hover:underline underline-offset-4'
  if (item.section === 'reading')
    return (
      <Link
        className={cls}
        to="/admin/reading/materials/$materialId"
        params={{ materialId: item.id }}
      >
        Открыть исходный материал Reading
        <ArrowRight2 size={16} aria-hidden="true" />
      </Link>
    )
  if (item.section === 'listening')
    return (
      <Link
        className={cls}
        to="/admin/listening/tests/$testId"
        params={{ testId: item.id }}
      >
        Открыть исходный материал Listening
        <ArrowRight2 size={16} aria-hidden="true" />
      </Link>
    )
  if (item.section === 'writing')
    return (
      <Link
        className={cls}
        to="/admin/writing/materials/$materialId"
        params={{ materialId: item.id }}
      >
        Открыть исходный материал Writing
        <ArrowRight2 size={16} aria-hidden="true" />
      </Link>
    )
  return (
    <Link
      className={cls}
      to="/admin/speaking/materials/$materialId"
      params={{ materialId: item.id }}
    >
      Открыть исходный материал Speaking
      <ArrowRight2 size={16} aria-hidden="true" />
    </Link>
  )
}
