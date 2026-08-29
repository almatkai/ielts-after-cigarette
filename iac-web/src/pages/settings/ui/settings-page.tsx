import { useForm } from '@tanstack/react-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import { authStore } from '@/features/auth/auth-store'
import {
  getProfile,
  queryKeys,
  updateGoal,
  updateProfile,
} from '@/features/ielts/api'
import { getErrorMessage } from '@/lib/api/client'

const cardClassName = 'gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none'

const fieldClassName =
  'h-11 min-w-0 max-w-full rounded-[9px] border-[#deded9] bg-white shadow-none focus-visible:border-[#e23b3b] focus-visible:ring-0'

const selectClassName =
  'h-11 w-full min-w-0 max-w-full rounded-[9px] border-[#deded9] bg-white shadow-none focus-visible:border-[#e23b3b] focus-visible:ring-0'

const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Укажите имя не короче 2 символов'),
  timezone: z.string().trim(),
})

const goalSchema = z.object({
  targetBand: z
    .string()
    .refine(
      (value) =>
        value !== '' &&
        Number.isFinite(Number(value)) &&
        Number(value) >= 4 &&
        Number(value) <= 9 &&
        Number.isInteger(Number(value) * 2),
      'Выберите балл от 4.0 до 9.0 с шагом 0.5',
    ),
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Укажите дату экзамена')
    .refine((value) => value >= todayDateValue(), {
      message: 'Дата экзамена не может быть в прошлом',
    }),
  examType: z.enum(['academic', 'general'], {
    message: 'Выберите формат IELTS',
  }),
})

const targetBandOptions: string[] = []
for (let band = 4; band <= 9; band += 0.5) {
  targetBandOptions.push(band.toFixed(1))
}

function todayDateValue() {
  const today = new Date()
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
}

function firstError(errors: unknown[]) {
  for (const error of errors) {
    if (typeof error === 'string') return error
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message)
    }
  }
  return undefined
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: ({ signal }) => getProfile(signal),
  })
  const profile = profileQuery.data ?? null
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [goalMessage, setGoalMessage] = useState<string | null>(null)

  const profileForm = useForm({
    defaultValues: {
      displayName: profile?.displayName ?? '',
      timezone: profile?.timezone ?? '',
    },
    onSubmit: async ({ value }) => {
      setProfileMessage(null)
      try {
        const updated = await updateProfile({
          displayName: value.displayName.trim(),
          ...(value.timezone.trim()
            ? { timezone: value.timezone.trim() }
            : {}),
        })
        authStore.updateUser(updated)
        queryClient.setQueryData(queryKeys.profile, updated)
        await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
        setProfileMessage('Профиль сохранён.')
      } catch (error) {
        setProfileMessage(getErrorMessage(error))
      }
    },
  })

  const goalForm = useForm({
    defaultValues: {
      targetBand: profile?.targetBand?.toFixed(1) ?? '',
      examDate: profile?.examDate ?? '',
      examType: profile?.examType ?? '',
    },
    onSubmit: async ({ value }) => {
      setGoalMessage(null)
      try {
        const updated = await updateGoal({
          targetBand: Number(value.targetBand),
          examDate: value.examDate,
          examType: value.examType as 'academic' | 'general',
        })
        authStore.updateUser(updated)
        queryClient.setQueryData(queryKeys.profile, updated)
        await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
        setGoalMessage('Цель обновлена.')
      } catch (error) {
        setGoalMessage(getErrorMessage(error))
      }
    },
  })

  // Подставляем загруженный профиль в формы (один раз после загрузки).
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    if (profile && !initialized) {
      profileForm.reset({
        displayName: profile.displayName,
        timezone: profile.timezone,
      })
      goalForm.reset({
        targetBand: profile.targetBand?.toFixed(1) ?? '',
        examDate: profile.examDate ?? '',
        examType: profile.examType ?? '',
      })
      setInitialized(true)
    }
  }, [profile, initialized, profileForm, goalForm])

  if (profileQuery.isPending) {
    return <LoadingState label="Загружаем настройки…" />
  }
  if (profileQuery.isError) {
    return (
      <ErrorState
        title="Не удалось загрузить профиль"
        message={getErrorMessage(profileQuery.error)}
        onRetry={() => void profileQuery.refetch()}
      />
    )
  }

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#e23b3b]">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Настройки
        </h1>
        <p className="mt-2 text-sm text-[#69696d]">
          Профиль и цель подготовки.
        </p>
      </div>

      <Card className={cardClassName}>
        <CardHeader className="border-b border-[#ededeb] p-5 sm:p-6">
          <CardTitle className="text-base tracking-[-0.02em]">
            Профиль
          </CardTitle>
          <CardDescription className="mt-1 leading-5">
            Имя и часовой пояс аккаунта.
          </CardDescription>
        </CardHeader>
        <form
          className="min-w-0"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void profileForm.handleSubmit()
          }}
        >
          <CardContent className="grid min-w-0 gap-5 p-5 sm:grid-cols-2 sm:p-6 [&>*]:min-w-0">
            <profileForm.Field
              name="displayName"
              validators={{ onSubmit: profileSchema.shape.displayName }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Имя</Label>
                  <Input
                    id={field.name}
                    autoComplete="name"
                    placeholder="Как к вам обращаться"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    className={fieldClassName}
                  />
                  {firstError(field.state.meta.errors) ? (
                    <p className="text-xs text-[#c92f2f]" role="alert">
                      {firstError(field.state.meta.errors)}
                    </p>
                  ) : null}
                </div>
              )}
            </profileForm.Field>
            <profileForm.Field name="timezone">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Часовой пояс</Label>
                  <Input
                    id={field.name}
                    placeholder="Например, Asia/Almaty"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    className={fieldClassName}
                  />
                </div>
              )}
            </profileForm.Field>
            {profileMessage ? (
              <p className="text-sm text-[#69696d] sm:col-span-2" role="status">
                {profileMessage}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="justify-end border-t border-[#ededeb] px-5 py-4 sm:px-6">
            <profileForm.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-[9px] bg-[#e23b3b] px-5 shadow-none hover:bg-[#c92f2f]"
                >
                  {isSubmitting ? 'Сохраняем…' : 'Сохранить профиль'}
                </Button>
              )}
            </profileForm.Subscribe>
          </CardFooter>
        </form>
      </Card>

      <Card className={cardClassName}>
        <CardHeader className="border-b border-[#ededeb] p-5 sm:p-6">
          <CardTitle className="text-base tracking-[-0.02em]">
            Цель подготовки
          </CardTitle>
          <CardDescription className="mt-1 leading-5">
            Целевой балл, формат и дата экзамена.
          </CardDescription>
        </CardHeader>
        <form
          className="min-w-0"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void goalForm.handleSubmit()
          }}
        >
          <CardContent className="grid min-w-0 gap-5 p-5 sm:grid-cols-2 sm:p-6 [&>*]:min-w-0">
            <goalForm.Field
              name="targetBand"
              validators={{ onSubmit: goalSchema.shape.targetBand }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Целевой балл</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <SelectTrigger id={field.name} className={selectClassName}>
                      <SelectValue placeholder="Выберите балл" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {targetBandOptions.map((band) => (
                        <SelectItem key={band} value={band}>
                          {band}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {firstError(field.state.meta.errors) ? (
                    <p className="text-xs text-[#c92f2f]" role="alert">
                      {firstError(field.state.meta.errors)}
                    </p>
                  ) : null}
                </div>
              )}
            </goalForm.Field>
            <goalForm.Field
              name="examType"
              validators={{ onSubmit: goalSchema.shape.examType }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Формат IELTS</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <SelectTrigger id={field.name} className={selectClassName}>
                      <SelectValue placeholder="Выберите формат" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="general">General Training</SelectItem>
                    </SelectContent>
                  </Select>
                  {firstError(field.state.meta.errors) ? (
                    <p className="text-xs text-[#c92f2f]" role="alert">
                      {firstError(field.state.meta.errors)}
                    </p>
                  ) : null}
                </div>
              )}
            </goalForm.Field>
            <goalForm.Field
              name="examDate"
              validators={{ onSubmit: goalSchema.shape.examDate }}
            >
              {(field) => (
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor={field.name}>Планируемая дата экзамена</Label>
                  <Input
                    id={field.name}
                    type="date"
                    min={todayDateValue()}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    className={fieldClassName}
                  />
                  {firstError(field.state.meta.errors) ? (
                    <p className="text-xs text-[#c92f2f]" role="alert">
                      {firstError(field.state.meta.errors)}
                    </p>
                  ) : null}
                </div>
              )}
            </goalForm.Field>
            {goalMessage ? (
              <p className="text-sm text-[#69696d] sm:col-span-2" role="status">
                {goalMessage}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="justify-end border-t border-[#ededeb] px-5 py-4 sm:px-6">
            <goalForm.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-[9px] bg-[#e23b3b] px-5 shadow-none hover:bg-[#c92f2f]"
                >
                  {isSubmitting ? 'Сохраняем…' : 'Сохранить цель'}
                </Button>
              )}
            </goalForm.Subscribe>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
