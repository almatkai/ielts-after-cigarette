import { useThemePreference } from '@/features/theme/theme'
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
import { Switch } from '@/components/ui/switch'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import { authStore, useAuth } from '@/features/auth/auth-store'
import { LoginToContinue } from '@/components/auth/guest-shell'
import { useMascotVisibility } from '@/features/assistant/mascot-store'
import {
  getProfile,
  queryKeys,
  updateGoal,
  updateProfile,
} from '@/features/ielts/api'
import { getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'
import { LanguagePicker } from '@/components/ui/language-picker'

const cardClassName = 'gap-0 rounded-[10px] border-border py-0 shadow-none'

const fieldClassName =
  'h-11 min-w-0 max-w-full rounded-[9px] border-border bg-card shadow-none focus-visible:border-primary focus-visible:ring-0'

const selectClassName =
  'h-11 w-full min-w-0 max-w-full rounded-[9px] border-border bg-card shadow-none focus-visible:border-primary focus-visible:ring-0'

const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Укажите имя не короче 2 символов'),
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
  const { preference, setPreference } = useThemePreference()
  const { t } = useLanguage()
  const { user } = useAuth()
  const { isVisible: isMascotVisible, setVisible: setMascotVisible } =
    useMascotVisibility()
  const queryClient = useQueryClient()
  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: ({ signal }) => getProfile(signal),
    enabled: Boolean(user),
  })
  const profile = profileQuery.data ?? null
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [goalMessage, setGoalMessage] = useState<string | null>(null)

  const profileForm = useForm({
    defaultValues: {
      displayName: profile?.displayName ?? '',
    },
    onSubmit: async ({ value }) => {
      setProfileMessage(null)
      try {
        const updated = await updateProfile({
          displayName: value.displayName.trim(),
        })
        authStore.updateUser(updated)
        queryClient.setQueryData(queryKeys.profile, updated)
        await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
        setProfileMessage('Профиль сохранён.')
      } catch (error) {
        setProfileMessage(t(getErrorMessage(error)))
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
        setGoalMessage(t(getErrorMessage(error)))
      }
    },
  })

  // Подставляем загруженный профиль в формы (один раз после загрузки).
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    if (profile && !initialized) {
      profileForm.reset({
        displayName: profile.displayName,
      })
      goalForm.reset({
        targetBand: profile.targetBand?.toFixed(1) ?? '',
        examDate: profile.examDate ?? '',
        examType: profile.examType ?? '',
      })
      setInitialized(true)
    }
  }, [profile, initialized, profileForm, goalForm])

  // Гость может выбрать язык без регистрации; остальное откроется после входа.
  if (!user) {
    return (
      <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
        <LanguageSettingsCard />
        <Card className={cardClassName}>
          <CardHeader className="border-b border-border p-5 sm:p-6">
            <CardTitle className="text-base tracking-[-0.02em]">
              {t('Профиль и цель')}
            </CardTitle>
            <CardDescription className="mt-1 leading-5">
              {t(
                'Профиль, цель подготовки и напоминания доступны после входа.',
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <LoginToContinue />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (profileQuery.isPending) {
    return <LoadingState label={t('Загружаем настройки…')} />
  }
  if (profileQuery.isError) {
    return (
      <ErrorState
        title={t('Не удалось загрузить профиль')}
        message={t(getErrorMessage(profileQuery.error))}
        onRetry={() => void profileQuery.refetch()}
      />
    )
  }

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1120px] gap-5">
      <LanguageSettingsCard />
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.025em] text-foreground">
          {t('Настройте профиль и цель')}
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {t(
            'Укажите целевой балл и дату экзамена — по ним строится ваш план подготовки.',
          )}
        </p>
      </div>

      <Card className={cardClassName}>
        <CardHeader className="p-5 sm:p-6">
          <CardTitle className="text-base">{t('Тема оформления')}</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 sm:px-6">
          <div
            role="group"
            aria-label={t('Тема оформления')}
            className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-muted p-1"
          >
            {(
              [
                { value: 'system', label: 'Системная' },
                { value: 'light', label: 'Светлая' },
                { value: 'dark', label: 'Тёмная' },
              ] as const
            ).map((theme) => (
              <button
                type="button"
                key={theme.value}
                aria-pressed={preference === theme.value}
                onClick={() => setPreference(theme.value)}
                className={`min-h-11 rounded-md px-3 text-sm font-semibold transition-colors ${preference === theme.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-card'}`}
              >
                {t(theme.label)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className={cardClassName}>
        <CardHeader className="border-b border-border p-5 sm:p-6">
          <CardTitle className="text-base tracking-[-0.02em]">
            {t('Профиль')}
          </CardTitle>
          <CardDescription className="mt-1 leading-5">
            {t('Имя аккаунта.')}
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
          <CardContent className="grid min-w-0 gap-5 p-5 sm:p-6 [&>*]:min-w-0">
            <profileForm.Field
              name="displayName"
              validators={{ onSubmit: profileSchema.shape.displayName }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>{t('Имя')}</Label>
                  <Input
                    id={field.name}
                    autoComplete="name"
                    placeholder={t('Как к вам обращаться')}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    className={fieldClassName}
                  />
                  {firstError(field.state.meta.errors) ? (
                    <p className="text-xs text-destructive" role="alert">
                      {t(firstError(field.state.meta.errors) ?? '')}
                    </p>
                  ) : null}
                </div>
              )}
            </profileForm.Field>
            {profileMessage ? (
              <p
                className="text-sm text-muted-foreground sm:col-span-2"
                role="status"
              >
                {t(profileMessage)}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="justify-end border-t border-border px-5 py-4 sm:px-6">
            <profileForm.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-[9px] bg-primary px-5 shadow-none hover:bg-primary-hover"
                >
                  {isSubmitting ? t('Сохраняем…') : t('Сохранить профиль')}
                </Button>
              )}
            </profileForm.Subscribe>
          </CardFooter>
        </form>
      </Card>

      <Card className={cardClassName}>
        <CardHeader className="border-b border-border p-5 sm:p-6">
          <CardTitle className="text-base tracking-[-0.02em]">
            {t('Цель подготовки')}
          </CardTitle>
          <CardDescription className="mt-1 leading-5">
            {t('Целевой балл, формат и дата экзамена.')}
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
                  <Label htmlFor={field.name}>{t('Целевой балл')}</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <SelectTrigger id={field.name} className={selectClassName}>
                      <SelectValue placeholder={t('Выберите балл')} />
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
                    <p className="text-xs text-destructive" role="alert">
                      {t(firstError(field.state.meta.errors) ?? '')}
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
                  <Label htmlFor={field.name}>{t('Формат IELTS')}</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <SelectTrigger id={field.name} className={selectClassName}>
                      <SelectValue placeholder={t('Выберите формат')} />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="general">General Training</SelectItem>
                    </SelectContent>
                  </Select>
                  {firstError(field.state.meta.errors) ? (
                    <p className="text-xs text-destructive" role="alert">
                      {t(firstError(field.state.meta.errors) ?? '')}
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
                  <Label htmlFor={field.name}>
                    {t('Планируемая дата экзамена')}
                  </Label>
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
                    <p className="text-xs text-destructive" role="alert">
                      {t(firstError(field.state.meta.errors) ?? '')}
                    </p>
                  ) : null}
                </div>
              )}
            </goalForm.Field>
            {goalMessage ? (
              <p
                className="text-sm text-muted-foreground sm:col-span-2"
                role="status"
              >
                {t(goalMessage)}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="justify-end border-t border-border px-5 py-4 sm:px-6">
            <goalForm.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-[9px] bg-primary px-5 shadow-none hover:bg-primary-hover"
                >
                  {isSubmitting ? t('Сохраняем…') : t('Сохранить цель')}
                </Button>
              )}
            </goalForm.Subscribe>
          </CardFooter>
        </form>
      </Card>

      <Card className={cardClassName}>
        <CardHeader className="border-b border-border p-5 sm:p-6">
          <CardTitle className="text-base tracking-[-0.02em]">
            {t('Помощник Юки')}
          </CardTitle>
          <CardDescription className="mt-1 leading-5">
            {t('Управление подсказкой помощника в интерфейсе.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label
                htmlFor="mascot-toggle"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                {t('Показывать подсказку Юки')}
              </Label>
              <p className="text-xs leading-5 text-muted-foreground">
                {t(
                  'Отображать подсказку помощника в правом нижнем углу экрана. Если отключить, останется компактная кнопка быстрого перехода в чат.',
                )}
              </p>
            </div>
            <Switch
              id="mascot-toggle"
              checked={isMascotVisible}
              onCheckedChange={setMascotVisible}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Язык — персональная настройка устройства, доступная и гостям без аккаунта.
function LanguageSettingsCard() {
  const { t } = useLanguage()
  return (
    <Card className={cardClassName}>
      <CardHeader className="border-b border-border p-5 sm:p-6">
        <CardTitle className="text-base tracking-[-0.02em]">
          {t('Язык интерфейса')}
        </CardTitle>
        <CardDescription className="mt-1 leading-5">
          {t(
            'Выберите язык приложения. Настройка сохранится на этом устройстве.',
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <LanguagePicker />
      </CardContent>
    </Card>
  )
}
