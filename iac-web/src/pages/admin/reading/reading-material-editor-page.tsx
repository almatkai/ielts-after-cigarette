import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  Send,
  TriangleAlert,
} from 'lucide-react'
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
  createReadingMaterial,
  getReadingMaterial,
  publishReadingMaterial,
  updateReadingMaterial,
} from '@/features/admin/api'
import { useAuth } from '@/features/auth/auth-store'
import { getErrorMessage } from '@/lib/api/client'

import type {
  ReadingMaterial,
  ReadingMaterialInput,
} from '@/features/admin/api'

type EditorForm = ReadingMaterialInput & { revision: number }

const interFont = {
  fontFamily:
    '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
} as const

const cardClassName =
  'gap-0 rounded-xl border-slate-200 bg-white py-0 shadow-sm dark:border-slate-800 dark:bg-slate-900'

const cardTitleClassName =
  'text-base font-bold tracking-tight text-slate-900 dark:text-slate-100'

const fieldClassName =
  'h-11 rounded-lg border-slate-300 bg-white shadow-none focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900'

const textareaFieldClassName =
  'rounded-lg border-slate-300 bg-white shadow-none focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900'

const outlineButtonClassName =
  'rounded-lg border-slate-300 bg-white text-slate-900 shadow-sm hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-100'

const emptyForm: EditorForm = {
  slug: '',
  examType: 'academic',
  difficulty: 'intermediate',
  title: '',
  description: '',
  body: '',
  sourceTitle: null,
  sourceUrl: null,
  revision: 0,
}

function materialToForm(material: ReadingMaterial): EditorForm {
  return {
    slug: material.slug,
    examType: material.examType,
    difficulty: material.difficulty,
    title: material.title,
    description: material.description,
    body: material.body,
    sourceTitle: material.sourceTitle,
    sourceUrl: material.sourceUrl,
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

  const update = <TKey extends keyof EditorForm>(
    key: TKey,
    value: EditorForm[TKey],
  ) => setForm((current) => ({ ...current, [key]: value }))

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
    return (
      <p
        style={interFont}
        className="text-sm text-slate-500 dark:text-slate-400"
      >
        Загружаем материал…
      </p>
    )
  }
  if (editing && materialQuery.isError) {
    return (
      <Card className={cardClassName}>
        <CardContent className="flex flex-col items-center p-8 text-center">
          <TriangleAlert
            className="size-6 text-red-500 dark:text-red-400"
            aria-hidden
          />
          <p className="mt-3 text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Материал не удалось загрузить.
          </p>
          <Button
            asChild
            variant="outline"
            className={`mt-4 ${outlineButtonClassName}`}
          >
            <Link to="/admin/reading/materials">Вернуться в библиотеку</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const material = materialQuery.data
  const pending = saveMutation.isPending || publishMutation.isPending

  return (
    <form
      style={interFont}
      className="grid gap-5"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button
            asChild
            variant="link"
            className="h-auto p-0 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <Link to="/admin/reading/materials">
              <ArrowLeft aria-hidden />К библиотеке
            </Link>
          </Button>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {editing ? 'Редактор материала' : 'Новый Reading материал'}
            </h1>
            {material ? (
              <Badge
                variant="outline"
                className="border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                {material.status}
              </Badge>
            ) : null}
          </div>
          {material ? (
            <p className="mt-2 text-xs text-slate-400 tabular-nums dark:text-slate-500">
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
              className={outlineButtonClassName}
              disabled={pending}
              onClick={() => void handlePublish()}
            >
              <Send aria-hidden />
              Опубликовать текущую версию
            </Button>
          ) : null}
          <Button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-blue-500 font-bold text-white shadow-sm hover:bg-blue-600"
          >
            <Save aria-hidden />
            {saveMutation.isPending ? 'Сохраняем…' : 'Сохранить черновик'}
          </Button>
        </div>
      </div>

      {message ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          role="status"
        >
          <CheckCircle2
            className="size-4 text-slate-500 dark:text-slate-400"
            aria-hidden
          />
          {message}
        </div>
      ) : null}

      <Card className={cardClassName}>
        <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800">
          <CardTitle className={cardTitleClassName}>Метаданные</CardTitle>
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
              className={textareaFieldClassName}
            />
          </div>
        </CardContent>
      </Card>

      <Card className={cardClassName}>
        <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800">
          <CardTitle className={cardTitleClassName}>Passage</CardTitle>
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
            className={`${textareaFieldClassName} font-serif text-base leading-7`}
            placeholder="Вставьте текст Reading passage…"
          />
          <p className="mt-2 text-right text-xs text-slate-400 tabular-nums dark:text-slate-500">
            {form.body.trim().length} символов
          </p>
        </CardContent>
      </Card>

      <Card className={cardClassName}>
        <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800">
          <CardTitle className={cardTitleClassName}>Источник и права</CardTitle>
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
        <CardFooter className="border-t border-slate-100 px-5 py-4 text-xs leading-5 text-slate-400 dark:border-slate-800 dark:text-slate-500">
          Добавляйте только собственные или лицензированные материалы и
          фиксируйте источник.
        </CardFooter>
      </Card>
    </form>
  )
}
