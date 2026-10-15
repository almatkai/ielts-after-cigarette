import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { useAuth } from '@/features/auth/auth-store'
import { useLanguage } from '@/lib/i18n'
import { fullMockKeys, getFullMockOverview } from './api'

// Shown immediately on a submitted listening result, including the final test
// in the bank. This does not block the student's score if the overview fails.
export function CompletedBankNotice({ attemptId }: { attemptId: string }) {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const query = useQuery({
    queryKey: [
      ...fullMockKeys.overview(user?.id, user?.examType),
      'completed',
      attemptId,
    ],
    queryFn: ({ signal }) => getFullMockOverview(signal),
    retry: false,
    staleTime: 0,
  })
  const bank = query.data?.banks.find((item) => item.skill === 'listening')
  if (!bank?.isExhausted) return null
  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"
    >
      <p className="font-semibold">
        {language === 'en'
          ? `You have completed all available Listening tests (${bank.completed} of ${bank.total}).`
          : language === 'kk'
            ? `Сіз Listening бойынша барлық қолжетімді тестті орындадыңыз (${bank.completed} / ${bank.total}).`
            : `Вы выполнили все доступные тесты Listening (${bank.completed} из ${bank.total}).`}
      </p>
      <p className="mt-1">
        {language === 'en'
          ? 'In upcoming Full Mocks, Listening tests will repeat and be chosen at random. Other sections will first be picked from tests you have not taken yet.'
          : language === 'kk'
            ? 'Келесі Full Mock сынақтарында Listening тесттері қайталанып, кездейсоқ таңдалады. Басқа бөлімдер алдымен орындалмаған тапсырмалардан таңдалады.'
            : 'В следующих Full Mock тесты Listening будут повторяться и выбираться случайно. Другие секции сначала подбираются из непройденных заданий.'}
      </p>
      <Link
        to="/full-mocks"
        className="mt-2 inline-block font-semibold underline"
      >
        {t('К Full Mock')}
      </Link>
    </div>
  )
}
