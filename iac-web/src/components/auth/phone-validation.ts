/**
 * Нормализует введённый пользователем номер к E.164.
 * Принимает привычные локальные форматы: «8 700 123 45 67»,
 * «77001234567», «7001234567» и «+7 700 123 45 67».
 */
export function normalizePhone(value: string) {
  const compact = value.trim().replace(/[\s()-]/g, '')
  const digits = compact.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`
  }
  if (compact.startsWith('+')) {
    return `+${digits}`
  }
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`
  }
  if (digits.length === 10 && digits.startsWith('7')) {
    return `+7${digits}`
  }
  return compact
}

/**
 * Маска для поля ввода: форматирует номер как «+7 700 123 45 67»
 * по мере ввода. Номера с явным «+» других стран оставляет как есть.
 */
export function formatPhoneInput(value: string) {
  const hasPlus = value.trimStart().startsWith('+')
  let digits = value.replace(/\D/g, '')
  if (!digits) return hasPlus ? '+' : ''

  if (hasPlus) {
    if (!digits.startsWith('7')) return `+${digits}`
    digits = digits.slice(1)
  } else if (digits.startsWith('8')) {
    // «8 700 …» по-русски/казахски — то же самое, что «+7 700 …»
    digits = digits.slice(1)
  } else if (digits.length === 11 && digits.startsWith('7')) {
    digits = digits.slice(1)
  }

  const national = digits.slice(0, 10)
  const parts = [
    national.slice(0, 3),
    national.slice(3, 6),
    national.slice(6, 8),
    national.slice(8, 10),
  ].filter(Boolean)
  return parts.length > 0 ? `+7 ${parts.join(' ')}` : '+7'
}

export function validatePhone(value: string) {
  const normalized = normalizePhone(value)
  if (!normalized || normalized === '+') return 'Введите номер WhatsApp'
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    return 'Введите номер полностью, например +7 700 123 45 67'
  }
  return undefined
}
