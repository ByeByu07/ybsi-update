"use client"

import { useState, useEffect } from "react"
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
import { Loader2, Calendar, Plus } from "lucide-react"

type ActivePatient = {
  patient: {
    id: string
    patientCode: string
    name: string
  }
  booking: {
    id: string
    bookingCode: string
    monthlyContractAmount: string | null
  }
  room: {
    roomNumber: string
    roomType: string
  }
}

type NewPeriodDialogProps = {
  isOpen: boolean
  onClose: () => void
  patient: ActivePatient
  onSuccess: () => void
}

export function NewPeriodDialog({ isOpen, onClose, patient, onSuccess }: NewPeriodDialogProps) {
  const [receivedFrom, setReceivedFrom] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH')
  const [bankAccountName, setBankAccountName] = useState('BCA 0554 0103 5208 507')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCharges, setIsLoadingCharges] = useState(false)
  const [unpaidCharges, setUnpaidCharges] = useState<any[]>([])

  const monthlyAmount = patient.booking.monthlyContractAmount || '0'
  const unpaidChargesTotal = unpaidCharges.reduce((sum, c) => sum + Number(c.amount), 0)
  const totalPaymentRequired = Number(monthlyAmount) + unpaidChargesTotal

  // Fetch unpaid charges when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchUnpaidCharges()
    }
  }, [isOpen])

  const fetchUnpaidCharges = async () => {
    setIsLoadingCharges(true)
    try {
      const response = await fetch(`/api/bookings/${patient.booking.id}/charges?unpaidOnly=true`)
      if (response.ok) {
        const result = await response.json()
        setUnpaidCharges(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch unpaid charges:', error)
    } finally {
      setIsLoadingCharges(false)
    }
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

  const handleSubmit = async () => {
    if (!receivedFrom.trim()) {
      toast.error("Nama penerima harus diisi")
      return
    }

    if (paymentMethod === 'BANK_TRANSFER' && !bankAccountName.trim()) {
      toast.error("Nama rekening bank harus diisi untuk transfer")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        receivedFrom: receivedFrom.trim(),
        paymentMethod,
        amountPaid: String(totalPaymentRequired), // Include unpaid charges
        bankAccountName: paymentMethod === 'BANK_TRANSFER' ? bankAccountName : undefined,
        additionalNotes: additionalNotes.trim() || undefined,
      }

      const response = await fetch(`/api/bookings/${patient.booking.id}/billing-periods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create billing period')
      }

      toast.success(
        `Periode bulanan baru berhasil dibuat! Total: ${formatCurrency(monthlyAmount)}`
      )

      // Reset form
      setReceivedFrom('')
      setPaymentMethod('CASH')
      setAdditionalNotes('')
      setBankAccountName('BCA 0554 0103 5208 507')

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Create billing period error:', error)
      toast.error(error instanceof Error ? error.message : "Gagal membuat periode bulanan baru")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Buat Periode Bulanan Baru
          </DialogTitle>
          <DialogDescription>
            Buat periode bulanan baru untuk pasien {patient.patient.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                  <p className="text-muted-foreground">Jumlah Bulanan</p>
                  <p className="font-medium text-green-600">{formatCurrency(monthlyAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Amount Breakdown */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Prepaid Bulanan:</Label>
                  <span className="font-semibold">{formatCurrency(monthlyAmount)}</span>
                </div>

                {isLoadingCharges ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengecek hutang...
                  </div>
                ) : unpaidCharges.length > 0 ? (
                  <>
                    <div className="border-t pt-3">
                      <Label className="text-sm text-orange-600 mb-2 block">Hutang Bulan Sebelumnya:</Label>
                      {unpaidCharges.map((charge) => (
                        <div key={charge.id} className="flex justify-between items-start text-sm mb-2 pl-4">
                          <span className="text-muted-foreground flex-1">
                            {charge.description}
                            <span className="text-xs block text-gray-400">
                              {charge.chargeCode} - {new Date(charge.chargeDate).toLocaleDateString('id-ID')}
                            </span>
                          </span>
                          <span className="font-medium text-orange-600">
                            +{formatCurrency(charge.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t-2 border-gray-300 pt-3">
                      <div className="flex justify-between items-center">
                        <Label className="font-semibold text-base">TOTAL PEMBAYARAN:</Label>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(totalPaymentRequired)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Prepaid Rp {Number(monthlyAmount).toLocaleString('id-ID')} + Pelunasan Hutang Rp {unpaidChargesTotal.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold text-base">TOTAL PEMBAYARAN:</Label>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(monthlyAmount)}
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Tidak ada hutang bulan sebelumnya
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Received From */}
          <div className="space-y-2">
            <Label htmlFor="receivedFrom">
              Diterima Dari <span className="text-red-500">*</span>
            </Label>
            <Input
              id="receivedFrom"
              placeholder="Nama keluarga/wali pasien yang membayar"
              value={receivedFrom}
              onChange={(e) => setReceivedFrom(e.target.value)}
            />
          </div>

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
                  Transfer Bank
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Bank Transfer Fields */}
          {paymentMethod === 'BANK_TRANSFER' && (
            <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
              <Label htmlFor="bankAccount">Rekening Tujuan</Label>
              <Input
                id="bankAccount"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="BCA 0554 0103 5208 507"
              />
              <p className="text-xs text-muted-foreground">
                Rekening tujuan transfer pembayaran
              </p>
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
            <Textarea
              id="notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Catatan tambahan tentang pembayaran ini..."
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
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Periode Baru
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
