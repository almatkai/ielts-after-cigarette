import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, LampCharge, Lock } from 'iconsax-react'

import {
  GuestLockedBand,
  GuestResultsAccess,
  GuestSignInButton,
} from '@/components/auth/guest-results-access'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AttemptDetail } from '@/features/attempts/api'
import { ObjectiveAttemptReview } from '@/features/attempts/objective-attempt-review'
import { useLanguage } from '@/lib/i18n'

export function GuestAttemptReview({
  attempt,
  embedded = false,
}: {
  attempt: AttemptDetail
  embedded?: boolean
}) {
  const { t } = useLanguage()
  const [improvement, setImprovement] = useState<string | null>(null)
  const preview = attempt.guestPreview
  const objective =
    attempt.materialType === 'reading' || attempt.materialType === 'listening'
  const skill =
    attempt.materialType.charAt(0).toUpperCase() + attempt.materialType.slice(1)
  const buttonClass =
    'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
  // An explicit server projection is required, including during mixed-version rollouts.
  const safeAttempt = {
    ...attempt,
    band: null,
    guestPreview: preview ?? {
      totalMistakes: 0,
      availableMistakes: 0,
      improvements: [],
    },
    review: attempt.review?.map((item) => ({
      ...item,
      locked: !preview || item.locked === true,
    })),
  }

  return (
    <GuestResultsAccess>
      <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-4">
        {!embedded ? (
          <>
            <Button
              asChild
              variant="link"
              className="h-auto justify-self-start p-0"
            >
              <Link to="/try">
                <ArrowLeft aria-hidden />
                {t('К пробному тесту')}
              </Link>
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-semibold">
                {skill}: {t('разбор ошибок')}
              </h1>
              <GuestLockedBand skill={skill} />
            </div>
          </>
        ) : null}
        {preview && preview.totalMistakes > 0 ? (
          <p className="text-sm text-[#69696d]">
            <span>{t('Без аккаунта доступны 30% ошибок')}</span> ·{' '}
            {preview.availableMistakes} {t('из')} {preview.totalMistakes}{' '}
            {t('разборов')}.
          </p>
        ) : null}
        {objective ? (
          <ObjectiveAttemptReview
            key={attempt.id}
            attempt={safeAttempt}
            showHeading={false}
          />
        ) : (
          <>
            <h2 className="text-lg font-semibold">
              {skill} · {t('рекомендации')}
            </h2>
            {!preview?.totalMistakes ? (
              <p className="text-sm text-[#69696d]">
                {t(
                  'ИИ не выделил отдельных рекомендаций. Полный отчёт доступен после входа.',
                )}
              </p>
            ) : null}
            {(preview?.improvements ?? []).map((item) => (
              <Card
                key={item.number}
                className="py-0 shadow-none"
                data-testid={`guest-improvement-${item.number}`}
              >
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <p className="text-sm font-semibold">
                    {item.label} · {t('рекомендация')} {item.number}
                  </p>
                  {item.locked ? (
                    <GuestSignInButton
                      className={`${buttonClass} border-[#e7e7e4] text-[#69696d]`}
                      label={`${t('Разобрать рекомендацию')} ${item.number}: ${t('войти в аккаунт')}`}
                    >
                      <Lock aria-hidden className="size-4" />
                      {t('Разобрать ошибку')}
                    </GuestSignInButton>
                  ) : (
                    <button
                      type="button"
                      className={`${buttonClass} border-blue-200 text-[#2563eb] hover:bg-blue-50`}
                      onClick={() => setImprovement(item.text ?? '')}
                      aria-label={`${t('Разобрать рекомендацию')} ${item.number}`}
                    >
                      <LampCharge aria-hidden className="size-4" />
                      {t('Разобрать ошибку')}
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}
        <Dialog
          open={improvement !== null}
          onOpenChange={(open) => {
            if (!open) setImprovement(null)
          }}
        >
          <DialogContent>
            <DialogTitle>{t('Разбор ошибки')}</DialogTitle>
            <DialogDescription className="whitespace-pre-wrap text-sm leading-6">
              {improvement}
            </DialogDescription>
          </DialogContent>
        </Dialog>
      </div>
    </GuestResultsAccess>
  )
}
