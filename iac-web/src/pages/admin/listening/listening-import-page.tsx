import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Clipboard, FileInput, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  importListeningTest,
  listeningKeys,
  parseListeningImport,
} from '@/features/listening/api'
import { getErrorMessage } from '@/lib/api/client'

import type {
  ListeningImportIssue,
  ListeningImportResult,
} from '@/features/listening/api'

const template = `# IELTS_LISTENING_IMPORT_V1
title: Listening test title
exam_type: ACADEMIC
duration_minutes: 40

## PART 1
title: Conversation
### GROUP 1
range: 1-1
type: FORM_COMPLETION
answer_limit: ONE_WORD_OR_A_NUMBER
instruction:
Complete the form.
1. Customer name: {{1}}

## ANSWERS
1: Morgan

## EXPLANATIONS
### 1
Optional explanation.`

const example = `# IELTS_LISTENING_IMPORT_V1
title: Synthetic Listening Demo
exam_type: ACADEMIC
duration_minutes: 40

## PART 1
title: Cookery class enquiry
### GROUP 1
range: 1-2
type: FORM_COMPLETION
answer_limit: ONE_WORD_OR_A_NUMBER
instruction:
Complete the form.
1. Class focus: how to {{1}} seasonal products
2. Returning clients receive a {{2}} discount

## PART 2
title: Traffic changes
### GROUP 2
range: 3-3
type: MULTIPLE_CHOICE
instruction:
Choose the correct letter.
3. Why are changes needed?
A: Accidents have risen
B: Traffic has increased
C: Vehicle types have changed

### GROUP 3
range: 4-5
type: MAP_LABELLING
instruction:
Choose the correct map label.
options:
A: North road
B: Market square
C: Station entrance
4. New traffic lights
5. Pedestrian crossing

## ANSWERS
1: choose
2: 20%
3: B
4: A
5: C

## EXPLANATIONS
### 3
The speaker says traffic volume has increased.`

export function ListeningImportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [source, setSource] = useState('')
  const [result, setResult] = useState<ListeningImportResult | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const parseMutation = useMutation({
    mutationFn: () => parseListeningImport(source, 'academic'),
    onSuccess: setResult,
  })
  const importMutation = useMutation({
    mutationFn: () => importListeningTest(result!.test),
    onSuccess: async (test) => {
      await queryClient.invalidateQueries({
        queryKey: listeningKeys.adminTests,
      })
      await navigate({
        to: '/admin/listening/tests/$testId',
        params: { testId: test.id },
        replace: true,
      })
    },
  })
  const parse = async () => {
    setMessage(null)
    try {
      await parseMutation.mutateAsync()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Button asChild variant="link" className="h-auto p-0">
            <Link to="/admin/listening/tests">
              <ArrowLeft aria-hidden /> К тестам
            </Link>
          </Button>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            Импорт Listening v1
          </h1>
          <p className="mt-2 text-sm text-[#69696d]">
            Импорт создаёт draft. Аудио и изображения можно прикрепить в
            конструкторе.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => void navigator.clipboard.writeText(template)}
          >
            <Clipboard aria-hidden /> Скопировать шаблон
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSource(example)
              setResult(null)
            }}
          >
            Вставить пример
          </Button>
        </div>
      </div>
      {message ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
          {message}
        </div>
      ) : null}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Документ</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Textarea
            rows={28}
            className="font-mono"
            value={source}
            onChange={(e) => {
              setSource(e.target.value)
              setResult(null)
            }}
            placeholder="# IELTS_LISTENING_IMPORT_V1"
          />
          <div className="flex justify-end">
            <Button
              className="bg-[#e23b3b] hover:bg-[#c92f2f]"
              onClick={() => void parse()}
              disabled={!source.trim() || parseMutation.isPending}
            >
              <FileInput aria-hidden /> Распознать
            </Button>
          </div>
        </CardContent>
      </Card>
      {result ? (
        <Preview
          result={result}
          pending={importMutation.isPending}
          onImport={() =>
            void importMutation
              .mutateAsync()
              .catch((error) => setMessage(getErrorMessage(error)))
          }
        />
      ) : null}
    </div>
  )
}

function Preview({
  result,
  pending,
  onImport,
}: {
  result: ListeningImportResult
  pending: boolean
  onImport: () => void
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex gap-2">
          <CardTitle>{result.test.title}</CardTitle>
          <Badge variant="outline">{result.formatVersion}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {result.test.parts.map((part) => (
          <div key={part.position} className="rounded-xl border p-4">
            <h3 className="font-semibold">
              Part {part.position}: {part.title}
            </h3>
            <p className="mt-1 text-xs text-[#69696d]">
              {part.audioAssetId
                ? '✓ audio attached'
                : '○ audio добавляется после импорта'}
            </p>
            <div className="mt-3 grid gap-2">
              {part.groups.map((group) => (
                <div
                  key={group.position}
                  className="rounded-lg bg-[#f7f7f5] p-3 text-sm"
                >
                  <strong>
                    Group {group.position} · {group.type.replaceAll('_', ' ')}
                  </strong>
                  <p className="mt-1 text-[#69696d]">
                    ✓ {group.questions.length} questions · ✓{' '}
                    {
                      group.questions.filter(
                        (q) => Object.keys(q.answer).length > 0,
                      ).length
                    }{' '}
                    answers · ○{' '}
                    {group.questions.filter((q) => q.explanation).length}{' '}
                    explanations
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
        <Issues title="Ошибки" items={result.errors} tone="red" />
        <Issues title="Предупреждения" items={result.warnings} tone="amber" />
        <Issues title="Информация" items={result.info} tone="blue" />
        <div className="flex justify-end">
          <Button
            className="bg-[#e23b3b] hover:bg-[#c92f2f]"
            disabled={result.errors.length > 0 || pending}
            onClick={onImport}
          >
            {pending ? 'Импортируем…' : 'Создать DRAFT'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
function Issues({
  title,
  items,
  tone,
}: {
  title: string
  items: ListeningImportIssue[]
  tone: 'red' | 'amber' | 'blue'
}) {
  if (!items.length) return null
  const classes = {
    red: 'border-red-200 bg-red-50',
    amber: 'border-amber-200 bg-amber-50',
    blue: 'border-blue-200 bg-blue-50',
  }
  return (
    <div className={`rounded-lg border p-3 ${classes[tone]}`}>
      <strong className="flex items-center gap-2">
        <TriangleAlert className="size-4" aria-hidden />
        {title}: {items.length}
      </strong>
      <ul className="mt-2 text-sm">
        {items.map((item, index) => (
          <li key={`${item.code}-${index}`}>
            {item.message}
            {item.questionNumber ? ` · #${item.questionNumber}` : ''}
            {item.line ? ` · line ${item.line}` : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}
