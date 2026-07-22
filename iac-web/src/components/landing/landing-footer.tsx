import { footerColumns } from '#/content/landing-content'

import { Brand } from './brand'

export function LandingFooter() {
  return (
    <footer className="border-t border-[#e7e7e4] bg-white py-12 sm:py-16">
      <div className="container-shell">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Brand />
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#69696d]">
              Сфокусированная практика IELTS и понятное отслеживание прогресса.
            </p>
          </div>
          <div className="grid gap-9 sm:grid-cols-3 lg:col-span-7">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h2 className="text-xs font-semibold tracking-[0.08em] text-[#69696d] uppercase">
                  {column.title}
                </h2>
                <ul className="mt-5 space-y-3 text-sm">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      {'href' in item ? (
                        <a
                          href={item.href}
                          className="inline-flex min-h-11 items-center text-[#111111] no-underline transition-colors hover:text-[#e23b3b]"
                        >
                          {item.label}
                        </a>
                      ) : (
                        <span className="text-[#8b8b8e]">{item.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-5 border-t border-[#e7e7e4] pt-7 text-xs leading-5 text-[#8b8b8e] sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-2xl">
            Сервис не является официальным продуктом IELTS и не связан с
            организациями — владельцами товарного знака IELTS.
          </p>
          <p className="shrink-0">© 2026 IAC</p>
        </div>
      </div>
    </footer>
  )
}
