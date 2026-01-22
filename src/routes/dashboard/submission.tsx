import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/submission')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/submission"!</div>
}
