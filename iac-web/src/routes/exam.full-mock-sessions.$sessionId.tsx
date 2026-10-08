import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/exam/full-mock-sessions/$sessionId')({
  component: Outlet,
  validateSearch: (search: Record<string, unknown>): { section?: number } => {
    const section = Number(search.section)
    return Number.isInteger(section) && section >= 1 && section <= 4
      ? { section }
      : {}
  },
})
