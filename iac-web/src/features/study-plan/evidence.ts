import type { StudyEvidence } from './api.ts'

export function evidenceSource(source: string) {
  if (/none|missing|unavailable/i.test(source) || !source) return 'Не указан'
  if (/human|specialist|qualified|teacher|examiner/i.test(source))
    return 'Проверка специалистом'
  if (/ai|automatic|automated/i.test(source))
    return 'Автоматическая обратная связь'
  if (/official|conversion/i.test(source))
    return 'Подтверждённая конверсия результата'
  if (/practice|attempt|partial|snapshot|unvalidated/i.test(source))
    return 'Результат практики'
  return source
}

export function qualifiedBand(evidence: StudyEvidence) {
  if (/practice|partial|repeat|unvalidated/i.test(evidence.source)) return null
  if (
    /pending|processing|awaiting|failed|missing|unavailable/i.test(
      evidence.status,
    )
  )
    return null
  if (
    (evidence.skill === 'writing' || evidence.skill === 'speaking') &&
    !/human|specialist|qualified|teacher|examiner|official/i.test(
      evidence.source,
    )
  )
    return null
  return evidence.band
}
