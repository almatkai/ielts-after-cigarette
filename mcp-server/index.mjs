#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_BASE = (process.env.IAC_API_URL || 'https://ielts.yrys.academy/api/v1').replace(/\/+$/, '')
const API_KEY = process.env.IAC_API_KEY || ''

import fs from 'node:fs'
import path from 'node:path'

function getHeaders(overrideKey, isFormData = false) {
  const key = overrideKey || API_KEY
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${key}`,
    'X-API-Key': key,
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

async function request(pathStr, options = {}) {
  const url = `${API_BASE}${pathStr}`
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers = {
    ...getHeaders(options.apiKey, isFormData),
    ...(options.headers || {}),
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }

  if (!res.ok) {
    const errorMsg = (typeof data === 'object' && data?.message) || (typeof data === 'string' ? data : `HTTP ${res.status}`)
    const code = (typeof data === 'object' && data?.code) || 'API_ERROR'
    throw new Error(`IAC API Error [${res.status} ${code}]: ${errorMsg}`)
  }

  return data
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || `test-${Date.now()}`
}

const server = new McpServer({
  name: 'iac-content-automation',
  version: '1.0.0',
})

// 1. Verify Connection / Ping
server.tool(
  'iac_ping',
  'Verify connection to the IELTS After Cigarette (IAC) API and validate the current MCP API key.',
  {
    api_key: z.string().optional().describe('Optional API key override (defaults to IAC_API_KEY env var)'),
  },
  async ({ api_key }) => {
    try {
      const data = await request('/admin/access', { apiKey: api_key })
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'connected',
                apiUrl: API_BASE,
                userId: data.userId,
                role: data.role,
                message: 'Successfully authenticated with IAC platform.',
              },
              null,
              2,
            ),
          },
        ],
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Connection verification failed: ${err.message}` }],
      }
    }
  },
)

// 2. List Reading Materials
server.tool(
  'iac_list_reading_materials',
  'List existing IELTS reading materials and tests from IAC library.',
  {},
  async () => {
    try {
      const data = await request('/admin/reading/materials')
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to list reading materials: ${err.message}` }],
      }
    }
  },
)

// 3. Create Reading Material
server.tool(
  'iac_create_reading_material',
  'Create a new IELTS reading material/passage with structured question groups in IAC.',
  {
    title: z.string().describe('Title of the reading passage/test'),
    slug: z.string().optional().describe('URL slug (alphanumeric and dashes, auto-generated if omitted)'),
    body: z.string().describe('HTML or Markdown text of the reading passage'),
    examType: z.enum(['academic', 'general']).default('academic').describe('Exam type: academic or general'),
    difficulty: z.enum(['foundation', 'intermediate', 'advanced']).default('intermediate').describe('Difficulty level'),
    kind: z.enum(['PASSAGE', 'TEST']).default('PASSAGE').describe('Material kind'),
    description: z.string().optional().default('').describe('Brief summary or description'),
    durationMinutes: z.number().int().optional().default(20).describe('Suggested time in minutes'),
    sourceTitle: z.string().optional().describe('Source name (e.g. Cambridge IELTS 19, BBC)'),
    sourceUrl: z.string().optional().describe('Original source URL'),
    questionGroups: z
      .array(
        z.object({
          position: z.number().int().default(1),
          type: z.string().describe('Question type e.g. multiple_choice, true_false_not_given, sentence_completion, matching_headings, etc.'),
          instructions: z.string().describe('Instructions displayed above the questions'),
          config: z.record(z.unknown()).optional(),
          questions: z.array(
            z.object({
              position: z.number().int(),
              prompt: z.string().describe('Question text or blank with {{blank_1}}'),
              content: z.record(z.unknown()).default({}),
              answer: z.record(z.unknown()).describe('Canonical answer object e.g. { value: "TRUE" } or { values: ["photosynthesis"] }'),
              explanation: z.string().default('').describe('Explanation with quotes from passage'),
              points: z.number().default(1),
            }),
          ),
        }),
      )
      .describe('Question groups belonging to this reading passage'),
    publish: z.boolean().default(true).describe('Whether to automatically publish immediately after creation'),
  },
  async (args) => {
    try {
      const payload = {
        title: args.title,
        slug: args.slug || slugify(args.title),
        examType: args.examType,
        difficulty: args.difficulty,
        kind: args.kind,
        description: args.description || '',
        body: args.body,
        durationMinutes: args.durationMinutes || 20,
        sourceTitle: args.sourceTitle || null,
        sourceUrl: args.sourceUrl || null,
        questionGroups: args.questionGroups || [],
      }

      const created = await request('/admin/reading/materials', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      let published = false
      if (args.publish && created?.id) {
        try {
          await request(`/admin/reading/materials/${created.id}/publish`, {
            method: 'POST',
            body: JSON.stringify({ revision: created.revision || 1 }),
          })
          published = true
        } catch (pubErr) {
          console.error('Warning: Created material draft, but publishing failed:', pubErr.message)
        }
      }

      const adminUrl = `${API_BASE.replace(/\/api\/v1$/, '')}/app/admin/reading/materials/${created.id}`
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                id: created.id,
                slug: created.slug,
                title: created.title,
                status: published ? 'PUBLISHED' : created.status || 'DRAFT',
                questionCount: args.questionGroups.reduce((acc, g) => acc + (g.questions?.length || 0), 0),
                adminUrl,
              },
              null,
              2,
            ),
          },
        ],
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to create reading material: ${err.message}` }],
      }
    }
  },
)

// 4. Import Raw IELTS Text
server.tool(
  'iac_import_reading_raw_text',
  'Parse raw IELTS reading text and questions using IAC parser engine and optionally save to library.',
  {
    source: z.string().describe('Raw text of the IELTS passage and questions'),
    examType: z.enum(['academic', 'general']).default('academic'),
    difficulty: z.enum(['foundation', 'intermediate', 'advanced']).default('intermediate'),
    save: z.boolean().default(true).describe('If true, saves parsed passages into IAC library'),
  },
  async ({ source, examType, difficulty, save }) => {
    try {
      const parseResult = await request('/admin/reading/import/parse', {
        method: 'POST',
        body: JSON.stringify({ source, examType, difficulty }),
      })

      if (!save) {
        return {
          content: [{ type: 'text', text: JSON.stringify(parseResult, null, 2) }],
        }
      }

      if (parseResult.errors && parseResult.errors.length > 0) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Parsing errors prevented import:\n${JSON.stringify(parseResult.errors, null, 2)}`,
            },
          ],
        }
      }

      const importResult = await request('/admin/reading/import', {
        method: 'POST',
        body: JSON.stringify({
          title: parseResult.title,
          durationMinutes: parseResult.durationMinutes || 60,
          passages: parseResult.passages.map((p) => p.material),
        }),
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                importedCount: importResult.items?.length || 0,
                items: importResult.items,
              },
              null,
              2,
            ),
          },
        ],
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to import reading text: ${err.message}` }],
      }
    }
  },
)

// 5. Publish Reading Material
server.tool(
  'iac_publish_reading_material',
  'Publish a draft IELTS reading material in IAC.',
  {
    material_id: z.string().uuid().describe('ID of the reading material to publish'),
    revision: z.number().int().default(1).describe('Revision number to publish'),
  },
  async ({ material_id, revision }) => {
    try {
      const data = await request(`/admin/reading/materials/${material_id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ revision }),
      })
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, status: 'PUBLISHED', material: data }, null, 2),
          },
        ],
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to publish reading material: ${err.message}` }],
      }
    }
  },
)

// 6. Create Listening Test
server.tool(
  'iac_create_listening_test',
  'Create a new IELTS listening test in IAC.',
  {
    title: z.string().describe('Title of the listening test'),
    durationMinutes: z.number().int().default(30),
    audioUrl: z.string().optional().describe('Audio recording URL'),
    sections: z.array(z.record(z.unknown())).describe('Listening test sections / question groups'),
    publish: z.boolean().default(true),
  },
  async (args) => {
    try {
      const payload = {
        title: args.title,
        durationMinutes: args.durationMinutes,
        audioUrl: args.audioUrl,
        sections: args.sections,
      }
      const created = await request('/admin/listening/tests', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (args.publish && created?.id) {
        await request(`/admin/listening/tests/${created.id}/publish`, {
          method: 'POST',
          body: JSON.stringify({}),
        })
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, test: created }, null, 2) }],
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to create listening test: ${err.message}` }],
      }
    }
  },
)

// 7. Create Writing Material
server.tool(
  'iac_create_writing_material',
  'Create an IELTS writing prompt/task (Task 1 or Task 2) in IAC.',
  {
    taskType: z.enum(['TASK_1', 'TASK_2']).describe('Writing task type'),
    title: z.string().describe('Title / topic'),
    prompt: z.string().describe('Full prompt text instructions'),
    sampleEssay: z.string().optional().describe('Band 8-9 sample essay response'),
    publish: z.boolean().default(true),
  },
  async (args) => {
    try {
      const created = await request('/admin/writing/materials', {
        method: 'POST',
        body: JSON.stringify({
          taskType: args.taskType,
          title: args.title,
          prompt: args.prompt,
          sampleEssay: args.sampleEssay,
        }),
      })
      if (args.publish && created?.id) {
        await request(`/admin/writing/materials/${created.id}/publish`, {
          method: 'POST',
          body: JSON.stringify({}),
        })
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, material: created }, null, 2) }],
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to create writing material: ${err.message}` }],
      }
    }
  },
)

// 8. Create Speaking Material
server.tool(
  'iac_create_speaking_material',
  'Create an IELTS speaking practice topic/task in IAC.',
  {
    part: z.number().int().min(1).max(3).describe('Speaking part: 1, 2, or 3'),
    topic: z.string().describe('Topic title'),
    questions: z.array(z.string()).describe('Questions or cue card bullets'),
    publish: z.boolean().default(true),
  },
  async (args) => {
    try {
      const created = await request('/admin/speaking/materials', {
        method: 'POST',
        body: JSON.stringify({
          part: args.part,
          topic: args.topic,
          questions: args.questions,
        }),
      })
      if (args.publish && created?.id) {
        await request(`/admin/speaking/materials/${created.id}/publish`, {
          method: 'POST',
          body: JSON.stringify({}),
        })
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, material: created }, null, 2) }],
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to create speaking material: ${err.message}` }],
      }
    }
  },
)

async function resolveFileBlob(filePathOrUrl, defaultFilename = 'upload.bin') {
  if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
    const res = await fetch(filePathOrUrl)
    if (!res.ok) throw new Error(`Failed to download file from URL (${res.status} ${res.statusText})`)
    const arrayBuffer = await res.arrayBuffer()
    const urlFilename = path.basename(new URL(filePathOrUrl).pathname) || defaultFilename
    return {
      blob: new Blob([arrayBuffer]),
      filename: urlFilename,
    }
  }

  const resolved = path.resolve(filePathOrUrl)
  if (!fs.existsSync(resolved)) {
    throw new Error(`Local file not found at path: ${resolved}`)
  }
  const buffer = fs.readFileSync(resolved)
  return {
    blob: new Blob([buffer]),
    filename: path.basename(resolved) || defaultFilename,
  }
}

// 9. Upload Audio
server.tool(
  'iac_upload_audio',
  'Upload an audio recording (.mp3, .m4a, .wav, .ogg, .webm) for an IELTS Listening test to IAC media storage, returning audioAssetId.',
  {
    filePathOrUrl: z.string().describe('Local file path or HTTPS URL of the audio file to upload'),
    filename: z.string().optional().describe('Optional custom filename with extension (e.g. listening-part-1.mp3)'),
  },
  async ({ filePathOrUrl, filename }) => {
    try {
      const fileInfo = await resolveFileBlob(filePathOrUrl, 'audio.mp3')
      const form = new FormData()
      form.append('file', fileInfo.blob, filename || fileInfo.filename)

      const result = await request('/admin/listening/media', {
        method: 'POST',
        body: form,
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                audioAssetId: result.id,
                originalName: result.originalName,
                mimeType: result.mimeType,
                byteSize: result.byteSize,
                message: 'Audio successfully uploaded. Pass this audioAssetId to iac_create_listening_test parts.',
              },
              null,
              2,
            ),
          },
        ],
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to upload audio: ${err.message}` }],
      }
    }
  },
)

// 10. Upload Image
server.tool(
  'iac_upload_image',
  'Upload an image/diagram/chart/map (.png, .jpg, .webp) for IELTS Writing Task 1 or Reading/Listening questions to IAC media storage.',
  {
    filePathOrUrl: z.string().describe('Local file path or HTTPS URL of the image to upload'),
    category: z.enum(['writing', 'listening', 'blog']).default('writing').describe('Target media category'),
    filename: z.string().optional().describe('Optional custom filename with extension (e.g. chart-line-graph.png)'),
  },
  async ({ filePathOrUrl, category, filename }) => {
    try {
      const fileInfo = await resolveFileBlob(filePathOrUrl, 'image.png')
      const form = new FormData()
      form.append('file', fileInfo.blob, filename || fileInfo.filename)

      const endpoint = category === 'listening' ? '/admin/listening/media' : category === 'blog' ? '/admin/blog/media' : '/admin/writing/media'
      const result = await request(endpoint, {
        method: 'POST',
        body: form,
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                assetId: result.id,
                category,
                originalName: result.originalName,
                mimeType: result.mimeType,
                byteSize: result.byteSize,
                message: category === 'writing'
                  ? 'Image successfully uploaded. Pass this assetId as visualAssetId in iac_create_writing_material task1.'
                  : 'Image successfully uploaded.',
              },
              null,
              2,
            ),
          },
        ],
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to upload image: ${err.message}` }],
      }
    }
  },
)

async function run() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('IAC MCP Server running on stdio transport')
}

run().catch((err) => {
  console.error('Fatal error starting IAC MCP Server:', err)
  process.exit(1)
})
