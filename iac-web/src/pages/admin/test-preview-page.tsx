import { useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'iconsax-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-store'
import {
  getReadingPreview,
  getListeningPreview,
} from '@/features/admin/preview-api'
import type {
  PreviewAnswerKeys,
  PreviewVersion,
  TestPreview,
} from '@/features/admin/preview-api'
import { ReadingPreviewRunner } from '@/pages/reading/reading-student-page'
import { ListeningPreviewRunner } from '@/pages/listening/listening-student-page'
import { getErrorMessage } from '@/lib/api/client'

function TestPreviewPage<T>({
  id,
  skill,
  fetchPreview,
  renderRunner,
  editorLink,
}: {
  id: string
  skill: string
  fetchPreview: (
    id: string,
    version: PreviewVersion,
    signal?: AbortSignal,
  ) => Promise<TestPreview<T>>
  renderRunner: (
    material: T,
    timerEnabled: boolean,
    answerKeys: PreviewAnswerKeys,
  ) => ReactNode
  editorLink: ReactNode
}) {
  const auth = useAuth()
  const [version, setVersion] = useState<PreviewVersion>('draft')
  const [reset, setReset] = useState(0)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const query = useQuery({
    queryKey: ['admin', 'preview', skill, id, version, auth.user?.id],
    queryFn: ({ signal }) => fetchPreview(id, version, signal),
    enabled: auth.user?.role === 'ADMIN',
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })

  return (
    <main className="min-h-dvh bg-[#f7f7f5] text-slate-900">
      <header className="border-b border-blue-200 bg-blue-50 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1780px] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-sm font-semibold">
              Предпросмотр {skill} · Только для администратора
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              {version === 'draft'
                ? 'Текущая сохранённая версия'
                : 'Опубликованная версия — её видят пользователи'}
              {query.data
                ? ` · Версия ${query.data.versionNumber} · revision ${query.data.revision}`
                : ''}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Пробные ответы не сохраняются. Попытка и статистика не создаются.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {editorLink}
            <Button
              type="button"
              size="sm"
              variant={version === 'draft' ? 'default' : 'outline'}
              onClick={() => setVersion('draft')}
            >
              Черновик
            </Button>
            {query.data?.status === 'PUBLISHED' || version === 'published' ? (
              <Button
                type="button"
                size="sm"
                variant={version === 'published' ? 'default' : 'outline'}
                onClick={() => setVersion('published')}
              >
                Опубликованная версия
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-pressed={timerEnabled}
              onClick={() => setTimerEnabled((value) => !value)}
            >
              {timerEnabled ? 'Выключить таймер' : 'Включить таймер'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!query.data}
              onClick={() => setReset((value) => value + 1)}
            >
              Сбросить ответы
            </Button>
          </div>
        </div>
      </header>
      {query.isPending ? (
        <p role="status" className="p-6 text-sm">
          Загружаем предпросмотр…
        </p>
      ) : null}
      {query.isError ? (
        <div role="alert" className="mx-auto grid max-w-xl gap-3 p-6">
          <h2 className="font-semibold">Не удалось открыть предпросмотр</h2>
          <p className="text-sm text-slate-600">
            {getErrorMessage(query.error)}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void query.refetch()}
          >
            Повторить
          </Button>
        </div>
      ) : null}
      {query.data && !query.isError ? (
        <div key={`${id}-${version}-${query.data.revision}-${reset}`}>
          {renderRunner(
            query.data.material,
            timerEnabled,
            query.data.answerKeys,
          )}
        </div>
      ) : null}
    </main>
  )
}

export function ReadingTestPreviewPage({ materialId }: { materialId: string }) {
  return (
    <TestPreviewPage
      id={materialId}
      skill="Reading"
      fetchPreview={getReadingPreview}
      editorLink={
        <Button asChild size="sm" variant="outline">
          <Link
            to="/admin/reading/materials/$materialId"
            params={{ materialId }}
          >
            <ArrowLeft aria-hidden />К редактору
          </Link>
        </Button>
      }
      renderRunner={(material, timerEnabled, answerKeys) => (
        <ReadingPreviewRunner
          material={material}
          timerEnabled={timerEnabled}
          answerKeys={answerKeys}
        />
      )}
    />
  )
}

export function ListeningTestPreviewPage({ testId }: { testId: string }) {
  return (
    <TestPreviewPage
      id={testId}
      skill="Listening"
      fetchPreview={getListeningPreview}
      editorLink={
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/listening/tests/$testId" params={{ testId }}>
            <ArrowLeft aria-hidden />К редактору
          </Link>
        </Button>
      }
      renderRunner={(test, timerEnabled, answerKeys) => (
        <ListeningPreviewRunner
          test={test}
          timerEnabled={timerEnabled}
          answerKeys={answerKeys}
        />
      )}
    />
  )
}
