import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function FullMockSectionComplete({ sessionId }: { sessionId: string }) {
  return (
    <div className="mx-auto grid w-full max-w-[1120px] gap-4 px-4 py-6 sm:px-6">
      <h1 className="text-[28px] sm:text-[36px] font-semibold">
        Section complete
      </h1>
      <p className="text-sm text-muted-foreground">
        Your results and review will open after the Full Mock is finished.
      </p>
      <Button asChild className="justify-self-start">
        <Link to="/exam/full-mock-sessions/$sessionId" params={{ sessionId }}>
          Continue the Full Mock
        </Link>
      </Button>
    </div>
  )
}
