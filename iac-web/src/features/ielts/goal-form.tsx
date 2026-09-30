import { TickCircle } from 'iconsax-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { ExamDatePicker } from '@/components/dashboard/exam-date-picker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { authStore } from '@/features/auth/auth-store'
import {
  getProfile,
  profileToGoalForm,
  putGoal,
  queryKeys,
  validateGoal,
} from '@/features/ielts/api'
import { getErrorMessage } from '@/lib/api/client'

import type { GoalFormValues } from '@/features/ielts/api'

const targetScores = ['5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5'] as const

const selectClassName =
  'h-11 w-full min-w-0 max-w-full rounded-[9px] border-[#deded9] bg-white shadow-none focus-visible:border-[#3b82f6] focus-visible:ring-0'

const emptyGoalForm: GoalFormValues = {
  targetScore: '',
  examDate: '',
  examFormat: '',
}

type GoalFieldsProps = {
  form: GoalFormValues
  errors: Record<string, string>
  onChange: (key: keyof GoalFormValues, value: string) => void
  idPrefix?: string
  /**
   * Поднимает слои выпадающих списков и календаря выше диалога,
   * если поля отрисованы внутри него.
   */
  elevated?: boolean
}

/**
 * Поля цели подготовки (формат, целевой балл, дата экзамена).
 * Используются и в блоке профиля, и в диалоге на dashboard.
 */
export function GoalFields({
  form,
  errors,
  onChange,
  idPrefix = 'goal',
  elevated = false,
}: GoalFieldsProps) {
  const overlayClassName = elevated ? 'z-[90]' : undefined
  const formatId = `${idPrefix}-exam-format`
  const scoreId = `${idPrefix}-target-score`
  const dateId = `${idPrefix}-exam-date`

  return (
    <div className="grid min-w-0 gap-5 sm:grid-cols-2 [&>*]:min-w-0">
      <div className="grid gap-2">
        <Label htmlFor={formatId}>Формат IELTS</Label>
        <Select
          name="examFormat"
          value={form.examFormat}
          onValueChange={(value) => onChange('examFormat', value)}
        >
          <SelectTrigger id={formatId} className={selectClassName}>
            <SelectValue placeholder="Выберите формат" />
          </SelectTrigger>
          <SelectContent position="popper" className={overlayClassName}>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="general">General Training</SelectItem>
          </SelectContent>
        </Select>
        {errors.examFormat ? (
          <p className="text-xs text-[#c92f2f]" role="alert">
            {errors.examFormat}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={scoreId}>Целевой балл</Label>
        <Select
          name="targetScore"
          value={form.targetScore}
          onValueChange={(value) => onChange('targetScore', value)}
        >
          <SelectTrigger id={scoreId} className={selectClassName}>
            <SelectValue placeholder="Выберите балл" />
          </SelectTrigger>
          <SelectContent position="popper" className={overlayClassName}>
            {targetScores.map((score) => (
              <SelectItem key={score} value={score}>
                {score}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.targetScore ? (
          <p className="text-xs text-[#c92f2f]" role="alert">
            {errors.targetScore}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor={dateId}>Планируемая дата экзамена</Label>
        <ExamDatePicker
          id={dateId}
          value={form.examDate}
          onChange={(date) => onChange('examDate', date)}
          error={errors.examDate}
          contentClassName={elevated ? 'z-[90]' : undefined}
        />
        {errors.examDate ? (
          <p className="text-xs text-[#c92f2f]" role="alert">
            {errors.examDate}
          </p>
        ) : null}
      </div>
    </div>
  )
}

type GoalDialogProps = {
  /** Кнопка, по которой открывается диалог. */
  children: React.ReactNode
}

/**
 * Быстрая настройка цели: формат, целевой балл и дата экзамена
 * без перехода в профиль. После сохранения обновляет dashboard.
 */
export function GoalDialog({ children }: GoalDialogProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Partial<GoalFormValues>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: ({ signal }) => getProfile(signal),
    enabled: open,
  })

  // Текущая цель из профиля + правки пользователя: поля сразу заполнены
  // сохранёнными значениями, без промежуточного пустого состояния.
  const form: GoalFormValues = {
    ...(profileQuery.data ? profileToGoalForm(profileQuery.data) : emptyGoalForm),
    ...draft,
  }

  const goalMutation = useMutation({
    mutationFn: (values: GoalFormValues) => putGoal(values),
    onSuccess: async (profile) => {
      authStore.updateUser(profile)
      queryClient.setQueryData(queryKeys.profile, profile)
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      setDraft({})
      setMessage(null)
      setIsSaved(true)
    },
  })

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setDraft({})
      setErrors({})
      setMessage(null)
      setIsSaved(false)
    }
  }

  const updateForm = (key: keyof GoalFormValues, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    const validationErrors = validateGoal(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    try {
      await goalMutation.mutateAsync(form)
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-32px)] overflow-y-auto">
        {isSaved ? (
          <>
            <DialogHeader>
              <span className="grid size-10 place-items-center rounded-[10px] bg-[#eff6ff] text-[#3b82f6]">
                <TickCircle className="size-5" aria-hidden />
              </span>
              <DialogTitle className="mt-1">Цель обновлена</DialogTitle>
              <DialogDescription>
                Dashboard уже пересчитан под новый балл и дату экзамена.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 rounded-[9px] bg-[#3b82f6] px-5 shadow-none hover:bg-[#2563eb]"
              >
                Готово
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Настроить цель</DialogTitle>
              <DialogDescription>
                Формат, целевой балл и дата экзамена — под них строится план
                подготовки.
              </DialogDescription>
            </DialogHeader>

            {profileQuery.isPending ? (
              <p className="py-6 text-center text-sm text-[#69696d]">
                Загружаем текущую цель…
              </p>
            ) : profileQuery.isError ? (
              <div className="grid gap-3 py-2">
                <p className="text-sm text-[#69696d]">
                  Не удалось загрузить текущую цель.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-fit rounded-[9px] border-[#deded9] bg-white px-4 shadow-none"
                  onClick={() => void profileQuery.refetch()}
                >
                  Повторить
                </Button>
              </div>
            ) : (
              <>
                <GoalFields
                  form={form}
                  errors={errors}
                  onChange={updateForm}
                  idPrefix="goal-dialog"
                  elevated
                />
                {message ? (
                  <p className="text-sm text-[#c92f2f]" role="alert">
                    {message}
                  </p>
                ) : null}
                <DialogFooter className="mt-1 border-t border-[#ededeb] pt-4">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-[9px] border-[#deded9] bg-white px-5 shadow-none"
                    >
                      Отмена
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={goalMutation.isPending}
                    className="h-10 rounded-[9px] bg-[#3b82f6] px-5 shadow-none hover:bg-[#2563eb]"
                  >
                    {goalMutation.isPending ? 'Сохраняем…' : 'Сохранить цель'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
