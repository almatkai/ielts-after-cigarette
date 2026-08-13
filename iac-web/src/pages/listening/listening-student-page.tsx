import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Clock3 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  getListeningMediaBlob,
  getPublicListeningTest,
  listeningKeys,
} from '@/features/listening/api'

import type { PublicListeningGroup } from '@/features/listening/api'

export function ListeningStudentPage({ testId }: { testId: string }) {
  const query = useQuery({
    queryKey: listeningKeys.publicTest(testId),
    queryFn: ({ signal }) => getPublicListeningTest(testId, signal),
  })
  const [answers, setAnswers] = useState<Record<number, string>>({})
  if (query.isPending) return <p>Загружаем Listening…</p>
  if (!query.data) return <p>Тест недоступен.</p>
  const test = query.data
  return (
    <div className="grid gap-5">
      <div>
        <Button asChild variant="link" className="h-auto p-0">
          <Link to="/dashboard/listening">
            <ArrowLeft aria-hidden />К Listening
          </Link>
        </Button>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          {test.title}
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-[#69696d]">
          <Clock3 className="size-4" aria-hidden />
          {test.durationMinutes} минут · ответы сохраняются только на этой
          странице
        </p>
      </div>
      {test.parts.map((part) => (
        <Card key={part.position} className="shadow-none">
          <CardHeader>
            <CardTitle>
              Part {part.position}: {part.title}
            </CardTitle>
            {part.audioAssetId ? (
              <ProtectedAudio assetId={part.audioAssetId} />
            ) : (
              <p className="text-sm text-amber-700">
                Аудио ещё не прикреплено.
              </p>
            )}
          </CardHeader>
          <CardContent className="grid gap-5">
            {part.groups.map((group) => (
              <StudentGroup
                key={group.position}
                group={group}
                answers={answers}
                setAnswers={setAnswers}
              />
            ))}
          </CardContent>
        </Card>
      ))}
      <div className="rounded-xl border bg-white p-4 text-sm text-[#69696d]">
        Это preview режима студента. Проверка и submit будут подключены вместе с
        attempt engine; правильные ответы и explanations этот API не возвращает.
      </div>
    </div>
  )
}

function ProtectedAudio({ assetId }: { assetId: string }) {
  const query = useQuery({
    queryKey: ['listening', 'media', assetId],
    queryFn: () => getListeningMediaBlob(assetId),
  })
  const url = useMemo(
    () => (query.data ? URL.createObjectURL(query.data) : null),
    [query.data],
  )
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )
  if (query.isPending) return <span className="text-sm">Загружаем аудио…</span>
  return url ? (
    <audio className="mt-3 w-full" controls preload="metadata" src={url} />
  ) : (
    <span>Аудио недоступно</span>
  )
}

function ProtectedImage({ assetId }: { assetId: string }) {
  const query = useQuery({
    queryKey: ['listening', 'media', assetId],
    queryFn: () => getListeningMediaBlob(assetId),
  })
  const url = useMemo(
    () => (query.data ? URL.createObjectURL(query.data) : null),
    [query.data],
  )
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )
  return url ? (
    <img
      className="max-h-[520px] w-full rounded-lg border object-contain"
      src={url}
      alt="Схема задания Listening"
    />
  ) : null
}

function StudentGroup({
  group,
  answers,
  setAnswers,
}: {
  group: PublicListeningGroup
  answers: Record<number, string>
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>
}) {
  const shared = (group.config.options ?? []) as Array<{
    id: string
    text: string
  }>
  return (
    <section className="grid gap-3 rounded-xl border p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#e23b3b]">
          {group.type.replaceAll('_', ' ')}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm">{group.instructions}</p>
      </div>
      {group.imageAssetId ? (
        <ProtectedImage assetId={group.imageAssetId} />
      ) : null}
      {group.context ? (
        <div className="whitespace-pre-wrap rounded-lg bg-[#f7f7f5] p-4 text-sm">
          {group.context}
        </div>
      ) : null}
      <div className="grid gap-4">
        {group.questions.map((question) => {
          const options = (question.content.options ?? shared) as Array<{
            id: string
            text: string
          }>
          return (
            <div key={question.number} className="grid gap-2">
              <p className="font-medium">
                <span className="mr-2 text-[#e23b3b]">{question.number}.</span>
                {question.prompt.replace('{{answer}}', '_____')}
              </p>
              {options.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {options.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer gap-2 rounded-lg border bg-white p-3 text-sm"
                    >
                      <input
                        type="radio"
                        name={`q-${question.number}`}
                        value={option.id}
                        checked={answers[question.number] === option.id}
                        onChange={() =>
                          setAnswers((current) => ({
                            ...current,
                            [question.number]: option.id,
                          }))
                        }
                      />
                      <span>
                        <strong>{option.id}.</strong> {option.text}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <Input
                  value={answers[question.number] ?? ''}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.number]: event.target.value,
                    }))
                  }
                  placeholder="Ваш ответ"
                />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
