import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft2, Lock1, Logout, Trash } from 'iconsax-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { authStore, useAuth } from '@/features/auth/auth-store'
import {
  changePassword,
  deleteUser,
  getUser,
  getUserAttempt,
  listUserAttempts,
  revokeSessions,
  updateUser,
  userKey,
  usersKey,
} from '@/features/admin/users-api'
import type { UserDetail, UserUpdate } from '@/features/admin/users-api'
import { getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'
import {
  date,
  Pagination,
  QueryError,
  roles,
  statusText,
  UserAvatar,
} from './shared'

export function UserPage({ userId }: { userId: string }) {
  const { t } = useLanguage()
  const query = useQuery({
    queryKey: userKey(userId),
    queryFn: ({ signal }) => getUser(userId, signal),
  })
  if (query.isPending)
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {t('Загрузка…')}
      </p>
    )
  if (query.isError)
    return (
      <QueryError
        message={t(getErrorMessage(query.error))}
        retry={() => void query.refetch()}
      />
    )
  return <UserProfile user={query.data} />
}
function UserProfile({ user }: { user: UserDetail }) {
  const auth = useAuth()
  const self = auth.user?.id === user.id
  const navigate = useNavigate()
  const client = useQueryClient()
  const { t } = useLanguage()
  const [tab, setTab] = useState<'profile' | 'tests' | 'activity'>('profile')
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState<
    'password' | 'delete' | 'sessions' | null
  >(null)
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [form, setForm] = useState<UserUpdate>({
    displayName: user.displayName,
    email: user.email,
    phone: user.phone ?? '',
    role: user.role,
    permissions: user.permissions,
    blocked: user.blocked,
  })
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: usersKey })
  }
  const save = useMutation({
    mutationFn: () => updateUser(user.id, form),
    onSuccess: async (result) => {
      setNotice('Сохранено')
      await refresh()
      if (self)
        authStore.updateUser({
          ...auth.user!,
          displayName: result.displayName,
          email: result.email,
          phone: result.phone,
          permissions: result.permissions,
        })
    },
  })
  const action = useMutation({
    mutationFn: async () => {
      if (dialog === 'password') return changePassword(user.id, password)
      if (dialog === 'sessions') return revokeSessions(user.id)
      if (dialog === 'delete') return deleteUser(user.id, email)
    },
    onSuccess: async () => {
      const deleting = dialog === 'delete'
      setDialog(null)
      setPassword('')
      setEmail('')
      setNotice(deleting ? '' : 'Готово')
      await refresh()
      if (deleting) await navigate({ to: '/admin/users' })
    },
  })
  const open = (value: typeof dialog) => {
    action.reset()
    setPassword('')
    setEmail('')
    setDialog(value)
  }
  const busy = save.isPending || action.isPending
  return (
    <div className="grid gap-5">
      <Link
        to="/admin/users"
        className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground no-underline hover:text-foreground"
      >
        <ArrowLeft2 className="size-4" aria-hidden />
        {t('Пользователи')}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar user={user} />
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold tracking-normal">
              {user.displayName}
            </h1>
            <p className="mt-1 break-all text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs ${user.blocked ? 'bg-destructive-soft text-destructive' : 'bg-primary-soft text-primary-hover'}`}
        >
          {user.blocked ? t('Заблокирован') : t(roles[user.role])}
        </span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card">
        <Metric value={String(user.completedTests)} label={t('Завершено')} />
        <Metric value={String(user.unfinishedTests)} label={t('В процессе')} />
        <Metric
          value={user.targetBand?.toFixed(1) ?? '—'}
          label={t('Целевой балл')}
        />
      </div>
      <nav
        aria-label={t('Данные пользователя')}
        className="flex gap-6 border-b border-border"
      >
        {(
          [
            ['profile', t('Профиль')],
            ['tests', t('Тесты')],
            ['activity', t('Активность')],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => {
              setTab(value)
              setNotice('')
            }}
            aria-current={tab === value ? 'page' : undefined}
            className={`border-b-2 px-1 pb-3 text-sm ${tab === value ? 'border-primary font-semibold text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === 'profile' && (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setNotice('')
              save.mutate()
            }}
            className="grid gap-5 rounded-xl border border-border bg-card p-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('Имя')} id="displayName">
                <Input
                  id="displayName"
                  required
                  maxLength={100}
                  value={form.displayName}
                  onChange={(e) =>
                    setForm({ ...form, displayName: e.target.value })
                  }
                />
              </Field>
              <Field label={t('Роль аккаунта')} id="userRole">
                <select
                  id="userRole"
                  disabled={self}
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value as UserUpdate['role'],
                    })
                  }
                  className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
                >
                  {Object.entries(roles).map(([value, label]) => (
                    <option value={value} key={value}>
                      {t(label)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Email" id="userEmail">
                <Input
                  id="userEmail"
                  type="email"
                  required
                  maxLength={254}
                  disabled={self}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label={t('Телефон')} id="userPhone">
                <Input
                  id="userPhone"
                  type="tel"
                  placeholder="+7…"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
            </div>
            <fieldset className="grid gap-3 border-t border-border pt-4">
              <legend className="px-1 text-sm font-medium">
                {t('Доступы')}
              </legend>
              <p className="text-xs leading-5 text-muted-foreground">
                {form.role === 'ADMIN'
                  ? t('Администратору доступны все разделы.')
                  : t(
                      'Выберите один или оба доступа. Они дополняют роль аккаунта; остальные разделы админки останутся закрыты.',
                    )}
              </p>
              <AccessCheckbox
                checked={
                  form.role === 'ADMIN' ||
                  form.permissions.includes('BLOG_MODERATOR')
                }
                disabled={form.role === 'ADMIN' || self}
                onChange={(checked) =>
                  setForm({
                    ...form,
                    permissions: checked
                      ? [
                          ...new Set([
                            ...form.permissions,
                            'BLOG_MODERATOR' as const,
                          ]),
                        ]
                      : form.permissions.filter(
                          (permission) => permission !== 'BLOG_MODERATOR',
                        ),
                  })
                }
                title={t('Авторы и блог')}
                description={t('Заявки авторов, проверка и публикация статей')}
              />
              <AccessCheckbox
                checked={
                  form.role === 'ADMIN' ||
                  form.permissions.includes('CONTENT_EDITOR')
                }
                disabled={form.role === 'ADMIN' || self}
                onChange={(checked) =>
                  setForm({
                    ...form,
                    permissions: checked
                      ? [
                          ...new Set([
                            ...form.permissions,
                            'CONTENT_EDITOR' as const,
                          ]),
                        ]
                      : form.permissions.filter(
                          (permission) => permission !== 'CONTENT_EDITOR',
                        ),
                  })
                }
                title={t('Учебные материалы и тесты')}
                description={t(
                  'Создание, проверка и публикация Reading, Listening, Writing, Speaking; архив Full Mock',
                )}
              />
            </fieldset>
            <label className="flex w-fit items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={self}
                checked={form.blocked}
                onChange={(e) =>
                  setForm({ ...form, blocked: e.target.checked })
                }
                className="size-4 accent-primary"
              />
              {t('Заблокировать аккаунт')}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={busy} type="submit">
                {save.isPending ? t('Сохранение…') : t('Сохранить')}
              </Button>
              {notice && (
                <span role="status" className="text-sm text-success">
                  {t(notice)}
                </span>
              )}
              {save.isError && (
                <p role="alert" className="text-sm text-destructive">
                  {t(getErrorMessage(save.error))}
                </p>
              )}
            </div>
            <dl className="grid gap-x-5 gap-y-4 border-t border-border pt-5 text-sm grid-cols-2">
              <Info
                label={t('Регистрация')}
                value={date(user.createdAt, true)}
              />
              <Info
                label={t('Статус')}
                value={t(statusText[user.status] ?? user.status)}
              />
              <Info
                label={t('Текущий балл')}
                value={user.currentBand?.toFixed(1)}
              />
              <Info label={t('Экзамен')} value={date(user.examDate)} />
              <Info
                label={t('Тип экзамена')}
                value={
                  user.examType === 'academic'
                    ? 'Academic'
                    : user.examType === 'general'
                      ? 'General'
                      : null
                }
              />
              <Info label={t('Часовой пояс')} value={user.timezone} />
              <Info
                label="Google"
                value={
                  user.googleConnected ? t('Подключён') : t('Не подключён')
                }
              />
              <Info
                label={t('Пароль')}
                value={user.hasPassword ? t('Установлен') : t('Не установлен')}
              />
              <Info label={t('Источник')} value={user.source} />
              <Info label={t('Реферальный код')} value={user.referralCode} />
              <Info label={t('Пригласил')} value={user.referredByCode} />
              <Info
                label={t('Согласие с условиями')}
                value={date(user.termsAcceptedAt, true)}
              />
              <Info label={t('Изменён')} value={date(user.updatedAt, true)} />
              <Info label="ID" value={user.id} />
            </dl>
          </form>
          <div className="grid gap-5">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold">{t('Доступ')}</h2>
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  disabled={self || busy}
                  onClick={() => open('password')}
                  className="justify-start border-border"
                >
                  <Lock1 aria-hidden />
                  {t('Сменить пароль')}
                </Button>
                <Button
                  variant="outline"
                  disabled={self || busy}
                  onClick={() => open('sessions')}
                  className="justify-start border-border"
                >
                  <Logout aria-hidden />
                  {t('Завершить сессии')}
                </Button>
                <Button
                  variant="ghost"
                  disabled={self || busy}
                  onClick={() => open('delete')}
                  className="justify-start text-destructive hover:bg-destructive-soft hover:text-destructive"
                >
                  <Trash aria-hidden />
                  {t('Удалить аккаунт')}
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-4 text-sm font-semibold">{t('Навыки')}</h2>
              <div className="grid gap-4">
                {user.skills.map((skill) => (
                  <div
                    key={skill.skill}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <div>
                      <p className="capitalize">{skill.skill}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {skill.completedTasks} {t('заданий')}
                        {skill.accuracy != null
                          ? ` · ${Math.round(skill.accuracy)}%`
                          : ''}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums text-primary">
                      {skill.band?.toFixed(1) ?? '—'}
                    </span>
                  </div>
                ))}
                {!user.skills.length && (
                  <p className="text-sm text-muted-foreground">
                    {t('Нет результатов')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {tab === 'tests' && <UserTests id={user.id} />}
      {tab === 'activity' && (
        <div className="grid gap-5">
          <dl className="flex flex-wrap gap-8 rounded-xl border border-border bg-card p-5 text-sm">
            <Info
              label={t('Последняя активность')}
              value={date(user.lastActiveAt, true)}
            />
            <Info
              label={t('Активных дней')}
              value={String(user.activityDays.length)}
            />
          </dl>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold">{t('Дни занятий')}</h2>
            <div className="flex flex-wrap gap-2">
              {user.activityDays.map((day) => (
                <span
                  key={day}
                  className="rounded-md bg-muted px-2.5 py-1.5 text-xs"
                >
                  {date(day)}
                </span>
              ))}
              {!user.activityDays.length && (
                <p className="text-sm text-muted-foreground">
                  {t('Активности пока нет')}
                </p>
              )}
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[600px] text-left text-sm">
              <caption className="px-5 pt-5 pb-3 text-left font-semibold">
                {t('Последние входы')}
              </caption>
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">{t('Дата')}</th>
                  <th className="px-5 py-3 font-medium">{t('Устройство')}</th>
                  <th className="px-5 py-3 font-medium">IP</th>
                  <th className="px-5 py-3 font-medium">{t('Сессия')}</th>
                </tr>
              </thead>
              <tbody>
                {user.sessions.map((session, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-5 py-4 text-xs">
                      {date(session.createdAt, true)}
                    </td>
                    <td className="max-w-64 px-5 py-4 text-xs text-muted-foreground">
                      <p
                        className="line-clamp-2 break-all"
                        title={session.userAgent ?? ''}
                      >
                        {session.userAgent ?? '—'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {session.ipAddress ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {session.revokedAt ||
                      new Date(session.expiresAt) < new Date()
                        ? t('Завершена')
                        : t('Активна')}
                    </td>
                  </tr>
                ))}
                {!user.sessions.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-muted-foreground"
                    >
                      {t('Входов пока нет')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Dialog
        open={dialog !== null}
        onOpenChange={(value) => {
          if (!value && !action.isPending) setDialog(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog === 'delete'
                ? t('Удалить аккаунт?')
                : dialog === 'password'
                  ? t('Сменить пароль')
                  : t('Завершить сессии?')}
            </DialogTitle>
            <DialogDescription>
              {dialog === 'delete'
                ? t(
                    'Профиль, тесты, записи и статьи будут удалены без восстановления.',
                  )
                : dialog === 'password'
                  ? t('Все сессии будут завершены.')
                  : t('Пользователю потребуется войти снова.')}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              action.mutate()
            }}
            className="grid gap-4"
          >
            {dialog === 'password' && (
              <Field label={t('Новый пароль')} id="newPassword">
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
            )}
            {dialog === 'delete' && (
              <Field label={`${t('Введите')} ${user.email}`} id="confirmEmail">
                <Input
                  id="confirmEmail"
                  type="email"
                  autoComplete="off"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            )}
            {action.isError && (
              <p role="alert" className="text-sm text-destructive">
                {t(getErrorMessage(action.error))}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-border"
                disabled={action.isPending}
                onClick={() => setDialog(null)}
              >
                {t('Отмена')}
              </Button>
              <Button
                type="submit"
                variant={dialog === 'delete' ? 'destructive' : 'default'}
                disabled={
                  action.isPending ||
                  (dialog === 'delete' &&
                    email.trim().toLowerCase() !== user.email)
                }
              >
                {action.isPending
                  ? t('Подождите…')
                  : dialog === 'delete'
                    ? t('Удалить навсегда')
                    : dialog === 'password'
                      ? t('Сменить пароль')
                      : t('Завершить')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
function Field({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

function AccessCheckbox({
  checked,
  disabled,
  onChange,
  title,
  description,
}: {
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
  title: string
  description: string
}) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-primary"
      />
      <span>
        <span className="block font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  )
}
function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm">{value || '—'}</dd>
    </div>
  )
}
function UserTests({ id }: { id: string }) {
  const { t } = useLanguage()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const query = useQuery({
    queryKey: [...userKey(id), 'attempts', page],
    queryFn: ({ signal }) => listUserAttempts(id, page, signal),
  })
  const detail = useQuery({
    queryKey: [...userKey(id), 'attempt', selected],
    queryFn: ({ signal }) => getUserAttempt(id, selected!, signal),
    enabled: !!selected,
  })
  return (
    <div className="grid gap-4">
      {query.isError ? (
        <QueryError
          message={t(getErrorMessage(query.error))}
          retry={() => void query.refetch()}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-border bg-background text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">{t('Тест')}</th>
                <th className="px-4 py-3 font-medium">{t('Статус')}</th>
                <th className="px-4 py-3 font-medium">{t('Балл')}</th>
                <th className="px-4 py-3 font-medium">{t('Начат')}</th>
              </tr>
            </thead>
            <tbody>
              {query.isPending ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {t('Загрузка…')}
                  </td>
                </tr>
              ) : (
                query.data.items.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-4">
                      <p className="mb-1 text-xs capitalize text-primary">
                        {attempt.skill}
                        {attempt.fullMock ? ' · Full Mock' : ''}
                      </p>
                      <button
                        onClick={() => setSelected(attempt.id)}
                        className="text-left font-medium hover:text-primary"
                      >
                        {attempt.title}
                      </button>
                    </td>
                    <td
                      className={`px-4 py-4 text-xs ${attempt.status === 'SUBMITTED' ? 'text-success' : 'text-muted-foreground'}`}
                    >
                      {t(statusText[attempt.status] ?? attempt.status)}
                    </td>
                    <td className="px-4 py-4 tabular-nums">
                      {attempt.band?.toFixed(1) ?? '—'}
                      {attempt.score != null && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {attempt.score}/{attempt.maxScore}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {date(attempt.startedAt, true)}
                      {attempt.submittedAt && (
                        <p className="mt-1">
                          {t('Завершён')} {date(attempt.submittedAt, true)}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
              {query.data?.items.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {t('Тестов пока нет')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {query.data && (
        <Pagination page={page} total={query.data.total} onChange={setPage} />
      )}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Ответы и оценка')}</DialogTitle>
            <DialogDescription>
              {t('Результаты выбранной попытки')}
            </DialogDescription>
          </DialogHeader>
          {detail.isPending ? (
            <p className="text-sm text-muted-foreground">{t('Загрузка…')}</p>
          ) : detail.isError ? (
            <QueryError
              message={t(getErrorMessage(detail.error))}
              retry={() => void detail.refetch()}
            />
          ) : (
            <div className="grid gap-4">
              {detail.data.answers.map((answer, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border p-4"
                >
                  <h3 className="mb-2 text-sm font-semibold">
                    {t('Ответ')} {index + 1}
                  </h3>
                  <AnswerValue value={answer} />
                </div>
              ))}
              {detail.data.writing != null && (
                <AnswerValue value={detail.data.writing} />
              )}{' '}
              {detail.data.speaking != null && (
                <AnswerValue value={detail.data.speaking} />
              )}{' '}
              {!detail.data.answers.length &&
                !detail.data.writing &&
                !detail.data.speaking && (
                  <p className="text-sm text-muted-foreground">
                    {t('Ответов пока нет')}
                  </p>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
const answerLabels: Record<string, string> = {
  prompt: 'Вопрос',
  answer: 'Ответ',
  value: 'Ответ',
  text: 'Текст',
  is_correct: 'Верно',
  points_awarded: 'Баллы',
  feedback: 'Обратная связь',
  overall_band: 'Общий балл',
  task_response_band: 'Раскрытие темы',
  coherence_band: 'Связность',
  lexical_resource_band: 'Лексика',
  grammar_band: 'Грамматика',
  fluency_band: 'Беглость',
  pronunciation_band: 'Произношение',
  task1: 'Task 1',
  task2: 'Task 2',
  optionId: 'Вариант',
  transcript: 'Расшифровка',
}
function AnswerValue({ value }: { value: unknown }) {
  const { t } = useLanguage()
  if (value == null) return null
  if (typeof value !== 'object')
    return (
      <p className="whitespace-pre-wrap break-words text-sm leading-6">
        {typeof value === 'boolean'
          ? value
            ? t('Да')
            : t('Нет')
          : String(value)}
      </p>
    )
  if (Array.isArray(value))
    return (
      <div className="grid gap-2">
        {value.map((v, i) => (
          <AnswerValue key={i} value={v} />
        ))}
      </div>
    )
  return (
    <dl className="grid gap-3">
      {Object.entries(value)
        .filter(
          ([key]) =>
            ![
              'attempt_id',
              'question_id',
              'model',
              'evaluated_at',
              'part_id',
            ].includes(key),
        )
        .map(([key, v]) => (
          <div key={key}>
            <dt className="text-xs text-muted-foreground">
              {t(answerLabels[key] ?? key.replaceAll('_', ' '))}
            </dt>
            <dd className="mt-1">
              <AnswerValue value={v} />
            </dd>
          </div>
        ))}
    </dl>
  )
}
