import {
  Add,
  Copy,
  InfoCircle,
  Key,
  TickCircle,
  Trash,
  Warning2,
} from 'iconsax-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  adminQueryKeys,
  createMCPKey,
  listMCPKeys,
  revokeMCPKey,
} from '@/features/admin/api'
import { ApiError, getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'

import type { CreateMCPKeyResult, MCPKeyEntry } from '@/features/admin/api'

export function MCPKeysPage() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const [newKeyName, setNewKeyName] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [createdKey, setCreatedKey] = useState<CreateMCPKeyResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const keysQuery = useQuery({
    queryKey: adminQueryKeys.mcpKeys,
    queryFn: ({ signal }) => listMCPKeys(signal),
  })

  const addMutation = useMutation({
    mutationFn: (name: string) => createMCPKey(name),
    onSuccess: async (data) => {
      setCreatedKey(data)
      setNewKeyName('')
      setShowCreateForm(false)
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.mcpKeys,
      })
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeMCPKey(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.mcpKeys,
      })
    },
  })

  const busy = addMutation.isPending || revokeMutation.isPending

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = newKeyName.trim()
    if (!name) return
    setActionError(null)
    try {
      await addMutation.mutateAsync(name)
    } catch (error) {
      setActionError(getErrorMessage(error))
    }
  }

  const handleRevoke = async (key: MCPKeyEntry) => {
    if (
      !confirm(
        `${t('Вы уверены, что хотите отозвать ключ?')} "${key.name}". ${t('Это действие необратимо.')}`,
      )
    ) {
      return
    }
    setActionError(null)
    try {
      await revokeMutation.mutateAsync(key.id)
    } catch (error) {
      setActionError(getErrorMessage(error))
    }
  }

  const handleCopy = async () => {
    if (!createdKey) return
    try {
      await navigator.clipboard.writeText(createdKey.secretKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback
    }
  }

  const formatDate = (val?: string | null) => {
    if (!val) return t('Никогда')
    try {
      return new Date(val).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return val
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-primary normal-case">
            {t('Администрирование')}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal">
            {t('MCP API-ключи')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t(
              'API-ключи для подключения локального Antigravity CLI и агентов автоматизации. Позволяют спарсить и добавить любые тесты IELTS без ручной работы.',
            )}
          </p>
        </div>

        {!showCreateForm && !createdKey && (
          <Button
            type="button"
            className="self-start bg-primary hover:bg-primary-hover"
            onClick={() => setShowCreateForm(true)}
          >
            <Add aria-hidden />
            {t('Создать API-ключ')}
          </Button>
        )}
      </div>

      {showCreateForm && (
        <Card className="rounded-[10px] border-primary/40 bg-card p-5 shadow-none">
          <form
            onSubmit={(event) => void handleCreate(event)}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <Key className="size-5 text-primary" aria-hidden />
              <h2 className="text-base font-medium">
                {t('Новый MCP API-ключ')}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                'Укажите название, чтобы легко идентифицировать, где используется ключ (например, "Antigravity CLI MacBook").',
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Input
                type="text"
                required
                value={newKeyName}
                onChange={(event) => setNewKeyName(event.target.value)}
                placeholder={t('Название ключа')}
                className="h-10 w-full max-w-xs rounded-[9px] border-border bg-card shadow-none focus-visible:border-primary focus-visible:ring-0"
              />
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-hover"
                disabled={busy}
              >
                {t('Сгенерировать')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewKeyName('')
                }}
                disabled={busy}
              >
                {t('Отмена')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {createdKey && (
        <Card className="rounded-[10px] border-2 border-emerald-500/50 bg-emerald-500/5 p-5 shadow-none">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TickCircle className="size-5 text-emerald-500" aria-hidden />
                <h3 className="font-semibold text-foreground">
                  {t('API-ключ успешно создан:')} {createdKey.name}
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreatedKey(null)}
              >
                {t('Закрыть')}
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-amber-500 dark:text-amber-400">
              <Warning2 className="size-4 shrink-0" aria-hidden />
              <span>
                {t(
                  'Скопируйте ключ прямо сейчас! В целях безопасности секретный ключ показывается только один раз.',
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-[8px] border border-border bg-background px-3 py-2 font-mono text-sm select-all">
                {createdKey.secretKey}
              </code>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 gap-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                onClick={() => void handleCopy()}
              >
                {copied ? (
                  <>
                    <TickCircle className="size-4" aria-hidden />
                    {t('Скопировано!')}
                  </>
                ) : (
                  <>
                    <Copy className="size-4" aria-hidden />
                    {t('Копировать')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {t(actionError)}
        </p>
      ) : null}

      {keysQuery.isPending ? (
        <Card className="rounded-[10px] border-border shadow-none">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {t('Загружаем список MCP-ключей…')}
          </CardContent>
        </Card>
      ) : keysQuery.isError ? (
        <Card className="rounded-[10px] border-border shadow-none">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <Warning2 className="size-6 text-destructive" aria-hidden />
            <p className="mt-3 text-sm">
              {keysQuery.error instanceof ApiError &&
              keysQuery.error.status === 403
                ? t(
                    'Нет доступа: управление MCP-ключами доступно только администраторам платформы.',
                  )
                : t('Не удалось загрузить список MCP-ключей.')}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void keysQuery.refetch()}
            >
              {t('Повторить')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs normal-case tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t('Название')}</th>
                <th className="px-4 py-3 font-medium">{t('Префикс ключа')}</th>
                <th className="px-4 py-3 font-medium">{t('Создан')}</th>
                <th className="px-4 py-3 font-medium">{t('Использован')}</th>
                <th className="px-4 py-3 font-medium">{t('Статус')}</th>
                <th className="px-4 py-3 font-medium text-right" />
              </tr>
            </thead>
            <tbody>
              {keysQuery.data?.keys.map((k) => {
                const isRevoked = Boolean(k.revokedAt)
                return (
                  <tr
                    key={k.id}
                    className="border-b border-muted transition-colors hover:bg-muted/30 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-medium">
                        <Key
                          className="size-4 text-muted-foreground"
                          aria-hidden
                        />
                        {k.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        {k.keyPrefix}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(k.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(k.lastUsedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {isRevoked ? (
                        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          {t('Отозван')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {t('Активен')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isRevoked && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={busy}
                          onClick={() => void handleRevoke(k)}
                        >
                          <Trash className="size-4" aria-hidden />
                          {t('Отозвать')}
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {keysQuery.data?.keys.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {t(
                      'MCP-ключи еще не созданы. Нажмите "Создать API-ключ", чтобы подключить Antigravity CLI.',
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Guide section */}
      <Card className="rounded-[10px] border-border bg-card p-5 shadow-none">
        <div className="flex items-start gap-3">
          <InfoCircle className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div className="space-y-3 text-sm">
            <h3 className="font-semibold text-foreground">
              {t('Как подключить Antigravity CLI для автоматического добавления тестов')}
            </h3>
            <ol className="list-decimal space-y-2 pl-4 text-muted-foreground">
              <li>
                {t(
                  'Создайте API-ключ выше и скопируйте его секретное значение.',
                )}
              </li>
              <li>
                {t(
                  'Добавьте конфигурацию сервера в файл настройки MCP (например, ~/.antigravity/antigravity.json или конфиг агента):',
                )}
                <pre className="mt-1.5 overflow-x-auto rounded-[8px] bg-muted/70 p-3 font-mono text-xs text-foreground">
{`"mcpServers": {
  "iac": {
    "command": "node",
    "args": ["<путь_к_репозиторию>/mcp-server/index.mjs"],
    "env": {
      "IAC_API_URL": "${typeof window !== 'undefined' ? window.location.origin + '/api/v1' : 'https://ielts.yrys.academy/api/v1'}",
      "IAC_API_KEY": "iac_mcp_..."
    }
  }
}`}
                </pre>
              </li>
              <li>
                {t(
                  'Запустите Antigravity CLI и просто дайте команду агенту:',
                )}
                <div className="mt-1.5 rounded-[8px] border border-border bg-muted/30 p-2 font-mono text-xs text-foreground">
                  {t(
                    '"Агент, спарси тест по этой ссылке https://mini-ielts.com/... и загрузи его в IAC"',
                  )}
                </div>
              </li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  )
}
