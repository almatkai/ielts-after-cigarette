import {
  ArrowLeft,
  Save2,
  Send2,
  TickCircle,
  Warning2,
} from 'iconsax-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  adminQueryKeys,
  archiveReadingMaterial,
  createReadingMaterial,
  getReadingMaterial,
  publishReadingMaterial,
  readingQuestionTypes,
  updateReadingMaterial,
} from '@/features/admin/api'
import { useAuth } from '@/features/auth/auth-store'
import { getErrorMessage } from '@/lib/api/client'

import type {
  ReadingMaterial,
  ReadingMaterialInput,
  ReadingQuestion,
  ReadingQuestionGroup,
} from '@/features/admin/api'

type EditorForm = ReadingMaterialInput & { revision: number }

const emptyForm: EditorForm = {
  kind: 'PASSAGE',
  slug: '',
  examType: 'academic',
  difficulty: 'intermediate',
  title: '',
  description: '',
  body: '',
  durationMinutes: null,
  sourceTitle: null,
  sourceUrl: null,
  questionGroups: [],
  revision: 0,
}

const fieldClassName =
  'h-11 rounded-[9px] border-[#deded9] bg-white shadow-none focus-visible:border-[#3b82f6] focus-visible:ring-0'

function materialToForm(material: ReadingMaterial): EditorForm {
  return {
    kind: material.kind,
    slug: material.slug,
    examType: material.examType,
    difficulty: material.difficulty,
    title: material.title,
    description: material.description,
    body: material.body,
    durationMinutes: material.durationMinutes,
    sourceTitle: material.sourceTitle,
    sourceUrl: material.sourceUrl,
    questionGroups: material.questionGroups ?? [],
    revision: material.revision,
  }
}

export function ReadingMaterialEditorPage({
  materialId,
}: {
  materialId?: string
}) {
  const editing = Boolean(materialId)
  const auth = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<EditorForm>(emptyForm)
  const [message, setMessage] = useState<string | null>(null)
  const materialQuery = useQuery({
    queryKey: adminQueryKeys.readingMaterial(materialId ?? 'new'),
    queryFn: ({ signal }) => getReadingMaterial(materialId!, signal),
    enabled: editing,
  })

  useEffect(() => {
    if (materialQuery.data) setForm(materialToForm(materialQuery.data))
  }, [materialQuery.data])

  const saveMutation = useMutation({
    mutationFn: (input: ReadingMaterialInput) =>
      materialId
        ? updateReadingMaterial(materialId, input)
        : createReadingMaterial(input),
    onSuccess: async (material) => {
      setForm(materialToForm(material))
      queryClient.setQueryData(
        adminQueryKeys.readingMaterial(material.id),
        material,
      )
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.readingMaterials,
      })
      setMessage('Черновик сохранён.')
      if (!materialId) {
        await navigate({
          to: '/admin/reading/materials/$materialId',
          params: { materialId: material.id },
          replace: true,
        })
      }
    },
  })
  const publishMutation = useMutation({
    mutationFn: () => publishReadingMaterial(materialId!, form.revision),
    onSuccess: async (material) => {
      setForm(materialToForm(material))
      queryClient.setQueryData(
        adminQueryKeys.readingMaterial(material.id),
        material,
      )
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.readingMaterials,
      })
      setMessage('Текущая версия опубликована.')
    },
  })
  const archiveMutation = useMutation({
    mutationFn: () => archiveReadingMaterial(materialId!, form.revision),
    onSuccess: async (material) => {
      setForm(materialToForm(material))
      queryClient.setQueryData(
        adminQueryKeys.readingMaterial(material.id),
        material,
      )
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.readingMaterials,
      })
      setMessage('Материал перенесён в архив.')
    },
  })

  const update = <TKey extends keyof EditorForm>(
    key: TKey,
    value: EditorForm[TKey],
  ) => setForm((current) => ({ ...current, [key]: value }))

  const addGroup = () =>
    update('questionGroups', [
      ...form.questionGroups,
      {
        position: form.questionGroups.length + 1,
        type: 'multiple_choice',
        instructions: '',
        questions: [
          {
            position: 1,
            prompt: '',
            content: {},
            answer: {},
            explanation: '',
            points: 1,
          },
        ],
      },
    ])

  const updateGroup = (index: number, patch: Partial<ReadingQuestionGroup>) =>
    update(
      'questionGroups',
      form.questionGroups.map((group, groupIndex) =>
        groupIndex === index ? { ...group, ...patch } : group,
      ),
    )

  const updateQuestion = (
    groupIndex: number,
    questionIndex: number,
    patch: Partial<ReadingQuestion>,
  ) =>
    updateGroup(groupIndex, {
      questions: form.questionGroups[groupIndex].questions.map(
        (question, currentIndex) =>
          currentIndex === questionIndex ? { ...question, ...patch } : question,
      ),
    })

  const parseQuestionJSON = (groups: ReadingQuestionGroup[]) =>
    groups.map((group) => ({
      ...group,
      questions: group.questions.map((question) => ({
        ...question,
        content: question.content,
        answer: question.answer,
      })),
    }))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    if (form.title.trim().length < 3 || form.body.trim().length < 50) {
      setMessage('Добавьте название и текст длиной не менее 50 символов.')
      return
    }
    try {
      await saveMutation.mutateAsync({
        ...form,
        sourceTitle: form.sourceTitle?.trim() || null,
        sourceUrl: form.sourceUrl?.trim() || null,
        questionGroups: parseQuestionJSON(form.questionGroups),
        revision: editing ? form.revision : undefined,
      })
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const handlePublish = async () => {
    setMessage(null)
    try {
      await publishMutation.mutateAsync()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  if (editing && materialQuery.isPending) {
    return <p className="text-sm text-[#69696d]">Загружаем материал…</p>
  }
  if (editing && materialQuery.isError) {
    return (
      <Card className="rounded-[16px] border-[#e7e7e4] shadow-none">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <Warning2 className="size-6 text-[#e23b3b]" aria-hidden />
          <p className="mt-3 text-sm">Материал не удалось загрузить.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/admin/reading/materials">Вернуться в библиотеку</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const material = materialQuery.data
  const pending =
    saveMutation.isPending ||
    publishMutation.isPending ||
    archiveMutation.isPending

  return (
    <form className="grid gap-5" onSubmit={(event) => void handleSubmit(event)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button asChild variant="link" className="h-auto p-0 text-[#69696d]">
            <Link to="/admin/reading/materials">
              <ArrowLeft aria-hidden />К библиотеке
            </Link>
          </Button>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-[-0.04em]">
              {editing ? 'Редактор материала' : 'Новый Reading материал'}
            </h1>
            {material ? (
              <Badge variant="outline">{material.status}</Badge>
            ) : null}
          </div>
          {material ? (
            <p className="mt-2 text-xs text-[#808084]">
              Версия текста {material.currentVersionNumber} · revision{' '}
              {material.revision}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {materialId && auth.user?.role === 'ADMIN' ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => void handlePublish()}
            >
              <Send2 aria-hidden />
              Опубликовать текущую версию
            </Button>
          ) : null}
          {materialId && auth.user?.role === 'ADMIN' ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                if (window.confirm('Архивировать этот Reading-материал?')) {
                  archiveMutation.mutate()
                }
              }}
            >
              {archiveMutation.isPending ? 'Архивируем…' : 'Архивировать'}
            </Button>
          ) : null}
          <Button
            type="submit"
            disabled={pending}
            className="bg-[#3b82f6] hover:bg-[#2563eb]"
          >
            <Save2 aria-hidden />
            {saveMutation.isPending ? 'Сохраняем…' : 'Сохранить черновик'}
          </Button>
        </div>
      </div>

      {message ? (
        <div
          className="flex items-center gap-2 rounded-[10px] border border-[#e7e7e4] bg-white px-4 py-3 text-sm"
          role="status"
        >
          <TickCircle className="size-4 text-[#69696d]" aria-hidden />
          {message}
        </div>
      ) : null}

      <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#ededeb] p-5">
          <div>
            <CardTitle className="text-base">Группы вопросов</CardTitle>
            <p className="mt-1 text-xs text-[#808084]">
              Все официальные типы IELTS Reading доступны в списке. Ответы
              хранятся отдельно от текста.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={form.kind === 'TEST'}
            onClick={addGroup}
          >
            Добавить группу
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 p-5">
          {form.questionGroups.length === 0 ? (
            <p className="text-sm text-[#69696d]">
              {form.kind === 'TEST'
                ? `Это полный тест. Вопросы находятся внутри ${materialQuery.data?.passages?.length ?? 0} passage и публикуются вместе.`
                : 'Вопросы можно добавить сейчас или позже.'}
            </p>
          ) : null}
          {form.kind === 'TEST'
            ? materialQuery.data?.passages?.map((passage, index) => (
                <div
                  key={passage.id}
                  className="rounded-[12px] border border-[#e7e7e4] p-4"
                >
                  <p className="font-semibold">
                    Passage {index + 1}: {passage.title}
                  </p>
                  <p className="mt-1 text-sm text-[#69696d]">
                    {passage.questionGroups?.reduce(
                      (total, group) =>
                        total +
                        group.questions.reduce(
                          (points, question) => points + question.points,
                          0,
                        ),
                      0,
                    ) ?? 0}{' '}
                    вопросов
                  </p>
                </div>
              ))
            : null}
          {form.questionGroups.map((group, groupIndex) => (
            <div
              key={`${group.position}-${groupIndex}`}
              className="grid gap-4 rounded-[12px] border border-[#e7e7e4] p-4"
            >
              <div className="flex items-end gap-3">
                <div className="grid flex-1 gap-2">
                  <Label>Тип вопросов</Label>
                  <select
                    value={group.type}
                    onChange={(event) =>
                      updateGroup(groupIndex, {
                        type: event.target
                          .value as ReadingQuestionGroup['type'],
                      })
                    }
                    className={fieldClassName}
                  >
                    {readingQuestionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    update(
                      'questionGroups',
                      form.questionGroups.filter(
                        (_, index) => index !== groupIndex,
                      ),
                    )
                  }
                >
                  Удалить
                </Button>
              </div>
              <div className="grid gap-2">
                <Label>Инструкция</Label>
                <Input
                  value={group.instructions}
                  onChange={(event) =>
                    updateGroup(groupIndex, {
                      instructions: event.target.value,
                    })
                  }
                  className={fieldClassName}
                  placeholder="Choose the correct heading..."
                />
              </div>
              {group.questions.map((question, questionIndex) => (
                <div
                  key={`${question.position}-${questionIndex}`}
                  className="grid gap-3 rounded-[10px] bg-[#f7f7f5] p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      Вопрос {questionIndex + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateGroup(groupIndex, {
                          questions: group.questions.filter(
                            (_, index) => index !== questionIndex,
                          ),
                        })
                      }
                    >
                      Удалить
                    </Button>
                  </div>
                  <Textarea
                    value={question.prompt}
                    onChange={(event) =>
                      updateQuestion(groupIndex, questionIndex, {
                        prompt: event.target.value,
                      })
                    }
                    rows={2}
                    placeholder="Текст вопроса"
                  />
                  <ReadingQuestionFields
                    groupType={group.type}
                    question={question}
                    onChange={(patch) =>
                      updateQuestion(groupIndex, questionIndex, patch)
                    }
                  />
                  <div className="grid gap-2">
                    <Label>Explanation after answer</Label>
                    <Textarea
                      value={question.explanation}
                      onChange={(event) =>
                        updateQuestion(groupIndex, questionIndex, {
                          explanation: event.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Почему этот ответ правильный (необязательно)"
                    />
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={question.points}
                    onChange={(event) =>
                      updateQuestion(groupIndex, questionIndex, {
                        points: Number(event.target.value),
                      })
                    }
                    className={fieldClassName}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  updateGroup(groupIndex, {
                    questions: [
                      ...group.questions,
                      {
                        position: group.questions.length + 1,
                        prompt: '',
                        content: {},
                        answer: {},
                        explanation: '',
                        points: 1,
                      },
                    ],
                  })
                }
              >
                Добавить вопрос
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none">
        <CardHeader className="border-b border-[#ededeb] p-5">
          <CardTitle className="text-base">Метаданные</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 p-5 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="material-title">Название</Label>
            <Input
              id="material-title"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              className={fieldClassName}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="material-slug">Slug</Label>
            <Input
              id="material-slug"
              value={form.slug}
              onChange={(event) => update('slug', event.target.value)}
              placeholder="создастся автоматически"
              className={fieldClassName}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="material-exam-type">Формат экзамена</Label>
            <select
              id="material-exam-type"
              value={form.examType}
              onChange={(event) =>
                update('examType', event.target.value as EditorForm['examType'])
              }
              className={fieldClassName}
            >
              <option value="academic">Academic</option>
              <option value="general">General Training</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="material-difficulty">Сложность</Label>
            <select
              id="material-difficulty"
              value={form.difficulty}
              onChange={(event) =>
                update(
                  'difficulty',
                  event.target.value as EditorForm['difficulty'],
                )
              }
              className={fieldClassName}
            >
              <option value="foundation">Foundation</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="material-description">Краткое описание</Label>
            <Textarea
              id="material-description"
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none">
        <CardHeader className="border-b border-[#ededeb] p-5">
          <CardTitle className="text-base">Passage</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <Label htmlFor="material-body" className="sr-only">
            Текст материала
          </Label>
          <Textarea
            id="material-body"
            value={form.body}
            onChange={(event) => update('body', event.target.value)}
            rows={22}
            className="font-serif text-base leading-7"
            placeholder="Вставьте текст Reading passage…"
          />
          <p className="mt-2 text-right text-xs text-[#808084]">
            {form.body.trim().length} символов
          </p>
        </CardContent>
      </Card>

      <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none">
        <CardHeader className="border-b border-[#ededeb] p-5">
          <CardTitle className="text-base">Источник и права</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 p-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="material-source-title">Название источника</Label>
            <Input
              id="material-source-title"
              value={form.sourceTitle ?? ''}
              onChange={(event) => update('sourceTitle', event.target.value)}
              className={fieldClassName}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="material-source-url">HTTPS-ссылка</Label>
            <Input
              id="material-source-url"
              type="url"
              value={form.sourceUrl ?? ''}
              onChange={(event) => update('sourceUrl', event.target.value)}
              className={fieldClassName}
            />
          </div>
        </CardContent>
        <CardFooter className="border-t border-[#ededeb] px-5 py-4 text-xs leading-5 text-[#808084]">
          Добавляйте только собственные или лицензированные материалы и
          фиксируйте источник.
        </CardFooter>
      </Card>
    </form>
  )
}

type ReadingOption = { id: string; text: string }

function ReadingQuestionFields({
  groupType,
  question,
  onChange,
}: {
  groupType: ReadingQuestionGroup['type']
  question: ReadingQuestion
  onChange: (patch: Partial<ReadingQuestion>) => void
}) {
  const options = Array.isArray(question.content.options)
    ? question.content.options.filter(isReadingOption)
    : []
  const number = numericContent(question.content.number) ?? question.position
  const numberEnd = numericContent(question.content.numberEnd)
  const selectionLimit = numericContent(question.content.selectionLimit)
  const updateContent = (patch: Record<string, unknown>) =>
    onChange({ content: { ...question.content, ...patch } })
  const updateOption = (index: number, patch: Partial<ReadingOption>) =>
    updateContent({
      options: options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    })
  const completion =
    groupType.endsWith('_completion') || groupType === 'short_answer'
  const matching = groupType.startsWith('matching_')
  const enumValues =
    groupType === 'true_false_not_given'
      ? ['TRUE', 'FALSE', 'NOT_GIVEN']
      : groupType === 'yes_no_not_given'
        ? ['YES', 'NO', 'NOT_GIVEN']
        : null
  const multiSelect = groupType === 'multiple_choice' && question.points > 1

  return (
    <div className="grid gap-4 rounded-lg border border-[#deded9] bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label>Номер в тесте</Label>
          <Input
            type="number"
            min={1}
            value={number}
            onChange={(event) =>
              updateContent({ number: Number(event.target.value) })
            }
            className={fieldClassName}
          />
        </div>
        <div className="grid gap-2">
          <Label>Последний номер (multi-select)</Label>
          <Input
            type="number"
            min={number}
            value={numberEnd ?? ''}
            onChange={(event) => {
              const end = event.target.value
                ? Number(event.target.value)
                : undefined
              const limit = end ? end - number + 1 : undefined
              onChange({
                content: {
                  ...question.content,
                  numberEnd: end,
                  selectionLimit: limit,
                },
                ...(limit ? { points: limit } : {}),
              })
            }}
            className={fieldClassName}
            placeholder="Например 22 для диапазона 18–22"
          />
        </div>
        <div className="grid gap-2">
          <Label>Лимит выбора</Label>
          <Input
            type="number"
            min={1}
            value={selectionLimit ?? ''}
            onChange={(event) =>
              updateContent({
                selectionLimit: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
            className={fieldClassName}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Общий текст / таблица / summary</Label>
        <Textarea
          value={
            typeof question.content.context === 'string'
              ? question.content.context
              : ''
          }
          onChange={(event) => updateContent({ context: event.target.value })}
          rows={3}
          placeholder="Используйте {{12}} для пронумерованных пропусков"
        />
      </div>
      <div className="grid gap-2">
        <Label>HTTPS-ссылка на изображение (diagram/map)</Label>
        <Input
          value={
            typeof question.content.imageUrl === 'string'
              ? question.content.imageUrl
              : ''
          }
          onChange={(event) => updateContent({ imageUrl: event.target.value })}
          className={fieldClassName}
          placeholder="https://..."
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label>Варианты / банк слов</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              updateContent({
                options: [
                  ...options,
                  {
                    id: String.fromCharCode(65 + options.length),
                    text: '',
                  },
                ],
              })
            }
          >
            Добавить вариант
          </Button>
        </div>
        {options.map((option, index) => (
          <div key={`${option.id}-${index}`} className="flex gap-2">
            <Input
              aria-label="ID варианта"
              value={option.id}
              onChange={(event) =>
                updateOption(index, { id: event.target.value.toUpperCase() })
              }
              className={`${fieldClassName} w-20`}
            />
            <Input
              aria-label="Текст варианта"
              value={option.text}
              onChange={(event) =>
                updateOption(index, { text: event.target.value })
              }
              className={fieldClassName}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                updateContent({
                  options: options.filter(
                    (_, optionIndex) => optionIndex !== index,
                  ),
                })
              }
            >
              Удалить
            </Button>
          </div>
        ))}
      </div>
      <div className="grid gap-2">
        <Label>Правильный ответ</Label>
        {enumValues ? (
          <select
            value={
              typeof question.answer.value === 'string'
                ? question.answer.value
                : ''
            }
            onChange={(event) =>
              onChange({ answer: { value: event.target.value } })
            }
            className={fieldClassName}
          >
            <option value="">Выберите ответ</option>
            {enumValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        ) : multiSelect ? (
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const selected = Array.isArray(question.answer.optionIds)
                ? question.answer.optionIds.filter(
                    (value): value is string => typeof value === 'string',
                  )
                : []
              return (
                <label
                  key={option.id}
                  className="flex gap-2 rounded-lg border p-3"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.id)}
                    onChange={() => {
                      const next = selected.includes(option.id)
                        ? selected.filter((value) => value !== option.id)
                        : [...selected, option.id]
                      onChange({ answer: { optionIds: next } })
                    }}
                  />
                  {option.id}. {option.text}
                </label>
              )
            })}
          </div>
        ) : matching ||
          groupType === 'multiple_choice' ||
          options.length > 0 ? (
          <select
            value={
              typeof question.answer.optionId === 'string'
                ? question.answer.optionId
                : ''
            }
            onChange={(event) =>
              onChange({ answer: { optionId: event.target.value } })
            }
            className={fieldClassName}
          >
            <option value="">Выберите вариант</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.id}. {option.text}
              </option>
            ))}
          </select>
        ) : completion ? (
          <Input
            value={
              Array.isArray(question.answer.accepted)
                ? question.answer.accepted.join(' | ')
                : ''
            }
            onChange={(event) =>
              onChange({
                answer: {
                  accepted: event.target.value
                    .split('|')
                    .map((value) => value.trim())
                    .filter(Boolean),
                },
              })
            }
            className={fieldClassName}
            placeholder="answer | accepted alternative"
          />
        ) : null}
      </div>
    </div>
  )
}

function isReadingOption(value: unknown): value is ReadingOption {
  if (!value || typeof value !== 'object') return false
  const option = value as Record<string, unknown>
  return typeof option.id === 'string' && typeof option.text === 'string'
}

function numericContent(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
