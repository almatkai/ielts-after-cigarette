import { createFileRoute } from '@tanstack/react-router'
import { UserPage } from '@/pages/admin/users/user-page'

export const Route = createFileRoute('/admin/users/$userId')({
  component: UserRoute,
})
function UserRoute() {
  const { userId } = Route.useParams()
  return <UserPage key={userId} userId={userId} />
}
