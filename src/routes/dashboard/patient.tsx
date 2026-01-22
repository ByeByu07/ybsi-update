import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from "react"
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
import { AlertCircle, Users, Search, User, Plus, DollarSign, CreditCard, History, CheckCircle2, Receipt, Calendar, AlertTriangle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { AddPaymentDialog } from "@/components/patients/add-payment-dialog"
import { PaymentHistoryDialog } from "@/components/patients/payment-history-dialog"
import { CompleteBookingDialog } from "@/components/patients/complete-booking-dialog"
import { AddExpenseDialog } from "@/components/patients/add-expense-dialog"
import { SettlePeriodDialog } from "@/components/patients/settle-period-dialog"
import { NewPeriodDialog } from "@/components/patients/new-period-dialog"

type ActivePatient = {
  patient: {
    id: string
    patientCode: string
    name: string
    birthDate: string
    gender: string
    phone: string
    address: string
    emergencyContact: string
    emergencyPhone: string
  }
  booking: {
    id: string
    bookingCode: string
    bookingType: string
    monthlyContractAmount: string | null
    checkIn: string
    status: string
  }
  room: {
    id: string
    roomNumber: string
    roomType: string
  }
  invoice: {
    id: string
    invoiceCode: string
    status: string
    totalAmount: string
    paidAmount: string
    balanceAmount: string
    receivedFrom: string
    issuedAt: string
  } | null
  billingPeriod: {
    id: string
    periodCode: string
    periodMonth: number
    periodYear: number
    periodStartDate: string
    periodEndDate: string
    prepaidAmount: string
    spentAmount: string
    remainingBalance: string
    status: string
  } | null
}

export const Route = createFileRoute('/dashboard/patient')({
  component: RouteComponent,
})

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumb()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [selectedPatient, setSelectedPatient] = useState<ActivePatient | null>(null)
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false)
  const [isCompleteBookingOpen, setIsCompleteBookingOpen] = useState(false)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isSettlePeriodOpen, setIsSettlePeriodOpen] = useState(false)
  const [isNewPeriodOpen, setIsNewPeriodOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard/stakeholder" },
      { label: "Pasien Aktif" },
    ])
  }, [setBreadcrumbs])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch active patients with search
  const { data: activePatients, isLoading, isError, refetch } = useQuery({
    queryKey: ['active-patients', debouncedSearch],
    queryFn: () => fetchActivePatients(debouncedSearch || undefined),
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue)
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PAID: { label: "Lunas", color: "bg-green-100 text-green-800" },
      PARTIAL: { label: "Sebagian", color: "bg-yellow-100 text-yellow-800" },
      UNPAID: { label: "Belum Bayar", color: "bg-red-100 text-red-800" },
      OVERDUE: { label: "Terlambat", color: "bg-red-100 text-red-800" },
    }

    const info = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }

    return (
      <Badge variant="outline" className={info.color}>
        {info.label}
      </Badge>
    )
  }

  const getGenderLabel = (gender: string) => {
    const labels: Record<string, string> = {
      MALE: "Laki-laki",
      FEMALE: "Perempuan",
      OTHER: "Lainnya",
    }
    return labels[gender] || gender
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

  const handleAddPayment = (patient: ActivePatient) => {
    setSelectedPatient(patient)
    setIsAddPaymentOpen(true)
  }

  const handleViewHistory = (patient: ActivePatient) => {
    setSelectedPatient(patient)
    setIsPaymentHistoryOpen(true)
  }

  const handleCompleteBooking = (patient: ActivePatient) => {
    setSelectedPatient(patient)
    setIsCompleteBookingOpen(true)
  }

  const handleAddExpense = (patient: ActivePatient) => {
    setSelectedPatient(patient)
    setIsAddExpenseOpen(true)
  }

  const handleSettlePeriod = (patient: ActivePatient) => {
    setSelectedPatient(patient)
    setIsSettlePeriodOpen(true)
  }

  const handleNewPeriod = (patient: ActivePatient) => {
    setSelectedPatient(patient)
    setIsNewPeriodOpen(true)
  }

  // Check if due date is within 10 days
  const isDueDateNear = (dueDate: string | null) => {
    if (!dueDate) return false
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 10
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pasien Aktif</h2>
          <p className="text-muted-foreground">
            Daftar pasien dengan booking aktif dan status pembayaran
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/patient/all" })}>
          <Users className="h-4 w-4 mr-2" />
          Semua Pasien
        </Button>
      </div>

      {/* Summary Card */}
      {!isLoading && activePatients && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pasien Aktif</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePatients.length}</div>
              <p className="text-xs text-muted-foreground">Sedang dirawat</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lunas</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activePatients.filter(p => p.invoice?.status === 'PAID').length}
              </div>
              <p className="text-xs text-muted-foreground">Pembayaran lunas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Belum Lunas</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activePatients.filter(p => p.invoice?.status !== 'PAID').length}
              </div>
              <p className="text-xs text-muted-foreground">Masih ada tagihan</p>
            </CardContent>
          </Card>
        </div>
      )}

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
            <Label htmlFor="search">Cari Pasien Aktif</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Cari nama pasien, kode booking, nomor kamar..."
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
            <p className="text-destructive">Gagal memuat data pasien aktif</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && activePatients?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Pasien Aktif</h3>
            <p className="text-muted-foreground text-center">
              Tidak ada pasien dengan booking aktif saat ini.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Patients Table */}
      {!isLoading && !isError && activePatients && activePatients.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pasien</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Kamar</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Saldo/Status</TableHead>
                    <TableHead>Total Tagihan</TableHead>
                    <TableHead>Terbayar</TableHead>
                    <TableHead>Sisa</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activePatients.map((item) => (
                    <TableRow key={item.booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.patient.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.patient.patientCode}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getGenderLabel(item.patient.gender)}, {calculateAge(item.patient.birthDate)} tahun
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.booking.bookingCode}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.room.roomNumber}</div>
                          <div className="text-xs text-muted-foreground">{item.room.roomType}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(item.booking.checkIn)}</div>
                      </TableCell>
                      <TableCell>
                        {item.booking.bookingType === 'MONTHLY_CONTRACT' ? (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Kontrak
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800">
                            Harian
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.booking.bookingType === 'MONTHLY_CONTRACT' && item.billingPeriod ? (
                          <div>
                            <div className="font-medium text-sm">
                              {formatCurrency(item.billingPeriod.remainingBalance)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              dari {formatCurrency(item.billingPeriod.prepaidAmount)}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className={`h-1.5 rounded-full ${
                                  (Number(item.billingPeriod.remainingBalance) / Number(item.billingPeriod.prepaidAmount)) * 100 > 50
                                    ? 'bg-green-600'
                                    : (Number(item.billingPeriod.remainingBalance) / Number(item.billingPeriod.prepaidAmount)) * 100 > 20
                                    ? 'bg-yellow-600'
                                    : 'bg-red-600'
                                }`}
                                style={{
                                  width: `${(Number(item.billingPeriod.remainingBalance) / Number(item.billingPeriod.prepaidAmount)) * 100}%`
                                }}
                              ></div>
                            </div>
                            {/* Due date warning */}
                            {isDueDateNear(item.billingPeriod.periodEndDate) && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Jatuh tempo {getDaysUntilDue(item.billingPeriod.periodEndDate)} hari</span>
                              </div>
                            )}
                          </div>
                        ) : item.invoice ? (
                          getPaymentStatusBadge(item.invoice.status)
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800">
                            Tidak ada invoice
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.invoice ? (
                          <div className="font-medium">{formatCurrency(item.invoice.totalAmount)}</div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.invoice ? (
                          <div className="text-sm text-green-600">{formatCurrency(item.invoice.paidAmount)}</div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.invoice ? (
                          <div className={`font-medium ${parseFloat(item.invoice.balanceAmount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(item.invoice.balanceAmount)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Invoice button - for all patients with invoice */}
                          {/* {item.invoice && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                window.open(`/dashboard/stakeholder/invoices/${item.invoice.id}`, '_blank')
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Invoice
                            </Button>
                          )} */}

                          {/* Payment button - for all patients with unpaid balance */}
                          {item.invoice && parseFloat(item.invoice.balanceAmount) > 0 && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleAddPayment(item)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Bayar
                            </Button>
                          )}

                          {/* History button - for all patients with invoice */}
                          {item.invoice && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewHistory(item)}
                            >
                              <History className="h-4 w-4 mr-1" />
                              Riwayat
                            </Button>
                          )}

                          {/* Expense button - for all patients */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-300 text-orange-700 hover:bg-orange-50"
                            onClick={() => handleAddExpense(item)}
                            disabled={item.booking.bookingType === 'MONTHLY_CONTRACT' && item.billingPeriod?.status !== 'ACTIVE'}
                          >
                            <Receipt className="h-4 w-4 mr-1" />
                            Pengeluaran
                          </Button>

                          {/* Monthly Contract specific buttons */}
                          {item.booking.bookingType === 'MONTHLY_CONTRACT' && item.billingPeriod && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-300 text-green-700 hover:bg-green-50"
                                onClick={() => handleSettlePeriod(item)}
                                disabled={item.billingPeriod.status !== 'ACTIVE'}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Tutup Periode
                              </Button>
                              {item.billingPeriod.status === 'CLOSED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleNewPeriod(item)}
                                >
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Periode Baru
                                </Button>
                              )}
                            </>
                          )}

                          {/* Complete booking button - for all types */}
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleCompleteBooking(item)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Selesai
                          </Button>
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

      {/* Add Payment Dialog */}
      {selectedPatient && (
        <AddPaymentDialog
          isOpen={isAddPaymentOpen}
          onClose={() => {
            setIsAddPaymentOpen(false)
            setSelectedPatient(null)
          }}
          patient={selectedPatient}
          onSuccess={() => {
            refetch()
            setIsAddPaymentOpen(false)
            setSelectedPatient(null)
          }}
        />
      )}

      {/* Payment History Dialog */}
      {selectedPatient && (
        <PaymentHistoryDialog
          isOpen={isPaymentHistoryOpen}
          onClose={() => {
            setIsPaymentHistoryOpen(false)
            setSelectedPatient(null)
          }}
          patient={selectedPatient}
        />
      )}

      {/* Complete Booking Dialog */}
      {selectedPatient && (
        <CompleteBookingDialog
          isOpen={isCompleteBookingOpen}
          onClose={() => {
            setIsCompleteBookingOpen(false)
            setSelectedPatient(null)
          }}
          patient={selectedPatient}
          onSuccess={() => {
            refetch()
            setIsCompleteBookingOpen(false)
            setSelectedPatient(null)
          }}
        />
      )}

      {/* Add Expense Dialog */}
      {selectedPatient && (
        <AddExpenseDialog
          isOpen={isAddExpenseOpen}
          onClose={() => {
            setIsAddExpenseOpen(false)
            setSelectedPatient(null)
          }}
          patient={selectedPatient}
          onSuccess={() => {
            refetch()
            setIsAddExpenseOpen(false)
            setSelectedPatient(null)
          }}
        />
      )}

      {/* Settle Period Dialog */}
      {selectedPatient && (
        <SettlePeriodDialog
          isOpen={isSettlePeriodOpen}
          onClose={() => {
            setIsSettlePeriodOpen(false)
            setSelectedPatient(null)
          }}
          patient={selectedPatient}
          onSuccess={() => {
            refetch()
            setIsSettlePeriodOpen(false)
            setSelectedPatient(null)
          }}
        />
      )}

      {/* New Period Dialog */}
      {selectedPatient && (
        <NewPeriodDialog
          isOpen={isNewPeriodOpen}
          onClose={() => {
            setIsNewPeriodOpen(false)
            setSelectedPatient(null)
          }}
          patient={selectedPatient}
          onSuccess={() => {
            refetch()
            setIsNewPeriodOpen(false)
            setSelectedPatient(null)
          }}
        />
      )}
    </div>
  )
}
