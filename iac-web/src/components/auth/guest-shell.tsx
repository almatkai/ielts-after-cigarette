import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n'

export function LoginToContinue() {
  const { t } = useLanguage()
  return (
    <Button asChild variant="outline">
      <Link to="/login">{t('Войти в аккаунт')}</Link>
    </Button>
  )
}

export function GuestAccessGate() {
  const { t } = useLanguage()
  return (
    <section className="mx-auto grid max-w-2xl gap-4 rounded-2xl border border-[#e7e7e4] bg-white p-6 sm:p-8">
      <h2 className="text-xl font-semibold">
        {t('Войдите в аккаунт, чтобы продолжить')}
      </h2>
      <p className="text-sm leading-6 text-[#69696d]">
        {t(
          'Другие тесты, план подготовки и история прогресса доступны в аккаунте. Без регистрации можно пройти один полный пробный IELTS и разобрать результаты.',
        )}
      </p>
      <div className="flex flex-wrap gap-3">
        <LoginToContinue />
        <Button asChild variant="ghost">
          <Link to="/full-mocks">{t('К бесплатному Full Mock')}</Link>
        </Button>
      </div>
    </section>
  )
}
