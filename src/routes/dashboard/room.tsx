import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useBreadcrumb } from "@/components/breadcrumb-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertCircle,
  Bed,
  Filter,
  Search,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Wrench,
  Plus,
  Info,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

type RoomItem = {
  id: string
  roomNumber: string
  roomType: string
  capacity: number
  baseRate: string
  status: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  facilities: {
    id: string
    name: string
    additionalPrice: string
  }[]
}

type RoomFormData = {
  roomNumber: string
  roomType: string
  capacity: number
  baseRate: string
  status: string
  description: string | null
  isActive: boolean
}

type Stats = {
  status: string
  count: number
}
export const Route = createFileRoute('/dashboard/room')({
  component: RouteComponent,
})

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumb()
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activeFilter, setActiveFilter] = useState<string>("true")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")

  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<RoomItem | null>(null)

  // Form states
  const [formData, setFormData] = useState<RoomFormData>({
    roomNumber: "",
    roomType: "GENERAL",
    capacity: 0,
    baseRate: "0",
    status: "AVAILABLE",
    description: "",
    isActive: true,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: RoomFormData) => {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to create inventory item")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] })
      setIsAddModalOpen(false)
      resetForm()
      toast.success("Item inventaris berhasil ditambahkan")
    },
    onError: () => {
      toast.error("Gagal menambahkan item inventaris")
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RoomFormData }) => {
      const response = await fetch(`/api/rooms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to update inventory item")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] })
      setIsEditModalOpen(false)
      setCurrentItem(null)
      resetForm()
      toast.success("Item inventaris berhasil diperbarui")
    },
    onError: () => {
      toast.error("Gagal memperbarui item inventaris")
    },
  })

  const resetForm = () => {
    setFormData({
      roomNumber: "",
      roomType: "GENERAL",
      capacity: 0,
      baseRate: "0",
      status: "AVAILABLE",
      description: "",
      isActive: true,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditModalOpen && currentItem) {
      updateMutation.mutate({ id: currentItem.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard/stakeholder" },
      { label: "Kamar" },
    ])
  }, [setBreadcrumbs])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Build query params
  const queryParams = new URLSearchParams({
    ...(roomTypeFilter !== "all" && { roomType: roomTypeFilter }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(activeFilter !== "all" && { isActive: activeFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  })

  // Fetch rooms
  const { data, isLoading, isError } = useQuery<{
    success: boolean
    data: RoomItem[]
    stats: Stats[]
  }>({
    queryKey: ["rooms", roomTypeFilter, statusFilter, activeFilter, debouncedSearch],
    queryFn: async () => {
      const response = await fetch(`/api/rooms?${queryParams}`)
      if (!response.ok) throw new Error("Failed to fetch rooms")
      return response.json()
    },
  })

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount))
  }

  const getRoomTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      VIP: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      STANDARD: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      ICU: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type] || ""}`}>
        {type}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      OCCUPIED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      MAINTENANCE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    }

    const labels: Record<string, string> = {
      AVAILABLE: "Tersedia",
      OCCUPIED: "Terisi",
      MAINTENANCE: "Pemeliharaan",
    }

    const icons: Record<string, any> = {
      AVAILABLE: CheckCircle,
      OCCUPIED: XCircle,
      MAINTENANCE: Wrench,
    }

    const Icon = icons[status] || CheckCircle

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || ""}`}>
        <Icon className="h-3 w-3" />
        {labels[status] || status}
      </span>
    )
  }

  const getStatByStatus = (status: string) => {
    const stat = data?.stats.find(s => s.status === status)
    return stat?.count || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kamar</h2>
          <p className="text-muted-foreground">
            Kelola dan pantau ketersediaan kamar
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Kamar
        </Button>
      </div>

      {/* Summary Cards */}
      {!isLoading && data?.stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kamar</CardTitle>
              <Bed className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.reduce((sum, s) => sum + s.count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Kamar aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tersedia</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getStatByStatus("AVAILABLE")}
              </div>
              <p className="text-xs text-muted-foreground">Siap digunakan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terisi</CardTitle>
              <XCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {getStatByStatus("OCCUPIED")}
              </div>
              <p className="text-xs text-muted-foreground">Sedang digunakan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pemeliharaan</CardTitle>
              <Wrench className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {getStatByStatus("MAINTENANCE")}
              </div>
              <p className="text-xs text-muted-foreground">Dalam perbaikan</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Pencarian</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cari nomor kamar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomType">Tipe Kamar</Label>
              <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                <SelectTrigger id="roomType">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="ICU">ICU</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="AVAILABLE">Tersedia</SelectItem>
                  <SelectItem value="OCCUPIED">Terisi</SelectItem>
                  <SelectItem value="MAINTENANCE">Pemeliharaan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="active">Keaktifan</Label>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger id="active">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <p className="text-destructive">Gagal memuat data kamar</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && data?.data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bed className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Kamar</h3>
            <p className="text-muted-foreground text-center">
              Tidak ada kamar yang ditemukan dengan filter yang dipilih.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rooms Table */}
      {!isLoading && !isError && data?.data && data.data.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Kamar</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Kapasitas</TableHead>
                    <TableHead>Tarif Dasar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fasilitas</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Aktif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium text-lg">
                        {room.roomNumber}
                      </TableCell>
                      <TableCell>{getRoomTypeBadge(room.roomType)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{room.capacity}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {formatCurrency(room.baseRate)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">per hari</p>
                      </TableCell>
                      <TableCell>{getStatusBadge(room.status)}</TableCell>
                      <TableCell>
                        {room.facilities.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {room.facilities.map((facility) => (
                              <Badge key={facility.id} variant="secondary" className="text-xs">
                                {facility.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm truncate">
                            {room.description || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {room.isActive ? (
                          <Badge variant="default" className="bg-green-600">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Nonaktif
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setCurrentItem(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditModalOpen ? "Edit Item Inventaris" : "Tambah Item Inventaris"}
            </DialogTitle>
            <DialogDescription>
              {isEditModalOpen
                ? "Perbarui informasi item inventaris"
                : "Tambahkan item inventaris baru ke sistem"
              }
            </DialogDescription>
          </DialogHeader>

          <Alert variant="warning" className="my-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Perhatian</AlertTitle>
            <AlertDescription>
              Item inventaris yang ditambahkan tidak dapat dihapus dari sistem.
              Pastikan semua informasi sudah benar sebelum menyimpan.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">
                  Nomor Kamar <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="Contoh: KAMAR-001"
                  required
                  disabled={isEditModalOpen}
                />
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="roomType">
                  Tipe Kamar <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.roomType}
                  onValueChange={(value) => setFormData({ ...formData, roomType: value })}
                  required
                />
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Tersedia</SelectItem>
                    <SelectItem value="OCCUPIED">Dipakai</SelectItem>
                    <SelectItem value="MAINTENANCE">Perawatan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">
                  Kapasitas Orang<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min="0"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  placeholder="Contoh: 1 / 2 orang"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseRate">
                  Tarif <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="baseRate"
                  type="number"
                  min="0"
                  value={formData.baseRate}
                  onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Deskripsi
                </Label>
                <Input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setIsEditModalOpen(false)
                  setCurrentItem(null)
                  resetForm()
                }}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
