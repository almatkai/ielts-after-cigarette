import { BrandLogo } from '@/components/landing/brand'
import { Card } from '@/components/ui/card'
import { LanguagePicker } from '@/components/ui/language-picker'

type AuthShellProps = { children: React.ReactNode }

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header>
        <div className="container-shell flex h-20 items-center justify-between">
          <BrandLogo />
          <div className="w-36">
            <LanguagePicker compact />
          </div>
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-80px)] w-full items-center justify-center px-5 py-10 sm:py-14">
        <Card className="w-full max-w-[430px] gap-0 overflow-hidden border-border bg-card py-0 shadow-none max-[479px]:border-0 max-[479px]:bg-background">
          <div className="flex justify-center pt-7">
            <BrandLogo variant="stacked" />
          </div>
          {children}
        </Card>
      </main>
    </div>
  )
}
