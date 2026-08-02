export function validatePhone(value: string) {
  const normalizedValue = value.trim().replace(/[\s()-]/g, '')
  if (!normalizedValue) return 'Введите номер WhatsApp'
  if (!/^\+[1-9]\d{7,14}$/.test(normalizedValue)) {
    return 'Введите номер в международном формате, например +77001234567'
  }
  return undefined
}
