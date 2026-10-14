import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { useAuth } from '@/features/auth/auth-store'
import { fullMockKeys, getFullMockOverview } from './api'

// Shown immediately on a submitted listening result, including the final test
// in the bank. This does not block the student's score if the overview fails.
export function CompletedBankNotice({ attemptId }: { attemptId: string }) {
  const { user, guest } = useAuth()
  const query = useQuery({
    queryKey: [
      ...fullMockKeys.overview(user?.id, user?.examType),
      'completed',
      attemptId,
    ],
    queryFn: ({ signal }) => getFullMockOverview(signal),
    enabled: !guest,
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
        Вы выполнили все доступные тесты Listening ({bank.completed} из{' '}
        {bank.total}).
      </p>
      <p className="mt-1">
        В следующих Full Mock тесты Listening будут повторяться и выбираться
        случайно. Другие секции сначала подбираются из непройденных заданий.
      </p>
      <Link
        to="/full-mocks"
        className="mt-2 inline-block font-semibold underline"
      >
        К Full Mock
      </Link>
    </div>
  )
}
