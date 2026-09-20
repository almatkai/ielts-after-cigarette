import {
  ArrowLeft,
  DocumentUpload,
  Save2,
  Send2,
  TickCircle,
} from 'iconsax-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/auth-store'
import {
  archiveWritingMaterial,
  createWritingMaterial,
  getWritingMaterial,
  publishWritingMaterial,
  updateWritingMaterial,
  uploadWritingMedia,
  writingKeys,
} from '@/features/writing/api'
import type {
  WritingMaterialInput,
  WritingTaskInput,
} from '@/features/writing/api'
import { getErrorMessage } from '@/lib/api/client'

const fieldClassName = 'border-[#deded9] bg-white shadow-none'

const emptyForm: WritingMaterialInput = {
  slug: '',
  examType: 'academic',
  difficulty: 'intermediate',
  title: '',
  description: '',
  durationMinutes: 60,
  tasks: [
    {
      position: 1,
      type: 'task1',
      prompt: '',
      minimumWords: 150,
      visualType: 'bar_chart',
    },
    {
      position: 2,
      type: 'task2',
      prompt: '',
      minimumWords: 250,
      essayType: 'opinion',
    },
  ],
}

export function WritingMaterialEditorPage({
  materialId,
}: {
  materialId?: string
}) {
  const auth = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const editing = Boolean(materialId)
  const [form, setForm] = useState<WritingMaterialInput>(emptyForm)
  const [message, setMessage] = useState<string | null>(null)
  const materialQuery = useQuery({
    queryKey: writingKeys.adminMaterial(materialId ?? ''),
    queryFn: ({ signal }) => getWritingMaterial(materialId ?? '', signal),
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
      durationMinutes: material.durationMinutes,
      tasks: material.tasks,
      revision: material.revision,
    })
  }, [materialQuery.data])

  const saveMutation = useMutation({
    mutationFn: () =>
      materialId
        ? updateWritingMaterial(materialId, form)
        : createWritingMaterial(form),
    onSuccess: async (material) => {
      await queryClient.invalidateQueries({
        queryKey: writingKeys.adminMaterials,
      })
      if (!materialId) {
        await navigate({
          to: '/admin/writing/materials/$materialId',
          params: { materialId: material.id },
        })
        return
      }
      setForm((current) => ({ ...current, revision: material.revision }))
      setMessage('Черновик сохранён.')
    },
  })
  const publishMutation = useMutation({
    mutationFn: async () => {
      const saved = await updateWritingMaterial(materialId ?? '', form)
      return publishWritingMaterial(materialId ?? '', saved.revision)
    },
    onSuccess: async (material) => {
      await queryClient.invalidateQueries({
        queryKey: writingKeys.adminMaterials,
      })
      await queryClient.invalidateQueries({
        queryKey: writingKeys.adminMaterial(material.id),
      })
      setForm((current) => ({ ...current, revision: material.revision }))
      setMessage('Материал опубликован.')
    },
  })
  const uploadMutation = useMutation({
    mutationFn: uploadWritingMedia,
    onSuccess: (media) => {
      updateTask(0, { visualAssetId: media.id, visualUrl: undefined })
      setMessage(`${media.originalName} загружен. Сохраните черновик.`)
    },
  })
  const archiveMutation = useMutation({
    mutationFn: () =>
      archiveWritingMaterial(materialId ?? '', form.revision ?? 0),
    onSuccess: async (material) => {
      await queryClient.invalidateQueries({
        queryKey: writingKeys.adminMaterials,
      })
      await queryClient.invalidateQueries({
        queryKey: writingKeys.adminMaterial(material.id),
      })
      setForm((current) => ({ ...current, revision: material.revision }))
      setMessage('Материал перенесён в архив.')
    },
  })

  const update = <TKey extends keyof WritingMaterialInput>(
    key: TKey,
    value: WritingMaterialInput[TKey],
  ) => setForm((current) => ({ ...current, [key]: value }))
  const updateTask = (index: number, patch: Partial<WritingTaskInput>) => {
    update(
      'tasks',
      form.tasks.map((task, taskIndex) =>
        taskIndex === index ? { ...task, ...patch } : task,
      ),
    )
  }

  const handleExamType = (examType: WritingMaterialInput['examType']) => {
    update('examType', examType)
    const first = form.tasks[0]
    updateTask(0, {
      visualType:
        examType === 'academic' ? (first.visualType ?? 'bar_chart') : undefined,
      visualUrl: examType === 'academic' ? first.visualUrl : undefined,
      visualAssetId: examType === 'academic' ? first.visualAssetId : undefined,
      letterTone:
        examType === 'general' ? (first.letterTone ?? 'formal') : undefined,
    })
  }

  if (materialQuery.isPending && editing) {
    return <p className="text-sm text-[#69696d]">Загружаем материал…</p>
  }
  if (materialQuery.isError) {
    return (
      <Card className="shadow-none">
        <CardContent className="p-6 text-center text-sm text-[#e23b3b]">
          Не удалось загрузить материал.
        </CardContent>
      </Card>
    )
  }
  const material = materialQuery.data
  const pending =
    saveMutation.isPending ||
    publishMutation.isPending ||
    archiveMutation.isPending ||
    uploadMutation.isPending
  const taskOne = form.tasks[0]
  const taskTwo = form.tasks[1]

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
            <Link to="/admin/writing/materials">
              <ArrowLeft aria-hidden />К библиотеке
            </Link>
          </Button>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-[-0.04em]">
              {editing ? 'Редактор Writing' : 'Новый Writing-материал'}
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
              <Send2 aria-hidden />{' '}
              {publishMutation.isPending ? 'Публикуем…' : 'Опубликовать'}
            </Button>
          ) : null}
          {materialId && auth.user?.role === 'ADMIN' ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                if (window.confirm('Архивировать этот Writing-материал?')) {
                  archiveMutation.mutate()
                }
              }}
            >
              {archiveMutation.isPending ? 'Архивируем…' : 'Архивировать'}
            </Button>
          ) : null}
          <Button type="submit" disabled={pending}>
            <Save2 aria-hidden />
            {saveMutation.isPending ? 'Сохраняем…' : 'Сохранить черновик'}
          </Button>
        </div>
      </div>
      {message ? (
        <p
          className="flex items-center gap-2 rounded-xl border p-3 text-sm"
          role="status"
        >
          <TickCircle className="size-4 text-emerald-600" aria-hidden />
          {message}
        </p>
      ) : null}
      {saveMutation.isError ||
      publishMutation.isError ||
      archiveMutation.isError ||
      uploadMutation.isError ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-[#e23b3b]"
          role="alert"
        >
          {getErrorMessage(
            saveMutation.error ??
              publishMutation.error ??
              archiveMutation.error ??
              uploadMutation.error,
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
                handleExamType(
                  event.target.value as WritingMaterialInput['examType'],
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
                  event.target.value as WritingMaterialInput['difficulty'],
                )
              }
              className={fieldClassName}
            >
              <option value="foundation">Foundation</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </Field>
          <Field label="Лимит времени, минуты">
            <Input
              type="number"
              min={5}
              max={180}
              value={form.durationMinutes}
              onChange={(event) =>
                update('durationMinutes', Number(event.target.value))
              }
              className={fieldClassName}
            />
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
      <TaskEditor
        title="Task 1"
        task={taskOne}
        onChange={(patch) => updateTask(0, patch)}
        examType={form.examType}
        uploadPending={uploadMutation.isPending}
        onUploadVisual={(file) => {
          setMessage(`Загружаем ${file.name}…`)
          uploadMutation.mutate(file)
        }}
      />
      <TaskEditor
        title="Task 2"
        task={taskTwo}
        onChange={(patch) => updateTask(1, patch)}
      />
    </form>
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

function TaskEditor({
  title,
  task,
  onChange,
  examType,
  uploadPending,
  onUploadVisual,
}: {
  title: string
  task: WritingTaskInput
  onChange: (patch: Partial<WritingTaskInput>) => void
  examType?: 'academic' | 'general'
  uploadPending?: boolean
  onUploadVisual?: (file: File) => void
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <Field label="Формулировка задания">
          <Textarea
            value={task.prompt}
            onChange={(event) => onChange({ prompt: event.target.value })}
            rows={7}
            placeholder="Write at least 150 words…"
          />
        </Field>
        <Field label="Минимум слов">
          <Input
            type="number"
            min={1}
            max={1000}
            value={task.minimumWords}
            onChange={(event) =>
              onChange({ minimumWords: Number(event.target.value) })
            }
            className={fieldClassName}
          />
        </Field>
        {examType === 'academic' ? (
          <div className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Тип визуала">
                <select
                  value={task.visualType ?? 'bar_chart'}
                  onChange={(event) =>
                    onChange({
                      visualType: event.target.value as NonNullable<
                        WritingTaskInput['visualType']
                      >,
                    })
                  }
                  className={fieldClassName}
                >
                  <option value="bar_chart">Bar chart</option>
                  <option value="line_graph">Line graph</option>
                  <option value="pie_chart">Pie chart</option>
                  <option value="table">Table</option>
                  <option value="diagram">Diagram</option>
                  <option value="process">Process</option>
                  <option value="map">Map</option>
                  <option value="mixed">Mixed</option>
                </select>
              </Field>
              <Field label="Изображение задания">
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#deded9] bg-white px-3 text-sm font-medium">
                  <DocumentUpload className="size-4" aria-hidden />
                  {uploadPending
                    ? 'Загружаем…'
                    : task.visualAssetId
                      ? 'Заменить изображение'
                      : 'Загрузить изображение'}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                    disabled={uploadPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) onUploadVisual?.(file)
                      event.target.value = ''
                    }}
                  />
                </label>
                {task.visualAssetId ? (
                  <p className="text-xs text-emerald-700">
                    Изображение прикреплено: {task.visualAssetId}
                  </p>
                ) : null}
              </Field>
            </div>
            <Field label="Скрытые данные для AI-проверки">
              <Textarea
                value={task.assessmentNotes ?? ''}
                onChange={(event) =>
                  onChange({ assessmentNotes: event.target.value })
                }
                rows={8}
                placeholder="Опишите все ключевые факты, значения, изменения и обязательные сравнения. Студент этот текст не увидит."
              />
            </Field>
            <p className="text-xs leading-5 text-[#69696d]">
              Текстовая AI-модель использует эту разметку, чтобы проверить
              точность описания изображения. Не добавляйте готовое эссе — только
              проверяемые факты и ожидаемые сравнения.
            </p>
          </div>
        ) : examType === 'general' ? (
          <Field label="Тон письма">
            <select
              value={task.letterTone ?? 'formal'}
              onChange={(event) =>
                onChange({
                  letterTone: event.target.value as NonNullable<
                    WritingTaskInput['letterTone']
                  >,
                })
              }
              className={fieldClassName}
            >
              <option value="formal">Formal</option>
              <option value="semi-formal">Semi-formal</option>
              <option value="informal">Informal</option>
            </select>
          </Field>
        ) : task.position === 2 ? (
          <Field label="Тип эссе">
            <select
              value={task.essayType ?? 'opinion'}
              onChange={(event) =>
                onChange({
                  essayType: event.target.value as NonNullable<
                    WritingTaskInput['essayType']
                  >,
                })
              }
              className={fieldClassName}
            >
              <option value="opinion">Opinion / agree-disagree</option>
              <option value="discussion">Discussion</option>
              <option value="advantages_disadvantages">
                Advantages / disadvantages
              </option>
              <option value="problem_solution">Problem / solution</option>
              <option value="two_part">Two-part question</option>
            </select>
          </Field>
        ) : null}
      </CardContent>
    </Card>
  )
}
