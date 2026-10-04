import { createFileRoute, redirect } from '@tanstack/react-router'

// Old links no longer allow selecting a hand-assembled mock.
export const Route = createFileRoute('/_app/full-mocks/$mockId')({
  beforeLoad: () => {
    throw redirect({ to: '/full-mocks', replace: true })
  },
})
