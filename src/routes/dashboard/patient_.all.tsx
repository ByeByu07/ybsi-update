import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from "react"
import { usePatients } from "@/hooks/use-patients"
import { useBreadcrumb } from "@/components/breadcrumb-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertCircle, Search, User } from "lucide-react"

export const Route = createFileRoute('/dashboard/patient_/all')({
  component: RouteComponent,
})

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumb()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard/stakeholder" },
      { label: "Pasien", href: "/dashboard/stakeholder/patients" },
      { label: "Semua Pasien" },
    ])
  }, [setBreadcrumbs])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch patients with search
  const { data: patients, isLoading, isError } = usePatients(debouncedSearch || undefined)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getGenderLabel = (gender: string) => {
    const labels: Record<string, string> = {
      MALE: "Laki-laki",
      FEMALE: "Perempuan",
      OTHER: "Lainnya",
    }
    return labels[gender] || gender
  }

  const getGenderBadge = (gender: string) => {
    const colors: Record<string, string> = {
      MALE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      FEMALE: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[gender] || ``}`}>
        {getGenderLabel(gender)}
      </span>
    )
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return age
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Data Pasien</h2>
          <p className="text-muted-foreground">
            Kelola dan lihat semua data pasien
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">Cari Pasien</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Cari nama, kode, nomor telepon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
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
            <p className="text-destructive">Gagal memuat data pasien</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && patients?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Pasien</h3>
            <p className="text-muted-foreground text-center">
              Tidak ada data pasien yang ditemukan.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Patients Table */}
      {!isLoading && !isError && patients && patients.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Pasien</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Tanggal Lahir</TableHead>
                    <TableHead>Umur</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Kontak Darurat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{patient.patientCode}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{patient.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(patient.birthDate)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {calculateAge(patient.birthDate)} tahun
                        </span>
                      </TableCell>
                      <TableCell>{getGenderBadge(patient.gender)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm truncate">
                            {patient.address || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {patient.phone ? (
                          <a
                            href={`tel:${patient.phone}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {patient.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          {patient.emergencyContact && (
                            <p className="text-sm font-medium">{patient.emergencyContact}</p>
                          )}
                          {patient.emergencyPhone && (
                            <a
                              href={`tel:${patient.emergencyPhone}`}
                              className="text-xs text-primary hover:underline"
                            >
                              {patient.emergencyPhone}
                            </a>
                          )}
                          {!patient.emergencyContact && !patient.emergencyPhone && (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
