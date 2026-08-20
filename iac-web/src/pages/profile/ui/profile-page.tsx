import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  BellRing,
  CalendarDays,
  Camera,
  LockKeyhole,
  Mail,
  Target,
  UserRound,
} from 'lucide-react'

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

import type { ProfileForm } from '@/features/ielts/api'

const interFont = {
  fontFamily:
    '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
} as const

const cardClassName =
  'gap-0 rounded-xl border-slate-200 bg-white py-0 shadow-sm dark:border-slate-800 dark:bg-slate-900'

const cardHeaderClassName =
  'border-b border-slate-100 p-5 sm:p-6 dark:border-slate-800'

const cardTitleClassName =
  'text-base font-bold tracking-tight text-slate-900 dark:text-slate-100'

const cardDescriptionClassName =
  'mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400'

const iconChipClassName =
  'grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400'

const neutralIconChipClassName =
  'grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'

const fieldClassName =
  'h-11 min-w-0 max-w-full rounded-lg border-slate-300 bg-white shadow-none focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500'

const selectClassName =
  'h-11 w-full min-w-0 max-w-full rounded-lg border-slate-300 bg-white shadow-none focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

const outlineButtonClassName =
  'h-10 rounded-lg border-slate-300 bg-white text-slate-900 shadow-sm hover:border-slate-400 hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-100'

const primaryButtonClassName =
  'h-10 rounded-lg bg-blue-500 px-5 font-semibold text-white shadow-sm hover:bg-blue-600'

const errorTextClassName = 'text-xs text-red-600 dark:text-red-400'

const messageTextClassName = 'text-sm text-slate-500 dark:text-slate-400'

function preventSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault()
}

const emptyProfileForm: ProfileForm = {
  firstName: '',
  lastName: '',
  email: '',
  targetScore: '',
  examDate: '',
  examFormat: '',
}

function todayDateValue() {
  const today = new Date()
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
}

export function ProfilePage() {
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
      setProfileMessage('Личные данные сохранены.')
    },
  })
  const goalMutation = useMutation({
    mutationFn: () => putGoal(form),
    onSuccess: async (profile) => {
      authStore.updateUser(profile)
      queryClient.setQueryData(queryKeys.profile, profile)
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      setGoalMessage('Цель обновлена — dashboard уже получил новые данные.')
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
      setProfileMessage('Укажите имя длиной не менее двух символов.')
      return
    }
    try {
      await profileMutation.mutateAsync()
    } catch (error) {
      setProfileMessage(getErrorMessage(error))
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
      setGoalMessage(getErrorMessage(error))
    }
  }

  if (profileQuery.isPending) {
    return (
      <div style={interFont} className="mx-auto w-full max-w-[1120px]">
        <Card className={cardClassName}>
          <CardContent className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Загружаем профиль…
          </CardContent>
        </Card>
      </div>
    )
  }

  if (profileQuery.isError) {
    return (
      <div style={interFont} className="mx-auto w-full max-w-[1120px]">
        <Card className={cardClassName}>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Не удалось загрузить профиль
            </p>
            <Button
              type="button"
              variant="outline"
              className={`mt-4 ${outlineButtonClassName}`}
              onClick={() => void profileQuery.refetch()}
            >
              Повторить
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div style={interFont} className="mx-auto w-full min-w-0 max-w-[1120px]">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500 dark:text-blue-400">
          Профиль
        </p>
        <h1 className="mt-2.5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
          Личные данные и цели
        </h1>
        <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
          Расскажите о себе и зафиксируйте цель — план подготовки подстроится
          под неё.
        </p>
      </div>

      <Card className={`mb-5 overflow-hidden ${cardClassName}`}>
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="grid size-20 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-100 text-slate-400 sm:size-24 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
            <UserRound
              className="size-9 sm:size-11"
              strokeWidth={1.45}
              aria-hidden
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Фото профиля
            </h3>
            <p className="mt-1 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
              Загрузите JPG, PNG или WebP. Рекомендуемый размер — от 400 × 400
              пикселей.
            </p>
          </div>

          <Input
            ref={photoInputRef}
            id="profile-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            aria-label="Выбрать фото профиля"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => photoInputRef.current?.click()}
            className={`shrink-0 px-4 ${outlineButtonClassName}`}
          >
            <Camera aria-hidden />
            Загрузить фото
          </Button>
        </CardContent>
      </Card>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
        <div className="grid min-w-0 gap-5 [&>*]:min-w-0">
          <Card className={cardClassName}>
            <CardHeader className={cardHeaderClassName}>
              <div className="flex items-start gap-3">
                <span className={iconChipClassName}>
                  <UserRound className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <CardTitle className={cardTitleClassName}>
                    Личные данные
                  </CardTitle>
                  <CardDescription className={cardDescriptionClassName}>
                    Основная информация вашего аккаунта.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form className="min-w-0" onSubmit={handleProfileSubmit}>
              <CardContent className="grid min-w-0 gap-5 p-5 sm:grid-cols-2 sm:p-6 [&>*]:min-w-0">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">Имя</Label>
                  <Input
                    id="first-name"
                    name="firstName"
                    autoComplete="given-name"
                    placeholder="Введите имя"
                    value={form.firstName}
                    onChange={(event) =>
                      updateForm('firstName', event.target.value)
                    }
                    className={fieldClassName}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Фамилия</Label>
                  <Input
                    id="last-name"
                    name="lastName"
                    autoComplete="family-name"
                    placeholder="Введите фамилию"
                    value={form.lastName}
                    onChange={(event) =>
                      updateForm('lastName', event.target.value)
                    }
                    className={fieldClassName}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="email">Электронная почта</Label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                      aria-hidden
                    />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="Введите электронную почту"
                      value={form.email}
                      disabled
                      className={`${fieldClassName} pl-10`}
                    />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Изменение email пока не поддерживается backend.
                  </p>
                </div>
                {profileMessage ? (
                  <p
                    className={`${messageTextClassName} sm:col-span-2`}
                    role="status"
                  >
                    {profileMessage}
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="justify-end border-t border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
                <Button
                  type="submit"
                  disabled={profileMutation.isPending}
                  className={primaryButtonClassName}
                >
                  {profileMutation.isPending
                    ? 'Сохраняем…'
                    : 'Сохранить изменения'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className={cardClassName}>
            <CardHeader className={cardHeaderClassName}>
              <div className="flex items-start gap-3">
                <span className={iconChipClassName}>
                  <Target className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <CardTitle className={cardTitleClassName}>
                    Параметры подготовки
                  </CardTitle>
                  <CardDescription className={cardDescriptionClassName}>
                    Цель и формат, под которые будет строиться план.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form className="min-w-0" onSubmit={handleGoalSubmit}>
              <CardContent className="grid min-w-0 gap-5 p-5 sm:grid-cols-2 sm:p-6 [&>*]:min-w-0">
                <div className="grid gap-2">
                  <Label htmlFor="exam-format">Формат IELTS</Label>
                  <Select
                    name="examFormat"
                    value={form.examFormat}
                    onValueChange={(value) =>
                      updateForm(
                        'examFormat',
                        value as ProfileForm['examFormat'],
                      )
                    }
                  >
                    <SelectTrigger id="exam-format" className={selectClassName}>
                      <SelectValue placeholder="Выберите формат" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="general">General Training</SelectItem>
                    </SelectContent>
                  </Select>
                  {goalErrors.examFormat ? (
                    <p className={errorTextClassName} role="alert">
                      {goalErrors.examFormat}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="target-score">Целевой балл</Label>
                  <Select
                    name="targetScore"
                    value={form.targetScore}
                    onValueChange={(value) => updateForm('targetScore', value)}
                  >
                    <SelectTrigger
                      id="target-score"
                      className={selectClassName}
                    >
                      <SelectValue placeholder="Выберите балл" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {['5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5'].map(
                        (score) => (
                          <SelectItem key={score} value={score}>
                            {score}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  {goalErrors.targetScore ? (
                    <p className={errorTextClassName} role="alert">
                      {goalErrors.targetScore}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="exam-date">Планируемая дата экзамена</Label>
                  <div className="relative">
                    <CalendarDays
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                      aria-hidden
                    />
                    <Input
                      id="exam-date"
                      name="examDate"
                      type="date"
                      min={todayDateValue()}
                      value={form.examDate}
                      onChange={(event) =>
                        updateForm('examDate', event.target.value)
                      }
                      className={`${fieldClassName} pl-10`}
                    />
                  </div>
                  {goalErrors.examDate ? (
                    <p className={errorTextClassName} role="alert">
                      {goalErrors.examDate}
                    </p>
                  ) : null}
                </div>
                {goalMessage ? (
                  <p
                    className={`${messageTextClassName} sm:col-span-2`}
                    role="status"
                  >
                    {goalMessage}
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="justify-end border-t border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
                <Button
                  type="submit"
                  disabled={goalMutation.isPending}
                  className={primaryButtonClassName}
                >
                  {goalMutation.isPending
                    ? 'Сохраняем…'
                    : 'Сохранить параметры'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <aside className="grid min-w-0 gap-5 [&>*]:min-w-0">
          <Card className={cardClassName}>
            <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <span className={neutralIconChipClassName}>
                  <BellRing className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <CardTitle className={cardTitleClassName}>
                    Уведомления
                  </CardTitle>
                  <CardDescription className={cardDescriptionClassName}>
                    Выберите полезные напоминания.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <Label
                    htmlFor="lesson-reminders"
                    className="leading-5 text-slate-900 dark:text-slate-100"
                  >
                    Напоминания о занятиях
                  </Label>
                  <p className="mt-1 text-xs leading-5 text-slate-400 dark:text-slate-500">
                    Перед запланированной практикой.
                  </p>
                </div>
                <Switch
                  id="lesson-reminders"
                  aria-label="Напоминания о занятиях"
                  className="mt-0.5 data-[state=checked]:bg-blue-500"
                />
              </div>
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <Label
                    htmlFor="weekly-report"
                    className="leading-5 text-slate-900 dark:text-slate-100"
                  >
                    Еженедельный отчёт
                  </Label>
                  <p className="mt-1 text-xs leading-5 text-slate-400 dark:text-slate-500">
                    Краткая сводка прогресса за неделю.
                  </p>
                </div>
                <Switch
                  id="weekly-report"
                  aria-label="Еженедельный отчёт"
                  className="mt-0.5 data-[state=checked]:bg-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader className="border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <span className={neutralIconChipClassName}>
                  <LockKeyhole className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <CardTitle className={cardTitleClassName}>
                    Безопасность
                  </CardTitle>
                  <CardDescription className={cardDescriptionClassName}>
                    Измените пароль аккаунта.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={preventSubmit}>
              <CardContent className="grid gap-4 p-5">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Текущий пароль</Label>
                  <Input
                    id="current-password"
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Введите текущий пароль"
                    className={fieldClassName}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">Новый пароль</Label>
                  <Input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Не менее 8 символов"
                    minLength={8}
                    className={fieldClassName}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                <Button
                  type="submit"
                  variant="outline"
                  className={`w-full ${outlineButtonClassName}`}
                >
                  Обновить пароль
                </Button>
              </CardFooter>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  )
}
