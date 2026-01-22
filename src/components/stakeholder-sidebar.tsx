"use client"

import * as React from "react"
import {
  AudioWaveform,
  Command,
  LayoutDashboard,
  ClipboardList,
  Package,
  FileUp,
  CheckCircle,
  BedDouble,
  ScrollText,
  Users,
  UserRound,
  MessageCircleQuestion,
  User,
  File,
  LogOut,
  UserLock,
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
      name: "Acme Inc",
      logo: Command,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Pengajuan",
      url: "/dashboard/submission",
      icon: FileUp,
      badge: "10",
    },
    {
      title: "Persetujuan",
      url: "/dashboard/approval",
      icon: CheckCircle,
      badge: "10",
    },
    {
      title: "Registrasi Pasien",
      url: "/dashboard/registration",
      icon: User,
    },
    {
      title: "Pasien",
      url: "/dashboard/patient",
      icon: UserLock,
    },
    // {
    //   title: "Pencatatan",
    //   url: "/dashboard/stakeholder/records",
    //   icon: ClipboardList,
    // },
    // {
    //   title: "Dokumen",
    //   url: "/dashboard/stakeholder/documents",
    //   icon: File,
    // },
    // {
    //   title: "Inventori",
    //   url: "/dashboard/stakeholder/inventory",
    //   icon: Package,
    // },
    {
      title: "Kamar",
      url: "/dashboard/room",
      icon: BedDouble,
    },
    {
      title: "Anggota",
      url: "/dashboard/member",
      icon: UserRound,
    },
    // {
    //   title: "Log Audit",
    //   url: "/dashboard/stakeholder/audit-logs",
    //   icon: ScrollText,
    // },
  ],
  navSecondary: [
    {
      title: "Keluar",
      url: "/auth/logout",
      icon: LogOut,
    },
    // {
    //   title: "Bantuan",
    //   url: "/dashboard/stakeholder/help",
    //   icon: MessageCircleQuestion,
    // },
  ],
}

export function StakeholderSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
