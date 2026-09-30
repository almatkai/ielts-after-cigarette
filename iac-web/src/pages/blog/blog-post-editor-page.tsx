import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'iconsax-react'
import { useEffect, useState } from 'react'

import {
  blogMediaUrl,
  blogQueryKeys,
  createPost,
  getPublishedPost,
  listMyPosts,
  updatePost,
  uploadBlogMedia,
} from '@/features/blog/api'
import type { BlogSaveInput } from '@/features/blog/api'
import { BlogRichTextEditor } from '@/features/blog/rich-text-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

function slugifyTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

export function BlogPostEditorPage() {
  const params = useParams({ strict: false })
  const postId = params.postId
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNew = !postId

  const existingQuery = useQuery({
    queryKey: [...blogQueryKeys.myPosts, postId],
    queryFn: async ({ signal }) => {
      const { items } = await listMyPosts(signal)
      return items.find((post) => post.id === postId) ?? null
    },
    enabled: !isNew,
  })

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  useEffect(() => {
    const post = existingQuery.data
    if (post && !title) {
      setTitle(post.title)
      setSlug(post.slug)
      setDescription(post.description)
      setBodyHtml(post.bodyHtml)
      setCoverMediaId(post.coverMediaId)
    }
  }, [existingQuery.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const input: BlogSaveInput = {
        slug: slug || slugifyTitle(title) || `post-${Date.now()}`,
        title,
        description,
        coverMediaId,
        bodyHtml,
        bodyJson: {},
      }
      return isNew
        ? createPost(input)
        : updatePost(
            typeof postId === 'string' && postId !== '' ? postId : '',
            input,
          )
    },
    onSuccess: (post) => {
      setSavedAt(new Date())
      setError(null)
      void queryClient.invalidateQueries({ queryKey: blogQueryKeys.myPosts })
      if (isNew) {
        void navigate({
          to: '/writer/posts/$postId',
          params: { postId: post.id },
          replace: true,
        })
      }
    },
    onError: () => {
      setError(
        'Не удалось сохранить статью. Проверьте заголовок и текст, затем попробуйте ещё раз.',
      )
    },
  })

  const handleCoverChange = async (file: File | undefined) => {
    if (!file) return
    try {
      const media = await uploadBlogMedia(file)
      setCoverMediaId(media.id)
    } catch {
      setError('Не удалось загрузить обложку.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="border-b border-[#e7e7e4] bg-white">
        <div className="mx-auto flex min-h-16 max-w-[880px] items-center justify-between px-5 sm:px-7">
          <Link
            to="/writer/posts"
            className="flex items-center gap-2 text-sm font-semibold text-[#111111] no-underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Мои статьи
          </Link>
          <div className="flex items-center gap-3">
            {savedAt ? (
              <span className="text-xs text-[#808084]">
                Сохранено {savedAt.toLocaleTimeString('ru-RU')}
              </span>
            ) : null}
            <Button
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending
                ? 'Сохраняем…'
                : isNew
                  ? 'Сохранить черновик'
                  : 'Сохранить'}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[880px] gap-5 px-5 py-8 sm:px-7">
        {error ? (
          <p className="rounded-[10px] bg-[#fef2f2] px-4 py-3 text-sm text-[#c92f2f]">
            {error}
          </p>
        ) : null}

        <div className="grid gap-1.5">
          <Label htmlFor="post-title">Заголовок *</Label>
          <Input
            id="post-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="О чём статья?"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="post-slug">Адрес (slug)</Label>
            <Input
              id="post-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="how-i-got-band-8-writing"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="post-cover">Обложка</Label>
            <Input
              id="post-cover"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => {
                void handleCoverChange(event.target.files?.[0])
                event.target.value = ''
              }}
            />
            {coverMediaId ? (
              <img
                src={blogMediaUrl(coverMediaId)}
                alt="Обложка статьи"
                className="mt-1 h-24 w-full rounded-[10px] object-cover"
              />
            ) : null}
          </div>
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
          <Label>Текст статьи *</Label>
          <BlogRichTextEditor
            content={bodyHtml}
            onChange={(html) => setBodyHtml(html)}
          />
        </div>
      </main>
    </div>
  )
}

// Re-exported for the route loader preview of published posts in tests.
export { getPublishedPost }
