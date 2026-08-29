import { apiClient } from '@/lib/api/client'

import type { UserDto } from '@/features/auth/auth-store'

export type SkillId = 'listening' | 'reading' | 'writing' | 'speaking'

export type DashboardDto = {
  profile: {
    currentBand: number | null
    targetBand: number | null
    examDate: string | null
  }
  recommendedAction: {
    type: string
    title: string
    description: string
    target: string
  }
  todayPlan: Array<{
    id: string
    title: string
    skill: SkillId
    durationMinutes: number
  }>
  skillProgress: Array<{
    skill: SkillId
    estimatedBand: number | null
    accuracyPercent: number | null
    completedTasks: number
  }>
  unreadNotifications: number
}

export type ProfileForm = {
  firstName: string
  lastName: string
  email: string
  targetScore: string
  examDate: string
  examFormat: '' | 'academic' | 'general'
}

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  profile: ['profile'] as const,
}

export function getDashboard(signal?: AbortSignal) {
  return apiClient.request<DashboardDto>('/api/v1/dashboard', { signal })
}

export function getProfile(signal?: AbortSignal) {
  return apiClient.request<UserDto>('/api/v1/profile', { signal })
}

export function patchProfile(firstName: string, lastName: string) {
  const displayName = [firstName.trim(), lastName.trim()]
    .filter(Boolean)
    .join(' ')
  return apiClient.request<UserDto>('/api/v1/profile', {
    method: 'PATCH',
    body: { displayName },
  })
}

export function updateProfile(input: {
  displayName?: string
  timezone?: string
}) {
  return apiClient.request<UserDto>('/api/v1/profile', {
    method: 'PATCH',
    body: input,
  })
}

export function putGoal(form: ProfileForm) {
  return updateGoal({
    targetBand: Number(form.targetScore),
    examDate: form.examDate,
    examType: form.examFormat as 'academic' | 'general',
  })
}

export function updateGoal(input: {
  targetBand: number
  examDate: string
  examType: 'academic' | 'general'
}) {
  return apiClient.request<UserDto>('/api/v1/profile/goal', {
    method: 'PUT',
    body: input,
  })
}

export function profileToForm(profile: UserDto): ProfileForm {
  const [firstName = '', ...lastNameParts] = profile.displayName.split(/\s+/)
  return {
    firstName,
    lastName: lastNameParts.join(' '),
    email: profile.email,
    targetScore:
      profile.targetBand === null ? '' : profile.targetBand.toFixed(1),
    examDate: profile.examDate ?? '',
    examFormat: profile.examType ?? '',
  }
}

export function validateGoal(form: ProfileForm) {
  const errors: Record<string, string> = {}
  const band = Number(form.targetScore)
  if (
    !form.targetScore ||
    !Number.isFinite(band) ||
    band < 0 ||
    band > 9 ||
    !Number.isInteger(band * 2)
  ) {
    errors.targetScore = 'Выберите балл от 0 до 9 с шагом 0,5.'
  }
  if (!form.examFormat) {
    errors.examFormat = 'Выберите формат IELTS.'
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.examDate)) {
    errors.examDate = 'Укажите дату экзамена.'
  } else {
    const today = new Date()
    const todayValue = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-')
    if (form.examDate < todayValue) {
      errors.examDate = 'Дата экзамена не может быть в прошлом.'
    }
  }
  return errors
}
