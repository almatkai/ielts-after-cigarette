import { apiClient } from '@/lib/api/client'

export type AILimits = {
  assistantLimit: number
  guestAssistantLimit: number
  writingLimit: number
  speakingLimit: number
  updatedAt?: string
}

export type UpdateAILimitsInput = {
  assistantLimit?: number
  guestAssistantLimit?: number
  writingLimit?: number
  speakingLimit?: number
}

const path = '/api/v1/admin/ai-limits'

export const getAILimits = () => apiClient.request<AILimits>(path)

export const saveAILimits = (input: UpdateAILimitsInput) =>
  apiClient.request<AILimits>(path, {
    method: 'PUT',
    body: input,
  })
