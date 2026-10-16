import { expect, test } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`practice card bottom-edge hover stays stable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.route('**/api/v1/**', (route) => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/refresh')) {
        return route.fulfill({
          json: {
            accessToken: 'mock-token',
            tokenType: 'Bearer',
            expiresIn: 3600,
            user: {
              id: 'hover-student',
              role: 'STUDENT',
              email: 'hover@example.test',
              displayName: 'Student',
              timezone: 'UTC',
              examType: 'academic',
            },
          },
        })
      }
      if (new URL(route.request().url()).pathname.endsWith('/guest/session')) {
        return route.fulfill({ status: 401, json: { code: 'GUEST_EXPIRED' } })
      }
      return route.fulfill({ json: { items: [] } })
    })
    await page.goto('./practice')
    await expect(
      page
        .getByRole('main')
        .getByRole('heading', { name: 'Практика', exact: true }),
    ).toBeVisible()
    for (const title of [
      'Listening',
      'Reading',
      'Writing',
      'Speaking',
      'Полный пробный экзамен (Full Mock)',
    ]) {
      const card = page.locator('[data-slot="card"]').filter({
        has: page.getByRole('heading', { name: title, exact: true }),
      })
      // Centre the card so fixed mobile navigation cannot cover its bottom.
      await card.evaluate((node) =>
        node.scrollIntoView({ block: 'center', behavior: 'instant' }),
      )
      await page.mouse.move(0, 0)
      // Let the previous card's hover-out transition finish before measuring.
      await card.evaluate((node) =>
        Promise.all(
          node.getAnimations().map((animation) => animation.finished),
        ),
      )
      const bounds = await card.boundingBox()
      expect(bounds).not.toBeNull()
      await page.mouse.move(
        bounds!.x + bounds!.width / 2,
        bounds!.y + bounds!.height - 0.75,
      )
      // Keep the pointer stationary at the original bottom edge throughout the
      // animation: moving the hit target itself causes enter/leave oscillation.
      const frames = await card.evaluate(
        (node) =>
          new Promise<Array<{ top: number; bottom: number; hovered: boolean }>>(
            (resolve) => {
              const samples: Array<{
                top: number
                bottom: number
                hovered: boolean
              }> = []
              const sample = () => {
                const rect = node.getBoundingClientRect()
                samples.push({
                  top: rect.top,
                  bottom: rect.bottom,
                  hovered: node.matches(':hover'),
                })
                if (samples.length === 40) resolve(samples)
                else requestAnimationFrame(sample)
              }
              requestAnimationFrame(sample)
            },
          ),
      )
      expect(
        Math.max(
          ...frames.map((frame) =>
            Math.abs(frame.bottom - (bounds!.y + bounds!.height)),
          ),
        ),
        `${title} must not move its hover area`,
      ).toBeLessThan(0.1)
      expect(
        frames.every((frame) => frame.hovered),
        `${title} must not lose hover at its bottom edge`,
      ).toBe(true)
      // Non-geometric hover feedback is retained, rather than removing hover.
      await expect(card).toHaveCSS('border-color', 'rgb(215, 215, 210)')
    }
  })
}
