export function getFieldError(errors: unknown[]) {
  const firstError = errors[0]
  if (typeof firstError === 'string') return firstError
  if (
    firstError &&
    typeof firstError === 'object' &&
    'message' in firstError &&
    typeof firstError.message === 'string'
  ) {
    return firstError.message
  }
  return undefined
}
