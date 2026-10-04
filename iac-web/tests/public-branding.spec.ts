import { expect, test } from '@playwright/test'

const user = {
  id: 'student-id',
  role: 'STUDENT',
  email: 'student@example.test',
  displayName: 'Student',
  timezone: 'UTC',
  examType: 'academic',
  currentBand: null,
  targetBand: 7.5,
  examDate: '2026-12-04',
}

for (const [path, title] of [
  ['./', 'Обзор — Daiyndyq IELTS'],
  ['./practice', 'Практика — Daiyndyq IELTS'],
  ['./profile', 'Профиль — Daiyndyq IELTS'],
]) {
  test(`student page title uses the public brand: ${path}`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('**/api/v1/**', (route) => {
      const pathname = new URL(route.request().url()).pathname
      if (pathname.endsWith('/auth/refresh')) {
        return route.fulfill({
          json: {
            accessToken: 'mock-token',
            tokenType: 'Bearer',
            expiresIn: 3600,
            user,
          },
        })
      }
      if (pathname.endsWith('/profile')) return route.fulfill({ json: user })
      if (pathname.endsWith('/dashboard')) {
        return route.fulfill({
          json: {
            profile: {
              currentBand: null,
              targetBand: 7.5,
              examDate: '2026-12-04',
            },
            recommendedAction: {
              type: 'practice',
              title: 'Практика',
              description: 'Выберите секцию',
              target: '/practice',
            },
            todayPlan: [],
            skillProgress: [],
            unreadNotifications: 0,
          },
        })
      }
      return route.fulfill({ json: { items: [] } })
    })
    await page.goto(path)
    await expect(page).toHaveTitle(title)
    await expect(
      page.getByRole('link', {
        name: 'Daiyndyq IELTS — к обзору',
        exact: true,
      }),
    ).toBeVisible()
    expect(errors).toEqual([])
  })
}
