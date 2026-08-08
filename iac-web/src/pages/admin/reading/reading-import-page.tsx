import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Clipboard,
  FileInput,
  Info,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  adminQueryKeys,
  confirmReadingImport,
  parseReadingImport,
} from '@/features/admin/api'
import { getErrorMessage } from '@/lib/api/client'

import type {
  ReadingImportIssue,
  ReadingImportResult,
  ReadingMaterial,
  ReadingQuestionGroup,
} from '@/features/admin/api'

const template = `# IELTS_READING_IMPORT_V1
title: Test title
exam_type: ACADEMIC
duration_minutes: 60

## PASSAGE 1
title: Passage title
### TEXT
Paste passage text here. It must contain at least fifty characters.

### GROUP 1
range: 1-1
type: TRUE_FALSE_NOT_GIVEN
instruction:
Do the statements agree with the information?
1. The passage contains an example.

## ANSWERS
1: TRUE

## EXPLANATIONS
### 1
Optional multiline explanation.`

const example = `# IELTS_READING_IMPORT_V1
title: Synthetic Academic Reading
exam_type: ACADEMIC
duration_minutes: 60

## PASSAGE 1
title: A synthetic bird study
### TEXT
Researchers observed a fictional bird in a protected forest. This original passage exists only to demonstrate deterministic Reading import.

### GROUP 1
range: 1-2
type: TRUE_FALSE_NOT_GIVEN
instruction:
Do the statements agree with the information?
1. The bird was observed in a protected forest.
2. The passage describes a real IELTS examination.

### GROUP 2
range: 3-3
type: NOTE_COMPLETION
answer_limit: ONE_WORD_ONLY
instruction:
Complete the note.
3. Researchers observed a fictional {{3}}.

## PASSAGE 2
title: A synthetic research team
### TEXT
Alex, Blair and Casey form a fictional research team. This second original passage is long enough to pass validation safely.

### GROUP 3
range: 4-5
type: MATCHING_FEATURES
reuse_options: true
instruction:
Match each statement with the correct researcher.
options:
A: Alex
B: Blair
C: Casey
4. Recorded the first observation.
5. Checked the observation twice.

### GROUP 4
range: 6-6
type: MULTIPLE_CHOICE
instruction:
Choose the correct letter.
6. Why was this passage written?
A: To provide an import example
B: To reproduce a real test
C: To advertise a product
D: To test listening

## ANSWERS
1: TRUE
2: FALSE
3: bird
4: A
5: B
6: A

## EXPLANATIONS
### 1
The passage explicitly places the observation in a protected forest.
### 3
The missing word in the passage is “bird”.
### 6
The text is a synthetic import example.`

const completionTypes = new Set([
  'sentence_completion',
  'summary_completion',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'diagram_label_completion',
])

export function ReadingImportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [source, setSource] = useState('')
  const [examType, setExamType] =
    useState<ReadingMaterial['examType']>('academic')
  const [difficulty, setDifficulty] =
    useState<ReadingMaterial['difficulty']>('intermediate')
  const [result, setResult] = useState<ReadingImportResult | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const parseMutation = useMutation({
    mutationFn: () => parseReadingImport(source, examType, difficulty),
    onSuccess: (value) => {
      setResult(value)
      setMessage(null)
    },
  })
  const confirmMutation = useMutation({
    mutationFn: () =>
      confirmReadingImport(result!.passages.map((passage) => passage.material)),
    onSuccess: async ({ items }) => {
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.readingMaterials,
      })
      if (items[0]) {
        await navigate({
          to: '/admin/reading/materials/$materialId',
          params: { materialId: items[0].id },
          replace: true,
        })
      }
    },
  })

  const parse = async () => {
    setMessage(null)
    setResult(null)
    if (source.trim().length === 0) {
      setMessage('Вставьте документ IELTS Reading Import Format v1.')
      return
    }
    try {
      await parseMutation.mutateAsync()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const confirm = async () => {
    setMessage(null)
    try {
      await confirmMutation.mutateAsync()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(template)
      setMessage('Шаблон IELTS_READING_IMPORT_V1 скопирован.')
    } catch {
      setMessage(
        'Не удалось скопировать шаблон. Разрешите доступ к буферу обмена.',
      )
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-[#69696d]"
            onClick={() => void navigate({ to: '/admin/reading/materials' })}
          >
            <ArrowLeft aria-hidden /> К библиотеке
          </Button>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            Импорт IELTS Reading
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69696d]">
            Основной формат — IELTS Reading Import Format v1. Сначала проверьте
            preview, затем создайте обычные draft-материалы в существующем
            конструкторе.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void copyTemplate()}
          >
            <Clipboard aria-hidden /> Скопировать шаблон
          </Button>
          <Button
            type="button"
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
        <div
          role="alert"
          className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {message}
        </div>
      ) : null}

      <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none">
        <CardHeader className="border-b border-[#ededeb] p-5">
          <CardTitle className="text-base">Исходный документ</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="import-exam-type">Формат по умолчанию</Label>
              <select
                id="import-exam-type"
                value={examType}
                onChange={(event) =>
                  setExamType(event.target.value as ReadingMaterial['examType'])
                }
                className="h-11 rounded-[9px] border border-[#deded9] bg-white px-3"
              >
                <option value="academic">Academic</option>
                <option value="general">General Training</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="import-difficulty">Сложность</Label>
              <select
                id="import-difficulty"
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(
                    event.target.value as ReadingMaterial['difficulty'],
                  )
                }
                className="h-11 rounded-[9px] border border-[#deded9] bg-white px-3"
              >
                <option value="foundation">Foundation</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <Textarea
            value={source}
            onChange={(event) => {
              setSource(event.target.value)
              setResult(null)
            }}
            rows={24}
            className="font-mono text-sm leading-6"
            placeholder="# IELTS_READING_IMPORT_V1&#10;title: ..."
          />
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={parseMutation.isPending}
              onClick={() => void parse()}
              className="bg-[#e23b3b] hover:bg-[#c92f2f]"
            >
              <FileInput aria-hidden />
              {parseMutation.isPending ? 'Распознаём…' : 'Распознать'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result ? (
        <ImportPreview
          result={result}
          pending={confirmMutation.isPending}
          onBack={() => setResult(null)}
          onConfirm={() => void confirm()}
        />
      ) : null}
    </div>
  )
}

function ImportPreview({
  result,
  pending,
  onBack,
  onConfirm,
}: {
  result: ReadingImportResult
  pending: boolean
  onBack: () => void
  onConfirm: () => void
}) {
  const fatal = result.errors.length > 0
  return (
    <Card className="gap-0 rounded-[16px] border-[#e7e7e4] py-0 shadow-none">
      <CardHeader className="border-b border-[#ededeb] p-5">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{result.title}</CardTitle>
          <Badge variant="outline">{result.formatVersion}</Badge>
          {result.durationMinutes ? (
            <Badge variant="outline">{result.durationMinutes} мин.</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-5">
        {result.passages.map((passage) => (
          <div
            key={passage.number}
            className="rounded-[12px] border border-[#e7e7e4] p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">
                Passage {passage.number} — {passage.material.title}
              </h3>
              <Badge variant="outline">
                Text ✓ {passage.material.body.length} символов
              </Badge>
            </div>
            <div className="mt-4 grid gap-3">
              {passage.material.questionGroups.map((group, index) => (
                <GroupPreview
                  key={`${group.type}-${index}`}
                  group={group}
                  index={index}
                />
              ))}
            </div>
          </div>
        ))}
        <IssueList title="Ошибки" issues={result.errors} kind="error" />
        <IssueList
          title="Предупреждения"
          issues={result.warnings}
          kind="warning"
        />
        <IssueList title="Информация" issues={result.info} kind="info" />
        <div className="flex flex-wrap justify-end gap-2 border-t border-[#ededeb] pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Исправить документ
          </Button>
          <Button
            type="button"
            disabled={fatal || pending || result.passages.length === 0}
            onClick={onConfirm}
            className="bg-[#e23b3b] hover:bg-[#c92f2f]"
          >
            {pending
              ? 'Импортируем…'
              : `Импортировать ${result.passages.length} passage`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function GroupPreview({
  group,
  index,
}: {
  group: ReadingQuestionGroup
  index: number
}) {
  const numbers = group.questions
    .map((question) => question.content.number)
    .filter((number): number is number => typeof number === 'number')
  const first = numbers.length > 0 ? Math.min(...numbers) : null
  const last = numbers.length > 0 ? Math.max(...numbers) : null
  const answers = group.questions.filter(
    (question) => Object.keys(question.answer).length > 0,
  ).length
  const explanations = group.questions.filter(
    (question) => question.explanation.trim().length > 0,
  ).length
  const rule = group.questions[0]?.content.completionRule as
    { maxWords?: number; allowNumber?: boolean } | undefined
  return (
    <div className="rounded-[10px] bg-[#f7f7f5] p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2 font-semibold">
        <span>Group {index + 1}</span>
        {first !== null ? (
          <span>
            Questions {first}–{last}
          </span>
        ) : null}
        <Badge variant="outline">{group.type.replaceAll('_', ' ')}</Badge>
      </div>
      <div className="mt-2 grid gap-1 text-[#69696d] sm:grid-cols-2 lg:grid-cols-4">
        <span>✓ {group.questions.length} вопросов</span>
        <span>✓ {answers} ответов</span>
        <span>○ {explanations} explanations</span>
        {completionTypes.has(group.type) ? (
          <span>
            ✓ {group.questions.length} blanks
            {rule
              ? ` · до ${rule.maxWords} слов${rule.allowNumber ? ' и число' : ''}`
              : ''}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function IssueList({
  title,
  issues,
  kind,
}: {
  title: string
  issues: ReadingImportIssue[]
  kind: 'error' | 'warning' | 'info'
}) {
  if (issues.length === 0) return null
  const styles = {
    error: 'border-red-200 bg-red-50',
    warning: 'border-amber-200 bg-amber-50',
    info: 'border-blue-200 bg-blue-50',
  }
  const Icon = kind === 'info' ? Info : TriangleAlert
  return (
    <div className={`rounded-[10px] border p-4 ${styles[kind]}`}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4" aria-hidden />
        {title}: {issues.length}
      </h3>
      <ul className="mt-2 grid gap-1 text-sm">
        {issues.map((issue, index) => (
          <li key={`${issue.code}-${index}`}>
            {issue.message}
            {issue.questionNumber ? ` · вопрос ${issue.questionNumber}` : ''}
            {issue.line ? ` · строка ${issue.line}` : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}
