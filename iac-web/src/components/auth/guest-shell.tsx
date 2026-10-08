import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function LoginToContinue() {
  return (
    <Button asChild variant="outline">
      <Link to="/login">Войти в аккаунт</Link>
    </Button>
  )
}

export function GuestAccessGate() {
  return (
    <section className="mx-auto grid max-w-2xl gap-4 rounded-2xl border border-[#e7e7e4] bg-white p-6 sm:p-8">
      <h2 className="text-xl font-semibold">
        Войдите в аккаунт, чтобы продолжить
      </h2>
      <p className="text-sm leading-6 text-[#69696d]">
        Другие тесты, план подготовки и история прогресса доступны в аккаунте.
        Без регистрации можно пройти один полный пробный IELTS и разобрать
        результаты.
      </p>
      <div className="flex flex-wrap gap-3">
        <LoginToContinue />
        <Button asChild variant="ghost">
          <Link to="/full-mocks">К бесплатному Full Mock</Link>
        </Button>
      </div>
    </section>
  )
}
