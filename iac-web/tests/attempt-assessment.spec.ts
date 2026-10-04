import { expect, test } from '@playwright/test'

for (const skill of ['writing', 'speaking']) {
  for (const terminal of ['SUBMITTED', 'IN_PROGRESS', 'ABANDONED']) {
    test(`${skill}: polls status only and refreshes detail on ${terminal}`, async ({
      page,
    }) => {
      let status = 'PROCESSING'
      let detailReads = 0
      let statusReads = 0
      const jobKey = `${skill}Assessment`
      const criterion = { band: 7, feedback: 'Good work' }
      const evaluation = {
        overallBand: 7,
        model: 'test',
        evaluatedAt: '2026-10-04T10:00:00Z',
        summary: 'Assessment completed successfully',
        criteria: {
          taskResponse: criterion,
          coherence: criterion,
          fluency: criterion,
          lexicalResource: criterion,
          grammar: criterion,
          pronunciation: criterion,
        },
        tasks: [],
        parts: [],
      }
      await page.clock.install()
      await page.route('**/api/v1/**', async (route) => {
        const path = new URL(route.request().url()).pathname
        if (path.endsWith('/auth/refresh')) {
          return route.fulfill({
            json: {
              accessToken: 'mock-token',
              tokenType: 'Bearer',
              expiresIn: 3600,
              user: {
                id: 'student-id',
                role: 'STUDENT',
                email: 'assessment@example.test',
                displayName: 'Student',
                timezone: 'UTC',
              },
            },
          })
        }
        if (path.endsWith('/attempts/test-attempt/status')) {
          statusReads++
          return route.fulfill({
            json: {
              id: 'test-attempt',
              status,
              [jobKey]: {
                status: status === 'IN_PROGRESS' ? 'FAILED' : 'PROCESSING',
                attempts: 1,
              },
            },
          })
        }
        if (path.endsWith('/attempts/test-attempt')) {
          detailReads++
          return route.fulfill({
            json: {
              id: 'test-attempt',
              materialType: skill,
              materialId: 'test-material',
              materialVersionId: 'test-version',
              status,
              score: null,
              maxScore: null,
              band: status === 'SUBMITTED' ? 7 : null,
              startedAt: '2026-10-04T09:00:00Z',
              submittedAt:
                status === 'SUBMITTED' ? '2026-10-04T10:00:00Z' : null,
              answers: [],
              ...(status === 'SUBMITTED'
                ? { [`${skill}Evaluation`]: evaluation }
                : {
                    [jobKey]: {
                      status:
                        status === 'IN_PROGRESS' ? 'FAILED' : 'PROCESSING',
                      attempts: 1,
                    },
                  }),
            },
          })
        }
        return route.fulfill({ json: { items: [] } })
      })
      await page.goto('./attempts/test-attempt')
      await expect(
        page.getByText('Работа находится на проверке ИИ'),
      ).toBeVisible()
      await expect.poll(() => statusReads).toBe(1)
      // Dev StrictMode may abort the first mount's request and restart it.
      const initialReads = detailReads
      expect(initialReads).toBeLessThanOrEqual(2)

      await page.clock.runFor(2_100)
      await expect.poll(() => statusReads).toBe(2)
      expect(detailReads).toBe(initialReads)
      // The second successful read backs off to 5s, not another heavy 2.5s GET.
      await page.clock.runFor(2_600)
      expect(statusReads).toBe(2)
      expect(detailReads).toBe(initialReads)
      status = terminal
      await page.clock.runFor(2_500)
      await expect.poll(() => detailReads).toBe(initialReads + 1)
      const label =
        terminal === 'SUBMITTED'
          ? 'Assessment completed successfully'
          : terminal === 'ABANDONED'
            ? 'Секция завершена без оценки'
            : 'Попытка ещё не завершена'
      await expect(page.getByText(label)).toBeVisible()
      const stoppedAt = statusReads
      await page.clock.runFor(30_000)
      expect(statusReads).toBe(stoppedAt)
      expect(detailReads).toBe(initialReads + 1)
    })
  }
}
