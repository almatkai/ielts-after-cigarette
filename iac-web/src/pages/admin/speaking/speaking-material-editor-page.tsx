import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2, Plus, Save, Send, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/auth-store'
import {
  archiveSpeakingMaterial,
  createSpeakingMaterial,
  getSpeakingMaterial,
  publishSpeakingMaterial,
  speakingKeys,
  updateSpeakingMaterial,
} from '@/features/speaking/api'
import type {
  SpeakingMaterialInput,
  SpeakingPartInput,
} from '@/features/speaking/api'
import { getErrorMessage } from '@/lib/api/client'

const fieldClassName = 'border-[#deded9] bg-white shadow-none'

const emptyForm: SpeakingMaterialInput = {
  slug: '',
  examType: 'academic',
  difficulty: 'intermediate',
  title: '',
  description: '',
  parts: [
    {
      position: 1,
      type: 'part1',
      title: 'Introduction and interview',
      instructions: 'Answer the examiner naturally.',
      preparationSeconds: 0,
      responseSeconds: 300,
      cueCard: [],
      questions: [
        { position: 1, prompt: '' },
        { position: 2, prompt: '' },
      ],
    },
    {
      position: 2,
      type: 'part2',
      title: 'Describe a memorable place you have visited.',
      instructions:
        'You have one minute to prepare and up to two minutes to speak.',
      preparationSeconds: 60,
      responseSeconds: 120,
      cueCard: ['You should say:', 'where it was', 'when you went there'],
      questions: [],
    },
    {
      position: 3,
      type: 'part3',
      title: 'Discussion',
      instructions:
        'Discuss more abstract questions connected to the Part 2 topic.',
      preparationSeconds: 0,
      responseSeconds: 300,
      cueCard: [],
      questions: [
        { position: 1, prompt: '' },
        { position: 2, prompt: '' },
      ],
    },
  ],
}

export function SpeakingMaterialEditorPage({
  materialId,
}: {
  materialId?: string
}) {
  const auth = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const editing = Boolean(materialId)
  const [form, setForm] = useState<SpeakingMaterialInput>(emptyForm)
  const [message, setMessage] = useState<string | null>(null)
  const materialQuery = useQuery({
    queryKey: speakingKeys.adminMaterial(materialId ?? ''),
    queryFn: ({ signal }) => getSpeakingMaterial(materialId ?? '', signal),
    enabled: editing,
  })
  useEffect(() => {
    const material = materialQuery.data
    if (!material) return
    setForm({
      slug: material.slug,
      examType: material.examType,
      difficulty: material.difficulty,
      title: material.title,
      description: material.description,
      parts: material.parts,
      revision: material.revision,
    })
  }, [materialQuery.data])

  const saveMutation = useMutation({
    mutationFn: () =>
      materialId
        ? updateSpeakingMaterial(materialId, form)
        : createSpeakingMaterial(form),
    onSuccess: async (material) => {
      await queryClient.invalidateQueries({
        queryKey: speakingKeys.adminMaterials,
      })
      if (!materialId) {
        await navigate({
          to: '/admin/speaking/materials/$materialId',
          params: { materialId: material.id },
        })
        return
      }
      setForm((current) => ({ ...current, revision: material.revision }))
      setMessage('Черновик сохранён.')
    },
  })
  const publishMutation = useMutation({
    mutationFn: () =>
      publishSpeakingMaterial(materialId ?? '', form.revision ?? 0),
    onSuccess: async (material) => {
      await queryClient.invalidateQueries({
        queryKey: speakingKeys.adminMaterials,
      })
      await queryClient.invalidateQueries({
        queryKey: speakingKeys.adminMaterial(material.id),
      })
      setForm((current) => ({ ...current, revision: material.revision }))
      setMessage('Материал опубликован.')
    },
  })
  const archiveMutation = useMutation({
    mutationFn: () =>
      archiveSpeakingMaterial(materialId ?? '', form.revision ?? 0),
    onSuccess: async (material) => {
      await queryClient.invalidateQueries({
        queryKey: speakingKeys.adminMaterials,
      })
      await queryClient.invalidateQueries({
        queryKey: speakingKeys.adminMaterial(material.id),
      })
      setForm((current) => ({ ...current, revision: material.revision }))
      setMessage('Материал перенесён в архив.')
    },
  })
  const update = <TKey extends keyof SpeakingMaterialInput>(
    key: TKey,
    value: SpeakingMaterialInput[TKey],
  ) => setForm((current) => ({ ...current, [key]: value }))
  const updatePart = (index: number, patch: Partial<SpeakingPartInput>) =>
    update(
      'parts',
      form.parts.map((part, partIndex) =>
        partIndex === index ? { ...part, ...patch } : part,
      ),
    )
  const pending =
    saveMutation.isPending || publishMutation.isPending || archiveMutation.isPending

  if (materialQuery.isPending && editing)
    return <p className="text-sm text-[#69696d]">Загружаем материал…</p>
  if (materialQuery.isError)
    return (
      <Card className="shadow-none">
        <CardContent className="p-6 text-center text-sm text-[#e23b3b]">
          Не удалось загрузить материал.
        </CardContent>
      </Card>
    )
  const material = materialQuery.data
  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault()
        setMessage(null)
        saveMutation.mutate()
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button asChild variant="link" className="h-auto p-0 text-[#69696d]">
            <Link to="/admin/speaking/materials">
              <ArrowLeft aria-hidden />К библиотеке
            </Link>
          </Button>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-[-0.04em]">
              {editing ? 'Редактор Speaking' : 'Новый Speaking-материал'}
            </h1>
            {material ? (
              <Badge variant="outline">{material.status}</Badge>
            ) : null}
          </div>
          {material ? (
            <p className="mt-2 text-xs text-[#808084]">
              Версия {material.currentVersionNumber} · revision{' '}
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
              onClick={() => {
                setMessage(null)
                publishMutation.mutate()
              }}
            >
              <Send aria-hidden />
              Опубликовать
            </Button>
          ) : null}
          {materialId && auth.user?.role === 'ADMIN' ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                if (window.confirm('Архивировать этот Speaking-материал?')) {
                  archiveMutation.mutate()
                }
              }}
            >
              {archiveMutation.isPending ? 'Архивируем…' : 'Архивировать'}
            </Button>
          ) : null}
          <Button type="submit" disabled={pending}>
            <Save aria-hidden />
            {saveMutation.isPending ? 'Сохраняем…' : 'Сохранить черновик'}
          </Button>
        </div>
      </div>
      {message ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border p-3 text-sm"
        >
          <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
          {message}
        </p>
      ) : null}
      {saveMutation.isError || publishMutation.isError || archiveMutation.isError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-[#e23b3b]"
        >
          {getErrorMessage(
            saveMutation.error ?? publishMutation.error ?? archiveMutation.error,
          )}
        </p>
      ) : null}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Метаданные</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Название" className="sm:col-span-2">
            <Input
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              className={fieldClassName}
            />
          </Field>
          <Field label="Slug">
            <Input
              value={form.slug}
              onChange={(event) => update('slug', event.target.value)}
              placeholder="создастся автоматически"
              className={fieldClassName}
            />
          </Field>
          <Field label="Формат экзамена">
            <select
              value={form.examType}
              onChange={(event) =>
                update(
                  'examType',
                  event.target.value as SpeakingMaterialInput['examType'],
                )
              }
              className={fieldClassName}
            >
              <option value="academic">Academic</option>
              <option value="general">General Training</option>
            </select>
          </Field>
          <Field label="Сложность">
            <select
              value={form.difficulty}
              onChange={(event) =>
                update(
                  'difficulty',
                  event.target.value as SpeakingMaterialInput['difficulty'],
                )
              }
              className={fieldClassName}
            >
              <option value="foundation">Foundation</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </Field>
          <Field label="Краткое описание" className="sm:col-span-2">
            <Textarea
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              rows={3}
            />
          </Field>
        </CardContent>
      </Card>
      {form.parts.map((part, index) => (
        <PartEditor
          key={part.type}
          part={part}
          title={`Part ${index + 1}`}
          onChange={(patch) => updatePart(index, patch)}
        />
      ))}
    </form>
  )
}

function PartEditor({
  title,
  part,
  onChange,
}: {
  title: string
  part: SpeakingPartInput
  onChange: (patch: Partial<SpeakingPartInput>) => void
}) {
  const updateQuestion = (index: number, prompt: string) =>
    onChange({
      questions: part.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, prompt } : question,
      ),
    })
  const addQuestion = () =>
    onChange({
      questions: [
        ...part.questions,
        { position: part.questions.length + 1, prompt: '' },
      ],
    })
  const removeQuestion = (index: number) =>
    onChange({
      questions: part.questions
        .filter((_, questionIndex) => questionIndex !== index)
        .map((question, questionIndex) => ({
          ...question,
          position: questionIndex + 1,
        })),
    })
  const cueText = part.cueCard.join('\n')
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <Field label="Тема / карточка">
          <Textarea
            value={part.title}
            onChange={(event) => onChange({ title: event.target.value })}
            rows={3}
          />
        </Field>
        <Field label="Инструкция">
          <Textarea
            value={part.instructions}
            onChange={(event) => onChange({ instructions: event.target.value })}
            rows={3}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Подготовка, секунд">
            <Input
              type="number"
              min={0}
              max={120}
              value={part.preparationSeconds}
              onChange={(event) =>
                onChange({ preparationSeconds: Number(event.target.value) })
              }
              className={fieldClassName}
            />
          </Field>
          <Field label="Ответ, секунд">
            <Input
              type="number"
              min={30}
              max={600}
              value={part.responseSeconds}
              onChange={(event) =>
                onChange({ responseSeconds: Number(event.target.value) })
              }
              className={fieldClassName}
            />
          </Field>
        </div>
        {part.type === 'part2' ? (
          <Field label="Cue-card: одна подсказка на строку">
            <Textarea
              value={cueText}
              onChange={(event) =>
                onChange({
                  cueCard: event.target.value
                    .split('\n')
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
              rows={6}
              placeholder={'You should say:\n…'}
            />
          </Field>
        ) : (
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Вопросы экзаменатора</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuestion}
              >
                <Plus aria-hidden />
                Добавить
              </Button>
            </div>
            {part.questions.map((question, index) => (
              <div key={question.id ?? index} className="flex gap-2">
                <Input
                  value={question.prompt}
                  onChange={(event) =>
                    updateQuestion(index, event.target.value)
                  }
                  placeholder={`Question ${index + 1}`}
                  className={fieldClassName}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Удалить вопрос ${index + 1}`}
                  disabled={part.questions.length <= 2}
                  onClick={() => removeQuestion(index)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`grid gap-2 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
