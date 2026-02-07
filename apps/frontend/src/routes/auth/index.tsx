import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthForms } from './-components/auth-form';

export const Route = createFileRoute('/auth/')({
  component: RouteComponent,
  async beforeLoad({ context: { trpc, queryClient } }) {
    const {
      data:{
        user,
        session
      }
    } = await queryClient.fetchQuery(trpc.auth.getSession.queryOptions());
    if (user && session) {
      throw redirect({
        to: "/"
      })
    }
  },
})

function RouteComponent() {
  return <div> 
    <AuthForms />
  </div>
}
