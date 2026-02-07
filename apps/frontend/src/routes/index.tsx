import { trpc } from '@/router'
import { requireAuth } from '@/utils'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexComponent,
  async beforeLoad({ context: { trpc, queryClient } }) {
    return await requireAuth({ trpc, queryClient })
  },
  loader: async ({ context: { trpc, queryClient } }) => {
    return await requireAuth({ trpc, queryClient })
  },
})

function IndexComponent() {
  const meQuery = useQuery(trpc.auth.getSession.queryOptions())
  const me = meQuery.data?.data?.user;

  return (
    <div className={`p-2`}>
      <div className={`text-lg`}>Welcome Home! {me?.name}</div>
    </div>
  )
}