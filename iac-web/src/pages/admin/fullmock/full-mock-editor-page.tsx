import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorState, LoadingState } from '@/features/attempts/attempt-ui'
import {
  archiveFullMock,
  createFullMock,
  fullMockKeys,
  getFullMock,
  publishFullMock,
  updateFullMock,
} from '@/features/fullmock/api'
import type { FullMockInput, FullMockTest } from '@/features/fullmock/api'
import { listAdminListeningTests } from '@/features/listening/api'
import { listPublicReadingMaterials } from '@/features/reading/api'
import { listPublicSpeakingMaterials } from '@/features/speaking/api'
import { listPublicWritingMaterials } from '@/features/writing/api'
import { getErrorMessage } from '@/lib/api/client'

const emptyForm: FullMockInput = {
  slug: '',
  examType: 'academic',
  title: '',
  description: '',
  durationMinutes: 165,
  listeningMaterialId: '',
  readingMaterialId: '',
  writingMaterialId: '',
  speakingMaterialId: '',
}

export function FullMockEditorPage({ mockId }: { mockId?: string }) {
  const editing = Boolean(mockId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FullMockInput>(emptyForm)
  const mockQuery = useQuery({
    queryKey: fullMockKeys.adminTest(mockId ?? ''),
    enabled: editing,
    queryFn: ({ signal }) => getFullMock(mockId ?? '', signal),
  })
  const materialsQuery = useQuery({
    queryKey: ['admin', 'full-mocks', 'materials'],
    queryFn: async ({ signal }) => {
      const [listening, reading, writing, speaking] = await Promise.all([
        listAdminListeningTests(signal),
        listPublicReadingMaterials(signal),
        listPublicWritingMaterials(signal),
        listPublicSpeakingMaterials(signal),
      ])
      return {
        listening: listening.items.filter(
          (item) => item.status === 'PUBLISHED',
        ),
        reading: reading.items,
        writing: writing.items,
        speaking: speaking.items,
      }
    },
  })
  useEffect(() => {
    if (mockQuery.data) setForm(toInput(mockQuery.data))
  }, [mockQuery.data])
  const save = useMutation({
    mutationFn: () =>
      editing
        ? updateFullMock(mockId ?? '', {
            ...form,
            revision: mockQuery.data?.revision,
          })
        : createFullMock(form),
    onSuccess: async (mock) => {
      await queryClient.invalidateQueries({ queryKey: fullMockKeys.adminTests })
      await queryClient.invalidateQueries({
        queryKey: fullMockKeys.adminTest(mock.id),
      })
      if (!editing)
        await navigate({
          to: '/admin/full-mocks/$mockId',
          params: { mockId: mock.id },
        })
    },
  })
  const publish = useMutation({
    mutationFn: () =>
      publishFullMock(mockId ?? '', mockQuery.data?.revision ?? 0),
    onSuccess: (mock) => {
      queryClient.setQueryData(fullMockKeys.adminTest(mock.id), mock)
      void queryClient.invalidateQueries({ queryKey: fullMockKeys.adminTests })
    },
  })
  const archive = useMutation({
    mutationFn: () =>
      archiveFullMock(mockId ?? '', mockQuery.data?.revision ?? 0),
    onSuccess: (mock) => {
      queryClient.setQueryData(fullMockKeys.adminTest(mock.id), mock)
      void queryClient.invalidateQueries({ queryKey: fullMockKeys.adminTests })
    },
  })
  if (mockQuery.isPending || materialsQuery.isPending)
    return <LoadingState label="Загружаем редактор…" />
  if (mockQuery.isError || materialsQuery.isError)
    return (
      <ErrorState
        title="Не удалось открыть редактор"
        message={getErrorMessage(mockQuery.error ?? materialsQuery.error)}
        onRetry={() => {
          void mockQuery.refetch()
          void materialsQuery.refetch()
        }}
      />
    )
  const materials = materialsQuery.data
  return (
    <div className="grid gap-5">
      <div>
        <Button asChild variant="link" className="h-auto p-0">
          <Link to="/admin/full-mocks">К Full Mock</Link>
        </Button>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
          {editing ? 'Редактор Full Mock' : 'Новый Full Mock'}
        </h1>
      </div>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Параметры экзамена</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Название">
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
              />
            </Field>
            <Field label="Slug">
              <Input
                value={form.slug}
                onChange={(event) =>
                  setForm({ ...form, slug: event.target.value })
                }
              />
            </Field>
            <Field label="Тип экзамена">
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={form.examType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    examType: event.target.value as FullMockInput['examType'],
                  })
                }
              >
                <option value="academic">Academic</option>
                <option value="general">General</option>
              </select>
            </Field>
            <Field label="Общий лимит, минуты">
              <Input
                type="number"
                min={60}
                max={300}
                value={form.durationMinutes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    durationMinutes: Number(event.target.value),
                  })
                }
              />
            </Field>
          </div>
          <Field label="Описание">
            <Input
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <MaterialSelect
              label="Listening"
              value={form.listeningMaterialId}
              onChange={(value) =>
                setForm({ ...form, listeningMaterialId: value })
              }
              items={materials.listening
                .filter((item) => item.examType === form.examType)
                .map((item) => ({
                  id: item.id,
                  title: item.title,
                }))}
            />
            <MaterialSelect
              label="Reading"
              value={form.readingMaterialId}
              onChange={(value) =>
                setForm({ ...form, readingMaterialId: value })
              }
              items={materials.reading
                .filter((item) => item.examType === form.examType)
                .map((item) => ({
                  id: item.id,
                  title: item.title,
                }))}
            />
            <MaterialSelect
              label="Writing"
              value={form.writingMaterialId}
              onChange={(value) =>
                setForm({ ...form, writingMaterialId: value })
              }
              items={materials.writing
                .filter((item) => item.examType === form.examType)
                .map((item) => ({
                  id: item.id,
                  title: item.title,
                }))}
            />
            <MaterialSelect
              label="Speaking"
              value={form.speakingMaterialId}
              onChange={(value) =>
                setForm({ ...form, speakingMaterialId: value })
              }
              items={materials.speaking
                .filter((item) => item.examType === form.examType)
                .map((item) => ({
                  id: item.id,
                  title: item.title,
                }))}
            />
          </div>
          {save.isError || publish.isError || archive.isError ? (
            <p className="text-sm text-[#e23b3b]">
              {getErrorMessage(save.error ?? publish.error ?? archive.error)}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? 'Сохраняем…' : 'Сохранить'}
            </Button>
            {editing ? (
              <Button
                variant="outline"
                disabled={publish.isPending}
                onClick={() => publish.mutate()}
              >
                {publish.isPending ? 'Публикуем…' : 'Опубликовать'}
              </Button>
            ) : null}
            {editing ? (
              <Button
                variant="outline"
                disabled={archive.isPending}
                onClick={() => {
                  if (window.confirm('Архивировать этот Full Mock?')) {
                    archive.mutate()
                  }
                }}
              >
                {archive.isPending ? 'Архивируем…' : 'Архивировать'}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </label>
  )
}
function MaterialSelect({
  label,
  value,
  onChange,
  items,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  items: { id: string; title: string }[]
}) {
  return (
    <Field label={label}>
      <select
        className="h-10 rounded-md border bg-background px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Выберите опубликованный материал</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
    </Field>
  )
}
function toInput(mock: FullMockTest): FullMockInput {
  return {
    slug: mock.slug,
    examType: mock.examType,
    title: mock.title,
    description: mock.description,
    durationMinutes: mock.durationMinutes,
    listeningMaterialId: mock.listeningMaterialId,
    readingMaterialId: mock.readingMaterialId,
    writingMaterialId: mock.writingMaterialId,
    speakingMaterialId: mock.speakingMaterialId,
    revision: mock.revision,
  }
}
