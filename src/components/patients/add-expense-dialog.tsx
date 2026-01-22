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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Receipt } from "lucide-react"

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
    invoiceCode: string
  } | null
}

type ExpenseItem = {
  id: string
  enabled: boolean
  description: string
  amount: string
  expenseType: 'NURSING' | 'SNACK' | 'DOCTOR' | 'CUSTOM' | 'MEDICINE' | 'SUPPLIES'
}

type AddExpenseDialogProps = {
  isOpen: boolean
  onClose: () => void
  patient: ActivePatient
  onSuccess: () => void
}

export function AddExpenseDialog({ isOpen, onClose, patient, onSuccess }: AddExpenseDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH')
  const [bankAccountName, setBankAccountName] = useState('BCA 0554 0103 5208 507')
  const [notes, setNotes] = useState('')
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Expense categories (matching invoice categories)
  const [nursingEnabled, setNursingEnabled] = useState(false)
  const [nursingAmount, setNursingAmount] = useState('')
  const [snackEnabled, setSnackEnabled] = useState(false)
  const [snackAmount, setSnackAmount] = useState('')
  const [doctorEnabled, setDoctorEnabled] = useState(false)
  const [doctorAmount, setDoctorAmount] = useState('')
  const [customExpenses, setCustomExpenses] = useState<ExpenseItem[]>([])

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

  const addCustomExpense = () => {
    setCustomExpenses([
      ...customExpenses,
      {
        id: `custom-${Date.now()}`,
        enabled: true,
        description: "",
        amount: "",
        expenseType: "CUSTOM" as const,
      },
    ])
  }

  const removeCustomExpense = (id: string) => {
    setCustomExpenses(customExpenses.filter((exp) => exp.id !== id))
  }

  const updateCustomExpense = (id: string, field: string, value: any) => {
    setCustomExpenses(
      customExpenses.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    )
  }

  const calculateTotal = () => {
    let total = 0
    if (nursingEnabled && nursingAmount) total += Number(nursingAmount)
    if (snackEnabled && snackAmount) total += Number(snackAmount)
    if (doctorEnabled && doctorAmount) total += Number(doctorAmount)
    customExpenses.forEach((exp) => {
      if (exp.enabled && exp.amount) total += Number(exp.amount)
    })
    return total
  }

  const handleSubmit = async () => {
    // Build expense items
    const expenseItems = []

    if (nursingEnabled && nursingAmount) {
      expenseItems.push({
        description: "Perawatan",
        amount: nursingAmount,
        expenseType: "NURSING" as const,
      })
    }

    if (snackEnabled && snackAmount) {
      expenseItems.push({
        description: "Snack/Keb. Diri",
        amount: snackAmount,
        expenseType: "SNACK" as const,
      })
    }

    if (doctorEnabled && doctorAmount) {
      expenseItems.push({
        description: "Kontrol dokter",
        amount: doctorAmount,
        expenseType: "DOCTOR" as const,
      })
    }

    customExpenses.forEach((exp) => {
      if (exp.enabled && exp.amount && exp.description) {
        expenseItems.push({
          description: exp.description,
          amount: exp.amount,
          expenseType: exp.expenseType,
        })
      }
    })

    if (expenseItems.length === 0) {
      toast.error("Tambahkan minimal 1 item pengeluaran")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        bookingId: patient.booking.id,
        expenseItems,
        paymentMethod,
        bankAccountName: paymentMethod === 'BANK_TRANSFER' ? bankAccountName : undefined,
        notes: notes || undefined,
        expenseDate,
      }

      console.log(payload)

      const response = await fetch(`/api/bookings/${patient.booking.id}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add expenses')
      }

      toast.success(
        `Pengeluaran berhasil dicatat! Total: ${formatCurrencyDisplay(calculateTotal())}`
      )

      // Reset form
      setNursingEnabled(false)
      setNursingAmount('')
      setSnackEnabled(false)
      setSnackAmount('')
      setDoctorEnabled(false)
      setDoctorAmount('')
      setCustomExpenses([])
      setPaymentMethod('CASH')
      setNotes('')
      setExpenseDate(new Date().toISOString().split('T')[0])

      onSuccess()
    } catch (error) {
      console.error('Add expense error:', error)
      toast.error(error instanceof Error ? error.message : "Gagal menambahkan pengeluaran")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Tambah Pengeluaran
          </DialogTitle>
          <DialogDescription>
            Catat pengeluaran untuk pasien {patient.patient.name}
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
                {patient.invoice && (
                  <div>
                    <p className="text-muted-foreground">Invoice</p>
                    <p className="font-medium">{patient.invoice.invoiceCode}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expense Date */}
          <div className="space-y-2">
            <Label htmlFor="expenseDate">
              Tanggal Pengeluaran <span className="text-red-500">*</span>
            </Label>
            <Input
              id="expenseDate"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Expense Items */}
          <div>
            <Label className="mb-3 block">
              Item Pengeluaran <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-4">
              {/* Nursing */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="nursing"
                  checked={nursingEnabled}
                  onCheckedChange={(checked) => {
                    setNursingEnabled(!!checked)
                    if (!checked) setNursingAmount('')
                  }}
                />
                <Label htmlFor="nursing" className="cursor-pointer flex-shrink-0 w-36">
                  Perawatan:
                </Label>
                <div className="flex items-center flex-1">
                  <span className="text-sm text-muted-foreground mr-2">Rp</span>
                  <Input
                    className="w-full"
                    placeholder="0"
                    value={formatCurrency(nursingAmount)}
                    onChange={(e) => {
                      const rawValue = parseFormattedNumber(e.target.value)
                      setNursingAmount(rawValue)
                      if (rawValue && !nursingEnabled) setNursingEnabled(true)
                    }}
                  />
                </div>
              </div>

              {/* Snack */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="snack"
                  checked={snackEnabled}
                  onCheckedChange={(checked) => {
                    setSnackEnabled(!!checked)
                    if (!checked) setSnackAmount('')
                  }}
                />
                <Label htmlFor="snack" className="cursor-pointer flex-shrink-0 w-36">
                  Snack/Keb. Diri:
                </Label>
                <div className="flex items-center flex-1">
                  <span className="text-sm text-muted-foreground mr-2">Rp</span>
                  <Input
                    className="w-full"
                    placeholder="0"
                    value={formatCurrency(snackAmount)}
                    onChange={(e) => {
                      const rawValue = parseFormattedNumber(e.target.value)
                      setSnackAmount(rawValue)
                      if (rawValue && !snackEnabled) setSnackEnabled(true)
                    }}
                  />
                </div>
              </div>

              {/* Doctor */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="doctor"
                  checked={doctorEnabled}
                  onCheckedChange={(checked) => {
                    setDoctorEnabled(!!checked)
                    if (!checked) setDoctorAmount('')
                  }}
                />
                <Label htmlFor="doctor" className="cursor-pointer flex-shrink-0 w-36">
                  Kontrol dokter:
                </Label>
                <div className="flex items-center flex-1">
                  <span className="text-sm text-muted-foreground mr-2">Rp</span>
                  <Input
                    className="w-full"
                    placeholder="0"
                    value={formatCurrency(doctorAmount)}
                    onChange={(e) => {
                      const rawValue = parseFormattedNumber(e.target.value)
                      setDoctorAmount(rawValue)
                      if (rawValue && !doctorEnabled) setDoctorEnabled(true)
                    }}
                  />
                </div>
              </div>

              {/* Custom Expenses */}
              {customExpenses.map((expense) => (
                <div key={expense.id} className="space-y-2 p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={expense.enabled}
                      onCheckedChange={(checked) =>
                        updateCustomExpense(expense.id, 'enabled', !!checked)
                      }
                    />
                    <Input
                      className="flex-1"
                      placeholder="Deskripsi (contoh: Obat, Bahan habis pakai)"
                      value={expense.description}
                      onChange={(e) =>
                        updateCustomExpense(expense.id, 'description', e.target.value)
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomExpense(expense.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3 ml-9">
                    <span className="text-sm text-muted-foreground mr-2">Rp</span>
                    <Input
                      className="w-full"
                      placeholder="0"
                      value={formatCurrency(expense.amount)}
                      onChange={(e) => {
                        const rawValue = parseFormattedNumber(e.target.value)
                        updateCustomExpense(expense.id, 'amount', rawValue)
                        if (rawValue && !expense.enabled) {
                          updateCustomExpense(expense.id, 'enabled', true)
                        }
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Add Custom Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomExpense}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Item Lainnya
              </Button>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between items-center">
              <Label className="font-semibold">Total Pengeluaran:</Label>
              <span className="text-lg font-bold">
                {formatCurrencyDisplay(calculateTotal())}
              </span>
            </div>
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
              <Label htmlFor="bankAccount">Rekening Sumber</Label>
              <Input
                id="bankAccount"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="BCA 0554 0103 5208 507"
              />
              <p className="text-xs text-muted-foreground">
                Rekening yang digunakan untuk pembayaran
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan tentang pengeluaran ini..."
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
              disabled={isSubmitting || calculateTotal() <= 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Simpan Pengeluaran'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
