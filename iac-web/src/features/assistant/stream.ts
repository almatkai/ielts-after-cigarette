import { ApiError, apiClient } from '@/lib/api/client'
import type { AssistantChatRequest, AssistantChatResponse } from './api'

export type AssistantStreamEvent =
  { type: 'reset' } | { type: 'delta'; text: string }

export async function streamAssistantChat(
  request: AssistantChatRequest,
  onEvent: (event: AssistantStreamEvent) => void,
  signal?: AbortSignal,
): Promise<AssistantChatResponse> {
  const response = await apiClient.stream('/api/v1/assistant/chat/stream', {
    method: 'POST',
    body: request,
    signal,
  })
  if (
    !response.body ||
    !response.headers.get('Content-Type')?.startsWith('text/event-stream')
  ) {
    throw new ApiError(502, {
      code: 'INVALID_AI_STREAM',
      message: 'Ответ чата не получен',
    })
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      if (buffer.length > 1_000_000)
        throw new Error('Stream frame is too large')
      let boundary = /\r?\n\r?\n/.exec(buffer)
      while (boundary) {
        const frame = buffer.slice(0, boundary.index)
        buffer = buffer.slice(boundary.index + boundary[0].length)
        const data = frame
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n')
        if (data) {
          const event = JSON.parse(data) as {
            type: string
            text?: string
            response?: AssistantChatResponse
          }
          if (event.type === 'reset') onEvent({ type: 'reset' })
          else if (event.type === 'delta' && typeof event.text === 'string')
            onEvent({ type: 'delta', text: event.text })
          else if (event.type === 'done' && event.response?.message.content)
            return event.response
          else if (event.type === 'unavailable' && event.text)
            return { message: { role: 'assistant', content: event.text } }
        }
        boundary = /\r?\n\r?\n/.exec(buffer)
      }
      if (done)
        throw new ApiError(502, {
          code: 'AI_STREAM_INTERRUPTED',
          message: 'Соединение с чатом прервалось',
        })
    }
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}
