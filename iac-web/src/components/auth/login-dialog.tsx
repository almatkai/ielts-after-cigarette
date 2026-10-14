import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoginForm } from './login-form'

export function LoginDialog({
  open,
  onOpenChange,
  onSuccess,
  trigger,
  description = 'Войдите через Google, чтобы открыть другие тесты и сохранить прогресс.',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void>
  trigger: HTMLElement | null
  description?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-32px)] max-w-[430px] gap-0 overflow-y-auto p-0 sm:p-0"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          if (trigger?.isConnected) trigger.focus()
        }}
      >
        <DialogTitle className="sr-only">Войти или создать аккаунт</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <LoginForm
          description={description}
          onSuccess={onSuccess}
          onContinueAsGuest={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
