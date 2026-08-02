import { Eye, EyeSlash } from 'iconsax-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type AuthInputProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  type?: 'email' | 'password' | 'tel' | 'text'
  autoComplete: string
  placeholder: string
  error?: string
  inputMode?: 'email' | 'numeric' | 'search' | 'tel' | 'text' | 'url'
  maxLength?: number
}

export function AuthInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  autoComplete,
  placeholder,
  error,
  inputMode,
  maxLength,
}: AuthInputProps) {
  const [passwordIsVisible, setPasswordIsVisible] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && passwordIsVisible ? 'text' : type
  const errorId = `${id}-error`

  return (
    <div>
      <Label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[#111111]"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-12 w-full rounded-[10px] border bg-white px-4 text-[15px] text-[#111111] outline-none transition-colors placeholder:text-[#aaa9a6] focus-visible:border-[#111111] focus-visible:ring-0 focus-visible:outline-none aria-invalid:ring-0',
            isPassword && 'pr-12',
            error ? 'border-[#e23b3b]' : 'border-[#dededb]',
          )}
        />
        {isPassword ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPasswordIsVisible((visible) => !visible)}
            className="absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center rounded-[9px] text-[#69696d] transition-colors hover:bg-[#f4f4f1] hover:text-[#111111]"
            aria-label={passwordIsVisible ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={passwordIsVisible}
          >
            {passwordIsVisible ? (
              <EyeSlash
                size={19}
                color="currentColor"
                variant="Linear"
                aria-hidden
              />
            ) : (
              <Eye
                size={19}
                color="currentColor"
                variant="Linear"
                aria-hidden
              />
            )}
          </Button>
        ) : null}
      </div>
      <div className="min-h-5 pt-1">
        {error ? (
          <p
            id={errorId}
            className="text-xs leading-4 text-[#c92f2f]"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
