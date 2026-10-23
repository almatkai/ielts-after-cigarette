import {
  Camera,
  DirectRight,
  NotificationStatus,
  Sms,
  User,
} from 'iconsax-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

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
import { Switch } from '@/components/ui/switch'
import { useMascotVisibility } from '@/features/assistant/mascot-store'
import { authStore } from '@/features/auth/auth-store'
import {
  getProfile,
  patchProfile,
  profileToForm,
  putGoal,
  queryKeys,
  validateGoal,
} from '@/features/ielts/api'
import { getErrorMessage } from '@/lib/api/client'
import { GoalFields } from '@/features/ielts/goal-form'
import { useLanguage } from '@/lib/i18n'

import type { ProfileForm } from '@/features/ielts/api'

const fieldClassName =
  'h-11 min-w-0 max-w-full rounded-[9px] border-border bg-card shadow-none focus-visible:border-primary focus-visible:ring-0'

const emptyProfileForm: ProfileForm = {
  firstName: '',
  lastName: '',
  email: '',
  targetScore: '',
  examDate: '',
  examFormat: '',
}

export function ProfilePage() {
  const { t } = useLanguage()
  const { isVisible: isMascotVisible, setVisible: setMascotVisible } =
    useMascotVisibility()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProfileForm>(emptyProfileForm)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [goalMessage, setGoalMessage] = useState<string | null>(null)
  const [goalErrors, setGoalErrors] = useState<Record<string, string>>({})
  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: ({ signal }) => getProfile(signal),
  })
  const profileMutation = useMutation({
    mutationFn: () => patchProfile(form.firstName, form.lastName),
    onSuccess: (profile) => {
      authStore.updateUser(profile)
      queryClient.setQueryData(queryKeys.profile, profile)
      setProfileMessage(t('Личные данные сохранены.'))
    },
  })
  const goalMutation = useMutation({
    mutationFn: () => putGoal(form),
    onSuccess: async (profile) => {
      authStore.updateUser(profile)
      queryClient.setQueryData(queryKeys.profile, profile)
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      setGoalMessage(t('Цель обновлена — dashboard уже получил новые данные.'))
    },
  })

  useEffect(() => {
    if (profileQuery.data) {
      setForm(profileToForm(profileQuery.data))
    }
  }, [profileQuery.data])

  const updateForm = <TKey extends keyof ProfileForm>(
    key: TKey,
    value: ProfileForm[TKey],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleProfileSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setProfileMessage(null)
    if (`${form.firstName} ${form.lastName}`.trim().length < 2) {
      setProfileMessage(t('Укажите имя длиной не менее двух символов.'))
      return
    }
    try {
      await profileMutation.mutateAsync()
    } catch (error) {
      setProfileMessage(t(getErrorMessage(error)))
    }
  }

  const handleGoalSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setGoalMessage(null)
    const errors = validateGoal(form)
    setGoalErrors(errors)
    if (Object.keys(errors).length > 0) return
    try {
      await goalMutation.mutateAsync()
    } catch (error) {
      setGoalMessage(t(getErrorMessage(error)))
    }
  }

  if (profileQuery.isPending) {
    return (
      <Card className="mx-auto max-w-[1120px] rounded-[10px] border-border">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          {t('Загружаем профиль…')}
        </CardContent>
      </Card>
    )
  }

  if (profileQuery.isError) {
    return (
      <Card className="mx-auto max-w-[1120px] rounded-[10px] border-border">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <p className="text-sm font-semibold text-foreground">
            {t('Не удалось загрузить профиль')}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => void profileQuery.refetch()}
          >
            {t('Повторить')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1120px]">
      {/* 1. Блок Фото профиля */}
      <Card className="group mb-4 sm:mb-5 gap-0 overflow-hidden rounded-[10px] sm:rounded-[10px] border-border py-0 shadow-none transition-all hover:border-border-strong">
        <CardContent className="flex flex-col gap-4 p-3.5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
          <div className="grid size-16 shrink-0 place-items-center rounded-full border border-border bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary-soft group-hover:text-primary group-hover:border-border-strong sm:size-24">
            <User
              className="size-7 sm:size-11 transition-colors"
              strokeWidth={1.45}
              aria-hidden
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-semibold tracking-[-0.02em] text-foreground">
              {t('Фото профиля')}
            </h3>
            <p className="mt-0.5 sm:mt-1 max-w-lg text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">
              {t(
                'Загрузите JPG, PNG или WebP. Рекомендуемый размер — от 400 × 400 пикселей.',
              )}
            </p>
          </div>

          <Input
            ref={photoInputRef}
            id="profile-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            aria-label={t('Выбрать фото профиля')}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => photoInputRef.current?.click()}
            className="h-10 shrink-0 rounded-[9px] border-border bg-card px-4 shadow-none hover:border-border-strong hover:text-primary transition-colors"
          >
            <Camera
              className="transition-colors group-hover:text-primary"
              aria-hidden
            />
            {t('Загрузить фото')}
          </Button>
        </CardContent>
      </Card>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
        <div className="grid min-w-0 gap-5 [&>*]:min-w-0">
          {/* 2. Блок Личные данные */}
          <Card className="group gap-0 rounded-[10px] sm:rounded-[10px] border-border py-0 shadow-none transition-all hover:border-border-strong">
            <CardHeader className="border-b border-border p-3.5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-8 sm:size-9 shrink-0 place-items-center rounded-[8px] sm:rounded-[9px] bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary-soft group-hover:text-primary ">
                  <User
                    className="size-4 sm:size-[18px] transition-colors"
                    aria-hidden
                  />
                </span>
                <div>
                  <CardTitle className="text-sm sm:text-base tracking-[-0.02em]">
                    {t('Личные данные')}
                  </CardTitle>
                  <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm leading-4 sm:leading-5">
                    {t('Основная информация вашего аккаунта.')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form className="min-w-0" onSubmit={handleProfileSubmit}>
              <CardContent className="grid min-w-0 gap-3.5 p-3.5 sm:gap-5 sm:grid-cols-2 sm:p-6 [&>*]:min-w-0">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">{t('Имя')}</Label>
                  <Input
                    id="first-name"
                    name="firstName"
                    autoComplete="given-name"
                    placeholder={t('Введите имя')}
                    value={form.firstName}
                    onChange={(event) =>
                      updateForm('firstName', event.target.value)
                    }
                    className={fieldClassName}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">{t('Фамилия')}</Label>
                  <Input
                    id="last-name"
                    name="lastName"
                    autoComplete="family-name"
                    placeholder={t('Введите фамилию')}
                    value={form.lastName}
                    onChange={(event) =>
                      updateForm('lastName', event.target.value)
                    }
                    className={fieldClassName}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="email">{t('Электронная почта')}</Label>
                  <div className="relative">
                    <Sms
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-hover:text-primary"
                      aria-hidden
                    />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder={t('Введите электронную почту')}
                      value={form.email}
                      disabled
                      className={`${fieldClassName} pl-10`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('Изменение email пока не поддерживается backend.')}
                  </p>
                </div>
                {profileMessage ? (
                  <p
                    className="text-sm text-muted-foreground sm:col-span-2"
                    role="status"
                  >
                    {t(profileMessage)}
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="justify-end border-t border-border px-3.5 py-3 sm:px-6 sm:py-4">
                <Button
                  type="submit"
                  disabled={profileMutation.isPending}
                  className="h-9 sm:h-10 rounded-[9px] bg-primary px-4 sm:px-5 text-xs sm:text-sm shadow-none hover:bg-primary-hover"
                >
                  {profileMutation.isPending
                    ? t('Сохраняем…')
                    : t('Сохранить изменения')}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* 3. Блок Параметры подготовки */}
          <Card className="group gap-0 rounded-[10px] sm:rounded-[10px] border-border py-0 shadow-none transition-all hover:border-border-strong">
            <CardHeader className="border-b border-border p-3.5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-8 sm:size-9 shrink-0 place-items-center rounded-[8px] sm:rounded-[9px] bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary-soft group-hover:text-primary ">
                  <DirectRight
                    className="size-4 sm:size-[18px] transition-colors"
                    aria-hidden
                  />
                </span>
                <div>
                  <CardTitle className="text-sm sm:text-base tracking-[-0.02em]">
                    {t('Параметры подготовки')}
                  </CardTitle>
                  <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm leading-4 sm:leading-5">
                    {t('Цель и формат, под которые будет строиться план.')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form className="min-w-0" onSubmit={handleGoalSubmit}>
              <CardContent className="grid min-w-0 gap-5 p-5 sm:p-6 [&>*]:min-w-0">
                <GoalFields
                  form={form}
                  errors={goalErrors}
                  onChange={updateForm}
                  idPrefix="profile-goal"
                />
                {goalMessage ? (
                  <p className="text-sm text-muted-foreground" role="status">
                    {t(goalMessage)}
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="justify-end border-t border-border px-5 py-4 sm:px-6">
                <Button
                  type="submit"
                  disabled={goalMutation.isPending}
                  className="h-10 rounded-[9px] bg-primary px-5 shadow-none hover:bg-primary-hover"
                >
                  {goalMutation.isPending
                    ? t('Сохраняем…')
                    : t('Сохранить параметры')}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <aside className="grid min-w-0 gap-5 [&>*]:min-w-0">
          {/* 4. Блок Уведомления */}
          <Card className="group gap-0 rounded-[10px] border-border py-0 shadow-none transition-all hover:border-border-strong">
            <CardHeader className="border-b border-border p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary-soft group-hover:text-primary ">
                  <NotificationStatus
                    className="size-[18px] transition-colors"
                    aria-hidden
                  />
                </span>
                <div>
                  <CardTitle className="text-base tracking-[-0.02em]">
                    {t('Уведомления')}
                  </CardTitle>
                  <CardDescription className="mt-1 leading-5">
                    {t('Выберите полезные напоминания.')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <Label
                    htmlFor="lesson-reminders"
                    className="leading-5 text-foreground"
                  >
                    {t('Напоминания о занятиях')}
                  </Label>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t('Перед запланированной практикой.')}
                  </p>
                </div>
                <Switch
                  id="lesson-reminders"
                  aria-label={t('Напоминания о занятиях')}
                  className="mt-0.5 data-[state=checked]:bg-primary"
                />
              </div>
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <Label
                    htmlFor="weekly-report"
                    className="leading-5 text-foreground"
                  >
                    {t('Еженедельный отчёт')}
                  </Label>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t('Краткая сводка прогресса за неделю.')}
                  </p>
                </div>
                <Switch
                  id="weekly-report"
                  aria-label={t('Еженедельный отчёт')}
                  className="mt-0.5 data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-[10px] border-border py-0 shadow-none">
            <CardHeader className="p-5">
              <CardTitle className="text-base">{t('Помощник Юки')}</CardTitle>
              <CardDescription>
                {t('Управление отображением питомца Юки в интерфейсе.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label
                    htmlFor="profile-mascot-toggle"
                    className="leading-5 text-foreground cursor-pointer"
                  >
                    {t('Показывать питомца (Юки)')}
                  </Label>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t('Если скрыть, останется маленькая кнопка чата.')}
                  </p>
                </div>
                <Switch
                  id="profile-mascot-toggle"
                  checked={isMascotVisible}
                  onCheckedChange={setMascotVisible}
                  aria-label={t('Показывать питомца (Юки)')}
                  className="mt-0.5 data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-[10px] border-border py-0 shadow-none">
            <CardHeader className="p-5">
              <CardTitle className="text-base">{t('Безопасность')}</CardTitle>
              <CardDescription>
                {t('Вход в аккаунт доступен только через Google.')}
              </CardDescription>
            </CardHeader>
          </Card>
        </aside>
      </div>
    </div>
  )
}
