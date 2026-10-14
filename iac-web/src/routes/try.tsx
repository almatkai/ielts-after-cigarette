import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/try')({ component: TrialEntry })
function TrialEntry() {
  const navigate = useNavigate()
  useEffect(() => {
    void navigate({ to: '/', replace: true })
  }, [navigate])
  return (
    <p className="p-8" role="status">
      Открываем IELTS…
    </p>
  )
}
