import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Image, Plus, Save, Send, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/auth-store'
import {
  createListeningTest,
  getAdminListeningTest,
  listeningKeys,
  listeningQuestionTypes,
  publishListeningTest,
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

export function ListeningTestEditorPage({ testId }: { testId?: string }) {
  const editing = Boolean(testId)
  const auth = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Form>(emptyForm)
  const [message, setMessage] = useState<string | null>(null)
  const query = useQuery({
    queryKey: listeningKeys.adminTest(testId ?? 'new'),
    queryFn: ({ signal }) => getAdminListeningTest(testId!, signal),
    enabled: editing,
  })
  useEffect(() => {
    if (query.data) setForm(toForm(query.data))
  }, [query.data])

  const saveMutation = useMutation({
    mutationFn: (input: ListeningTestInput) =>
      testId ? updateListeningTest(testId, input) : createListeningTest(input),
    onSuccess: async (test) => {
      setForm(toForm(test))
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
    mutationFn: () => publishListeningTest(testId!, form.revision),
    onSuccess: (test) => {
      setForm(toForm(test))
      setMessage('Тест опубликован и доступен студентам.')
    },
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
      await saveMutation.mutateAsync({
        ...form,
        parts: form.parts.map((part, pi) => ({
          ...part,
          position: pi + 1,
          groups: part.groups.map((group, gi) => ({
            ...group,
            position: gi + 1,
            questions: group.questions.map((question, qi) => ({
              ...question,
              position: qi + 1,
            })),
          })),
        })),
        revision: editing ? form.revision : undefined,
      })
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  if (editing && query.isPending) return <p>Загружаем конструктор…</p>
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
        <div className="flex gap-2">
          {testId && auth.user?.role === 'ADMIN' ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void publishMutation.mutateAsync()}
            >
              <Send aria-hidden /> Опубликовать
            </Button>
          ) : null}
          <Button type="submit" className="bg-[#3b82f6] hover:bg-[#2563eb]">
            <Save aria-hidden /> Сохранить
          </Button>
        </div>
      </div>
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
              <Upload className="size-5" aria-hidden />
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
                  <Plus aria-hidden /> Добавить вопрос
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
              <Plus aria-hidden /> Добавить группу
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
        <Plus aria-hidden /> Добавить Part
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
