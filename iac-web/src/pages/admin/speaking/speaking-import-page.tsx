import {
  ArrowLeft,
  DocumentUpload,
  TickCircle,
} from 'iconsax-react'
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

const example = `{
  "format": "IELTS_SPEAKING_IMPORT_V1",
  "materials": [
    {
      "slug": "speaking-home-town-01",
      "examType": "academic",
      "difficulty": "intermediate",
      "title": "Home town",
      "description": "",
      "parts": []
    }
  ]
}`

export function SpeakingImportPage() {
  const queryClient = useQueryClient()
  const [source, setSource] = useState('')
  const parseMutation = useMutation({
    mutationFn: () => parseSpeakingImport(source),
  })
  const importMutation = useMutation({
    mutationFn: () => confirmSpeakingImport(parseMutation.data?.materials ?? []),
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
        <Button asChild variant="link" className="h-auto p-0 text-[#69696d]">
          <Link to="/admin/speaking/materials">
            <ArrowLeft aria-hidden />К библиотеке
          </Link>
        </Button>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Импорт Speaking
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#69696d]">
          Вставьте объект формата <code>IELTS_SPEAKING_IMPORT_V1</code>.
          Импорт сначала проверяется, а материалы создаются только после
          подтверждения.
        </p>
      </div>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>JSON-источник</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Textarea
            value={source}
            onChange={(event) => setSource(event.target.value)}
            rows={20}
            className="font-mono text-xs"
            placeholder={example}
            aria-label="JSON для импорта Speaking"
          />
          <Button
            type="button"
            disabled={!source.trim() || parseMutation.isPending}
            onClick={() => parseMutation.mutate()}
          >
            <DocumentUpload aria-hidden />
            {parseMutation.isPending ? 'Проверяем…' : 'Проверить импорт'}
          </Button>
          {parseMutation.isError ? (
            <p className="text-sm text-[#e23b3b]">
              {getErrorMessage(parseMutation.error)}
            </p>
          ) : null}
        </CardContent>
      </Card>
      {result ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Результат проверки</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {result.errors.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-[#e23b3b]">
                {result.errors.map((error) => (
                  <li key={`${error.item}-${error.code}-${error.message}`}>
                    {error.item ? `Материал ${error.item}: ` : ''}
                    {error.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-sm text-emerald-700">
                <TickCircle className="size-4" aria-hidden />
                Готово к импорту: {result.materials.length} материалов.
              </p>
            )}
            <Button
              type="button"
              disabled={!canImport || importMutation.isPending}
              onClick={() => importMutation.mutate()}
            >
              {importMutation.isPending ? 'Импортируем…' : 'Подтвердить импорт'}
            </Button>
            {importMutation.isError ? (
              <p className="text-sm text-[#e23b3b]">
                {getErrorMessage(importMutation.error)}
              </p>
            ) : null}
            {importMutation.isSuccess ? (
              <p className="text-sm text-emerald-700">Импорт завершён.</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
