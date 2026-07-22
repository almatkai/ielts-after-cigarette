import { Brand } from '@/components/landing/brand'
import { Card } from '@/components/ui/card'
import { BorderBeam } from '@/registry/magicui/border-beam'

type AuthShellProps = {
  children: React.ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#111111]">
      <header>
        <div className="container-shell flex h-20 items-center justify-center">
          <Brand />
        </div>
      </header>

      <main className="container-shell flex min-h-[calc(100vh-80px)] items-center justify-center py-10 sm:py-14">
        <Card className="relative w-full max-w-[430px] gap-0 overflow-hidden border-[#e7e7e4] bg-white py-0 shadow-[0_22px_70px_rgba(17,17,17,0.07)]">
          {children}
          <BorderBeam
            duration={8}
            size={100}
            colorFrom="#e23b3b"
            colorTo="#ffffff"
            borderWidth={1.5}
          />
        </Card>
      </main>
    </div>
  )
}
