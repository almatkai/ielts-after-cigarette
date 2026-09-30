import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { DocumentText, Profile } from 'iconsax-react'

import { listPublishedPosts } from '@/features/blog/api'

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function BlogIndexPage() {
  const postsQuery = useQuery({
    queryKey: ['blog', 'posts', 20, 0],
    queryFn: ({ signal }) => listPublishedPosts(20, 0, signal),
  })

  const posts = postsQuery.data?.items ?? []

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="border-b border-[#e7e7e4] bg-white">
        <div className="mx-auto flex min-h-16 max-w-[880px] items-center justify-between px-5 sm:px-7">
          <Link to="/blog" className="text-sm font-semibold tracking-[-0.01em]">
            IAC · Блог
          </Link>
          <Link
            to="/blog/become-writer"
            className="flex items-center gap-2 rounded-[10px] border border-[#deded9] bg-white px-3.5 py-2 text-sm font-semibold text-[#111111] no-underline transition-colors hover:bg-[#f4f4f1]"
          >
            <Profile className="size-4" aria-hidden />
            Стать автором
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[880px] px-5 py-10 sm:px-7">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-[#3b82f6] uppercase">
            Блог
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Опыт и стратегии от авторов с IELTS 7.5+
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#69696d]">
            Все статьи пишут авторы, чьи сертификаты IELTS подтверждены командой
            платформы.
          </p>
        </div>

        <div className="mt-8 grid gap-4">
          {postsQuery.isPending ? (
            <p className="text-sm text-[#69696d]">Загружаем статьи…</p>
          ) : postsQuery.isError ? (
            <p className="text-sm text-[#c92f2f]">
              Не удалось загрузить статьи. Попробуйте позже.
            </p>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[16px] border border-[#e7e7e4] bg-white px-6 py-14 text-center">
              <DocumentText className="size-8 text-[#a0a0a4]" aria-hidden />
              <p className="text-sm text-[#69696d]">
                Статей пока нет — скоро здесь появятся первые публикации.
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="block rounded-[16px] border border-[#e7e7e4] bg-white p-5 no-underline shadow-none transition-colors hover:bg-[#fbfbfa]"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#808084]">
                  <span className="font-semibold text-[#111111]">
                    {post.author.displayName}
                  </span>
                  {post.publishedAt ? (
                    <span>{formatDate(post.publishedAt)}</span>
                  ) : null}
                  <span>· {post.readingTimeMinutes} мин чтения</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[#111111]">
                  {post.title}
                </h2>
                {post.description ? (
                  <p className="mt-1.5 text-sm leading-6 text-[#69696d]">
                    {post.description}
                  </p>
                ) : null}
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
