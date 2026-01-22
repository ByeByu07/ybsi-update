import { authClient } from '@/lib/auth-client'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/logout')({
  component: RouteComponent,
  loader: async() => {
    // Perform logout logic here, such as clearing session cookies or tokens
    // After logout, redirect to the sign-in page

    await authClient.signOut();

    throw redirect({ to: '/auth/signin' });
  }
})

function RouteComponent() {
  return <div>U will be redirecting to signin page</div>
}
