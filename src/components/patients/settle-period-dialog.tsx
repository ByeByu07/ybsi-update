"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type ActivePatient = {
  patient: {
    id: string
    patientCode: string
    name: string
  }
  booking: {
    id: string
    bookingCode: string
  }
  room: {
    roomNumber: string
    roomType: string
  }
  billingPeriod: {
    id: string
    periodCode: string
    periodMonth: number
    periodYear: number
    prepaidAmount: string
    spentAmount: string
    remainingBalance: string
  } | null
}

type SettlePeriodDialogProps = {
  isOpen: boolean
  onClose: () => void
  patient: ActivePatient
  onSuccess: () => void
}

export function SettlePeriodDialog({ isOpen, onClose, patient, onSuccess }: SettlePeriodDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue)
  }

  const handleSettle = async () => {
    if (!patient.billingPeriod) {
      toast.error("Tidak ada periode aktif untuk diselesaikan")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/billing-periods/${patient.billingPeriod.id}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to settle billing period')
      }

      const revenue = Number(patient.billingPeriod.remainingBalance)

      toast.success(
        `Periode berhasil diselesaikan! Pendapatan: ${formatCurrency(revenue)}`
      )

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Settle period error:', error)
      toast.error(error instanceof Error ? error.message : "Gagal menyelesaikan periode")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!patient.billingPeriod) {
    return null
  }

  const remainingBalance = Number(patient.billingPeriod.remainingBalance)
  const prepaidAmount = Number(patient.billingPeriod.prepaidAmount)
  const spentAmount = Number(patient.billingPeriod.spentAmount)
  const percentageSpent = (spentAmount / prepaidAmount) * 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Selesaikan Periode Bulanan
          </DialogTitle>
          <DialogDescription>
            Tutup periode {patient.billingPeriod.periodMonth}/{patient.billingPeriod.periodYear} dan catat sisa saldo sebagai pendapatan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Patient Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Pasien</p>
                  <p className="font-medium">{patient.patient.name}</p>
                  <p className="text-xs text-muted-foreground">{patient.patient.patientCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kamar</p>
                  <p className="font-medium">{patient.room.roomNumber}</p>
                  <p className="text-xs text-muted-foreground">{patient.room.roomType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Booking</p>
                  <p className="font-medium">{patient.booking.bookingCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Periode</p>
                  <p className="font-medium">{patient.billingPeriod.periodCode}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Prepaid Bulanan:</span>
                  <span className="font-semibold">{formatCurrency(prepaidAmount)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Pengeluaran:</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(spentAmount)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b-2 border-gray-300">
                  <span className="text-sm text-muted-foreground">Sisa Saldo:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(remainingBalance)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Pendapatan yang Akan Dicatat:</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(remainingBalance)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Pengeluaran: {percentageSpent.toFixed(1)}%</span>
                  <span>Sisa: {(100 - percentageSpent).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${100 - percentageSpent}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Setelah periode diselesaikan, Anda tidak dapat menambahkan pengeluaran lagi ke periode ini.
              Sisa saldo Rp {remainingBalance.toLocaleString('id-ID')} akan dicatat sebagai pendapatan.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              onClick={handleSettle}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Selesaikan Periode
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
