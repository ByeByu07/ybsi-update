import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from "react"
import { useBreadcrumb } from "@/components/breadcrumb-provider"
import { authClient } from "@/lib/auth-client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertCircle, Info, Plus, Users } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Member = {
  organizationId: string
  userId: string
  role: string
  createdAt: string
  id: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

type TokenFormData = {
  organizationId: string
  role: "MEMBER" | "KETUA" | "BENDAHARA" | "SEKRETARIS" | "OPERASIONAL" | "PENGADAAN" | "NURSE"
}

export const Route = createFileRoute('/dashboard/member')({
  component: RouteComponent,
})

function RouteComponent() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const { setBreadcrumbs } = useBreadcrumb()

  const [isGenerateTokenModalOpen, setIsGenerateTokenModalOpen] = useState(false)

  const session = authClient.useSession()

  const [formData, setFormData] = useState<TokenFormData>({
    organizationId: session.data?.session?.activeOrganizationId || "",
    role: "KETUA",
  })

  const generateTokenMutation = useMutation({
    mutationFn: async (data: TokenFormData) => {
      const response = await fetch("/api/members/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const { success, data: token, error } = await response.json()

      console.log(success, token, error)

      if (!success) throw new Error(error)
      if (!response.ok) throw new Error("Failed to generate token")
      return token.token
    },
    onSuccess: (token) => {
      console.log(token)
      navigator.clipboard.writeText(token)
      toast.success("Token berhasil disalin")
    },
    onError: () => {
      toast.error("Gagal menghasilkan token")
    },
  })

  const resetForm = () => {
    setFormData({
      organizationId: session.data?.session?.activeOrganizationId || "",
      role: "KETUA",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    generateTokenMutation.mutate(formData)
    resetForm()
    // setIsGenerateTokenModalOpen(false)
  }

  useEffect(() => {
    loadMembers()
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard/stakeholder" },
      { label: "Anggota" },
    ])
  }, [setBreadcrumbs])

  const loadMembers = async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const { data, error } = await authClient.organization.listMembers({
        query: {
          organizationId: session.data?.session?.activeOrganizationId ?? undefined,
          limit: 100,
          offset: 0,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      })

      if (error) {
        setIsError(true)
        console.error(error)
      } else {
        console.log(data)
        // console.log(typeof data.members[0] === typeof Members)
        setMembers(data?.members || [])
      }
    } catch (error) {
      setIsError(true)
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      KETUA: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      BENDAHARA: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      SEKRETARIS: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      MEMBER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    }

    return (
      <Badge variant="outline" className={colors[role] || ""}>
        {role}
      </Badge>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Anggota</h2>
          <p className="text-muted-foreground">
            Kelola dan lihat semua anggota organisasi
          </p>
        </div>
        <Button onClick={() => setIsGenerateTokenModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Anggota
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 py-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">Gagal memuat data anggota</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && members.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Anggota</h3>
            <p className="text-muted-foreground text-center">
              Tidak ada anggota yang terdaftar dalam organisasi ini.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Members Table */}
      {!isLoading && !isError && members.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Anggota</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tanggal Bergabung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.user.image || undefined} />
                            <AvatarFallback>
                              {getInitials(member.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {member.userId.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>{formatDate(member.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      <Dialog open={isGenerateTokenModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsGenerateTokenModalOpen(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {"Tambah Anggota"}
            </DialogTitle>
            <DialogDescription>
              {"Tambahkan anggota baru ke sistem"}
            </DialogDescription>
          </DialogHeader>

          {/* <Alert variant="warning" className="my-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Perhatian</AlertTitle>
            <AlertDescription>
              Item inventaris yang ditambahkan tidak dapat dihapus dari sistem.
              Pastikan semua informasi sudah benar sebelum menyimpan.
            </AlertDescription>
          </Alert> */}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as "MEMBER" | "KETUA" | "BENDAHARA" | "SEKRETARIS" | "OPERASIONAL" | "PENGADAAN" | "NURSE" })}
                >
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KETUA">Ketua</SelectItem>
                    <SelectItem value="BENDAHARA">Bendahara</SelectItem>
                    <SelectItem value="SEKRETARIS">Sekretaris</SelectItem>
                    <SelectItem value="OPERASIONAL">Operasional</SelectItem>
                    <SelectItem value="PENGADAAN">Pengadaan</SelectItem>
                    <SelectItem value="NURSE">Nurse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsGenerateTokenModalOpen(false)
                  resetForm()
                }}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={generateTokenMutation.isPending}
              >
                {(generateTokenMutation.isPending) ? "Membuat..." : "Buat"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
