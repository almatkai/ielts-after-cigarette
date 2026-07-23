import { useRef } from 'react'
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

const fieldClassName =
  'h-11 min-w-0 max-w-full rounded-[9px] border-[#deded9] bg-white shadow-none focus-visible:border-[#e23b3b] focus-visible:ring-0'

const selectClassName =
  'h-11 w-full min-w-0 max-w-full rounded-[9px] border-[#deded9] bg-white shadow-none focus-visible:border-[#e23b3b] focus-visible:ring-0'

function preventSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault()
}

export function ProfilePage() {
  const photoInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1120px]">
      <Card className="mb-5 gap-0 overflow-hidden rounded-[16px] border-[#e7e7e4] py-0 shadow-[0_10px_36px_rgba(17,17,17,0.035)]">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="grid size-20 shrink-0 place-items-center rounded-full border border-[#e7e7e4] bg-[#f4f4f1] text-[#8d8d90] sm:size-24">
            <UserRound
              className="size-9 sm:size-11"
              strokeWidth={1.45}
              aria-hidden
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold tracking-[-0.02em] text-[#111111]">
              Фото профиля
            </h3>
            <p className="mt-1 max-w-lg text-sm leading-6 text-[#69696d]">
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
            className="h-10 shrink-0 rounded-[9px] border-[#deded9] bg-white px-4 shadow-none"
          >
            <Camera aria-hidden />
            Загрузить фото
          </Button>
        </CardContent>
      </Card>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
        <div className="grid min-w-0 gap-5 [&>*]:min-w-0">
          <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-[0_10px_36px_rgba(17,17,17,0.035)]">
            <CardHeader className="border-b border-[#ededeb] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#fff0f0] text-[#e23b3b]">
                  <UserRound className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <CardTitle className="text-base tracking-[-0.02em]">
                    Личные данные
                  </CardTitle>
                  <CardDescription className="mt-1 leading-5">
                    Основная информация вашего аккаунта.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form className="min-w-0" onSubmit={preventSubmit}>
              <CardContent className="grid min-w-0 gap-5 p-5 sm:grid-cols-2 sm:p-6 [&>*]:min-w-0">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">Имя</Label>
                  <Input
                    id="first-name"
                    name="firstName"
                    autoComplete="given-name"
                    placeholder="Введите имя"
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
                    className={fieldClassName}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="email">Электронная почта</Label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#9a9a9d]"
                      aria-hidden
                    />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="Введите электронную почту"
                      className={`${fieldClassName} pl-10`}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t border-[#ededeb] px-5 py-4 sm:px-6">
                <Button
                  type="submit"
                  className="h-10 rounded-[9px] bg-[#e23b3b] px-5 shadow-none hover:bg-[#c92f2f]"
                >
                  Сохранить изменения
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-[0_10px_36px_rgba(17,17,17,0.035)]">
            <CardHeader className="border-b border-[#ededeb] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#fff0f0] text-[#e23b3b]">
                  <Target className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <CardTitle className="text-base tracking-[-0.02em]">
                    Параметры подготовки
                  </CardTitle>
                  <CardDescription className="mt-1 leading-5">
                    Цель и формат, под которые будет строиться план.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form className="min-w-0" onSubmit={preventSubmit}>
              <CardContent className="grid min-w-0 gap-5 p-5 sm:grid-cols-2 sm:p-6 [&>*]:min-w-0">
                <div className="grid gap-2">
                  <Label htmlFor="exam-format">Формат IELTS</Label>
                  <Select name="examFormat">
                    <SelectTrigger id="exam-format" className={selectClassName}>
                      <SelectValue placeholder="Выберите формат" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="general">General Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="target-score">Целевой балл</Label>
                  <Select name="targetScore">
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
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="exam-date">Планируемая дата экзамена</Label>
                  <div className="relative">
                    <CalendarDays
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#9a9a9d]"
                      aria-hidden
                    />
                    <Input
                      id="exam-date"
                      name="examDate"
                      type="date"
                      className={`${fieldClassName} pl-10`}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t border-[#ededeb] px-5 py-4 sm:px-6">
                <Button
                  type="submit"
                  className="h-10 rounded-[9px] bg-[#e23b3b] px-5 shadow-none hover:bg-[#c92f2f]"
                >
                  Сохранить параметры
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <aside className="grid min-w-0 gap-5 [&>*]:min-w-0">
          <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-[0_10px_36px_rgba(17,17,17,0.035)]">
            <CardHeader className="border-b border-[#ededeb] p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#f4f4f1] text-[#69696d]">
                  <BellRing className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <CardTitle className="text-base tracking-[-0.02em]">
                    Уведомления
                  </CardTitle>
                  <CardDescription className="mt-1 leading-5">
                    Выберите полезные напоминания.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-[#ededeb] p-0">
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <Label
                    htmlFor="lesson-reminders"
                    className="leading-5 text-[#111111]"
                  >
                    Напоминания о занятиях
                  </Label>
                  <p className="mt-1 text-xs leading-5 text-[#808084]">
                    Перед запланированной практикой.
                  </p>
                </div>
                <Switch
                  id="lesson-reminders"
                  aria-label="Напоминания о занятиях"
                  className="mt-0.5 data-[state=checked]:bg-[#e23b3b]"
                />
              </div>
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <Label
                    htmlFor="weekly-report"
                    className="leading-5 text-[#111111]"
                  >
                    Еженедельный отчёт
                  </Label>
                  <p className="mt-1 text-xs leading-5 text-[#808084]">
                    Краткая сводка прогресса за неделю.
                  </p>
                </div>
                <Switch
                  id="weekly-report"
                  aria-label="Еженедельный отчёт"
                  className="mt-0.5 data-[state=checked]:bg-[#e23b3b]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-[0_10px_36px_rgba(17,17,17,0.035)]">
            <CardHeader className="border-b border-[#ededeb] p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#f4f4f1] text-[#69696d]">
                  <LockKeyhole className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <CardTitle className="text-base tracking-[-0.02em]">
                    Безопасность
                  </CardTitle>
                  <CardDescription className="mt-1 leading-5">
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
              <CardFooter className="border-t border-[#ededeb] px-5 py-4">
                <Button
                  type="submit"
                  variant="outline"
                  className="h-10 w-full rounded-[9px] border-[#deded9] bg-white shadow-none"
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
