import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/exam/full-mock-sessions/$sessionId')({
  component: Outlet,
})
