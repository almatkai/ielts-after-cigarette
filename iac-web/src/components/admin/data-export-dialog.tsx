import { useState } from 'react'
import { Copy, DocumentDownload, TickCircle } from 'iconsax-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { downloadTextFile } from '@/features/admin/export-utils'

type DataExportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  formatLabel: string
  filename: string
  content: string
}

export function DataExportDialog({
  open,
  onOpenChange,
  title,
  formatLabel,
  filename,
  content,
}: DataExportDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy to clipboard', e)
    }
  }

  const handleDownload = () => {
    const isJson = filename.endsWith('.json')
    downloadTextFile(
      filename,
      content,
      isJson ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8',
    )
  }

  const lineCount = content.split('\n').length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-4 p-6">
        <DialogHeader className="gap-1.5 text-left">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl font-bold tracking-tight">
              Экспорт: {title}
            </DialogTitle>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-[11px]"
            >
              {formatLabel}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Данные в формате, полностью готовом для повторного импорта или
            сохранения резервной копии.
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-1 min-h-[300px] max-h-[55vh] flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 bg-slate-100/80 text-[11px] font-mono text-slate-500">
            <span>{filename}</span>
            <span>
              {content.length.toLocaleString()} симв. • {lineCount} строк
            </span>
          </div>
          <textarea
            readOnly
            value={content}
            className="flex-1 w-full p-4 font-mono text-xs leading-relaxed bg-transparent resize-none focus:outline-hidden select-all"
            spellCheck={false}
          />
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-2 sm:justify-between pt-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 text-xs font-semibold h-9"
            >
              {copied ? (
                <>
                  <TickCircle className="size-4 text-emerald-600" />
                  <span className="text-emerald-700">Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="size-4 text-slate-600" />
                  <span>Копировать в буфер</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white h-9 shadow-2xs"
            >
              <DocumentDownload className="size-4" />
              <span>Скачать файл</span>
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-slate-500 h-9"
          >
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
