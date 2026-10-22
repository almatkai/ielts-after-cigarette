import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { attemptKeys, listAttempts } from '@/features/attempts/api'
import type {
  AttemptListItem,
  AttemptMaterialType,
} from '@/features/attempts/api'
import {
  attemptStartQueryKey,
  examAttemptLink,
} from '@/features/attempts/exam-attempt-routes'
import { useLanguage } from '@/lib/i18n'

const skillLabels: Record<AttemptMaterialType, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

export function UnfinishedTestBanner() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const attemptsQuery = useQuery({
    queryKey: attemptKeys.listAll,
    queryFn: ({ signal }) => listAttempts(undefined, signal),
  })

  const inProgressAttempts = useMemo(() => {
    return (attemptsQuery.data?.items ?? []).filter(
      (item) => item.status === 'IN_PROGRESS',
    )
  }, [attemptsQuery.data?.items])

  if (inProgressAttempts.length === 0) return null

  const handlePrepareAttempt = (draft: AttemptListItem) => {
    // Full Mock sections resume through their session page, which refetches
    // its own state; only practice pages carry a cached start-attempt query.
    if (draft.fullMockSessionId) return
    queryClient.removeQueries({
      queryKey: attemptStartQueryKey(draft.materialType, draft.materialId),
      exact: true,
    })
  }

  const renderDraftButton = (draft: AttemptListItem) => {
    const btnClassName =
      'h-7 sm:h-8 shrink-0 rounded-[7px] sm:rounded-[8px] bg-primary px-2.5 sm:px-3 text-[11px] sm:text-xs font-semibold text-primary-foreground shadow-none hover:bg-primary-hover'

    // Section attempts of a Full Mock session must go back to the session —
    // the practice routes would start a different attempt.
    if (draft.fullMockSessionId) {
      return (
        <Button asChild className={btnClassName}>
          <Link
            to="/exam/full-mock-sessions/$sessionId"
            params={{ sessionId: draft.fullMockSessionId }}
          >
            {t('Продолжить')}
          </Link>
        </Button>
      )
    }
    return (
      <Button asChild className={btnClassName}>
        <Link
          {...examAttemptLink(draft.materialType, draft.materialId)}
          onClick={() => handlePrepareAttempt(draft)}
        >
          {t('Продолжить')}
        </Link>
      </Button>
    )
  }

  return (
    <Card className="gap-2 rounded-[10px] sm:rounded-[10px] border border-border bg-primary-soft p-3 sm:p-4 shadow-none">
      <h3 className="text-[11px] sm:text-xs font-semibold text-muted-foreground">
        {t('Черновики')}
      </h3>
      <div className="divide-y divide-border">
        {inProgressAttempts.map((draft) => (
          <div
            key={draft.id}
            className="flex min-w-0 items-center justify-between gap-3 py-2 sm:py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="border-border-strong bg-primary-soft px-1.5 py-0 text-[10px] font-medium text-primary"
                >
                  {skillLabels[draft.materialType]}
                </Badge>
                {draft.fullMockSessionId ? (
                  <Badge
                    variant="outline"
                    className="border-border-strong bg-primary-soft px-1.5 py-0 text-[10px] font-medium text-primary"
                  >
                    Full Mock
                  </Badge>
                ) : null}
              </div>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-semibold leading-snug text-foreground">
                {draft.testTitle || t('Практический тест')}
              </p>
            </div>
            {renderDraftButton(draft)}
          </div>
        ))}
      </div>
    </Card>
  )
}
