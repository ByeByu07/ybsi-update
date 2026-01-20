"use client"

import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Banknote, CheckCircle, Clock, CreditCard, CalendarClock } from "lucide-react";
import { Patient } from "@/hooks/use-patients";
import { Room } from "@/hooks/use-rooms";
import { PaymentFormData } from "./payment-form.step";
import { useState, useEffect } from "react";

type RegistrationData = {
  patient: Patient | null;
  room: Room | null;
  paymentForm: PaymentFormData | null;
  paymentMethod: 'CASH' | 'TRANSFER' | 'PAYLATER' | '' | null;
  amountPaid?: string;
};

export const PaymentMethodStep = ({
  id,
  stepper,
  selectedPayment,
  onPaymentSelect,
  registrationData,
  amountPaid,
  onAmountPaidChange
}: {
  id: string;
  stepper: any;
  selectedPayment: 'CASH' | 'TRANSFER' | 'PAYLATER' | null;
  onPaymentSelect: (method: 'CASH' | 'TRANSFER' | 'PAYLATER') => void;
  registrationData: RegistrationData;
  amountPaid?: string;
  onAmountPaidChange?: (amount: string) => void;
}) => {
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? value.replace(/\D/g, "") : value.toString();
    if (!numValue || numValue === "0") return "0";
    return new Intl.NumberFormat("id-ID").format(Number(numValue));
  };

  const parseFormattedNumber = (value: string) => {
    return value.replace(/\./g, "");
  };

  // Calculate total from payment form
  const calculateTotalFromPaymentForm = () => {
    let total = 0;
    const paymentForm = registrationData.paymentForm;
    
    if (!paymentForm) return 0;

    if (paymentForm.nursingEnabled && paymentForm.nursingFee) {
      total += Number(paymentForm.nursingFee);
    }
    if (paymentForm.snackEnabled && paymentForm.snackFee) {
      total += Number(paymentForm.snackFee);
    }
    if (paymentForm.doctorEnabled && paymentForm.doctorCheckup) {
      total += Number(paymentForm.doctorCheckup);
    }
    if (paymentForm.customCategories) {
      paymentForm.customCategories.forEach((cat) => {
        if (cat.enabled && cat.amount) {
          total += Number(cat.amount);
        }
      });
    }

    return total;
  };

  const totalAmount = calculateTotalFromPaymentForm();
  const paidAmount = amountPaid ? Number(amountPaid) : 0;
  const remainingAmount = totalAmount - paidAmount;

  // Automatically set amountPaid to "0" when PAYLATER is selected
  useEffect(() => {
    if (selectedPayment === 'PAYLATER' && onAmountPaidChange && amountPaid !== "0") {
      onAmountPaidChange("0");
    }
  }, [selectedPayment, amountPaid]);

  return (
    <stepper.Panel className="min-h-[400px] rounded-lg border bg-white p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Metode Pembayaran</h3>
          <p className="text-sm text-muted-foreground">
            Pilih metode pembayaran untuk pendaftaran ini
          </p>
        </div>

        <RadioGroup
          value={selectedPayment || ""}
          onValueChange={(value) => onPaymentSelect(value as 'CASH' | 'TRANSFER' | 'PAYLATER')}
          className="space-y-8"
        >
          {/* PAY NOW SECTION */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-1 bg-green-600 rounded-full"></div>
              <div>
                <h4 className="text-base font-bold text-green-700">Bayar Sekarang</h4>
                <p className="text-xs text-muted-foreground">
                  Pembayaran dilakukan saat ini. Pilih metode pembayaran:
                </p>
              </div>
            </div>

            <div className="space-y-3 ml-4">
              {/* CASH OPTION */}
              <Card
                className={`cursor-pointer transition-all ${
                  selectedPayment === "CASH"
                    ? "ring-2 ring-green-500 shadow-lg bg-green-50"
                    : "hover:shadow-md hover:border-green-200"
                }`}
                onClick={() => onPaymentSelect("CASH")}
              >
                <CardContent className="p-5">
                  <div className="flex items-start space-x-4">
                    <RadioGroupItem value="CASH" id="cash" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <Banknote className="h-5 w-5 text-green-600" />
                        <Label htmlFor="cash" className="text-base font-semibold cursor-pointer">
                          Tunai (Cash)
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pembayaran tunai di kasir
                      </p>
                    </div>
                    {selectedPayment === "CASH" && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-xs font-semibold">Dipilih</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* TRANSFER OPTION */}
              <Card
                className={`cursor-pointer transition-all ${
                  selectedPayment === "TRANSFER"
                    ? "ring-2 ring-blue-500 shadow-lg bg-blue-50"
                    : "hover:shadow-md hover:border-blue-200"
                }`}
                onClick={() => onPaymentSelect("TRANSFER")}
              >
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <RadioGroupItem value="TRANSFER" id="transfer" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <Label htmlFor="transfer" className="text-base font-semibold cursor-pointer">
                            Transfer Bank
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Transfer ke rekening organisasi
                        </p>
                      </div>
                      {selectedPayment === "TRANSFER" && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-xs font-semibold">Dipilih</span>
                        </div>
                      )}
                    </div>

                    {/* Transfer Details - Show when selected */}
                    {selectedPayment === "TRANSFER" && (
                      <>
                        <div className="bg-white rounded-lg border border-blue-200 p-3 space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                              Rekening Tujuan
                            </p>
                            <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded font-mono">
                              <span className="font-semibold text-gray-900 text-sm">0554 0103 7466 509</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText("0554 0103 5208 507");
                                }}
                                className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                              >
                                Salin
                              </button>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                              Atas Nama
                            </p>
                            <div className="bg-gray-50 p-2.5 rounded">
                              <span className="font-medium text-gray-900 text-sm">Rosa Hendrawan</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                              Kontak Person
                            </p>
                            <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded">
                              <span className="text-gray-900 text-sm">
                                <span className="font-medium">CP:</span> 081334614801
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText("081334614801");
                                }}
                                className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                              >
                                Salin
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                          <p className="text-xs font-semibold text-blue-900 mb-1">💡 Tips Pembayaran:</p>
                          <ul className="text-xs text-blue-800 space-y-0.5">
                            <li>✓ Transfer dapat dilakukan dari semua bank</li>
                            <li>✓ Sertakan kode pasien di berita transfer</li>
                            <li>✓ Konfirmasi pembayaran via WhatsApp CP</li>
                          </ul>
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Verifikasi pembayaran dalam 1-2 jam kerja</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* PAY LATER SECTION */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-1 bg-purple-600 rounded-full"></div>
              <div>
                <h4 className="text-base font-bold text-purple-700">Bayar Nanti</h4>
                <p className="text-xs text-muted-foreground">
                  Pembayaran dapat dilakukan setelah layanan diberikan
                </p>
              </div>
            </div>

            <div className="ml-4">
              <Card
                className={`cursor-pointer transition-all ${
                  selectedPayment === "PAYLATER"
                    ? "ring-2 ring-purple-500 shadow-lg bg-purple-50"
                    : "hover:shadow-md hover:border-purple-200"
                }`}
                onClick={() => onPaymentSelect("PAYLATER")}
              >
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <RadioGroupItem value="PAYLATER" id="paylater" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <CalendarClock className="h-5 w-5 text-purple-600" />
                          <Label htmlFor="paylater" className="text-base font-semibold cursor-pointer">
                            PayLater
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Tidak ada pembayaran di muka (Rp 0)
                        </p>
                      </div>
                      {selectedPayment === "PAYLATER" && (
                        <div className="flex items-center space-x-1 text-purple-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-xs font-semibold">Dipilih</span>
                        </div>
                      )}
                    </div>

                    {/* PayLater Info - Show when selected */}
                    {selectedPayment === "PAYLATER" && (
                      <>
                        <div className="bg-white rounded-lg border border-purple-200 p-3">
                          <p className="text-xs font-medium text-gray-900 mb-2">
                            Dengan memilih opsi ini:
                          </p>
                          <ul className="text-xs text-gray-700 space-y-1 ml-3">
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>Tidak ada pembayaran saat registrasi</span>
                            </li>
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>Pembayaran dilakukan setelah layanan selesai</span>
                            </li>
                          </ul>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                          <p className="text-xs font-semibold text-amber-900 mb-1">⚠️ Perhatian:</p>
                          <p className="text-xs text-amber-800">
                            Pastikan pasien memahami bahwa pembayaran wajib diselesaikan sebelum meninggalkan fasilitas atau sesuai kebijakan yang berlaku.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </RadioGroup>

        {/* Amount Paid Input - Only show for CASH or TRANSFER */}
        {(selectedPayment === 'CASH' || selectedPayment === 'TRANSFER') && (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Banknote className="h-5 w-5 text-green-600" />
                <span>Jumlah Pembayaran</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amountPaid" className="text-sm font-medium mb-2 block">
                  Jumlah yang Dibayar Sekarang <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Rp</span>
                  <Input
                    id="amountPaid"
                    value={formatCurrency(amountPaid || "")}
                    onChange={(e) => {
                      const rawValue = parseFormattedNumber(e.target.value);
                      if (onAmountPaidChange) {
                        onAmountPaidChange(rawValue);
                      }
                    }}
                    placeholder="0"
                    className="flex-1 text-lg font-semibold"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Masukkan jumlah uang yang diterima dari pasien/keluarga
                </p>
              </div>

              {/* Payment Summary */}
              <div className="space-y-2 pt-3 border-t border-green-200">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Tagihan:</span>
                  <span className="font-semibold">Rp {formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dibayar Sekarang:</span>
                  <span className="font-semibold text-green-600">
                    Rp {formatCurrency(paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-green-200">
                  <span className="font-semibold">
                    {remainingAmount > 0 ? "Sisa Tagihan:" : remainingAmount < 0 ? "Kembalian:" : "Status:"}
                  </span>
                  <span className={`font-bold ${
                    remainingAmount > 0 
                      ? "text-orange-600" 
                      : remainingAmount < 0 
                      ? "text-blue-600" 
                      : "text-green-600"
                  }`}>
                    {remainingAmount === 0 
                      ? "LUNAS" 
                      : `Rp ${formatCurrency(Math.abs(remainingAmount))}`
                    }
                  </span>
                </div>
              </div>

              {remainingAmount < 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-900">💵 Kembalian untuk Pasien</p>
                  <p className="text-xs text-blue-800 mt-1">
                    Pastikan untuk memberikan kembalian sebesar Rp {formatCurrency(Math.abs(remainingAmount))}
                  </p>
                </div>
              )}

              {remainingAmount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-orange-900">⚠️ Pembayaran Belum Lunas</p>
                  <p className="text-xs text-orange-800 mt-1">
                    Masih ada sisa tagihan sebesar Rp {formatCurrency(remainingAmount)} yang perlu dibayar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Registration Summary */}
        {selectedPayment && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Ringkasan Registrasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pasien:</span>
                <span className="font-medium">{registrationData.patient?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kamar:</span>
                <span className="font-medium">
                  {registrationData.room?.roomNumber} ({registrationData.room?.roomType})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metode Pembayaran:</span>
                <span className="font-medium">
                  {selectedPayment === 'CASH' && 'Tunai'}
                  {selectedPayment === 'PAYLATER' && 'Bayar Nanti'}
                  {selectedPayment === 'TRANSFER' && 'Transfer Bank'}
                </span>
              </div>
              {selectedPayment === 'PAYLATER' && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Pembayaran Sekarang:</span>
                  <span className="font-bold text-lg text-purple-600">Rp 0</span>
                </div>
              )}
              {(selectedPayment === 'CASH' || selectedPayment === 'TRANSFER') && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Pembayaran Sekarang:</span>
                  <span className="font-bold text-lg text-green-600">
                    Rp {formatCurrency(paidAmount)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </stepper.Panel>
  );
};