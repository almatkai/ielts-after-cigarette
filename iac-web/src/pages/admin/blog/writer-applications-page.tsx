import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TickCircle } from 'iconsax-react'
import { useState } from 'react'

import {
  approveWriterApplication,
  blogQueryKeys,
  listWriterApplications,
  rejectWriterApplication,
} from '@/features/blog/api'
import type { WriterApplicationDto } from '@/features/blog/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED'

const statusFilters: StatusFilter[] = ['PENDING', 'APPROVED', 'REJECTED']

function statusBadge(status: WriterApplicationDto['status']) {
  switch (status) {
    case 'APPROVED':
      return 'bg-[#ecfdf5] text-[#047857]'
    case 'REJECTED':
      return 'bg-[#fef2f2] text-[#c92f2f]'
    default:
      return 'bg-[#eff6ff] text-[#1d4ed8]'
  }
}

export function AdminWriterApplicationsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<StatusFilter>('PENDING')
  const [reviewTarget, setReviewTarget] = useState<{
    application: WriterApplicationDto
    approve: boolean
  } | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const applicationsQuery = useQuery({
    queryKey: [...blogQueryKeys.applications, filter],
    queryFn: ({ signal }) => listWriterApplications(filter, signal),
  })

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      approve,
      notes,
    }: {
      id: string
      approve: boolean
      notes: string
    }) =>
      approve
        ? approveWriterApplication(id, notes)
        : rejectWriterApplication(id, notes),
    onSuccess: () => {
      setReviewTarget(null)
      setReviewNotes('')
      void queryClient.invalidateQueries({
        queryKey: blogQueryKeys.applications,
      })
    },
    onError: () => {
      setActionError('Не удалось сохранить решение. Попробуйте ещё раз.')
    },
  })

  const applications = applicationsQuery.data?.items ?? []

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">
          Заявки авторов
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#69696d]">
          Проверьте заявленный балл IELTS (минимум 7.5) и сертификат перед
          одобрением. Одобренные заявители получают роль автора блога.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {statusFilters.map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => setFilter(candidate)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === candidate
                ? 'bg-[#111111] text-white'
                : 'bg-white text-[#69696d] hover:bg-[#f4f4f1]'
            }`}
          >
            {candidate === 'PENDING'
              ? 'На проверке'
              : candidate === 'APPROVED'
                ? 'Одобренные'
                : 'Отклонённые'}
          </button>
        ))}
      </div>

      {actionError ? (
        <p className="rounded-[10px] bg-[#fef2f2] px-4 py-3 text-sm text-[#c92f2f]">
          {actionError}
        </p>
      ) : null}

      <div className="grid gap-3">
        {applicationsQuery.isPending ? (
          <p className="text-sm text-[#69696d]">Загружаем…</p>
        ) : applications.length === 0 ? (
          <p className="rounded-[16px] border border-[#e7e7e4] bg-white px-5 py-10 text-center text-sm text-[#69696d]">
            Заявок в этой категории нет.
          </p>
        ) : (
          applications.map((application) => (
            <div
              key={application.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[16px] border border-[#e7e7e4] bg-white p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[#111111]">
                    {application.userDisplayName}
                  </span>
                  <span className="text-xs text-[#808084]">
                    {application.userEmail}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(application.status)}`}
                  >
                    {application.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#69696d]">
                  Overall {application.overallBand}
                  {' · '}Reading {application.readingBand}
                  {' · '}Writing {application.writingBand}
                  {' · '}Speaking {application.speakingBand}
                  {' · '}TRF {application.trfNumber}
                </p>
              </div>
              {application.status === 'PENDING' ? (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setReviewTarget({ application, approve: true })
                      setReviewNotes('')
                    }}
                  >
                    <TickCircle className="size-4" aria-hidden />
                    Одобрить
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReviewTarget({ application, approve: false })
                      setReviewNotes('')
                    }}
                  >
                    Отклонить
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <Dialog
        open={reviewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setReviewTarget(null)
        }}
      >
        <DialogContent className="max-w-xl">
          {reviewTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {reviewTarget.approve
                    ? 'Одобрить заявку автора'
                    : 'Отклонить заявку автора'}
                </DialogTitle>
                <DialogDescription>
                  {reviewTarget.application.userDisplayName} · Overall{' '}
                  {reviewTarget.application.overallBand} · TRF{' '}
                  {reviewTarget.application.trfNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3">
                <div className="rounded-[12px] border border-[#e7e7e4] bg-[#fbfbfa] p-4 text-sm leading-6 text-[#525256]">
                  <p>
                    <b>Listening:</b>{' '}
                    {reviewTarget.application.listeningBand ?? '—'}
                  </p>
                  <p>
                    <b>Reading:</b> {reviewTarget.application.readingBand}
                  </p>
                  <p>
                    <b>Writing:</b> {reviewTarget.application.writingBand}
                  </p>
                  <p>
                    <b>Speaking:</b> {reviewTarget.application.speakingBand}
                  </p>
                  <p>
                    <b>Тип:</b> {reviewTarget.application.examType ?? '—'}
                  </p>
                  <p>
                    <b>Дата теста:</b>{' '}
                    {reviewTarget.application.testDate ?? '—'}
                  </p>
                  {reviewTarget.application.bio ? (
                    <p className="mt-2">
                      <b>О себе:</b> {reviewTarget.application.bio}
                    </p>
                  ) : null}
                </div>

                <object
                  data={`/api/v1/writers/applications/${reviewTarget.application.id}/certificate`}
                  type={
                    reviewTarget.application.certificateMime || 'image/jpeg'
                  }
                  className="h-72 w-full rounded-[12px] border border-[#e7e7e4] bg-white"
                >
                  <p className="p-4 text-sm text-[#69696d]">
                    Не удалось показать сертификат встроенно — откройте файл по
                    ссылке{' '}
                    <a
                      className="text-[#1d4ed8] underline"
                      href={`/api/v1/writers/applications/${reviewTarget.application.id}/certificate`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      сертификат заявителя
                    </a>
                    .
                  </p>
                </object>

                <Textarea
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  rows={2}
                  placeholder={
                    reviewTarget.approve
                      ? 'Комментарий (необязательно)'
                      : 'Причина отклонения, например: «балл ниже 7.5» или «нечитаемый скан»'
                  }
                />
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setReviewTarget(null)}>
                  Отмена
                </Button>
                <Button
                  disabled={reviewMutation.isPending}
                  onClick={() =>
                    reviewMutation.mutate({
                      id: reviewTarget.application.id,
                      approve: reviewTarget.approve,
                      notes: reviewNotes,
                    })
                  }
                >
                  {reviewMutation.isPending
                    ? 'Сохраняем…'
                    : reviewTarget.approve
                      ? 'Одобрить и выдать роль автора'
                      : 'Отклонить заявку'}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
