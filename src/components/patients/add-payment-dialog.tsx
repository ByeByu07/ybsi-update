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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type ActivePatient = {
  patient: {
    id: string
    patientCode: string
    name: string
    birthDate: string
    gender: string
  }
  booking: {
    id: string
    bookingCode: string
  }
  room: {
    roomNumber: string
    roomType: string
  }
  invoice: {
    id: string
    invoiceCode: string
    totalAmount: string
    paidAmount: string
    balanceAmount: string
  } | null
}

type AddPaymentDialogProps = {
  isOpen: boolean
  onClose: () => void
  patient: ActivePatient
  onSuccess: () => void
}

export function AddPaymentDialog({ isOpen, onClose, patient, onSuccess }: AddPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH')
  const [amountPaid, setAmountPaid] = useState('')
  const [bankAccountName, setBankAccountName] = useState('BRI 0554 0103 7466 509')
  const [transferReferenceNumber, setTransferReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? value.replace(/\D/g, "") : value.toString()
    if (!numValue || numValue === "0") return "0"
    return new Intl.NumberFormat("id-ID").format(Number(numValue))
  }

  const parseFormattedNumber = (value: string) => {
    return value.replace(/\./g, "")
  }

  const formatCurrencyDisplay = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue)
  }

  const handleSubmit = async () => {
    if (!patient.invoice) {
      toast.error("Invoice tidak ditemukan")
      return
    }

    const amount = parseFloat(amountPaid)
    if (!amount || amount <= 0) {
      toast.error("Jumlah pembayaran harus lebih dari 0")
      return
    }

    const balance = parseFloat(patient.invoice.balanceAmount)
    if (amount > balance) {
      toast.error("Jumlah pembayaran melebihi sisa tagihan")
      return
    }

    if (paymentMethod === 'BANK_TRANSFER' && !transferReferenceNumber) {
      toast.error("Nomor referensi transfer harus diisi")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        invoiceId: patient.invoice.id,
        bookingId: patient.booking.id,
        amount: amountPaid,
        paymentMethod,
        bankAccountName: paymentMethod === 'BANK_TRANSFER' ? bankAccountName : undefined,
        transferReferenceNumber: paymentMethod === 'BANK_TRANSFER' ? transferReferenceNumber : undefined,
        notes: notes || undefined,
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add payment')
      }

      toast.success(
        paymentMethod === 'CASH'
          ? `Pembayaran berhasil dicatat! Kode: ${result.data.paymentCode}`
          : 'Pembayaran berhasil dicatat dan menunggu verifikasi bendahara'
      )

      // Reset form
      setAmountPaid('')
      setPaymentMethod('CASH')
      setTransferReferenceNumber('')
      setNotes('')

      onSuccess()
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error instanceof Error ? error.message : "Gagal menambahkan pembayaran")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!patient.invoice) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Pembayaran</DialogTitle>
          <DialogDescription>
            Tambahkan pembayaran untuk pasien {patient.patient.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient & Invoice Summary */}
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
                  <p className="text-muted-foreground">Invoice</p>
                  <p className="font-medium">{patient.invoice.invoiceCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Booking</p>
                  <p className="font-medium">{patient.booking.bookingCode}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-300">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Tagihan</p>
                    <p className="font-bold text-lg">{formatCurrencyDisplay(patient.invoice.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sudah Dibayar</p>
                    <p className="font-bold text-lg text-green-600">{formatCurrencyDisplay(patient.invoice.paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sisa Tagihan</p>
                    <p className="font-bold text-lg text-red-600">{formatCurrencyDisplay(patient.invoice.balanceAmount)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Metode Pembayaran</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as 'CASH' | 'BANK_TRANSFER')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CASH" id="cash" />
                <Label htmlFor="cash" className="cursor-pointer">
                  Tunai (Cash)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="BANK_TRANSFER" id="bank" />
                <Label htmlFor="bank" className="cursor-pointer">
                  Transfer Bank (Perlu Verifikasi)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Jumlah Bayar <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-2">Rp</span>
              <Input
                id="amount"
                placeholder="0"
                value={formatCurrency(amountPaid)}
                onChange={(e) => {
                  const rawValue = parseFormattedNumber(e.target.value)
                  setAmountPaid(rawValue)
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Maksimal: {formatCurrencyDisplay(patient.invoice.balanceAmount)}
            </p>
          </div>

          {/* Bank Transfer Fields */}
          {paymentMethod === 'BANK_TRANSFER' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Rekening Tujuan</Label>
                <Input
                  id="bankAccount"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="BCA 0554 0103 5208 507"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refNumber">
                  Nomor Referensi Transfer <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="refNumber"
                  value={transferReferenceNumber}
                  onChange={(e) => setTransferReferenceNumber(e.target.value)}
                  placeholder="Contoh: 1234567890"
                />
                <p className="text-xs text-muted-foreground">
                  Nomor referensi dari bank (untuk verifikasi)
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Catatan:</strong> Pembayaran via transfer bank akan masuk ke status "Menunggu Verifikasi"
                  dan harus diverifikasi oleh bendahara sebelum invoice diupdate.
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan untuk pembayaran ini..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !amountPaid || parseFloat(amountPaid) <= 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Simpan Pembayaran'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
