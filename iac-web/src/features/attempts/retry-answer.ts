import type { StudentAnswer } from './api'

// Mirror attempts.gradeAnswer; practising must not accept a different answer than the exam.
export function evaluateRetryAnswer(
  given: StudentAnswer,
  correct: StudentAnswer,
): boolean {
  if (typeof correct.optionId === 'string') {
    return correct.optionId !== '' && given.optionId === correct.optionId
  }
  if (Array.isArray(correct.optionIds)) {
    const expected = correct.optionIds
    const actual = given.optionIds
    if (
      !expected.every((id) => typeof id === 'string') ||
      !Array.isArray(actual) ||
      !actual.every((id) => typeof id === 'string') ||
      expected.length !== actual.length
    )
      return false
    const remaining = [...actual]
    for (const id of expected) {
      const index = remaining.indexOf(id)
      if (index < 0) return false
      remaining.splice(index, 1)
    }
    return true
  }
  if (typeof given.value !== 'string') return false
  const value = given.value.trim().toLowerCase()
  if (typeof correct.value === 'string') {
    return correct.value !== '' && value === correct.value.trim().toLowerCase()
  }
  return (
    value !== '' &&
    Array.isArray(correct.accepted) &&
    correct.accepted.some(
      (item) => typeof item === 'string' && item.trim().toLowerCase() === value,
    )
  )
}
