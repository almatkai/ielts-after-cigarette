import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { authStore, useAuth } from '@/features/auth/auth-store'
import { retakeGuestMock } from '@/features/auth/guest'
import { fullMockKeys, startGeneratedFullMock } from '@/features/fullmock/api'
import { getErrorMessage } from '@/lib/api/client'

export function FullMockRetake({ sessionId }: { sessionId: string }) {
  const { user, guest } = useAuth()
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const retake = useMutation({
    mutationFn: () =>
      user ? startGeneratedFullMock(true) : retakeGuestMock(sessionId),
    onSuccess: async (session) => {
      if (!user) await authStore.restoreGuest()
      queryClient.setQueryData(fullMockKeys.session(session.id), session)
      await queryClient.invalidateQueries({ queryKey: ['full-mock-overview'] })
      await navigate({
        to: '/exam/full-mock-sessions/$sessionId',
        params: { sessionId: session.id },
      })
      setOpen(false)
    },
  })
  if (!user && guest?.sessionId && guest.sessionId !== sessionId) {
    return (
      <Button asChild className="w-full sm:w-fit">
        <Link
          to="/exam/full-mock-sessions/$sessionId"
          params={{ sessionId: guest.sessionId }}
        >
          Открыть последнюю попытку
        </Link>
      </Button>
    )
  }
  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (retake.isPending) return
        setOpen(value)
        if (value) retake.reset()
      }}
    >
      <AlertDialogTrigger asChild>
        <Button className="w-full sm:w-fit">Пересдать тест</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Пересдать полный тест?</AlertDialogTitle>
          <AlertDialogDescription>
            Новая попытка начнётся с чистыми ответами и таймерами. Предыдущий
            результат сохранится.
            {user ? ' Незавершённый тест, если он есть, будет закрыт.' : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {retake.isError ? (
          <p role="alert" className="text-sm text-[#e23b3b]">
            {getErrorMessage(retake.error)}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={retake.isPending}>
            Отмена
          </AlertDialogCancel>
          <Button disabled={retake.isPending} onClick={() => retake.mutate()}>
            {retake.isPending ? 'Готовим тест…' : 'Начать заново'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
