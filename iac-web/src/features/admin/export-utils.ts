import type { ReadingMaterial } from '@/features/admin/api'
import type { ListeningTest } from '@/features/listening/api'
import type { WritingMaterial } from '@/features/writing/api'
import type { SpeakingMaterial } from '@/features/speaking/api'

/**
 * Downloads a string content as a file in the browser.
 */
export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Lowercases a possibly-missing question-group type. API payloads are not
 * guaranteed to carry `type`, and IELTS material types are uppercase
 * (SENTENCE_COMPLETION), so callers must match case-insensitively.
 */
function groupTypeOf(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : ''
}

/**
 * Normalizes a cue card to the string array the backend expects. Tolerates a
 * legacy newline-joined string so older exports still re-import cleanly.
 */
function cueCardLinesOf(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((line): line is string => typeof line === 'string')
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return value.split('\n')
  }
  return []
}

/**
 * Reads a positive integer field that may be absent from a legacy payload.
 */
function positionOf(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/**
 * Serializes a Reading material or full Reading test into the IELTS_READING_IMPORT_V1 format.
 */
export function serializeReadingToV1(test: ReadingMaterial): string {
  let out = '# IELTS_READING_IMPORT_V1\n'
  out += `title: ${test.title}\n`
  out += `exam_type: ${test.examType.toUpperCase()}\n`
  out += `duration_minutes: ${test.durationMinutes || 60}\n\n`

  const passages =
    test.passages && test.passages.length > 0 ? test.passages : [test]
  const allAnswers: Array<{ num: number; ans: string }> = []
  const allExplanations: Array<{ num: number; exp: string }> = []

  passages.forEach((p, pIdx) => {
    out += `## PASSAGE ${pIdx + 1}\n`
    out += `title: ${p.title || `Passage ${pIdx + 1}`}\n`
    out += `### TEXT\n${(p.body || '').trim()}\n\n`

    const groups = p.questionGroups || []
    groups.forEach((g, gIdx) => {
      out += `### GROUP ${gIdx + 1}\n`
      const questions = g.questions
      const startNum = questions[0]?.content?.number as number || 1
      let endNum = questions[questions.length - 1]?.content?.number as number || startNum
      if (typeof questions[questions.length - 1]?.content?.numberEnd === 'number') {
        endNum = questions[questions.length - 1].content.numberEnd as number
      }
      out += `range: ${startNum}-${endNum}\n`

      const isMultiSelect = questions.some(
        (q) =>
          (typeof q.content.selectionLimit === 'number' && q.content.selectionLimit > 1) ||
          (typeof q.content.numberEnd === 'number' &&
            q.content.numberEnd > ((q.content.number as number) || 0)),
      )
      let typeStr = groupTypeOf(g.type).toUpperCase()
      if (isMultiSelect && typeStr === 'MULTIPLE_CHOICE') {
        typeStr = 'MULTIPLE_SELECT'
      }
      out += `type: ${typeStr}\n`

      const config = g.config as Record<string, any> | undefined
      if (config?.answerLimit) {
        const maxWords = config.answerLimit.maxWords || 1
        const allowNum = config.answerLimit.allowNumber
        if (maxWords === 1 && !allowNum) out += `answer_limit: ONE_WORD_ONLY\n`
        else if (maxWords === 1 && allowNum)
          out += `answer_limit: ONE_WORD_OR_A_NUMBER\n`
        else if (maxWords === 2 && !allowNum)
          out += `answer_limit: NO_MORE_THAN_TWO_WORDS\n`
        else if (maxWords === 2 && allowNum)
          out += `answer_limit: NO_MORE_THAN_TWO_WORDS_OR_A_NUMBER\n`
        else if (maxWords === 3 && allowNum)
          out += `answer_limit: NO_MORE_THAN_THREE_WORDS_OR_A_NUMBER\n`
        else out += `answer_limit: NO_MORE_THAN_${maxWords}_WORDS\n`
      } else if (groupTypeOf(g.type).includes('completion')) {
        out += `answer_limit: NO_MORE_THAN_TWO_WORDS\n`
      }

      if (config?.reuseOptions || (questions[0]?.content as any)?.reuse) {
        out += `reuse_options: true\n`
      }
      if (g.instructions) {
        out += `instruction:\n${g.instructions.trim()}\n`
      }

      if (Array.isArray(config?.options) && config.options.length > 0) {
        out += `options:\n`
        config.options.forEach((opt: { id: string; text: string }) => {
          out += `${opt.id}: ${opt.text}\n`
        })
      }

      questions.forEach((q, qIndex) => {
        const qNum = (q.content.number as number) || startNum + qIndex
        const qNumEnd = (q.content.numberEnd as number) || qNum
        let promptText = q.prompt || ''
        promptText = promptText.replace(/\{\{answer\}\}/g, `{{${qNum}}}`)
        if (
          !promptText.includes(`{{${qNum}}}`) &&
          (groupTypeOf(g.type).includes('completion') ||
            groupTypeOf(g.type).includes('fill'))
        ) {
          promptText += ` {{${qNum}}}`
        }

        const qOptions = q.content.options as Array<{ id: string; text: string }> | undefined
        if (qNumEnd > qNum) {
          if (Array.isArray(qOptions) && qOptions.length > 0) {
            out += `options:\n`
            qOptions.forEach((opt) => {
              out += `${opt.id}: ${opt.text}\n`
            })
          }
        } else {
          out += `${qNum}. ${promptText}\n`
          if (Array.isArray(qOptions) && qOptions.length > 0 && !config?.options) {
            qOptions.forEach((opt) => {
              out += `${opt.id}: ${opt.text}\n`
            })
          }
        }

        // Collect answers
        const ansObj = q.answer as Record<string, any> | undefined
        if (qNumEnd > qNum && Array.isArray(ansObj?.optionIds)) {
          ansObj.optionIds.forEach((optId: string, i: number) => {
            allAnswers.push({ num: qNum + i, ans: optId })
          })
        } else {
          let ans = ''
          if (ansObj?.value) ans = String(ansObj.value)
          else if (ansObj?.optionId) ans = String(ansObj.optionId)
          else if (Array.isArray(ansObj?.accepted) && ansObj.accepted.length > 0)
            ans = String(ansObj.accepted[0])
          if (ans) allAnswers.push({ num: qNum, ans })
        }

        const expParts: string[] = []
        if (q.content.quote) expParts.push(`quote: ${q.content.quote}`)
        if (q.content.hint) expParts.push(`hint: ${q.content.hint}`)
        if (q.explanation) expParts.push(q.explanation)
        if (expParts.length > 0) {
          allExplanations.push({ num: qNum, exp: expParts.join('\n') })
        }
      })
      out += `\n`
    })
  })

  out += `## ANSWERS\n`
  allAnswers
    .sort((a, b) => a.num - b.num)
    .forEach((a) => {
      out += `${a.num}: ${a.ans}\n`
    })
  out += `\n`

  if (allExplanations.length > 0) {
    out += `## EXPLANATIONS\n`
    allExplanations
      .sort((a, b) => a.num - b.num)
      .forEach((e) => {
        out += `### ${e.num}\n${e.exp.trim()}\n`
      })
  }

  return out
}

/**
 * Serializes a Listening test into the IELTS_LISTENING_IMPORT_V1 format.
 */
export function serializeListeningToV1(test: ListeningTest): string {
  let out = '# IELTS_LISTENING_IMPORT_V1\n'
  out += `title: ${test.title}\n`
  out += `exam_type: ${test.examType.toUpperCase()}\n`
  out += `duration_minutes: ${test.durationMinutes || 40}\n\n`

  const allAnswers: Array<{ num: number; ans: string }> = []
  const allExplanations: Array<{ num: number; exp: string }> = []

  test.parts.forEach((part, partIdx) => {
    out += `## PART ${partIdx + 1}\n`
    out += `title: ${part.title || `Part ${partIdx + 1}`}\n`

    part.groups.forEach((group, groupIdx) => {
      out += `### GROUP ${groupIdx + 1}\n`
      const questions = group.questions
      const startNum = questions[0]?.number || groupIdx + 1
      const endNum = questions[questions.length - 1]?.number || startNum
      out += `range: ${startNum}-${endNum}\n`
      out += `type: ${group.type.toUpperCase()}\n`

      const config = group.config as Record<string, any> | undefined
      if (config?.answerLimit) {
        const maxWords = config.answerLimit.maxWords || 1
        const allowNum = config.answerLimit.allowNumber
        if (maxWords === 1 && !allowNum) out += `answer_limit: ONE_WORD_ONLY\n`
        else if (maxWords === 1 && allowNum)
          out += `answer_limit: ONE_WORD_OR_A_NUMBER\n`
        else if (maxWords === 2 && !allowNum)
          out += `answer_limit: NO_MORE_THAN_TWO_WORDS\n`
        else if (maxWords === 2 && allowNum)
          out += `answer_limit: NO_MORE_THAN_TWO_WORDS_OR_A_NUMBER\n`
        else if (maxWords === 3 && allowNum)
          out += `answer_limit: NO_MORE_THAN_THREE_WORDS_OR_A_NUMBER\n`
        else out += `answer_limit: NO_MORE_THAN_${maxWords}_WORDS\n`
      } else if (group.type.includes('completion')) {
        out += `answer_limit: ONE_WORD_OR_A_NUMBER\n`
      }

      if (group.instructions) {
        out += `instruction:\n${group.instructions.trim()}\n`
      }

      if (group.context) {
        out += `context:\n${group.context.trim()}\n`
      }

      if (Array.isArray(config?.options) && config.options.length > 0) {
        out += `options:\n`
        config.options.forEach((opt: { id: string; text: string }) => {
          out += `${opt.id}: ${opt.text}\n`
        })
      }

      questions.forEach((q) => {
        const qNum = q.number
        let promptText = q.prompt || ''
        promptText = promptText.replace(/\{\{answer\}\}/g, `{{${qNum}}}`)
        if (
          !promptText.includes(`{{${qNum}}}`) &&
          (group.type.includes('completion') || group.type.includes('fill'))
        ) {
          promptText += ` {{${qNum}}}`
        }

        out += `${qNum}. ${promptText}\n`
        const qContent = q.content as Record<string, any> | undefined
        const qOptions = qContent?.options as Array<{ id: string; text: string }> | undefined
        if (Array.isArray(qOptions) && qOptions.length > 0 && !config?.options) {
          qOptions.forEach((opt) => {
            out += `${opt.id}: ${opt.text}\n`
          })
        }

        // Answers
        const ansObj = q.answer as Record<string, any> | undefined
        let ans = ''
        if (ansObj?.value) ans = String(ansObj.value)
        else if (ansObj?.optionId) ans = String(ansObj.optionId)
        else if (Array.isArray(ansObj?.accepted) && ansObj.accepted.length > 0)
          ans = String(ansObj.accepted[0])
        if (ans) allAnswers.push({ num: qNum, ans })

        const expParts: string[] = []
        if (qContent?.quote) expParts.push(`quote: ${qContent.quote}`)
        if (qContent?.hint) expParts.push(`hint: ${qContent.hint}`)
        if (q.explanation) expParts.push(q.explanation)
        if (expParts.length > 0) {
          allExplanations.push({ num: qNum, exp: expParts.join('\n') })
        }
      })
      out += `\n`
    })
  })

  out += `## ANSWERS\n`
  allAnswers
    .sort((a, b) => a.num - b.num)
    .forEach((a) => {
      out += `${a.num}: ${a.ans}\n`
    })
  out += `\n`

  if (allExplanations.length > 0) {
    out += `## EXPLANATIONS\n`
    allExplanations
      .sort((a, b) => a.num - b.num)
      .forEach((e) => {
        out += `### ${e.num}\n${e.exp.trim()}\n`
      })
  }

  return out
}

/**
 * Serializes a Writing material into JSON format compatible with Writing import.
 */
export function serializeWritingToJSON(material: WritingMaterial): string {
  const exportPayload = {
    materials: [
      {
        slug: material.slug,
        examType: material.examType,
        difficulty: material.difficulty,
        title: material.title,
        description: material.description || '',
        durationMinutes: material.durationMinutes || 60,
        tasks: material.tasks.map((t) => ({
          type: t.type,
          prompt: t.prompt,
          minimumWords: t.minimumWords,
          visualType: t.visualType || undefined,
          visualAssetId: t.visualAssetId || undefined,
          assessmentNotes: t.assessmentNotes || undefined,
          essayType: t.essayType || undefined,
          letterTone: t.letterTone || undefined,
        })),
      },
    ],
  }
  return JSON.stringify(exportPayload, null, 2)
}

/**
 * Serializes a Speaking material into JSON format compatible with IELTS_SPEAKING_IMPORT_V1.
 */
export function serializeSpeakingToJSON(material: SpeakingMaterial): string {
  const exportPayload = {
    format: 'IELTS_SPEAKING_IMPORT_V1',
    materials: [
      {
        slug: material.slug,
        examType: material.examType,
        difficulty: material.difficulty,
        title: material.title,
        description: material.description || '',
        parts: material.parts.map((p) => ({
          type: p.type,
          title: p.title,
          instructions: p.instructions || '',
          preparationSeconds: p.preparationSeconds,
          responseSeconds: p.responseSeconds,
          // The backend Part.CueCard is []string, so it must stay an array;
          // joining it with newlines makes re-import fail with a JSON unmarshal error.
          cueCard: cueCardLinesOf(p.cueCard),
          // The backend Question field is `position`, not `questionNumber`.
          questions: p.questions.map((q, idx) => ({
            position: positionOf((q as any).position, idx + 1),
            prompt: q.prompt,
          })),
        })),
      },
    ],
  }
  return JSON.stringify(exportPayload, null, 2)
}
