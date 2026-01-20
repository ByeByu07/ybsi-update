"use client"

import * as React from "react"
import {
  Command,
  MessageCircleQuestion,
  User,
  CalendarDays,
  Edit,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
// This is sample data.
const data = {
  teams: [
    {
      name: "YBSI",
      logo: Command,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Absensi",
      url: "/dashboard/worker/",
      icon: CalendarDays,
    },
    {
      title: "Registrasi",
      url: "/dashboard/worker/registration",
      icon: Edit,
    },
  ],
  navSecondary: [
   
    {
      title: "Profile",
      url: "#",
      icon: User,
    },
    {
      title: "Help",
      url: "#",
      icon: MessageCircleQuestion,
    },
  ],
}

export function WorkerSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <h1 className="text-xl font-bold ml-2">YBSI</h1>
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        {/* <NavFavorites favorites={data.favorites} /> */}
        {/* <NavWorkspaces workspaces={data.workspaces} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
