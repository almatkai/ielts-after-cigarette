import type { AttemptReviewItem } from './api'
import type { PublicListeningTest } from '../listening/api'
import type { PublicReadingMaterial } from '../reading/api'

export type ReviewMaterial = PublicListeningTest | PublicReadingMaterial

// Match IDs in the attempt's pinned material; question numbers are not passage boundaries.
export function withReviewMaterial(
  item: AttemptReviewItem,
  material?: ReviewMaterial | null,
): AttemptReviewItem {
  if (!material) return item
  if ('parts' in material) {
    for (const part of material.parts) {
      for (const group of part.groups) {
        const question = group.questions.find((q) => q.id === item.questionId)
        if (!question) continue
        const content = {
          ...group.config,
          ...question.content,
          ...item.content,
          options:
            question.content.options ??
            group.config.options ??
            item.content?.options,
          context: group.context,
          instructions: group.instructions,
          imageAssetId: group.imageAssetId,
        }
        const line = group.context
          .split('\n')
          .find((value) =>
            new RegExp(`\\{\\{\\s*${item.number}\\s*\\}\\}`).test(value),
          )
        return {
          ...item,
          type: item.type ?? group.type,
          content,
          prompt:
            item.prompt.trim() === '{{answer}}' && line
              ? line.replace(/\{\{\s*\d+\s*\}\}/g, '_____')
              : item.prompt,
          audioAssetId: item.audioAssetId ?? part.audioAssetId ?? undefined,
          transcript: item.transcript ?? part.transcript,
        }
      }
    }
  } else {
    for (const passage of material.passages?.length
      ? material.passages
      : [material]) {
      for (const group of passage.questionGroups) {
        const question = group.questions.find((q) => q.id === item.questionId)
        if (!question) continue
        return {
          ...item,
          type: item.type ?? group.type,
          content: {
            ...question.content,
            ...item.content,
            instructions: group.instructions,
          },
          passageTitle: passage.title,
          passageBody: passage.body,
        }
      }
    }
  }
  return item
}
