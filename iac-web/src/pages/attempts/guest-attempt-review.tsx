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
import { formatAnswer } from '@/features/attempts/attempt-ui'
import type { Option } from '@/features/attempts/attempt-ui'
import type { AttemptDetail, AttemptReviewItem } from '@/features/attempts/api'
import { MistakeRetryDialog } from '@/features/attempts/mistake-retry-dialog'

export function GuestAttemptReview({ attempt }: { attempt: AttemptDetail }) {
  const [selected, setSelected] = useState<AttemptReviewItem | null>(null)
  const [improvement, setImprovement] = useState<string | null>(null)
  const preview = attempt.guestPreview
  const mistakes = (attempt.review ?? []).filter((item) => !item.isCorrect)
  const skill =
    attempt.materialType.charAt(0).toUpperCase() + attempt.materialType.slice(1)
  const buttonClass =
    'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'

  return (
    <GuestResultsAccess>
      <div className="mx-auto grid w-full min-w-0 max-w-[900px] gap-5">
        <Button
          asChild
          variant="link"
          className="h-auto justify-self-start p-0"
        >
          <Link to="/try">
            <ArrowLeft aria-hidden />К пробному тесту
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">
            {skill}: разбор ошибок
          </h1>
          <GuestLockedBand skill={skill} />
        </div>
        <div className="border-l-2 border-[#3b82f6] pl-4 text-sm leading-6">
          <p className="font-semibold">Без аккаунта доступны 30% ошибок</p>
          <p className="text-[#69696d]">
            Разборов без входа: {preview?.availableMistakes ?? 0} из{' '}
            {preview?.totalMistakes ?? mistakes.length}. Войдите, чтобы увидеть
            оценку секции и остальные разборы.
          </p>
        </div>
        {preview && preview.totalMistakes === 0 ? (
          <p className="text-sm text-[#69696d]">
            {attempt.materialType === 'reading' ||
            attempt.materialType === 'listening'
              ? 'В этой секции нет ошибок.'
              : 'ИИ не выделил отдельных рекомендаций. Полный отчёт доступен после входа.'}
          </p>
        ) : null}
        {mistakes.map((item) => {
          // Only an explicit server preview grants access; stale/full responses
          // must not accidentally unlock data before the API rollout.
          const locked = !preview || item.locked === true
          const options = (item.content?.options ?? []) as Option[]
          return (
            <Card
              key={item.questionId}
              className="shadow-none"
              data-testid={`guest-mistake-${item.number}`}
            >
              <CardContent className="grid gap-3 p-5">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                  <div className="w-full min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      Вопрос {item.number}
                    </p>
                    <p className="mt-1 text-sm leading-6">
                      {item.prompt.replace('{{answer}}', '_____')}
                    </p>
                    <p className="mt-2 text-sm text-[#69696d]">
                      Ваш ответ: {formatAnswer(item.answer, options)}
                    </p>
                  </div>
                  {locked ? (
                    <GuestSignInButton
                      className={`${buttonClass} border-[#e7e7e4] text-[#69696d]`}
                      label={`Разобрать ошибку ${item.number}: войти в аккаунт`}
                    >
                      <Lock aria-hidden className="size-4" />
                      Разобрать ошибку
                    </GuestSignInButton>
                  ) : (
                    <button
                      type="button"
                      className={`${buttonClass} border-blue-200 text-[#2563eb] hover:bg-blue-50`}
                      onClick={() => setSelected(item)}
                      aria-label={`Разобрать ошибку ${item.number}`}
                    >
                      <LampCharge aria-hidden className="size-4" />
                      Разобрать ошибку
                    </button>
                  )}
                </div>
                {locked ? (
                  <p className="text-xs text-[#69696d]">
                    Правильный ответ и объяснение доступны после входа.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
        {(preview?.improvements ?? []).map((item) => (
          <Card
            key={item.number}
            className="shadow-none"
            data-testid={`guest-improvement-${item.number}`}
          >
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <p className="text-sm font-semibold">
                {item.label} · рекомендация {item.number}
              </p>
              {item.locked ? (
                <GuestSignInButton
                  className={`${buttonClass} border-[#e7e7e4] text-[#69696d]`}
                  label={`Разобрать рекомендацию ${item.number}: войти в аккаунт`}
                >
                  <Lock aria-hidden className="size-4" />
                  Разобрать ошибку
                </GuestSignInButton>
              ) : (
                <button
                  type="button"
                  className={`${buttonClass} border-blue-200 text-[#2563eb] hover:bg-blue-50`}
                  onClick={() => setImprovement(item.text ?? '')}
                  aria-label={`Разобрать рекомендацию ${item.number}`}
                >
                  <LampCharge aria-hidden className="size-4" />
                  Разобрать ошибку
                </button>
              )}
            </CardContent>
          </Card>
        ))}
        <GuestSignInButton className="justify-self-start rounded-lg bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          Войти и открыть полный разбор
        </GuestSignInButton>
        <MistakeRetryDialog
          item={selected}
          open={Boolean(selected)}
          onOpenChange={(open) => {
            if (!open) setSelected(null)
          }}
          attemptId={attempt.id}
          materialType={attempt.materialType}
        />
        <Dialog
          open={improvement !== null}
          onOpenChange={(open) => {
            if (!open) setImprovement(null)
          }}
        >
          <DialogContent>
            <DialogTitle>Разбор ошибки</DialogTitle>
            <DialogDescription className="whitespace-pre-wrap text-sm leading-6">
              {improvement}
            </DialogDescription>
          </DialogContent>
        </Dialog>
      </div>
    </GuestResultsAccess>
  )
}
