"use client"

import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Receipt } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

type Payment = {
  id: string
  paymentCode: string
  amount: string
  paymentMethod: string
  bankAccountName: string | null
  transferReferenceNumber: string | null
  transferProofUrl: string | null
  status: string
  paymentDate: string
  notes: string | null
  createdAt: string
  receivedByUserId: string
  receivedByName: string
  verifiedByUserId: string | null
  verifiedAt: string | null
  verifiedByName: string | null
}

type ActivePatient = {
  patient: {
    name: string
    patientCode: string
  }
  booking: {
    bookingCode: string
  }
  invoice: {
    id: string
    invoiceCode: string
    totalAmount: string
    paidAmount: string
    balanceAmount: string
  } | null
}

type PaymentHistoryDialogProps = {
  isOpen: boolean
  onClose: () => void
  patient: ActivePatient
}

async function fetchPaymentHistory(invoiceId: string) {
  const res = await fetch(`/api/invoices/${invoiceId}/payments`)
  if (!res.ok) throw new Error('Failed to fetch payment history')
  const result = await res.json()
  return result.data as Payment[]
}

export function PaymentHistoryDialog({ isOpen, onClose, patient }: PaymentHistoryDialogProps) {
  const { data: payments, isLoading, isError, refetch } = useQuery({
    queryKey: ['payment-history', patient.invoice?.id],
    queryFn: () => fetchPaymentHistory(patient.invoice!.id),
    enabled: isOpen && !!patient.invoice?.id,
  })

  useEffect(() => {
    if (isOpen && patient.invoice?.id) {
      refetch()
    }
  }, [isOpen, patient.invoice?.id, refetch])

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue)
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

  const getPaymentMethodBadge = (method: string) => {
    const methodMap: Record<string, { label: string; color: string }> = {
      CASH: { label: "Tunai", color: "bg-green-100 text-green-800" },
      BANK_TRANSFER: { label: "Transfer Bank", color: "bg-blue-100 text-blue-800" },
    }

    const info = methodMap[method] || { label: method, color: "bg-gray-100 text-gray-800" }

    return (
      <Badge variant="outline" className={info.color}>
        {info.label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      VERIFIED: { label: "Terverifikasi", color: "bg-green-100 text-green-800" },
      PENDING: { label: "Menunggu Verifikasi", color: "bg-yellow-100 text-yellow-800" },
      REJECTED: { label: "Ditolak", color: "bg-red-100 text-red-800" },
    }

    const info = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }

    return (
      <Badge variant="outline" className={info.color}>
        {info.label}
      </Badge>
    )
  }

  if (!patient.invoice) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Riwayat Pembayaran
          </DialogTitle>
          <DialogDescription>
            Riwayat pembayaran untuk {patient.patient.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient & Invoice Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">Pasien</p>
                  <p className="font-medium">{patient.patient.name}</p>
                  <p className="text-xs text-muted-foreground">{patient.patient.patientCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Invoice</p>
                  <p className="font-medium">{patient.invoice.invoiceCode}</p>
                  <p className="text-xs text-muted-foreground">{patient.booking.bookingCode}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-blue-300">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Tagihan</p>
                    <p className="font-bold text-lg">{formatCurrency(patient.invoice.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sudah Dibayar</p>
                    <p className="font-bold text-lg text-green-600">{formatCurrency(patient.invoice.paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sisa Tagihan</p>
                    <p className="font-bold text-lg text-red-600">{formatCurrency(patient.invoice.balanceAmount)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History Table */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Daftar Pembayaran</h3>

            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}

            {isError && (
              <Card className="border-destructive">
                <CardContent className="flex items-center gap-2 py-6">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-destructive">Gagal memuat riwayat pembayaran</p>
                </CardContent>
              </Card>
            )}

            {!isLoading && !isError && payments && payments.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Belum Ada Pembayaran</h3>
                  <p className="text-muted-foreground text-center">
                    Belum ada pembayaran yang tercatat untuk invoice ini.
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoading && !isError && payments && payments.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Bayar</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Diterima Oleh</TableHead>
                      <TableHead>Verifikasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="font-medium">{payment.paymentCode}</div>
                          {payment.notes && (
                            <div className="text-xs text-muted-foreground">{payment.notes}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatDate(payment.paymentDate)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getPaymentMethodBadge(payment.paymentMethod)}
                            {payment.bankAccountName && (
                              <div className="text-xs text-muted-foreground">
                                {payment.bankAccountName}
                              </div>
                            )}
                            {payment.transferReferenceNumber && (
                              <div className="text-xs text-muted-foreground">
                                Ref: {payment.transferReferenceNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-green-600">
                            {formatCurrency(payment.amount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{payment.receivedByName}</div>
                        </TableCell>
                        <TableCell>
                          {payment.status === 'VERIFIED' && payment.verifiedByName ? (
                            <div className="text-sm">
                              <div className="font-medium">{payment.verifiedByName}</div>
                              {payment.verifiedAt && (
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(payment.verifiedAt)}
                                </div>
                              )}
                            </div>
                          ) : payment.status === 'PENDING' ? (
                            <div className="text-xs text-muted-foreground">Belum diverifikasi</div>
                          ) : (
                            <div className="text-xs text-muted-foreground">-</div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Summary */}
          {!isLoading && !isError && payments && payments.length > 0 && (
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Pembayaran Tercatat:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(
                      payments
                        .filter(p => p.status === 'VERIFIED')
                        .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                    )}
                  </span>
                </div>
                {payments.some(p => p.status === 'PENDING') && (
                  <p className="text-xs text-yellow-700 mt-2">
                    * Pembayaran dengan status "Menunggu Verifikasi" belum termasuk dalam total yang terbayar
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
