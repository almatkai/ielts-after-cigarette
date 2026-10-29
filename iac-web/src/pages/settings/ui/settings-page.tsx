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
import { AccessSummary } from '@/features/billing/access-status'
import { useBillingAccess } from '@/features/billing/use-billing'
import { Link } from '@tanstack/react-router'

const cardClassName = 'gap-0 rounded-[10px] border-border py-0 shadow-none'

const fieldClassName =
  'h-9 min-w-0 max-w-full rounded-[8px] border-border bg-card shadow-none focus-visible:border-primary focus-visible:ring-0'

const selectClassName =
  'h-9 w-full min-w-0 max-w-full rounded-[8px] border-border bg-card shadow-none focus-visible:border-primary focus-visible:ring-0'

const saveButtonClassName =
  'h-9 shrink-0 rounded-[8px] bg-primary px-4 shadow-none hover:bg-primary-hover'

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
      <div className="mx-auto grid w-full min-w-0 max-w-[880px] gap-4">
        <Card className={cardClassName}>
          <SectionHeader
            title={t('Профиль и цель')}
            description={t(
              'Профиль, цель подготовки и напоминания доступны после входа.',
            )}
          />
          <CardContent className="p-4">
            <LoginToContinue />
          </CardContent>
        </Card>
        <InterfaceSettingsCard />
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
    <div className="mx-auto grid w-full min-w-0 max-w-[880px] gap-4">
      <AccessCard />
      <Card className={cardClassName}>
        <SectionHeader
          title={t('Профиль и цель')}
          description={t(
            'Укажите целевой балл и дату экзамена — по ним строится ваш план подготовки.',
          )}
        />
        <CardContent className="divide-y divide-border p-0">
          <form
            className="min-w-0"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void profileForm.handleSubmit()
            }}
          >
            <SettingRow
              label={<Label htmlFor="displayName">{t('Имя')}</Label>}
              description={t('Имя аккаунта.')}
            >
              <profileForm.Field
                name="displayName"
                validators={{ onSubmit: profileSchema.shape.displayName }}
              >
                {(field) => (
                  <div className="grid gap-1.5">
                    <div className="flex gap-2">
                      <Input
                        id={field.name}
                        autoComplete="name"
                        placeholder={t('Как к вам обращаться')}
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        onBlur={field.handleBlur}
                        className={fieldClassName}
                      />
                      <profileForm.Subscribe
                        selector={(state) => state.isSubmitting}
                      >
                        {(isSubmitting) => (
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className={saveButtonClassName}
                          >
                            {isSubmitting ? t('Сохраняем…') : t('Сохранить')}
                          </Button>
                        )}
                      </profileForm.Subscribe>
                    </div>
                    {firstError(field.state.meta.errors) ? (
                      <p className="text-xs text-destructive" role="alert">
                        {t(firstError(field.state.meta.errors) ?? '')}
                      </p>
                    ) : null}
                    {profileMessage ? (
                      <p
                        className="text-xs text-muted-foreground"
                        role="status"
                      >
                        {t(profileMessage)}
                      </p>
                    ) : null}
                  </div>
                )}
              </profileForm.Field>
            </SettingRow>
          </form>

          <form
            className="min-w-0"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void goalForm.handleSubmit()
            }}
          >
            <SettingRow
              label={t('Цель подготовки')}
              description={t('Целевой балл, формат и дата экзамена.')}
            >
              <div className="grid gap-3">
                <div className="grid min-w-0 gap-3 sm:grid-cols-3 [&>*]:min-w-0">
                  <goalForm.Field
                    name="targetBand"
                    validators={{ onSubmit: goalSchema.shape.targetBand }}
                  >
                    {(field) => (
                      <FieldBlock
                        id={field.name}
                        label={t('Целевой балл')}
                        error={firstError(field.state.meta.errors)}
                      >
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => {
                            // Radix внутри <form> шлёт '' при подстановке
                            // значения из профиля — не затираем им поле.
                            if (value) field.handleChange(value)
                          }}
                        >
                          <SelectTrigger
                            id={field.name}
                            className={selectClassName}
                          >
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
                      </FieldBlock>
                    )}
                  </goalForm.Field>
                  <goalForm.Field
                    name="examType"
                    validators={{ onSubmit: goalSchema.shape.examType }}
                  >
                    {(field) => (
                      <FieldBlock
                        id={field.name}
                        label={t('Формат IELTS')}
                        error={firstError(field.state.meta.errors)}
                      >
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => {
                            // Radix внутри <form> шлёт '' при подстановке
                            // значения из профиля — не затираем им поле.
                            if (value) field.handleChange(value)
                          }}
                        >
                          <SelectTrigger
                            id={field.name}
                            className={selectClassName}
                          >
                            <SelectValue placeholder={t('Выберите формат')} />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="academic">Academic</SelectItem>
                            <SelectItem value="general">
                              General Training
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldBlock>
                    )}
                  </goalForm.Field>
                  <goalForm.Field
                    name="examDate"
                    validators={{ onSubmit: goalSchema.shape.examDate }}
                  >
                    {(field) => (
                      <FieldBlock
                        id={field.name}
                        label={t('Дата экзамена')}
                        error={firstError(field.state.meta.errors)}
                      >
                        <Input
                          id={field.name}
                          type="date"
                          min={todayDateValue()}
                          value={field.state.value}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          onBlur={field.handleBlur}
                          className={fieldClassName}
                        />
                      </FieldBlock>
                    )}
                  </goalForm.Field>
                </div>
                <div className="flex items-center justify-end gap-3">
                  {goalMessage ? (
                    <p
                      className="mr-auto text-xs text-muted-foreground"
                      role="status"
                    >
                      {t(goalMessage)}
                    </p>
                  ) : null}
                  <goalForm.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className={saveButtonClassName}
                      >
                        {isSubmitting ? t('Сохраняем…') : t('Сохранить цель')}
                      </Button>
                    )}
                  </goalForm.Subscribe>
                </div>
              </div>
            </SettingRow>
          </form>
        </CardContent>
      </Card>

      <InterfaceSettingsCard
        mascot={{ checked: isMascotVisible, onChange: setMascotVisible }}
      />
    </div>
  )
}

function AccessCard() {
  const { t } = useLanguage()
  const access = useBillingAccess()
  if (!access.data) return null
  return (
    <Card className={cardClassName}>
      <SectionHeader title={t('Тариф и доступ')} />
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <AccessSummary access={access.data} />
        {access.data.staff ? null : (
          <Button
            asChild
            variant="outline"
            className="h-9 shrink-0 rounded-[8px]"
          >
            <Link to="/pricing">
              {access.data.active ? t('Продлить доступ') : t('Выбрать тариф')}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="grid gap-0.5 border-b border-border px-4 py-3">
      <CardTitle className="text-sm font-semibold tracking-[-0.01em]">
        {title}
      </CardTitle>
      {description ? (
        <CardDescription className="text-xs leading-5">
          {description}
        </CardDescription>
      ) : null}
    </div>
  )
}

// Строка настроек: подпись слева, управление справа; на мобильном — столбиком.
function SettingRow({
  label,
  description,
  children,
}: {
  label: React.ReactNode
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid min-w-0 gap-2.5 px-4 py-3.5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
      <div className="min-w-0 sm:pt-2">
        <div className="text-sm font-medium leading-5 text-foreground">
          {label}
        </div>
        {description ? (
          <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function FieldBlock({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  const { t } = useLanguage()
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {t(error)}
        </p>
      ) : null}
    </div>
  )
}

const themeOptions = [
  { value: 'system', label: 'Системная' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
] as const

// Язык и тема — настройки устройства, доступные и гостям без аккаунта.
function InterfaceSettingsCard({
  mascot,
}: {
  mascot?: { checked: boolean; onChange: (value: boolean) => void }
}) {
  const { t } = useLanguage()
  const { preference, setPreference } = useThemePreference()
  return (
    <Card className={cardClassName}>
      <SectionHeader title={t('Интерфейс')} />
      <CardContent className="divide-y divide-border p-0">
        <InlineRow
          label={t('Язык интерфейса')}
          description={t('Сохраняется на этом устройстве.')}
        >
          <LanguagePicker bare className="sm:w-48" />
        </InlineRow>
        <InlineRow label={t('Тема оформления')}>
          <div
            role="group"
            aria-label={t('Тема оформления')}
            className="inline-flex gap-0.5 rounded-[9px] border border-border bg-muted p-0.5"
          >
            {themeOptions.map((theme) => (
              <button
                type="button"
                key={theme.value}
                aria-pressed={preference === theme.value}
                onClick={() => setPreference(theme.value)}
                className={`h-8 rounded-[7px] px-3 text-[13px] font-medium transition-colors ${preference === theme.value ? 'bg-card text-foreground shadow-[0_0_0_1px_var(--border)]' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t(theme.label)}
              </button>
            ))}
          </div>
        </InlineRow>
        {mascot ? (
          <InlineRow
            inline
            label={t('Помощник Юки')}
            description={t('Если скрыть, останется маленькая кнопка чата.')}
          >
            <Switch
              id="mascot-toggle"
              checked={mascot.checked}
              onCheckedChange={mascot.onChange}
              aria-label={t('Показывать питомца (Юки)')}
              className="data-[state=checked]:bg-primary"
            />
          </InlineRow>
        ) : null}
      </CardContent>
    </Card>
  )
}

// Однострочная настройка: подпись слева, компактный контрол прижат вправо.
function InlineRow({
  inline = false,
  label,
  description,
  children,
}: {
  // Не переносить контрол под подпись на мобильном (для свитчей).
  inline?: boolean
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`flex min-w-0 gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${inline ? 'flex-row items-center justify-between gap-4' : 'flex-col'}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium leading-5 text-foreground">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
