import { Brand } from '@/components/landing/brand'
import { Card } from '@/components/ui/card'
import { heroContent } from '#/content/landing-content'
import { BorderBeam } from '@/registry/magicui/border-beam'

import { AuthBackground } from './auth-background'

type AuthShellProps = {
  children: React.ReactNode
}

const bandSteps = [
  { band: '5.0', height: 28, active: false },
  { band: '5.5', height: 38, active: false },
  { band: '6.0', height: 52, active: false },
  { band: '6.5', height: 66, active: false },
  { band: '7.0', height: 82, active: false },
  { band: '7.5+', height: 100, active: true },
] as const

const skillChips = ['Аудирование', 'Чтение', 'Письмо', 'Устная речь'] as const

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <AuthBackground />
      <header className="relative z-10">
        <div className="container-shell flex h-20 items-center justify-start">
          <Brand />
        </div>
      </header>

      <main className="container-shell relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center py-10 sm:py-14">
        <div className="relative grid w-full max-w-[430px] overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_22px_70px_rgba(15,23,42,0.07)] lg:max-w-[960px] lg:grid-cols-[1.05fr_1fr]">
          <aside className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-[#0f172a] p-10 lg:flex">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255, 255, 255, 0.16) 1px, transparent 1.1px)',
                backgroundSize: '24px 24px',
                maskImage:
                  'radial-gradient(ellipse 90% 80% at 30% 30%, black 0%, rgba(0, 0, 0, 0.7) 55%, transparent 85%)',
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute right-[-30%] bottom-[-35%] size-[420px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
              }}
              aria-hidden
            />

            <div className="relative">
              <div className="inline-flex flex-col items-start gap-2 text-xs font-semibold tracking-[0.09em] text-[#93c5fd] uppercase">
                <span>{heroContent.eyebrow}</span>
                <span className="h-px w-9 bg-[#3b82f6]" aria-hidden />
              </div>
              <h2 className="mt-6 text-3xl leading-[1.15] font-semibold tracking-[-0.02em] text-white">
                {heroContent.titleStart}{' '}
                <span className="text-[#3b82f6]">{heroContent.titleAccent}</span>.
              </h2>
              <p className="mt-4 max-w-[380px] text-sm leading-6 text-[#cbd5e1]">
                {heroContent.description}
              </p>
            </div>

            <div className="relative">
              <div className="flex items-end gap-3" aria-hidden>
                {bandSteps.map((step) => (
                  <div
                    key={step.band}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div
                      className={`w-full rounded-[6px] ${step.active ? 'bg-[#3b82f6]' : 'bg-[#1e293b]'}`}
                      style={{ height: `${step.height}px` }}
                    />
                    <span
                      className={`text-[11px] font-semibold ${step.active ? 'text-[#93c5fd]' : 'text-[#64748b]'}`}
                    >
                      {step.band}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {skillChips.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[#334155] px-3 py-1 text-xs font-medium text-[#cbd5e1]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <div className="relative flex items-center">
            <Card className="relative w-full gap-0 rounded-none border-0 bg-white py-0 shadow-none">
              {children}
            </Card>
          </div>

          <BorderBeam
            duration={8}
            size={100}
            colorFrom="#3b82f6"
            colorTo="#ffffff"
            borderWidth={1.5}
          />
        </div>
      </main>
    </div>
  )
}
