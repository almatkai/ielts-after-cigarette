import { ArrowLeft, DocumentUpload, TickCircle } from 'iconsax-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  confirmSpeakingImport,
  parseSpeakingImport,
  speakingKeys,
} from '@/features/speaking/api'
import { getErrorMessage } from '@/lib/api/client'
import { useLanguage } from '@/lib/i18n'

const speakingImportTemplate = JSON.stringify(
  {
    format: 'IELTS_SPEAKING_IMPORT_V1',
    materials: [
      {
        slug: 'speaking-travel-and-holidays',
        examType: 'academic',
        difficulty: 'intermediate',
        title: 'IELTS Speaking: Travel and Holidays',
        description:
          'Full 3-part speaking practice on travel, vacations, and international tourism.',
        parts: [
          {
            type: 'part1',
            title: 'Introduction and Interview',
            instructions: 'Answer the examiner questions naturally.',
            preparationSeconds: 0,
            responseSeconds: 300,
            cueCard: [],
            questions: [
              { position: 1, prompt: 'Do you enjoy traveling?' },
              {
                position: 2,
                prompt: 'What kind of places do you prefer to visit?',
              },
              { position: 3, prompt: 'Who do you usually travel with?' },
            ],
          },
          {
            type: 'part2',
            title: 'Describe a memorable holiday',
            instructions: 'Speak for 1-2 minutes.',
            preparationSeconds: 60,
            responseSeconds: 120,
            cueCard: [
              'Where you went',
              'Who you went with',
              'What you did there',
              'And explain why this holiday was so memorable to you.',
            ],
            questions: [],
          },
          {
            type: 'part3',
            title: 'Discussion',
            instructions: 'Discuss broader issues.',
            preparationSeconds: 0,
            responseSeconds: 300,
            cueCard: [],
            questions: [
              {
                position: 1,
                prompt: 'How has tourism changed over the last few decades?',
              },
              {
                position: 2,
                prompt: 'What are the environmental impacts of mass tourism?',
              },
            ],
          },
        ],
      },
    ],
  },
  null,
  2,
)

export function SpeakingImportPage() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [source, setSource] = useState('')
  const parseMutation = useMutation({
    mutationFn: () => parseSpeakingImport(source),
  })
  const importMutation = useMutation({
    mutationFn: () =>
      confirmSpeakingImport(parseMutation.data?.materials ?? []),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: speakingKeys.adminMaterials,
      })
    },
  })
  const result = parseMutation.data
  const canImport = Boolean(
    result && result.errors.length === 0 && result.materials.length > 0,
  )

  return (
    <div className="grid max-w-4xl gap-5">
      <div>
        <Button
          asChild
          variant="link"
          className="h-auto p-0 text-muted-foreground"
        >
          <Link to="/admin/speaking/materials">
            <ArrowLeft aria-hidden />
            {t('К библиотеке')}
          </Link>
        </Button>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">
          {t('Импорт Speaking')}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('Вставьте объект формата')} <code>IELTS_SPEAKING_IMPORT_V1</code>.{' '}
          {t(
            'Импорт сначала проверяется, а материалы создаются только после подтверждения.',
          )}
        </p>
      </div>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t('JSON-источник')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Textarea
            value={source}
            onChange={(event) => setSource(event.target.value)}
            rows={20}
            className="font-mono text-xs"
            placeholder='{"format":"IELTS_SPEAKING_IMPORT_V1","materials":[...]}'
            aria-label={t('JSON для импорта Speaking')}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setSource(speakingImportTemplate)}
          >
            {t('Вставить пример шаблона')}
          </Button>
          <Button
            type="button"
            disabled={!source.trim() || parseMutation.isPending}
            onClick={() => parseMutation.mutate()}
          >
            <DocumentUpload aria-hidden />
            {parseMutation.isPending ? t('Проверяем…') : t('Проверить импорт')}
          </Button>
          {parseMutation.isError ? (
            <p className="text-sm text-destructive">
              {getErrorMessage(parseMutation.error)}
            </p>
          ) : null}
        </CardContent>
      </Card>
      {result ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>{t('Результат проверки')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {result.errors.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-destructive">
                {result.errors.map((error) => (
                  <li key={`${error.item}-${error.code}-${error.message}`}>
                    {error.item ? `${t('Материал')} ${error.item}: ` : ''}
                    {error.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-sm text-success">
                <TickCircle className="size-4" aria-hidden />
                {t('Готово к импорту: {count} материалов.').replace(
                  '{count}',
                  String(result.materials.length),
                )}
              </p>
            )}
            <Button
              type="button"
              disabled={!canImport || importMutation.isPending}
              onClick={() => importMutation.mutate()}
            >
              {importMutation.isPending
                ? t('Импортируем…')
                : t('Подтвердить импорт')}
            </Button>
            {importMutation.isError ? (
              <p className="text-sm text-destructive">
                {getErrorMessage(importMutation.error)}
              </p>
            ) : null}
            {importMutation.isSuccess ? (
              <p className="text-sm text-success">{t('Импорт завершён.')}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
