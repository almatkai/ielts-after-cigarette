import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function FullMockSectionComplete({ sessionId }: { sessionId: string }) {
  return (
    <div className="mx-auto grid w-full max-w-[1120px] gap-4 px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-semibold">Секция завершена</h1>
      <p className="text-sm text-[#69696d]">
        Результаты и разбор откроются после завершения Full Mock.
      </p>
      <Button asChild className="justify-self-start">
        <Link to="/exam/full-mock-sessions/$sessionId" params={{ sessionId }}>
          Продолжить Full Mock
        </Link>
      </Button>
    </div>
  )
}
