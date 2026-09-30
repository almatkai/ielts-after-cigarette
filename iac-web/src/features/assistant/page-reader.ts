export type ExtractedPageReadme = {
  title: string
  url: string
  markdown: string
}

const IGNORED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'SVG',
  'CANVAS',
  'IFRAME',
  'AUDIO',
  'VIDEO',
])

const IGNORED_SELECTORS = [
  '#ai-assistant-widget',
  '[data-ai-assistant-ignore]',
  '#dashboard-mobile-navigation',
  'header[role="banner"]',
  'nav',
  'aside',
  '[aria-hidden="true"]',
]

/**
 * Extracts the current page's readable content and converts it into a
 * structured, clean README / Markdown document.
 */
export function extractPageAsReadme(): ExtractedPageReadme {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      title: 'IELTS Preparation',
      url: '/',
      markdown:
        '# IELTS Preparation Platform\n\n*Running in non-browser context*',
    }
  }

  const url = window.location.pathname + window.location.search
  const title =
    document.querySelector('h1')?.textContent.trim() ||
    document.title ||
    'IELTS Platform Page'

  // Find the primary content container
  const container =
    document.querySelector('main') ||
    document.querySelector('[role="main"]') ||
    document.querySelector('article') ||
    document.getElementById('root') ||
    document.body

  const lines: string[] = []
  lines.push(`# ${title}`)
  lines.push(`**URL**: \`${url}\`\n`)

  processNode(container, lines)

  let markdown = lines
    .join('\n')
    // Remove triple or more consecutive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Limit characters if page is extremely long
  const MAX_CHARS = 24000
  if (markdown.length > MAX_CHARS) {
    markdown =
      markdown.slice(0, MAX_CHARS) +
      '\n\n*...[README content truncated to fit token limits]*'
  }

  return {
    title,
    url,
    markdown,
  }
}

function shouldIgnore(el: Element): boolean {
  if (IGNORED_TAGS.has(el.tagName)) return true
  for (const selector of IGNORED_SELECTORS) {
    try {
      if (el.matches(selector) || el.closest(selector)) {
        return true
      }
    } catch {
      // Ignore selector match error
    }
  }
  return false
}

function processNode(node: Node, lines: string[], indent = '') {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.replace(/\s+/g, ' ').trim()
    if (text) {
      lines.push(`${indent}${text}`)
    }
    return
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return
  }

  const el = node as HTMLElement

  if (shouldIgnore(el)) {
    return
  }

  // Handle hidden elements
  if (el.offsetParent === null && el.tagName !== 'BODY') {
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') {
      return
    }
  }

  const tag = el.tagName.toUpperCase()

  // Form controls: textareas, inputs, checkboxes
  if (tag === 'TEXTAREA') {
    const textarea = el as HTMLTextAreaElement
    const val = textarea.value.trim()
    if (val) {
      lines.push(
        `\n**Student Input / Essay Draft:**\n\`\`\`text\n${val}\n\`\`\`\n`,
      )
    }
    return
  }

  if (tag === 'INPUT') {
    const input = el as HTMLInputElement
    const inputType = input.type.toLowerCase()
    if (inputType === 'radio' || inputType === 'checkbox') {
      const isChecked = input.checked
      const label = input.labels?.[0]?.textContent.trim() || input.value || ''
      lines.push(`${indent}${isChecked ? '[x]' : '[ ]'} ${label}`)
    } else if (inputType === 'text' || !inputType) {
      const val = input.value.trim()
      if (val) {
        lines.push(`${indent}[Input: "${val}"]`)
      }
    }
    return
  }

  // Headings
  if (tag === 'H1') {
    const text = el.textContent.trim()
    if (text) lines.push(`\n# ${text}\n`)
    return
  }
  if (tag === 'H2') {
    const text = el.textContent.trim()
    if (text) lines.push(`\n## ${text}\n`)
    return
  }
  if (tag === 'H3') {
    const text = el.textContent.trim()
    if (text) lines.push(`\n### ${text}\n`)
    return
  }
  if (tag === 'H4' || tag === 'H5' || tag === 'H6') {
    const text = el.textContent.trim()
    if (text) lines.push(`\n#### ${text}\n`)
    return
  }

  // Paragraphs
  if (tag === 'P') {
    const text = getElementFormattedText(el)
    if (text) {
      lines.push(`\n${text}\n`)
    }
    return
  }

  // Blockquotes
  if (tag === 'BLOCKQUOTE') {
    const text = getElementFormattedText(el)
    if (text) {
      const quoted = text
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n')
      lines.push(`\n${quoted}\n`)
    }
    return
  }

  // Lists
  if (tag === 'UL' || tag === 'OL') {
    const isOrdered = tag === 'OL'
    let itemIndex = 1
    for (const child of Array.from(el.children)) {
      if (child.tagName.toUpperCase() === 'LI') {
        const itemText = getElementFormattedText(child as HTMLElement)
        if (itemText) {
          const prefix = isOrdered ? `${itemIndex++}. ` : '- '
          lines.push(`${indent}${prefix}${itemText}`)
        }
      }
    }
    lines.push('')
    return
  }

  // Tables
  if (tag === 'TABLE') {
    const tableMd = extractTableAsMarkdown(el as HTMLTableElement)
    if (tableMd) {
      lines.push(`\n${tableMd}\n`)
    }
    return
  }

  // Recursively process child nodes
  for (const child of Array.from(node.childNodes)) {
    processNode(child, lines, indent)
  }
}

function getElementFormattedText(el: HTMLElement): string {
  // If the element has code blocks, inputs, or tables, don't just use innerText
  if (el.querySelector('textarea, input, table, pre')) {
    const subLines: string[] = []
    for (const child of Array.from(el.childNodes)) {
      processNode(child, subLines)
    }
    return subLines.join(' ').replace(/\s+/g, ' ').trim()
  }
  return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim()
}

function extractTableAsMarkdown(table: HTMLTableElement): string {
  const rows = Array.from(table.rows)
  if (rows.length === 0) return ''

  const result: string[] = []
  let hasHeader = false

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    const cells = Array.from(row.cells).map(
      (c) => c.textContent.replace(/\s+/g, ' ').trim() || '',
    )
    result.push(`| ${cells.join(' | ')} |`)

    if (r === 0) {
      const separators = cells.map(() => '---')
      result.push(`| ${separators.join(' | ')} |`)
      hasHeader = true
    }
  }

  if (!hasHeader) {
    return ''
  }

  return result.join('\n')
}
