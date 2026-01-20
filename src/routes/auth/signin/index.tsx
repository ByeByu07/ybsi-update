import { SigninForm } from '@/components/auth/signin-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/signin/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <SigninForm />
      </div>
    </div>
}
