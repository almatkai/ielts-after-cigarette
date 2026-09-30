import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Gallery,
  Link1,
  MenuBoard,
  Note,
  NoteText,
  Text,
  TextBlock,
  TextBold,
  TextItalic,
} from 'iconsax-react'
import { useCallback, useRef } from 'react'

import { blogMediaUrl, uploadBlogMedia } from '@/features/blog/api'
import { cn } from '@/lib/utils'

type BlogRichTextEditorProps = {
  content: string
  onChange: (html: string) => void
  disabled?: boolean
}

type ToolbarAction = {
  key: string
  label: string
  icon: typeof TextBold
  isActive: () => boolean
  run: () => void
}

export function BlogRichTextEditor({
  content,
  onChange,
  disabled = false,
}: BlogRichTextEditorProps) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

  const uploadInlineImage = useCallback(async (file: File) => {
    const media = await uploadBlogMedia(file)
    return blogMediaUrl(media.id)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
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

  const chain = () => editor.chain().focus()

  const actions: ToolbarAction[] = [
    {
      key: 'h2',
      label: 'Заголовок',
      icon: TextBlock,
      isActive: () => editor.isActive('heading', { level: 2 }),
      run: () => chain().toggleHeading({ level: 2 }).run(),
    },
    {
      key: 'p',
      label: 'Текст',
      icon: Text,
      isActive: () =>
        editor.isActive('paragraph') &&
        !editor.isActive('bulletList') &&
        !editor.isActive('orderedList'),
      run: () => chain().setParagraph().run(),
    },
    {
      key: 'bold',
      label: 'Жирный',
      icon: TextBold,
      isActive: () => editor.isActive('bold'),
      run: () => chain().toggleBold().run(),
    },
    {
      key: 'italic',
      label: 'Курсив',
      icon: TextItalic,
      isActive: () => editor.isActive('italic'),
      run: () => chain().toggleItalic().run(),
    },
    {
      key: 'bulletList',
      label: 'Список',
      icon: Note,
      isActive: () => editor.isActive('bulletList'),
      run: () => chain().toggleBulletList().run(),
    },
    {
      key: 'orderedList',
      label: 'Нумерованный список',
      icon: MenuBoard,
      isActive: () => editor.isActive('orderedList'),
      run: () => chain().toggleOrderedList().run(),
    },
    {
      key: 'blockquote',
      label: 'Цитата',
      icon: NoteText,
      isActive: () => editor.isActive('blockquote'),
      run: () => chain().toggleBlockquote().run(),
    },
    {
      key: 'link',
      label: 'Ссылка',
      icon: Link1,
      isActive: () => editor.isActive('link'),
      run: () => {
        const previous = editor.getAttributes('link').href as string | undefined
        const url = window.prompt('URL ссылки', previous ?? 'https://')
        if (url === null) return
        if (url === '') {
          editor.chain().focus().extendMarkRange('link').unsetLink().run()
          return
        }
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .setLink({ href: url })
          .run()
      },
    },
  ]

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        try {
          const url = await uploadInlineImage(file)
          editor.chain().focus().setImage({ src: url }).run()
        } catch (error) {
          console.error('Не удалось загрузить изображение', error)
        }
      }
    },
    [editor, uploadInlineImage],
  )

  return (
    <div className="rounded-[12px] border border-[#e7e7e4] bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#ededeb] px-2 py-2">
        {actions.map((action) => {
          const Icon = action.icon
          const active = action.isActive()
          return (
            <button
              key={action.key}
              type="button"
              disabled={disabled}
              onClick={action.run}
              aria-label={action.label}
              title={action.label}
              className={cn(
                'grid size-9 place-items-center rounded-[8px] text-[#69696d] transition-colors hover:bg-[#f4f4f1] hover:text-[#111111]',
                active && 'bg-[#eff6ff] text-[#1d4ed8]',
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
            </button>
          )
        })}
        <button
          type="button"
          disabled={disabled}
          onClick={() => uploadInputRef.current?.click()}
          aria-label="Вставить изображение"
          title="Вставить изображение (или перетащите файл в текст)"
          className="grid size-9 place-items-center rounded-[8px] text-[#69696d] transition-colors hover:bg-[#f4f4f1] hover:text-[#111111]"
        >
          <Gallery className="size-[18px]" aria-hidden />
        </button>
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
        <span className="ml-auto pr-1 text-[11px] text-[#808084]">
          Вставка из буфера и Drag&amp;Drop поддерживаются
        </span>
      </div>
      <EditorContent
        editor={editor}
        className="blog-editor min-h-[320px] px-4 py-3"
        onDrop={(event) => {
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
