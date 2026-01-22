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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
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
    checkIn: string
  }
  room: {
    roomNumber: string
    roomType: string
  }
  invoice: {
    id: string
    invoiceCode: string
    status: string
    balanceAmount: string
  } | null
}

type CompleteBookingDialogProps = {
  isOpen: boolean
  onClose: () => void
  patient: ActivePatient
  onSuccess: () => void
}

export function CompleteBookingDialog({ isOpen, onClose, patient, onSuccess }: CompleteBookingDialogProps) {
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const calculateDays = () => {
    const checkIn = new Date(patient.booking.checkIn)
    const checkOut = new Date(checkOutDate)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const hasOutstandingBalance = patient.invoice && parseFloat(patient.invoice.balanceAmount) > 0

  const handleSubmit = async () => {
    if (!checkOutDate) {
      toast.error("Tanggal check-out harus diisi")
      return
    }

    const checkIn = new Date(patient.booking.checkIn)
    const checkOut = new Date(checkOutDate)

    if (checkOut < checkIn) {
      toast.error("Tanggal check-out tidak boleh sebelum check-in")
      return
    }

    if (hasOutstandingBalance) {
      toast.error("Pembayaran belum lunas. Selesaikan pembayaran terlebih dahulu.")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        checkOut: new Date(checkOutDate).toISOString(),
        notes: notes || undefined,
      }

      const response = await fetch(`/api/bookings/${patient.booking.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete booking')
      }

      toast.success(`Booking berhasil diselesaikan! Durasi rawat: ${calculateDays()} hari`)

      setCheckOutDate(new Date().toISOString().split('T')[0])
      setNotes('')

      onSuccess()
    } catch (error) {
      console.error('Complete booking error:', error)
      toast.error(error instanceof Error ? error.message : "Gagal menyelesaikan booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Selesaikan Booking
          </DialogTitle>
          <DialogDescription>
            Tandai booking sebagai selesai dan bebaskan kamar
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
          {/* Patient & Booking Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Pasien</p>
                  <p className="font-medium">{patient.patient.name}</p>
                  <p className="text-xs text-muted-foreground">{patient.patient.patientCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Kamar</p>
                  <p className="font-medium">{patient.room.roomNumber}</p>
                  <p className="text-xs text-muted-foreground">{patient.room.roomType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Booking</p>
                  <p className="font-medium">{patient.booking.bookingCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Check In</p>
                  <p className="font-medium">{formatDate(patient.booking.checkIn)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status Warning */}
          {hasOutstandingBalance && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Perhatian!</strong> Pasien masih memiliki tagihan yang belum lunas sebesar{" "}
                <strong>{formatCurrency(patient.invoice!.balanceAmount)}</strong>.
                Selesaikan pembayaran terlebih dahulu sebelum menyelesaikan booking.
              </AlertDescription>
            </Alert>
          )}

          {!hasOutstandingBalance && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                Pembayaran sudah lunas. Booking siap untuk diselesaikan.
              </AlertDescription>
            </Alert>
          )}

          {/* Check Out Date */}
          <div className="space-y-2">
            <Label htmlFor="checkOut" className="text-sm">
              Tanggal Check Out <span className="text-red-500">*</span>
            </Label>
            <Input
              id="checkOut"
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              min={patient.booking.checkIn.split('T')[0]}
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">
              Durasi rawat: <strong>{calculateDays()} hari</strong>
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm">Catatan Tambahan (Opsional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tentang penyelesaian booking..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Important Notice */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <div className="text-xs text-yellow-800">
                  <p className="font-semibold mb-1">Perhatian:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Booking akan ditandai sebagai COMPLETED</li>
                    <li>Kamar {patient.room.roomNumber} akan menjadi AVAILABLE kembali</li>
                    <li>Pasien tidak bisa ditambahkan pembayaran setelah booking selesai</li>
                    <li>Aksi ini tidak dapat dibatalkan</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !checkOutDate || hasOutstandingBalance}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Selesaikan Booking
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}