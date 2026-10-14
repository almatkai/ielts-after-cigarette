import { createFileRoute } from '@tanstack/react-router'
import { UsersPage } from '@/pages/admin/users/users-page'

export const Route = createFileRoute('/admin/users/')({ component: UsersPage })
