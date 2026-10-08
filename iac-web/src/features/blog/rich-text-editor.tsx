import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Code,
  Gallery,
  Link1,
  QuoteUp,
  TextBold,
  TextItalic,
  TextUnderline,
  TextalignCenter,
  TextalignLeft,
  TextalignRight,
} from 'iconsax-react'
import { useCallback, useRef, useState } from 'react'

import { blogMediaUrl, uploadBlogMedia } from '@/features/blog/api'
import { cn } from '@/lib/utils'

import type { Editor } from '@tiptap/react'

type BlogRichTextEditorProps = {
  content: string
  onChange: (html: string) => void
  disabled?: boolean
}

type IconComponent = React.ComponentType<{ className?: string }>

// Outline glyphs for actions iconsax has no clear icon for.
function glyph(paths: string[]): IconComponent {
  return function Glyph({ className }) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    )
  }
}

const UndoIcon = glyph(['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'])
const RedoIcon = glyph(['m15 14 5-5-5-5', 'M20 9H9.5a5.5 5.5 0 0 0 0 11H13'])
const StrikeIcon = glyph([
  'M16 4H9a3 3 0 0 0-2.83 4',
  'M14 12a4 4 0 0 1 0 8H6',
  'M4 12h16',
])
const HighlightIcon = glyph([
  'm9 11-6 6v3h9l3-3',
  'm22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4',
])
const BulletListIcon = glyph([
  'M9 6h11',
  'M9 12h11',
  'M9 18h11',
  'M4.5 6h.01',
  'M4.5 12h.01',
  'M4.5 18h.01',
])
const OrderedListIcon = glyph([
  'M10 6h10',
  'M10 12h10',
  'M10 18h10',
  'M4 6h1v4',
  'M4 10h2',
  'M6 18H4c0-1 2-2 2-3s-1-1.5-2-1',
])
const CodeBlockIcon = glyph(['M4 4h16v16H4z', 'm10 9-3 3 3 3', 'm14 9 3 3-3 3'])
const DividerIcon = glyph(['M3 12h18', 'M8 6h8', 'M8 18h8'])

type BlockType = 'paragraph' | 'h2' | 'h3'

const blockTypes: { value: BlockType; label: string }[] = [
  { value: 'paragraph', label: 'Обычный текст' },
  { value: 'h2', label: 'Заголовок' },
  { value: 'h3', label: 'Подзаголовок' },
]

export function BlogRichTextEditor({
  content,
  onChange,
  disabled = false,
}: BlogRichTextEditorProps) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Image.configure({ allowBase64: false }),
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder:
          'Напишите статью: делитесь опытом подготовки, стратегиями и разборами заданий…',
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML())
    },
  })

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return
      setUploadError(null)
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        setUploading((count) => count + 1)
        try {
          const media = await uploadBlogMedia(file)
          editor
            .chain()
            .focus()
            .setImage({ src: blogMediaUrl(media.id) })
            .run()
        } catch {
          setUploadError(`Не удалось загрузить «${file.name}».`)
        } finally {
          setUploading((count) => count - 1)
        }
      }
    },
    [editor],
  )

  return (
    <div className="rounded-[12px] border border-[#e7e7e4] bg-white">
      <Toolbar
        editor={editor}
        disabled={disabled}
        onPickImage={() => uploadInputRef.current?.click()}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files)
          event.target.value = ''
        }}
      />
      {uploading > 0 || uploadError ? (
        <p
          className={cn(
            'border-b border-[#ededeb] px-4 py-2 text-xs',
            uploadError ? 'text-[#c92f2f]' : 'text-[#69696d]',
          )}
        >
          {uploadError ?? 'Сжимаем и загружаем изображение…'}
        </p>
      ) : null}
      <EditorContent
        editor={editor}
        className="blog-editor blog-article min-h-[360px] px-5 py-4"
        onDrop={(event) => {
          if (event.dataTransfer.files.length === 0) return
          event.preventDefault()
          void handleFiles(event.dataTransfer.files)
        }}
        onPaste={(event) => {
          const files = event.clipboardData.files
          if (files.length > 0) {
            event.preventDefault()
            void handleFiles(files)
          }
        }}
      />
    </div>
  )
}

function Toolbar({
  editor,
  disabled,
  onPickImage,
}: {
  editor: Editor
  disabled: boolean
  onPickImage: () => void
}) {
  // useEditor does not re-render on selection changes, so toolbar state is
  // read through a selector that updates on every transaction.
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      block: (current.isActive('heading', { level: 2 })
        ? 'h2'
        : current.isActive('heading', { level: 3 })
          ? 'h3'
          : 'paragraph'),
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      underline: current.isActive('underline'),
      strike: current.isActive('strike'),
      highlight: current.isActive('highlight'),
      code: current.isActive('code'),
      bulletList: current.isActive('bulletList'),
      orderedList: current.isActive('orderedList'),
      blockquote: current.isActive('blockquote'),
      codeBlock: current.isActive('codeBlock'),
      link: current.isActive('link'),
      alignCenter: current.isActive({ textAlign: 'center' }),
      alignRight: current.isActive({ textAlign: 'right' }),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  })

  const chain = () => editor.chain().focus()

  const setBlock = (value: BlockType) => {
    if (value === 'paragraph') chain().setParagraph().run()
    else
      chain()
        .setHeading({ level: value === 'h2' ? 2 : 3 })
        .run()
  }

  const editLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Адрес ссылки', previous ?? 'https://')
    if (url === null) return
    if (url.trim() === '') {
      chain().extendMarkRange('link').unsetLink().run()
      return
    }
    chain().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  return (
    <div
      role="toolbar"
      aria-label="Форматирование текста"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-[12px] border-b border-[#ededeb] bg-white/95 px-2 py-1.5 backdrop-blur"
    >
      <ToolButton
        label="Отменить (Ctrl+Z)"
        icon={UndoIcon}
        disabled={disabled || !state.canUndo}
        onClick={() => chain().undo().run()}
      />
      <ToolButton
        label="Повторить (Ctrl+Shift+Z)"
        icon={RedoIcon}
        disabled={disabled || !state.canRedo}
        onClick={() => chain().redo().run()}
      />
      <Divider />
      <select
        aria-label="Стиль абзаца"
        value={state.block}
        disabled={disabled}
        onChange={(event) => setBlock(event.target.value as BlockType)}
        className="h-8 rounded-[8px] bg-transparent px-1.5 text-sm font-medium text-[#111111] outline-none hover:bg-[#f4f4f1]"
      >
        {blockTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
      <Divider />
      <ToolButton
        label="Жирный (Ctrl+B)"
        icon={TextBold}
        active={state.bold}
        disabled={disabled}
        onClick={() => chain().toggleBold().run()}
      />
      <ToolButton
        label="Курсив (Ctrl+I)"
        icon={TextItalic}
        active={state.italic}
        disabled={disabled}
        onClick={() => chain().toggleItalic().run()}
      />
      <ToolButton
        label="Подчёркнутый (Ctrl+U)"
        icon={TextUnderline}
        active={state.underline}
        disabled={disabled}
        onClick={() => chain().toggleUnderline().run()}
      />
      <ToolButton
        label="Зачёркнутый"
        icon={StrikeIcon}
        active={state.strike}
        disabled={disabled}
        onClick={() => chain().toggleStrike().run()}
      />
      <ToolButton
        label="Выделить маркером"
        icon={HighlightIcon}
        active={state.highlight}
        disabled={disabled}
        onClick={() => chain().toggleHighlight().run()}
      />
      <ToolButton
        label="Код в строке"
        icon={Code}
        active={state.code}
        disabled={disabled}
        onClick={() => chain().toggleCode().run()}
      />
      <ToolButton
        label="Ссылка"
        icon={Link1}
        active={state.link}
        disabled={disabled}
        onClick={editLink}
      />
      <Divider />
      <ToolButton
        label="Маркированный список"
        icon={BulletListIcon}
        active={state.bulletList}
        disabled={disabled}
        onClick={() => chain().toggleBulletList().run()}
      />
      <ToolButton
        label="Нумерованный список"
        icon={OrderedListIcon}
        active={state.orderedList}
        disabled={disabled}
        onClick={() => chain().toggleOrderedList().run()}
      />
      <ToolButton
        label="Цитата"
        icon={QuoteUp}
        active={state.blockquote}
        disabled={disabled}
        onClick={() => chain().toggleBlockquote().run()}
      />
      <ToolButton
        label="Блок кода или примера"
        icon={CodeBlockIcon}
        active={state.codeBlock}
        disabled={disabled}
        onClick={() => chain().toggleCodeBlock().run()}
      />
      <ToolButton
        label="Разделитель"
        icon={DividerIcon}
        disabled={disabled}
        onClick={() => chain().setHorizontalRule().run()}
      />
      <Divider />
      <ToolButton
        label="По левому краю"
        icon={TextalignLeft}
        active={!state.alignCenter && !state.alignRight}
        disabled={disabled}
        onClick={() => chain().unsetTextAlign().run()}
      />
      <ToolButton
        label="По центру"
        icon={TextalignCenter}
        active={state.alignCenter}
        disabled={disabled}
        onClick={() => chain().setTextAlign('center').run()}
      />
      <ToolButton
        label="По правому краю"
        icon={TextalignRight}
        active={state.alignRight}
        disabled={disabled}
        onClick={() => chain().setTextAlign('right').run()}
      />
      <Divider />
      <ToolButton
        label="Изображение (или перетащите и вставьте из буфера)"
        icon={Gallery}
        disabled={disabled}
        onClick={onPickImage}
      />
    </div>
  )
}

function ToolButton({
  label,
  icon: Icon,
  active = false,
  disabled,
  onClick,
}: {
  label: string
  icon: IconComponent
  active?: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      // Keep the text selection while clicking toolbar buttons.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'grid size-8 place-items-center rounded-[8px] text-[#525256] transition-colors hover:bg-[#f4f4f1] hover:text-[#111111] disabled:pointer-events-none disabled:opacity-35',
        active && 'bg-[#eff6ff] text-[#1d4ed8] hover:bg-[#e3eefe]',
      )}
    >
      <Icon className="size-[18px]" />
    </button>
  )
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-[#e7e7e4]" aria-hidden />
}
