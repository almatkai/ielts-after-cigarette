import {
  Add,
  ArrowLeft,
  DocumentUpload,
  ExportCurve,
  Eye,
  Image,
  Magicpen,
  Play,
  Save2,
  Send2,
  VolumeHigh,
} from 'iconsax-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/auth-store'
import { DataExportDialog } from '@/components/admin/data-export-dialog'
import { serializeListeningToV1 } from '@/features/admin/export-utils'
import {
  archiveListeningTest,
  createListeningTest,
  getAdminListeningTest,
  getListeningMediaBlob,
  listeningKeys,
  listeningQuestionTypes,
  publishListeningTest,
  transcribeListeningTest,
  updateListeningTest,
  uploadListeningMedia,
} from '@/features/listening/api'
import { getErrorMessage } from '@/lib/api/client'

import type {
  ListeningGroup,
  ListeningPart,
  ListeningQuestion,
  ListeningTest,
  ListeningTestInput,
} from '@/features/listening/api'

type Form = ListeningTestInput & { revision: number }
const emptyForm: Form = {
  slug: '',
  examType: 'academic',
  title: '',
  description: '',
  durationMinutes: 40,
  parts: [],
  revision: 0,
}
const emptyQuestion = (number: number): ListeningQuestion => ({
  position: 1,
  number,
  prompt: '',
  content: {},
  answer: {},
  explanation: '',
  points: 1,
})
const emptyGroup = (): ListeningGroup => ({
  position: 1,
  type: 'multiple_choice',
  instructions: '',
  context: '',
  config: {},
  imageAssetId: null,
  questions: [emptyQuestion(1)],
})
const emptyPart = (): ListeningPart => ({
  position: 1,
  title: '',
  audioAssetId: null,
  groups: [emptyGroup()],
})
const toForm = (test: ListeningTest): Form => ({
  slug: test.slug,
  examType: test.examType,
  title: test.title,
  description: test.description,
  durationMinutes: test.durationMinutes,
  parts: test.parts,
  revision: test.revision,
})

const toInput = (form: Form, editing: boolean): ListeningTestInput => ({
  ...form,
  revision: editing ? form.revision : undefined,
  parts: form.parts.map((part, partIndex) => ({
    ...part,
    position: partIndex + 1,
    groups: part.groups.map((group, groupIndex) => ({
      ...group,
      position: groupIndex + 1,
      questions: group.questions.map((question, questionIndex) => ({
        ...question,
        position: questionIndex + 1,
      })),
    })),
  })),
})

function formatSeconds(sec?: number): string {
  if (typeof sec !== 'number' || isNaN(sec)) return '--:--'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function PartAudioPlayer({
  assetId,
  onAudioRef,
}: {
  assetId: string
  onAudioRef?: (el: HTMLAudioElement | null) => void
}) {
  const query = useQuery({
    queryKey: ['listening', 'media', assetId],
    queryFn: () => getListeningMediaBlob(assetId),
  })
  const url = useMemo(
    () => (query.data ? URL.createObjectURL(query.data) : null),
    [query.data],
  )
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )
  if (query.isPending) {
    return <span className="text-xs text-slate-500">Загружаем аудиоплеер…</span>
  }
  if (!url) return null
  return (
    <audio
      ref={onAudioRef}
      className="mt-2 w-full h-9"
      controls
      preload="metadata"
      src={url}
    />
  )
}

export function ListeningTestEditorPage({ testId }: { testId?: string }) {
  const editing = Boolean(testId)
  const auth = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const partAudioRefs = useRef<Record<number, HTMLAudioElement | null>>({})
  const [form, setForm] = useState<Form>(emptyForm)
  const [message, setMessage] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const query = useQuery({
    queryKey: listeningKeys.adminTest(testId ?? 'new'),
    queryFn: ({ signal }) => getAdminListeningTest(testId!, signal),
    enabled: editing,
  })
  useEffect(() => {
    if (query.data) setForm(toForm(query.data))
  }, [query.data])

  const handleSeek = (partIndex: number, sec: number) => {
    const el = partAudioRefs.current[partIndex]
    if (el) {
      el.currentTime = sec
      void el.play()
    }
  }

  const saveMutation = useMutation({
    mutationFn: (input: ListeningTestInput) =>
      testId ? updateListeningTest(testId, input) : createListeningTest(input),
    onSuccess: async (test) => {
      setForm(toForm(test))
      queryClient.setQueryData(listeningKeys.adminTest(test.id), test)
      await queryClient.invalidateQueries({
        queryKey: listeningKeys.adminTests,
      })
      if (!testId)
        await navigate({
          to: '/admin/listening/tests/$testId',
          params: { testId: test.id },
          replace: true,
        })
      setMessage('Черновик сохранён.')
    },
  })
  const publishMutation = useMutation({
    mutationFn: async () => {
      // Save the audio assignment and any other edits first, then publish the
      // revision returned by that save. This prevents Save/Publish races.
      const saved = await updateListeningTest(testId!, toInput(form, true))
      return publishListeningTest(testId!, saved.revision)
    },
    onSuccess: async (test) => {
      setForm(toForm(test))
      queryClient.setQueryData(listeningKeys.adminTest(test.id), test)
      await queryClient.invalidateQueries({
        queryKey: listeningKeys.adminTests,
      })
      setMessage('Тест опубликован и доступен студентам.')
    },
    onError: (error) => setMessage(getErrorMessage(error)),
  })
  const archiveMutation = useMutation({
    mutationFn: () => archiveListeningTest(testId!, form.revision),
    onSuccess: async (test) => {
      setForm(toForm(test))
      queryClient.setQueryData(listeningKeys.adminTest(test.id), test)
      await queryClient.invalidateQueries({
        queryKey: listeningKeys.adminTests,
      })
      setMessage('Тест перенесён в архив.')
    },
  })
  const transcribeMutation = useMutation({
    mutationFn: () => transcribeListeningTest(testId!),
    onSuccess: async (test) => {
      setForm(toForm(test))
      await queryClient.invalidateQueries({
        queryKey: listeningKeys.adminTest(testId!),
      })
      await queryClient.invalidateQueries({
        queryKey: listeningKeys.adminTests,
      })
      setMessage(
        'Аудио успешно расшифровано нейросетью! Таймкоды и подсказки расставлены.',
      )
    },
    onError: (error) => setMessage(getErrorMessage(error)),
  })

  const updatePart = (index: number, patch: Partial<ListeningPart>) =>
    setForm((current) => ({
      ...current,
      parts: current.parts.map((part, i) =>
        i === index ? { ...part, ...patch } : part,
      ),
    }))
  const updateGroup = (
    partIndex: number,
    groupIndex: number,
    patch: Partial<ListeningGroup>,
  ) =>
    updatePart(partIndex, {
      groups: form.parts[partIndex].groups.map((group, i) =>
        i === groupIndex ? { ...group, ...patch } : group,
      ),
    })
  const updateQuestion = (
    partIndex: number,
    groupIndex: number,
    questionIndex: number,
    patch: Partial<ListeningQuestion>,
  ) =>
    updateGroup(partIndex, groupIndex, {
      questions: form.parts[partIndex].groups[groupIndex].questions.map(
        (question, i) =>
          i === questionIndex ? { ...question, ...patch } : question,
      ),
    })

  const sharedAudioAssetId =
    form.parts.length > 0 &&
    form.parts[0].audioAssetId &&
    form.parts.every((part) => part.audioAssetId === form.parts[0].audioAssetId)
      ? form.parts[0].audioAssetId
      : null

  const upload = async (
    kind: 'audio' | 'image',
    file: File,
    assign: (id: string) => void,
  ) => {
    setMessage(`Загружаем ${file.name}…`)
    try {
      const media = await uploadListeningMedia(kind, file)
      assign(media.id)
      setMessage(`${media.originalName} загружен. Сохраните черновик.`)
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)
    try {
      await saveMutation.mutateAsync(toInput(form, editing))
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const dirty =
    !query.data || JSON.stringify(form) !== JSON.stringify(toForm(query.data))
  const pending =
    saveMutation.isPending ||
    publishMutation.isPending ||
    archiveMutation.isPending ||
    transcribeMutation.isPending
  const handlePreview = async () => {
    setMessage(null)
    try {
      const saved = dirty
        ? await saveMutation.mutateAsync(toInput(form, editing))
        : query.data
      await navigate({
        to: '/admin/preview/listening/$testId',
        params: { testId: saved.id },
      })
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  if (editing && query.isPending) return <p>Загружаем конструктор…</p>
  if (editing && query.isError)
    return (
      <div role="alert" className="grid gap-3">
        <p>Не удалось загрузить тест: {getErrorMessage(query.error)}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void query.refetch()}
        >
          Повторить
        </Button>
      </div>
    )
  return (
    <form className="grid gap-5" onSubmit={(event) => void save(event)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Button asChild variant="link" className="h-auto p-0">
            <Link to="/admin/listening/tests">
              <ArrowLeft aria-hidden /> К Listening тестам
            </Link>
          </Button>
          <div className="mt-3 flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-[-0.04em]">
              {editing ? 'Listening конструктор' : 'Новый Listening тест'}
            </h1>
            {query.data ? (
              <Badge variant="outline">{query.data.status}</Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {auth.user?.role === 'ADMIN' ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => void handlePreview()}
            >
              <Eye aria-hidden />
              {dirty ? 'Сохранить и открыть тест' : 'Предпросмотр теста'}
            </Button>
          ) : null}
          {testId && auth.user?.role === 'ADMIN' ? (
            <Button
              type="button"
              variant="outline"
              disabled={
                transcribeMutation.isPending ||
                saveMutation.isPending ||
                publishMutation.isPending ||
                archiveMutation.isPending
              }
              onClick={() => {
                if (
                  window.confirm(
                    'Запустить AI STT транскрибацию аудио и автоматическую расстановку таймкодов для всех вопросов теста?',
                  )
                ) {
                  setMessage(
                    'Отправляем аудио в AI STT сервис и вычисляем таймкоды вопросов (это займет 10–25 сек)…',
                  )
                  transcribeMutation.mutate()
                }
              }}
              className="border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 font-medium"
            >
              <Magicpen aria-hidden className="size-4 text-purple-600 mr-1" />
              {transcribeMutation.isPending
                ? 'STT транскрибация…'
                : 'AI STT Расшифровка'}
            </Button>
          ) : null}
          {testId && auth.user?.role === 'ADMIN' ? (
            <Button
              type="button"
              variant="outline"
              disabled={
                transcribeMutation.isPending ||
                publishMutation.isPending ||
                saveMutation.isPending ||
                archiveMutation.isPending
              }
              onClick={() => {
                setMessage(null)
                publishMutation.mutate()
              }}
            >
              <Send2 aria-hidden />
              {publishMutation.isPending ? 'Публикуем…' : 'Опубликовать'}
            </Button>
          ) : null}
          {testId && auth.user?.role === 'ADMIN' ? (
            <Button
              type="button"
              variant="outline"
              disabled={archiveMutation.isPending}
              onClick={() => {
                if (window.confirm('Архивировать этот Listening тест?')) {
                  archiveMutation.mutate()
                }
              }}
            >
              {archiveMutation.isPending ? 'Архивируем…' : 'Архивировать'}
            </Button>
          ) : null}
          {testId && query.data ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setExportOpen(true)}
            >
              <ExportCurve aria-hidden className="size-4 mr-1.5" /> Экспорт V1
            </Button>
          ) : null}
          <Button
            type="submit"
            disabled={
              saveMutation.isPending ||
              publishMutation.isPending ||
              archiveMutation.isPending
            }
            className="bg-[#3b82f6] hover:bg-[#2563eb]"
          >
            <Save2 aria-hidden /> Сохранить
          </Button>
        </div>
      </div>
      {query.data ? (
        <DataExportDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          title={query.data.title}
          formatLabel="IELTS_LISTENING_IMPORT_V1"
          filename={`${query.data.slug || 'listening-test'}.v1.txt`}
          content={serializeListeningToV1(query.data)}
        />
      ) : null}
      {message ? (
        <div className="rounded-lg border bg-white px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Метаданные</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Название">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Slug">
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="listening-test-105"
            />
          </Field>
          <Field label="Тип экзамена">
            <select
              className="h-10 rounded-md border px-3"
              value={form.examType}
              onChange={(e) =>
                setForm({
                  ...form,
                  examType: e.target.value as Form['examType'],
                })
              }
            >
              <option value="academic">Academic</option>
              <option value="general">General</option>
            </select>
          </Field>
          <Field label="Продолжительность">
            <Input
              type="number"
              min={1}
              max={180}
              value={form.durationMinutes}
              onChange={(e) =>
                setForm({ ...form, durationMinutes: Number(e.target.value) })
              }
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Описание">
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Общее аудио теста</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <DocumentUpload className="size-5" aria-hidden />
            <label
              className={
                form.parts.length > 0
                  ? 'cursor-pointer text-sm font-semibold text-[#1d4ed8]'
                  : 'cursor-not-allowed text-sm font-semibold text-[#9b9b9f]'
              }
            >
              Загрузить один файл для всех Parts
              <input
                className="sr-only"
                type="file"
                disabled={form.parts.length === 0}
                accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    void upload('audio', file, (id) =>
                      setForm((current) => ({
                        ...current,
                        parts: current.parts.map((part) => ({
                          ...part,
                          audioAssetId: id,
                        })),
                      })),
                    )
                  }
                }}
              />
            </label>
            <span className="text-xs text-[#69696d]">
              {sharedAudioAssetId
                ? `Общий audio asset: ${sharedAudioAssetId}`
                : form.parts.length > 0
                  ? 'Общий аудиофайл ещё не прикреплён'
                  : 'Сначала импортируйте или добавьте Parts'}
            </span>
          </div>
          <p className="mt-2 text-xs text-[#69696d]">
            Один непрерывный файл будет воспроизводиться без перезапуска при
            переходе между вопросами и частями теста.
          </p>
        </CardContent>
      </Card>

      {form.parts.map((part, partIndex) => (
        <Card key={partIndex} className="shadow-none">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Part {partIndex + 1}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setForm({
                  ...form,
                  parts: form.parts.filter((_, i) => i !== partIndex),
                })
              }
            >
              Удалить part
            </Button>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Field label="Название part">
              <Input
                value={part.title}
                onChange={(e) =>
                  updatePart(partIndex, { title: e.target.value })
                }
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <ExportCurve className="size-5" aria-hidden />
              <label className="cursor-pointer text-sm font-semibold text-[#1d4ed8]">
                Загрузить аудио
                <input
                  className="sr-only"
                  type="file"
                  accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file)
                      void upload('audio', file, (id) =>
                        updatePart(partIndex, { audioAssetId: id }),
                      )
                  }}
                />
              </label>
              <span className="text-xs text-[#69696d]">
                {part.audioAssetId
                  ? `asset ${part.audioAssetId}`
                  : 'аудио не прикреплено'}
              </span>
            </div>
            {part.audioAssetId ? (
              <div className="rounded-lg border bg-slate-50 p-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold flex items-center gap-1.5 text-slate-700">
                    <VolumeHigh className="size-3.5 text-blue-600" />
                    Плеер предпросмотра аудио
                  </span>
                  <span>Part {partIndex + 1}</span>
                </div>
                <PartAudioPlayer
                  assetId={part.audioAssetId}
                  onAudioRef={(el) => {
                    partAudioRefs.current[partIndex] = el
                  }}
                />
              </div>
            ) : null}

            {part.transcript ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Стенограмма аудио (AI STT Transcript)
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-white text-blue-700 border-blue-200 text-[11px]"
                    >
                      {part.transcriptSegments?.length ?? 0} сегментов
                    </Badge>
                  </div>
                </div>

                {part.transcriptSegments &&
                part.transcriptSegments.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto space-y-1.5 rounded-lg border border-blue-100 bg-white p-3 text-xs">
                    {part.transcriptSegments.map((seg) => (
                      <div
                        key={seg.id}
                        className="flex items-start gap-2 hover:bg-slate-50 p-1 rounded"
                      >
                        <button
                          type="button"
                          onClick={() => handleSeek(partIndex, seg.start)}
                          className="shrink-0 font-mono text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
                          title="Перемотать аудио на эту секунду"
                        >
                          ▶ {formatSeconds(seg.start)} -{' '}
                          {formatSeconds(seg.end)}
                        </button>
                        <span className="text-slate-700 leading-relaxed">
                          {seg.text}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-blue-100 max-h-48 overflow-y-auto">
                    {part.transcript}
                  </p>
                )}
              </div>
            ) : null}
            {part.groups.map((group, groupIndex) => (
              <div
                key={groupIndex}
                className="grid gap-4 rounded-xl border bg-[#fafaf8] p-4"
              >
                <div className="flex flex-wrap items-end gap-3">
                  <Field label={`Group ${groupIndex + 1} — тип`}>
                    <select
                      className="h-10 rounded-md border px-3"
                      value={group.type}
                      onChange={(e) =>
                        updateGroup(partIndex, groupIndex, {
                          type: e.target.value as ListeningGroup['type'],
                        })
                      }
                    >
                      {listeningQuestionTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.replaceAll('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      updatePart(partIndex, {
                        groups: part.groups.filter((_, i) => i !== groupIndex),
                      })
                    }
                  >
                    Удалить group
                  </Button>
                </div>
                <Field label="Инструкция">
                  <Textarea
                    value={group.instructions}
                    onChange={(e) =>
                      updateGroup(partIndex, groupIndex, {
                        instructions: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Общий контекст / форма / таблица">
                  <Textarea
                    rows={5}
                    value={group.context}
                    onChange={(e) =>
                      updateGroup(partIndex, groupIndex, {
                        context: e.target.value,
                      })
                    }
                    placeholder="Используйте {{answer}} в отображаемых пропусках"
                  />
                </Field>
                <Field label="Group config JSON">
                  <Textarea
                    value={JSON.stringify(group.config)}
                    onChange={(e) => {
                      try {
                        updateGroup(partIndex, groupIndex, {
                          config: JSON.parse(e.target.value),
                        })
                      } catch {}
                    }}
                  />
                </Field>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Image className="size-5" aria-hidden />
                  <label className="cursor-pointer text-sm font-semibold text-[#1d4ed8]">
                    Загрузить карту/схему
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file)
                          void upload('image', file, (id) =>
                            updateGroup(partIndex, groupIndex, {
                              imageAssetId: id,
                            }),
                          )
                      }}
                    />
                  </label>
                  <span className="text-xs text-[#69696d]">
                    {group.imageAssetId
                      ? `asset ${group.imageAssetId}`
                      : 'изображение не прикреплено'}
                  </span>
                </div>
                {group.questions.map((question, questionIndex) => (
                  <div
                    key={questionIndex}
                    className="grid gap-3 rounded-lg border bg-white p-3"
                  >
                    <div className="flex items-center justify-between">
                      <strong>Вопрос {question.number || '?'}</strong>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          updateGroup(partIndex, groupIndex, {
                            questions: group.questions.filter(
                              (_, i) => i !== questionIndex,
                            ),
                          })
                        }
                      >
                        Удалить
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                      <Field label="Номер">
                        <Input
                          type="number"
                          min={1}
                          value={question.number}
                          onChange={(e) =>
                            updateQuestion(
                              partIndex,
                              groupIndex,
                              questionIndex,
                              { number: Number(e.target.value) },
                            )
                          }
                        />
                      </Field>
                      <Field label="Текст">
                        <Textarea
                          value={question.prompt}
                          onChange={(e) =>
                            updateQuestion(
                              partIndex,
                              groupIndex,
                              questionIndex,
                              { prompt: e.target.value },
                            )
                          }
                        />
                      </Field>
                    </div>

                    {/* Audio Timestamps & Hint/Quote Editor */}
                    <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-blue-100 bg-blue-50/30 p-3">
                      <Field label="Таймкод начала ответа (сек)">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            min={0}
                            placeholder="14.5"
                            value={
                              typeof question.content.timestampStart ===
                              'number'
                                ? question.content.timestampStart
                                : ''
                            }
                            onChange={(e) => {
                              const val =
                                e.target.value === ''
                                  ? undefined
                                  : Number(e.target.value)
                              const nextContent = { ...question.content }
                              if (val === undefined) {
                                delete nextContent.timestampStart
                              } else {
                                nextContent.timestampStart = val
                              }
                              updateQuestion(
                                partIndex,
                                groupIndex,
                                questionIndex,
                                {
                                  content: nextContent,
                                },
                              )
                            }}
                          />
                          {typeof question.content.timestampStart ===
                            'number' && (
                            <span className="text-xs font-mono text-slate-600 shrink-0">
                              ({formatSeconds(question.content.timestampStart)})
                            </span>
                          )}
                          {typeof question.content.timestampStart ===
                            'number' &&
                            part.audioAssetId && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleSeek(
                                    partIndex,
                                    question.content.timestampStart as number,
                                  )
                                }
                                className="h-9 px-2.5 text-xs text-blue-600 shrink-0 hover:bg-blue-50"
                                title="Слушать с этой секунды"
                              >
                                <Play className="size-3 mr-1 text-blue-600" />
                                <span>Слушать</span>
                              </Button>
                            )}
                        </div>
                      </Field>
                      <Field label="Таймкод конца ответа (сек)">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            min={0}
                            placeholder="21.0"
                            value={
                              typeof question.content.timestampEnd === 'number'
                                ? question.content.timestampEnd
                                : ''
                            }
                            onChange={(e) => {
                              const val =
                                e.target.value === ''
                                  ? undefined
                                  : Number(e.target.value)
                              const nextContent = { ...question.content }
                              if (val === undefined) {
                                delete nextContent.timestampEnd
                              } else {
                                nextContent.timestampEnd = val
                              }
                              updateQuestion(
                                partIndex,
                                groupIndex,
                                questionIndex,
                                {
                                  content: nextContent,
                                },
                              )
                            }}
                          />
                          {typeof question.content.timestampEnd ===
                            'number' && (
                            <span className="text-xs font-mono text-slate-600 shrink-0">
                              ({formatSeconds(question.content.timestampEnd)})
                            </span>
                          )}
                        </div>
                      </Field>

                      <div className="sm:col-span-2">
                        <Field label="Цитата-доказательство из аудио (Quote)">
                          <Textarea
                            rows={2}
                            placeholder="Фраза или предложение из аудиозаписи, подтверждающее ответ..."
                            value={
                              typeof question.content.quote === 'string'
                                ? question.content.quote
                                : ''
                            }
                            onChange={(e) =>
                              updateQuestion(
                                partIndex,
                                groupIndex,
                                questionIndex,
                                {
                                  content: {
                                    ...question.content,
                                    quote: e.target.value,
                                  },
                                },
                              )
                            }
                          />
                        </Field>
                      </div>

                      <div className="sm:col-span-2">
                        <Field label="Подсказка к поиску ответа (Scaffolding Hint на русском)">
                          <Textarea
                            rows={2}
                            placeholder="Наводящая подсказка для студента: на что обратить внимание или какие ключевые слова слушать..."
                            value={
                              typeof question.content.hint === 'string'
                                ? question.content.hint
                                : ''
                            }
                            onChange={(e) =>
                              updateQuestion(
                                partIndex,
                                groupIndex,
                                questionIndex,
                                {
                                  content: {
                                    ...question.content,
                                    hint: e.target.value,
                                  },
                                },
                              )
                            }
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Content JSON">
                        <Textarea
                          value={JSON.stringify(question.content)}
                          onChange={(e) => {
                            try {
                              updateQuestion(
                                partIndex,
                                groupIndex,
                                questionIndex,
                                { content: JSON.parse(e.target.value) },
                              )
                            } catch {}
                          }}
                        />
                      </Field>
                      <Field label="Correct answer JSON">
                        <Textarea
                          value={JSON.stringify(question.answer)}
                          onChange={(e) => {
                            try {
                              updateQuestion(
                                partIndex,
                                groupIndex,
                                questionIndex,
                                { answer: JSON.parse(e.target.value) },
                              )
                            } catch {}
                          }}
                        />
                      </Field>
                    </div>
                    <Field label="Explanation after answer">
                      <Textarea
                        value={question.explanation}
                        onChange={(e) =>
                          updateQuestion(partIndex, groupIndex, questionIndex, {
                            explanation: e.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const max = Math.max(
                      0,
                      ...form.parts.flatMap((p) =>
                        p.groups.flatMap((g) =>
                          g.questions.map((q) => q.number),
                        ),
                      ),
                    )
                    updateGroup(partIndex, groupIndex, {
                      questions: [
                        ...group.questions,
                        {
                          ...emptyQuestion(max + 1),
                          position: group.questions.length + 1,
                        },
                      ],
                    })
                  }}
                >
                  <Add aria-hidden /> Добавить вопрос
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                updatePart(partIndex, {
                  groups: [
                    ...part.groups,
                    {
                      ...emptyGroup(),
                      position: part.groups.length + 1,
                      questions: [],
                    },
                  ],
                })
              }
            >
              <Add aria-hidden /> Добавить группу
            </Button>
          </CardContent>
        </Card>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          setForm({
            ...form,
            parts: [
              ...form.parts,
              { ...emptyPart(), position: form.parts.length + 1 },
            ],
          })
        }
      >
        <Add aria-hidden /> Добавить Part
      </Button>
    </form>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
