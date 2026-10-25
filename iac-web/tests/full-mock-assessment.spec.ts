import { expect, test } from '@playwright/test'

for (const failed of [false, true]) {
  test(`report waits for analysis${failed ? ' and recovers failed earlier section' : ''}`, async ({
    page,
  }) => {
    let phase = failed ? 'FAILED' : 'QUEUED'
    let advances = 0
    let retries = 0
    const session = () => ({
      id: 'assessment-session',
      status: 'IN_PROGRESS',
      currentSection: 4,
      mockTest: { title: 'Assessment test', examType: 'academic' },
      sections: ['listening', 'reading', 'writing', 'speaking'].map(
        (skill, index) => ({
          position: index + 1,
          skill,
          assessmentStatus: skill === 'writing' ? phase : undefined,
          attempt: {
            id: `${skill}-attempt`,
            materialType: skill,
            status:
              skill === 'writing' && phase !== 'READY'
                ? phase === 'FAILED' || phase === 'QUEUED'
                  ? 'IN_PROGRESS'
                  : 'PROCESSING'
                : 'SUBMITTED',
            band: phase === 'READY' || skill !== 'writing' ? 7 : null,
          },
        }),
      ),
    })
    await page.clock.install()
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path.endsWith('/auth/refresh'))
        return route.fulfill({
          json: {
            accessToken: 'test',
            user: {
              id: 'student',
              role: 'STUDENT',
              email: 'test@example.test',
              timezone: 'UTC',
            },
          },
        })
      if (path.endsWith('/assessment/retry')) {
        retries++
        phase = 'QUEUED'
        return route.fulfill({ json: { status: 'PROCESSING' } })
      }
      if (path.endsWith('/advance')) {
        advances++
        return route.fulfill({ json: session() })
      }
      if (path.endsWith('/full-mock-sessions/assessment-session'))
        return route.fulfill({ json: session() })
      return route.fulfill({ json: { items: [] } })
    })
    await page.goto('/app/exam/full-mock-sessions/assessment-session')
    const finish = page.getByRole('button', {
      name: 'Finish and show the report',
    })
    await expect(finish).toBeDisabled()
    if (failed) {
      await expect(
        page.getByRole('alert').filter({ hasText: 'saved answers' }),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Retry analysis' }).click()
      await expect.poll(() => retries).toBe(1)
      await expect(finish).toBeDisabled()
    }
    await expect(page.getByRole('status')).toContainText(
      '3 of 4 sections ready',
    )
    phase = 'PROCESSING'
    await page.clock.runFor(10_100)
    await expect(finish).toBeDisabled()
    expect(advances).toBe(0)
    phase = 'READY'
    await page.clock.runFor(10_100)
    await expect(finish).toBeEnabled()
    await finish.click()
    await expect.poll(() => advances).toBe(1)
  })
}
