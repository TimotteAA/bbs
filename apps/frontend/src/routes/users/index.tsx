import { trpc } from '@/router'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useRouterState } from '@tanstack/react-router'

export const Route = createFileRoute('/users/')({
  component: RouteComponent,
  loader: async ({ context: { trpc, queryClient } }) => {
    await queryClient.ensureQueryData(trpc.user.users.queryOptions())
    return
  },
  pendingComponent: () => <div>loading....</div>
})

function RouteComponent() {
  const usersQuery = useQuery(trpc.user.users.queryOptions())

  const users = usersQuery.data || []
  return <div>Hello "/users/"!
    <hr />
    {users.map(user => <div key={user.id}>{user.name}, Role: {user.role}</div>)}
  </div>
}
