import { Microphone2 } from 'iconsax-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { LoginToContinue } from '@/components/auth/guest-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ErrorState,
  EmptyState,
  LibraryCardsSkeleton,
} from '@/features/attempts/attempt-ui'
import { useAuth } from '@/features/auth/auth-store'
import {
  listPublicSpeakingMaterials,
  speakingKeys,
} from '@/features/speaking/api'
import { getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'

export function SpeakingLibraryPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const query = useQuery({
    queryKey: speakingKeys.publicMaterials,
    queryFn: ({ signal }) => listPublicSpeakingMaterials(signal),
  })
  const materials = (query.data?.items ?? []).filter(
    (material) => !user?.examType || material.examType === user.examType,
  )

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <div>
        <h1 className="text-[28px] sm:text-[36px] font-semibold tracking-normal text-foreground">
          {t('Выберите Speaking-тренировку')}
        </h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {t(
            'Пройдите Parts 1–3 с таймерами, запишите ответы и получите расшифровку с разбором по критериям IELTS.',
          )}
        </p>
      </div>
      {query.isPending ? (
        <LibraryCardsSkeleton />
      ) : query.isError ? (
        <ErrorState
          title={t('Не удалось загрузить Speaking-материалы')}
          message={t(getErrorMessage(query.error))}
          onRetry={() => void query.refetch()}
        />
      ) : materials.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {materials.map((material) => (
            <Card
              key={material.id}
              className="group gap-0 rounded-[10px] border border-border bg-card py-0 shadow-none transition-all duration-200 hover:border-border-strong hover:shadow-none"
            >
              <CardContent className="flex h-full flex-col justify-between gap-4 p-5 sm:p-6">
                <div className="flex items-start gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary-soft group-hover:text-primary ">
                    <Microphone2
                      className="size-5 transition-colors"
                      aria-hidden
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
                        {material.title}
                      </h3>
                      <span className="shrink-0 rounded-sm border border-border/80 bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {material.examType === 'academic'
                          ? 'Academic'
                          : 'General'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('Сложность')}: {material.difficulty}
                    </p>
                    {material.description ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {material.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex justify-end border-t border-border pt-3">
                  {user ? (
                    <Button
                      asChild
                      className="h-10 rounded-[9px] bg-primary px-5 shadow-none hover:bg-primary-hover"
                    >
                      <Link
                        to="/exam/speaking/$materialId"
                        params={{ materialId: material.id }}
                      >
                        {t('Начать Speaking')}
                      </Link>
                    </Button>
                  ) : (
                    <LoginToContinue />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
