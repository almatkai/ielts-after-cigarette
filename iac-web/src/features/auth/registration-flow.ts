export type RegistrationDraft = {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  acceptedTerms: boolean
}

export type PendingRegistration = RegistrationDraft & {
  verificationId: string
}

let pendingRegistration: PendingRegistration | null = null

export function getPendingRegistration() {
  return pendingRegistration
}

export function setPendingRegistration(value: PendingRegistration) {
  pendingRegistration = value
}

export function clearPendingRegistration() {
  pendingRegistration = null
}
