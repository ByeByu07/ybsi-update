import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { privateDashboardMiddleware } from '@/middlewares/dashboard.middleware'
import { createFileRoute } from '@tanstack/react-router'
import { createClientOnlyFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
  server: {
    middleware: [privateDashboardMiddleware],
  }
})

const logOutFn = createClientOnlyFn(async () => { 
  await authClient.signOut()
  throw redirect({ to: '/auth/signin' }) 
});


function RouteComponent() {
  return <div>Hello "/dashboard/"! <Button onClick={logOutFn}>Logout</Button></div>
}
