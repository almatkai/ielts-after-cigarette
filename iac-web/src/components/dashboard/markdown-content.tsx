import React from 'react'

function formatInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-blue-700 font-semibold"
        >
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-slate-900">
          {token.slice(2, -2)}
        </strong>,
      )
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-slate-800">
          {token.slice(1, -1)}
        </em>,
      )
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

export function MarkdownContent({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let inCodeBlock = false
  let codeBuffer: string[] = []
  let listBuffer: { type: 'ul' | 'ol'; items: string[] } | null = null

  const flushList = (key: number) => {
    if (!listBuffer) return
    const Tag = listBuffer.type
    blocks.push(
      <Tag
        key={`list-${key}`}
        className={
          listBuffer.type === 'ul'
            ? 'list-disc list-outside pl-4 space-y-1 my-1.5'
            : 'list-decimal list-outside pl-4 space-y-1 my-1.5'
        }
      >
        {listBuffer.items.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {formatInline(item)}
          </li>
        ))}
      </Tag>,
    )
    listBuffer = null
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push(
          <pre
            key={`code-${i}`}
            className="my-2 rounded-xl bg-slate-900 p-2.5 text-[11px] text-slate-100 overflow-x-auto font-mono"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>,
        )
        codeBuffer = []
        inCodeBlock = false
      } else {
        flushList(i)
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine)
      continue
    }

    const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/)
    const olMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/)

    if (ulMatch) {
      if (listBuffer && listBuffer.type !== 'ul') flushList(i)
      if (!listBuffer) listBuffer = { type: 'ul', items: [] }
      listBuffer.items.push(ulMatch[1])
      continue
    }

    if (olMatch) {
      if (listBuffer && listBuffer.type !== 'ol') flushList(i)
      if (!listBuffer) listBuffer = { type: 'ol', items: [] }
      listBuffer.items.push(olMatch[2])
      continue
    }

    flushList(i)

    if (!trimmed) {
      continue
    }

    if (trimmed.startsWith('#### ')) {
      blocks.push(
        <h5
          key={`h4-${i}`}
          className="font-bold text-xs text-slate-900 mt-2 mb-1"
        >
          {formatInline(trimmed.replace(/^####\s+/, ''))}
        </h5>,
      )
    } else if (trimmed.startsWith('### ')) {
      blocks.push(
        <h4
          key={`h3-${i}`}
          className="font-bold text-[13px] text-slate-900 mt-2 mb-1"
        >
          {formatInline(trimmed.replace(/^###\s+/, ''))}
        </h4>,
      )
    } else if (trimmed.startsWith('## ')) {
      blocks.push(
        <h3
          key={`h2-${i}`}
          className="font-bold text-sm text-slate-900 mt-2.5 mb-1 text-blue-900"
        >
          {formatInline(trimmed.replace(/^##\s+/, ''))}
        </h3>,
      )
    } else if (trimmed.startsWith('# ')) {
      blocks.push(
        <h2
          key={`h1-${i}`}
          className="font-bold text-base text-slate-900 mt-3 mb-1.5 text-blue-950"
        >
          {formatInline(trimmed.replace(/^#\s+/, ''))}
        </h2>,
      )
    } else if (trimmed.startsWith('> ')) {
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-3 border-blue-400 bg-blue-50/50 pl-2.5 py-1 my-1.5 rounded-r text-[11px] text-slate-700 italic"
        >
          {formatInline(trimmed.replace(/^>\s+/, ''))}
        </blockquote>,
      )
    } else {
      blocks.push(
        <p key={`p-${i}`} className="leading-relaxed my-1">
          {formatInline(trimmed)}
        </p>,
      )
    }
  }

  flushList(lines.length)

  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push(
      <pre
        key="code-dangling"
        className="my-2 rounded-xl bg-slate-900 p-2.5 text-[11px] text-slate-100 overflow-x-auto font-mono"
      >
        <code>{codeBuffer.join('\n')}</code>
      </pre>,
    )
  }

  return <div className={className}>{blocks}</div>
}
