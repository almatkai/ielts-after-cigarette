import { apiClient } from '@/lib/api/client'

export type ChatRole = 'user' | 'assistant' | 'system' | 'tool'

export type ChatMessageDto = {
  role: ChatRole
  content: string
  toolCallId?: string
  name?: string
}

export type PageContextDto = {
  url: string
  title: string
  content: string
}

export type AssistantChatRequest = {
  messages: ChatMessageDto[]
  pageContext?: PageContextDto
}

export type AssistantToolCallDto = {
  id?: string
  name: string
  arguments?: string
}

export type AssistantChatResponse = {
  message: ChatMessageDto
  toolCalls?: AssistantToolCallDto[]
}

export async function sendAssistantChat(
  request: AssistantChatRequest,
  signal?: AbortSignal,
): Promise<AssistantChatResponse> {
  return apiClient.request<AssistantChatResponse>('/api/v1/assistant/chat', {
    method: 'POST',
    body: request,
    signal,
  })
}
