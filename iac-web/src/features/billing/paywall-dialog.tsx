import { Link } from '@tanstack/react-router'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLanguage } from '@/lib/i18n'

import { billingSkills } from './api'
import type { PaywallReason } from './api'
import { PlanPicker } from './plan-picker'
import { closePaywall, usePaywallState } from './paywall-store'

const skillTitles = {
  listening: 'Бесплатные тесты Listening закончились',
  reading: 'Бесплатные тесты Reading закончились',
  writing: 'Бесплатные тесты Writing закончились',
  speaking: 'Бесплатные тесты Speaking закончились',
} as const

const skillNames = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
} as const

export function paywallCopy(reason: PaywallReason | null) {
  if (reason?.feature === 'assistant') {
    return {
      title: 'Бесплатные сообщения Юки на сегодня закончились',
      description:
        'С тарифом лимит сообщений выше. Или вернитесь завтра — бесплатные сообщения обновятся.',
    }
  }
  if (reason?.feature === 'full_mock') {
    return {
      title: 'Для нового Full Mock не хватает бесплатных тестов',
      description:
        'Полный пробный экзамен засчитывается как один тест каждого навыка. Выберите тариф, чтобы проходить экзамены без ограничений.',
    }
  }
  if (reason?.skill) {
    return {
      title: skillTitles[reason.skill],
      description:
        'Выберите тариф, чтобы продолжить: все тесты, полные пробные экзамены и AI-разборы без ограничений по количеству.',
    }
  }
  return {
    title: 'Выберите тариф',
    description:
      'Все тесты, полные пробные экзамены и AI-разборы без ограничений по количеству.',
  }
}

/** Skills with free tests left, so the student sees what still works. */
export function RemainingFreeTests({
  reason,
}: {
  reason: PaywallReason | null
}) {
  const { t } = useLanguage()
  const remaining = reason?.remaining
  if (!remaining || reason.feature === 'assistant') return null
  const left = billingSkills.filter((skill) => (remaining[skill] ?? 0) > 0)
  if (left.length === 0) return null
  return (
    <p className="text-xs leading-5 text-muted-foreground">
      {t('Бесплатно ещё доступно:')}{' '}
      {left
        .map((skill) => `${skillNames[skill]} — ${remaining[skill]}`)
        .join(', ')}
    </p>
  )
}

/** Mounted once per layout; opened through openPaywall(). */
export function PaywallHost() {
  const { t } = useLanguage()
  const { open, reason } = usePaywallState()
  const copy = paywallCopy(reason)
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : closePaywall())}>
      <DialogContent className="max-h-[calc(100dvh-32px)] overflow-y-auto">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {t(copy.title)}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground">
            {t(copy.description)}
          </DialogDescription>
        </DialogHeader>
        <RemainingFreeTests reason={reason} />
        <PlanPicker />
        <Link
          to="/pricing"
          onClick={closePaywall}
          className="justify-self-center text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
        >
          {t('Подробнее о тарифах')}
        </Link>
      </DialogContent>
    </Dialog>
  )
}
