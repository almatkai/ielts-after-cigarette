import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { DocumentUpload, TickCircle } from 'iconsax-react'
import { useRef, useState } from 'react'

import {
  getMyApplication,
  submitWriterApplication,
  uploadBlogMedia,
} from '@/features/blog/api'
import { useAuth } from '@/features/auth/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const MIN_OVERALL_BAND = 7.5
const halfBandOptions = Array.from({ length: 19 }, (_, index) =>
  (index * 0.5).toFixed(1),
)

type BandSelectProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  min?: number
}

function BandSelect({ id, label, value, onChange, min }: BandSelectProps) {
  const options = halfBandOptions.filter((band) => {
    const numeric = Number(band)
    return min === undefined || numeric >= min
  })
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {options.map((band) => (
            <SelectItem key={band} value={band}>
              Band {band}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ApplicationForm() {
  const navigate = useNavigate()
  const [overallBand, setOverallBand] = useState('')
  const [listeningBand, setListeningBand] = useState('')
  const [readingBand, setReadingBand] = useState('')
  const [writingBand, setWritingBand] = useState('')
  const [speakingBand, setSpeakingBand] = useState('')
  const [trfNumber, setTrfNumber] = useState('')
  const [testDate, setTestDate] = useState('')
  const [examType, setExamType] = useState<'academic' | 'general' | ''>('')
  const [bio, setBio] = useState('')
  const [certificateMediaId, setCertificateMediaId] = useState<string | null>(
    null,
  )
  const [certificateName, setCertificateName] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadBlogMedia(file),
    onSuccess: (media) => {
      setCertificateMediaId(media.id)
      setCertificateName(media.originalName)
    },
  })

  const applyMutation = useMutation({
    mutationFn: () =>
      submitWriterApplication({
        overallBand: Number(overallBand),
        listeningBand: listeningBand === '' ? null : Number(listeningBand),
        readingBand: Number(readingBand),
        writingBand: Number(writingBand),
        speakingBand: Number(speakingBand),
        trfNumber,
        testDate: testDate === '' ? null : testDate,
        examType: examType === '' ? null : examType,
        bio,
        certificateMediaId: certificateMediaId ?? '',
      }),
    onSuccess: () => {
      void navigate({ to: '/blog/become-writer' })
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setValidationError(null)
    if (Number(overallBand) < MIN_OVERALL_BAND) {
      setValidationError(
        `Заявки принимаются только с официальным общим баллом IELTS ${MIN_OVERALL_BAND}+`,
      )
      return
    }
    if (readingBand === '' || writingBand === '' || speakingBand === '') {
      setValidationError('Укажите баллы Reading, Writing и Speaking')
      return
    }
    if (!certificateMediaId) {
      setValidationError('Загрузите скан или фото сертификата IELTS')
      return
    }
    applyMutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <BandSelect
          id="overall-band"
          label={`Общий балл (минимум ${MIN_OVERALL_BAND}) *`}
          value={overallBand}
          onChange={setOverallBand}
          min={MIN_OVERALL_BAND}
        />
        <BandSelect
          id="listening-band"
          label="Listening"
          value={listeningBand}
          onChange={setListeningBand}
        />
        <BandSelect
          id="reading-band"
          label="Reading *"
          value={readingBand}
          onChange={setReadingBand}
        />
        <BandSelect
          id="writing-band"
          label="Writing *"
          value={writingBand}
          onChange={setWritingBand}
        />
        <BandSelect
          id="speaking-band"
          label="Speaking *"
          value={speakingBand}
          onChange={setSpeakingBand}
        />
        <div className="grid gap-1.5">
          <Label htmlFor="exam-type">Тип экзамена</Label>
          <Select
            value={examType}
            onValueChange={(value) =>
              setExamType(value as 'academic' | 'general' | '')
            }
          >
            <SelectTrigger id="exam-type" className="w-full">
              <SelectValue placeholder="Не указан" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="general">General Training</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="trf-number">Номер сертификата (TRF) *</Label>
          <Input
            id="trf-number"
            value={trfNumber}
            onChange={(event) => setTrfNumber(event.target.value)}
            placeholder="Например: 25RU000123ALMATY01"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="test-date">Дата сдачи теста</Label>
          <Input
            id="test-date"
            type="date"
            value={testDate}
            onChange={(event) => setTestDate(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Сертификат IELTS * (PNG, JPG, WebP или GIF)</Label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 rounded-[12px] border border-dashed border-[#c9c9c4] bg-[#fbfbfa] px-4 py-4 text-left transition-colors hover:bg-[#f4f4f1]"
        >
          <DocumentUpload
            className="size-5 shrink-0 text-[#69696d]"
            aria-hidden
          />
          {certificateName ? (
            <span className="min-w-0 truncate text-sm font-semibold text-[#111111]">
              {certificateName}
            </span>
          ) : (
            <span className="text-sm text-[#69696d]">
              Нажмите, чтобы загрузить скан или фото сертификата
            </span>
          )}
          {uploadMutation.isPending ? (
            <span className="ml-auto text-xs text-[#808084]">Загружаем…</span>
          ) : null}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) uploadMutation.mutate(file)
            event.target.value = ''
          }}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="bio">
          Коротко о себе и темах, о которых хотите писать
        </Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={4}
          placeholder="Например: сдал IELTS Academic на 8.0, готовлю студентов к Writing, хочу писать разборы эссе"
        />
      </div>

      {(validationError || applyMutation.isError || uploadMutation.isError) && (
        <p className="rounded-[10px] bg-[#fef2f2] px-4 py-3 text-sm text-[#c92f2f]">
          {validationError ??
            (applyMutation.isError
              ? 'Не удалось отправить заявку. Проверьте данные и попробуйте ещё раз.'
              : 'Не удалось загрузить сертификат. Попробуйте другой файл.')}
        </p>
      )}

      <Button
        type="submit"
        disabled={applyMutation.isPending || uploadMutation.isPending}
        className="justify-self-start"
      >
        {applyMutation.isPending ? 'Отправляем…' : 'Отправить заявку'}
      </Button>
    </form>
  )
}

export function BecomeWriterPage() {
  const auth = useAuth()
  const applicationQuery = useQuery({
    queryKey: ['blog', 'writer-applications', 'mine'],
    queryFn: ({ signal }) => getMyApplication(signal),
  })

  const application = applicationQuery.data?.application ?? null
  const alreadyWriter = auth.user?.role === 'WRITER'
  const authenticated = Boolean(auth.user && auth.accessToken)

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="border-b border-[#e7e7e4] bg-white">
        <div className="mx-auto flex min-h-16 max-w-[760px] items-center justify-between px-5 sm:px-7">
          <Link to="/blog" className="text-sm font-semibold tracking-[-0.01em]">
            IAC · Блог
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-5 py-10 sm:px-7">
        <p className="text-xs font-semibold tracking-[0.08em] text-[#3b82f6] uppercase">
          Авторам
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Стать автором блога
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#69696d]">
          Публикации в блоге пишут авторы с подтверждённым официальным IELTS от
          7.5. Заполните заявку — команда платформы проверит баллы и сертификат
          и откроет доступ к редактору.
        </p>

        {!authenticated ? (
          <div className="mt-8 rounded-[16px] border border-[#e7e7e4] bg-white p-6 text-sm leading-6 text-[#69696d]">
            Чтобы отправить заявку, войдите в аккаунт платформы.
          </div>
        ) : alreadyWriter ? (
          <div className="mt-8 flex items-center gap-3 rounded-[16px] border border-[#e7e7e4] bg-white p-6 text-sm">
            <TickCircle className="size-5 text-emerald-600" aria-hidden />У вас
            уже есть роль автора — редактор статей доступен в кабинете.
          </div>
        ) : application?.status === 'PENDING' ? (
          <div className="mt-8 rounded-[16px] border border-[#e7e7e4] bg-white p-6 text-sm leading-6 text-[#69696d]">
            <p className="font-semibold text-[#111111]">Заявка на проверке</p>
            <p className="mt-2">
              Вы отправили заявку с общим баллом {application.overallBand}. Мы
              проверим сертификат и сообщим вам о решении.
            </p>
          </div>
        ) : application?.status === 'APPROVED' ? (
          <div className="mt-8 rounded-[16px] border border-[#e7e7e4] bg-white p-6 text-sm leading-6 text-[#69696d]">
            Заявка одобрена — обновите страницу, чтобы получить доступ к
            редактору.
          </div>
        ) : application?.status === 'REJECTED' ? (
          <div className="mt-8 grid gap-4">
            <div className="rounded-[16px] border border-[#e7e7e4] bg-white p-6 text-sm leading-6 text-[#69696d]">
              <p className="font-semibold text-[#111111]">Заявка отклонена</p>
              {application.reviewNotes ? (
                <p className="mt-2">Причина: {application.reviewNotes}</p>
              ) : null}
            </div>
            <ApplicationForm />
          </div>
        ) : (
          <div className="mt-8">
            <ApplicationForm />
          </div>
        )}
      </main>
    </div>
  )
}
