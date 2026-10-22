import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, CloseCircle, DocumentUpload, Export } from 'iconsax-react'
import { useRef, useState } from 'react'

import {
  blogMediaUrl,
  blogQueryKeys,
  createPost,
  listMyPosts,
  updatePost,
  uploadBlogMedia,
} from '@/features/blog/api'
import type { BlogPostDto, BlogSaveInput } from '@/features/blog/api'
import { BlogRichTextEditor } from '@/features/blog/rich-text-editor'
import { slugify } from '@/features/blog/slug'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api/client'

type FieldErrors = Partial<Record<'title' | 'slug' | 'bodyHtml', string>>

const fieldMessages: Record<keyof FieldErrors, string> = {
  title: 'Заголовок должен содержать от 3 до 300 символов.',
  slug: 'Адрес: только латиница, цифры и дефисы.',
  bodyHtml: 'Напишите текст статьи.',
}

function hasText(html: string) {
  return html.replace(/<[^>]*>/g, '').trim().length > 0 || /<img/i.test(html)
}

export function BlogPostEditorPage() {
  const params = useParams({ strict: false })
  const postId = params.postId

  const existingQuery = useQuery({
    queryKey: [...blogQueryKeys.myPosts, postId],
    queryFn: async ({ signal }) => {
      const { items } = await listMyPosts(signal)
      return items.find((post) => post.id === postId) ?? null
    },
    enabled: Boolean(postId),
  })

  if (!postId) return <EditorForm post={null} />
  if (existingQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Загружаем статью…</p>
  }
  if (!existingQuery.data) {
    return (
      <div className="mx-auto grid w-full max-w-[880px] gap-4">
        <p className="text-sm text-muted-foreground">Статья не найдена.</p>
        <Button asChild variant="outline" className="justify-self-start">
          <Link to="/writer/posts">Мои статьи</Link>
        </Button>
      </div>
    )
  }
  // The rich text editor reads its content only on mount, so the form
  // mounts once the saved post is available.
  return <EditorForm key={existingQuery.data.id} post={existingQuery.data} />
}

function EditorForm({ post }: { post: BlogPostDto | null }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNew = post === null
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  const [title, setTitle] = useState(post?.title ?? '')
  // New posts follow the title until the writer edits the address; published
  // addresses stay stable so existing links keep working.
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(!isNew)
  const [description, setDescription] = useState(post?.description ?? '')
  const [bodyHtml, setBodyHtml] = useState(post?.bodyHtml ?? '')
  const [coverMediaId, setCoverMediaId] = useState(post?.coverMediaId ?? null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)

  const effectiveSlug = slugEdited ? slug : slugify(title)

  const coverMutation = useMutation({
    mutationFn: (file: File) => uploadBlogMedia(file),
    onSuccess: (media) => setCoverMediaId(media.id),
    onError: () =>
      setError('Не удалось загрузить обложку. Попробуйте другой файл.'),
  })

  const saveMutation = useMutation({
    mutationFn: (input: BlogSaveInput) =>
      post ? updatePost(post.id, input) : createPost(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blogQueryKeys.myPosts })
      await navigate({ to: '/writer/posts' })
    },
    onError: (failure) => {
      if (failure instanceof ApiError && failure.code === 'BLOG_SLUG_EXISTS') {
        setSlugEdited(true)
        setSlug(effectiveSlug)
        setFieldErrors({ slug: 'Такой адрес уже занят — измените его.' })
        return
      }
      if (failure instanceof ApiError && failure.details) {
        const next: FieldErrors = {}
        for (const field of Object.keys(
          fieldMessages,
        ) as (keyof FieldErrors)[]) {
          if (failure.details[field]) next[field] = fieldMessages[field]
        }
        if (Object.keys(next).length > 0) {
          setFieldErrors(next)
          return
        }
      }
      setError('Не удалось сохранить статью. Попробуйте ещё раз.')
    },
  })

  const handleSave = () => {
    setError(null)
    const next: FieldErrors = {}
    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 3 || trimmedTitle.length > 300) {
      next.title = fieldMessages.title
    }
    const finalSlug = effectiveSlug || `post-${Date.now().toString(36)}`
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finalSlug)) {
      next.slug = fieldMessages.slug
    }
    if (!hasText(bodyHtml)) next.bodyHtml = fieldMessages.bodyHtml
    setFieldErrors(next)
    if (Object.keys(next).length > 0) return

    saveMutation.mutate({
      slug: finalSlug,
      title: trimmedTitle,
      description: description.trim(),
      coverMediaId,
      bodyHtml,
      bodyJson: {},
    })
  }

  return (
    <div className="mx-auto grid w-full max-w-[880px] min-w-0 gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/writer/posts"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground no-underline transition-colors hover:text-primary-hover"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Мои статьи
          </Link>
          <h1 className="text-[28px] sm:text-[36px] mt-2 font-semibold tracking-normal">
            {isNew ? 'Новая статья' : 'Редактирование статьи'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {post?.status === 'PUBLISHED' ? (
            <Button asChild variant="outline">
              <Link to="/blog/$slug" params={{ slug: post.slug }}>
                <Export className="size-4" aria-hidden />
                Открыть
              </Link>
            </Button>
          ) : null}
          <Button
            disabled={saveMutation.isPending || coverMutation.isPending}
            onClick={handleSave}
          >
            {saveMutation.isPending
              ? 'Сохраняем…'
              : isNew
                ? 'Сохранить черновик'
                : 'Сохранить'}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-[10px] bg-destructive-soft px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-1.5">
        <Label htmlFor="post-title">Заголовок *</Label>
        <Input
          id="post-title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setFieldErrors(({ title: _, ...rest }) => rest)
          }}
          placeholder="О чём статья?"
          aria-invalid={Boolean(fieldErrors.title)}
        />
        <FieldError message={fieldErrors.title} />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="post-slug">Адрес статьи</Label>
        <div className="flex min-w-0 items-center rounded-[10px] border border-border bg-card focus-within:border-primary-soft">
          <span className="shrink-0 pl-3 text-sm text-muted-foreground">
            /blog/
          </span>
          <input
            id="post-slug"
            value={effectiveSlug}
            onChange={(event) => {
              setSlugEdited(true)
              setSlug(slugify(event.target.value, { keepTrailingHyphen: true }))
              setFieldErrors(({ slug: _, ...rest }) => rest)
            }}
            onBlur={() => setSlug((value) => slugify(value))}
            placeholder="sozdastsya-iz-zagolovka"
            aria-invalid={Boolean(fieldErrors.slug)}
            className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none"
          />
          {slugEdited && isNew ? (
            <button
              type="button"
              onClick={() => {
                setSlugEdited(false)
                setSlug('')
              }}
              className="shrink-0 px-3 text-xs font-semibold text-primary-hover"
            >
              Из заголовка
            </button>
          ) : null}
        </div>
        {fieldErrors.slug ? (
          <FieldError message={fieldErrors.slug} />
        ) : (
          <p className="text-xs text-muted-foreground">
            {isNew
              ? 'Создаётся автоматически из заголовка. Можно изменить.'
              : 'Меняйте осторожно: старые ссылки на статью перестанут работать.'}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="post-description">Краткое описание</Label>
        <Textarea
          id="post-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          placeholder="Один-два предложения для карточки статьи и превью в поиске"
        />
      </div>

      <div className="grid gap-1.5">
        <Label>Обложка</Label>
        {coverMediaId ? (
          <div className="relative overflow-hidden rounded-[10px] border border-border">
            <img
              src={blogMediaUrl(coverMediaId)}
              alt="Обложка статьи"
              className="aspect-[16/6] w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setCoverMediaId(null)}
              className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-[8px] bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-none hover:bg-card"
            >
              <CloseCircle className="size-4" aria-hidden />
              Убрать
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="flex items-center gap-3 rounded-[10px] border border-dashed border-border-strong bg-background px-4 py-4 text-left transition-colors hover:bg-muted"
          >
            <DocumentUpload
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="text-sm text-muted-foreground">
              {coverMutation.isPending
                ? 'Загружаем…'
                : 'Загрузить обложку (PNG, JPG, WebP или GIF)'}
            </span>
          </button>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) coverMutation.mutate(file)
            event.target.value = ''
          }}
        />
      </div>

      <div className="grid gap-1.5">
        <Label>Текст статьи *</Label>
        <BlogRichTextEditor
          content={bodyHtml}
          onChange={(html) => {
            setBodyHtml(html)
            setFieldErrors(({ bodyHtml: _, ...rest }) => rest)
          }}
        />
        <FieldError message={fieldErrors.bodyHtml} />
      </div>
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}
