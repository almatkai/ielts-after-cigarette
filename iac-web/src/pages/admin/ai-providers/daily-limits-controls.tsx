import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api/client'
import { getAILimits, saveAILimits } from '@/features/ai-limits/api'
import type { AILimits } from '@/features/ai-limits/api'

export function DailyLimitsControls() {
  const [limits, setLimits] = useState<AILimits>({
    assistantLimit: 100,
    guestAssistantLimit: 15,
    writingLimit: 25,
    speakingLimit: 25,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    getAILimits()
      .then((data) => {
        if (active) setLimits(data)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof ApiError ? err.message : 'Не удалось загрузить лимиты',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const updated = await saveAILimits({
        assistantLimit: Number(limits.assistantLimit),
        guestAssistantLimit: Number(limits.guestAssistantLimit),
        writingLimit: Number(limits.writingLimit),
        speakingLimit: Number(limits.speakingLimit),
      })
      setLimits(updated)
      setNotice('Лимиты успешно сохранены и уже действуют на сервере!')
      setTimeout(() => setNotice(''), 5000)
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Ошибка сохранения. Проверьте правильность значений.',
      )
    } finally {
      setSaving(false)
    }
  }

  const applyPreset = (
    assistant: number,
    guest: number,
    writing: number,
    speaking: number,
  ) => {
    setLimits((prev) => ({
      ...prev,
      assistantLimit: assistant,
      guestAssistantLimit: guest,
      writingLimit: writing,
      speakingLimit: speaking,
    }))
  }

  return (
    <section
      aria-label="Дневные лимиты AI"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-900">
              Дневные лимиты AI (квоты)
            </h2>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              Действуют моментально
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Ограничение расхода токенов на пользователя в сутки. При пиковой нагрузке
            можно снизить лимиты на лету без перезапуска сервера.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Быстрые пресеты:</span>
          <button
            type="button"
            onClick={() => applyPreset(100, 15, 25, 25)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Штатный
          </button>
          <button
            type="button"
            onClick={() => applyPreset(30, 5, 10, 10)}
            className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
          >
            Пик / Эконом
          </button>
          <button
            type="button"
            onClick={() => applyPreset(10, 0, 3, 3)}
            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100"
          >
            Экстренный
          </button>
        </div>
      </div>

      {notice && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="mt-5 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <Label htmlFor="assistantLimit" className="text-xs font-semibold text-slate-700">
              Юки (студент)
            </Label>
            <p className="text-[11px] text-slate-500">Сообщений в день на пользователя</p>
            <Input
              id="assistantLimit"
              type="number"
              min="0"
              disabled={loading || saving}
              value={limits.assistantLimit}
              onChange={(e) =>
                setLimits((prev) => ({
                  ...prev,
                  assistantLimit: Math.max(0, parseInt(e.target.value) || 0),
                }))
              }
              className="mt-2 bg-white"
            />
          </div>

          <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <Label htmlFor="guestAssistantLimit" className="text-xs font-semibold text-slate-700">
              Юки (гость без входа)
            </Label>
            <p className="text-[11px] text-slate-500">Сообщений в день на IP-адрес</p>
            <Input
              id="guestAssistantLimit"
              type="number"
              min="0"
              disabled={loading || saving}
              value={limits.guestAssistantLimit}
              onChange={(e) =>
                setLimits((prev) => ({
                  ...prev,
                  guestAssistantLimit: Math.max(0, parseInt(e.target.value) || 0),
                }))
              }
              className="mt-2 bg-white"
            />
          </div>

          <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <Label htmlFor="writingLimit" className="text-xs font-semibold text-slate-700">
              Writing (проверки)
            </Label>
            <p className="text-[11px] text-slate-500">Оценок эссе в день на студента</p>
            <Input
              id="writingLimit"
              type="number"
              min="0"
              disabled={loading || saving}
              value={limits.writingLimit}
              onChange={(e) =>
                setLimits((prev) => ({
                  ...prev,
                  writingLimit: Math.max(0, parseInt(e.target.value) || 0),
                }))
              }
              className="mt-2 bg-white"
            />
          </div>

          <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <Label htmlFor="speakingLimit" className="text-xs font-semibold text-slate-700">
              Speaking (проверки)
            </Label>
            <p className="text-[11px] text-slate-500">Оценок устной речи в день на студента</p>
            <Input
              id="speakingLimit"
              type="number"
              min="0"
              disabled={loading || saving}
              value={limits.speakingLimit}
              onChange={(e) =>
                setLimits((prev) => ({
                  ...prev,
                  speakingLimit: Math.max(0, parseInt(e.target.value) || 0),
                }))
              }
              className="mt-2 bg-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-400">
            {limits.updatedAt ? (
              <>Обновлено: {new Date(limits.updatedAt).toLocaleString('ru-RU')}</>
            ) : (
              <>Используются базовые значения системы</>
            )}
          </p>
          <Button type="submit" disabled={loading || saving}>
            {saving ? 'Сохранение...' : 'Сохранить лимиты'}
          </Button>
        </div>
      </form>
    </section>
  )
}
