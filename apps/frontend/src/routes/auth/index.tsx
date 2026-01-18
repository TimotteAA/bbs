import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthForms } from './-components/auth-form';

export const Route = createFileRoute('/auth/')({
  component: RouteComponent,
  async beforeLoad(ctx) {
    const authClient = ctx.context.authClient;
    const { data: session } = await authClient.getSession();
    if (session) {
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
