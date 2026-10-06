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

const skillLabels: Record<AttemptMaterialType, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

export function UnfinishedTestBanner() {
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
      'h-7 sm:h-8 shrink-0 rounded-[7px] sm:rounded-[8px] bg-[#3b82f6] px-2.5 sm:px-3 text-[11px] sm:text-xs font-semibold text-white shadow-none hover:bg-[#2563eb]'

    // Section attempts of a Full Mock session must go back to the session —
    // the practice routes would start a different attempt.
    if (draft.fullMockSessionId) {
      return (
        <Button asChild className={btnClassName}>
          <Link
            to="/exam/full-mock-sessions/$sessionId"
            params={{ sessionId: draft.fullMockSessionId }}
          >
            Продолжить
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
          Продолжить
        </Link>
      </Button>
    )
  }

  return (
    <Card className="gap-2 rounded-[14px] sm:rounded-[16px] border border-[#e7e7e4] bg-white p-3 sm:p-4 shadow-none">
      <h3 className="text-[11px] sm:text-xs font-semibold text-[#808084]">Черновики</h3>
      <div className="divide-y divide-[#ededeb]">
        {inProgressAttempts.map((draft) => (
          <div
            key={draft.id}
            className="flex min-w-0 items-center justify-between gap-3 py-2 sm:py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50 px-1.5 py-0 text-[10px] font-medium text-blue-700"
                >
                  {skillLabels[draft.materialType]}
                </Badge>
                {draft.fullMockSessionId ? (
                  <Badge
                    variant="outline"
                    className="border-violet-200 bg-violet-50 px-1.5 py-0 text-[10px] font-medium text-violet-700"
                  >
                    Full Mock
                  </Badge>
                ) : null}
              </div>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-semibold leading-snug text-[#111111]">
                {draft.testTitle || 'Практический тест'}
              </p>
            </div>
            {renderDraftButton(draft)}
          </div>
        ))}
      </div>
    </Card>
  )
}
