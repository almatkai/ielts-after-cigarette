import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useLanguage } from '@/lib/i18n'

export const Route = createFileRoute('/try')({ component: TrialEntry })
function TrialEntry() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  useEffect(() => {
    void navigate({ to: '/', replace: true })
  }, [navigate])
  return (
    <p className="p-8" role="status">
      {t('Открываем IELTS…')}
    </p>
  )
}
