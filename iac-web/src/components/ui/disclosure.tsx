import type { ComponentProps, ReactNode } from 'react'
import { ArrowDown2 } from 'iconsax-react'
import { cn } from '@/lib/utils'

export function Disclosure({
  title,
  children,
  className,
  ...props
}: Omit<ComponentProps<'details'>, 'title'> & {
  title: ReactNode
}) {
  return (
    <details
      className={cn('min-w-0 [&[open]>summary>svg]:rotate-180', className)}
      {...props}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md py-2 text-[13px] leading-5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">{title}</span>
        <ArrowDown2
          size={14}
          className="shrink-0 transition-transform motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      {children}
    </details>
  )
}
