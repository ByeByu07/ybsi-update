import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from "react"
import { useBreadcrumb } from "@/components/breadcrumb-provider"
import { defineStepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import {
  type Room
} from "@/hooks/use-rooms";
import {
  type Patient,
} from "@/hooks/use-patients";
import { PaymentFormStep } from "@/components/registration/payment-form.step";
import { PaymentFormData } from "@/components/registration/payment-form.step";
import { PatientStep } from "@/components/registration/patient.step";
import { RoomStep } from "@/components/registration/room.step";
import { PaymentMethodStep } from "@/components/registration/payment-method.step";
import { toast } from "sonner"

export const Route = createFileRoute('/dashboard/registration')({
  component: RouteComponent,
})

const { Stepper } = defineStepper(
  { id: "step-1", title: "Data Pasien" },
  { id: "step-2", title: "Pilih Kamar" },
  { id: "step-3", title: "Detail Pembayaran" },
  { id: "step-4", title: "Metode Pembayaran" },
);

type RegistrationData = {
  patient: Patient | null;
  room: Room | null;
  paymentForm: PaymentFormData | null;
  paymentMethod: 'CASH' | 'TRANSFER' | 'PAYLATER' | null;
  amountPaid: string;
};

function RouteComponent() {
    const { setBreadcrumbs } = useBreadcrumb()
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    patient: null,
    room: null,
    paymentForm: null,
    paymentMethod: null,
    amountPaid: "0",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

const generateAndPrintInvoice = async (invoiceId: string) => {
    try {
      // Fetch the generated invoice document
      const response = await fetch(`/api/invoices/${invoiceId}/generate`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      // Get the blob
      const blob = await response.blob();

      // Create URL for the blob
      const url = URL.createObjectURL(blob);

      // Open in new window for printing
      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            // Try to trigger print dialog
            printWindow.print();
          }, 1000);
        };
      }

      // Clean up the URL after some time
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 10000);
    } catch (error) {
      console.error('Error generating and printing invoice:', error);
      throw error;
    }
  };

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard/worker" },
      { label: "Registrasi" },
    ])
  }, [setBreadcrumbs])

  const handleSubmitRegistration = async () => {
    if (!registrationData.patient || !registrationData.room || !registrationData.paymentForm || !registrationData.paymentMethod) {
      toast.error("Data registrasi tidak lengkap");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare line items from payment form
      const lineItems = [];

      if (registrationData.paymentForm.nursingEnabled && registrationData.paymentForm.nursingFee) {
        lineItems.push({
          description: "Perawatan",
          amount: registrationData.paymentForm.nursingFee,
          itemType: "NURSING" as const,
        });
      }

      if (registrationData.paymentForm.snackEnabled && registrationData.paymentForm.snackFee) {
        lineItems.push({
          description: "Snack/ keb. Diri",
          amount: registrationData.paymentForm.snackFee,
          itemType: "SNACK" as const,
        });
      }

      if (registrationData.paymentForm.doctorEnabled && registrationData.paymentForm.doctorCheckup) {
        lineItems.push({
          description: "Kontrol dokter",
          amount: registrationData.paymentForm.doctorCheckup,
          itemType: "DOCTOR" as const,
        });
      }

      if (registrationData.paymentForm.customCategories) {
        registrationData.paymentForm.customCategories.forEach((cat) => {
          if (cat.enabled && cat.amount && cat.description) {
            lineItems.push({
              description: cat.description,
              amount: cat.amount,
              itemType: "CUSTOM" as const,
            });
          }
        });
      }

      // Prepare request payload
      const payload = {
        patientId: registrationData.patient.id,
        roomId: registrationData.room.id,
        checkIn: new Date().toISOString(),
        paymentForm: {
          receivedFrom: registrationData.paymentForm.receivedFrom,
          lineItems,
          additionalNotes: registrationData.paymentForm.additionalNotes,
        },
        paymentMethod: registrationData.paymentMethod,
        amountPaid: registrationData.paymentMethod === 'PAYLATER' ? '0' : registrationData.amountPaid,
        bankAccountName: registrationData.paymentMethod === 'BANK_TRANSFER' ? "BCA 0554 0103 5208 507" : undefined,
        monthlyContractAmount: registrationData.paymentForm.nursingFee,
        bookingType: 'MONTHLY_CONTRACT',
      };

      const response = await fetch('/api/registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create registration');
      }

      toast.success(`Registrasi berhasil! Kode booking: ${result.data.booking.bookingCode}`);

      // Generate and print invoice automatically
      try {
        await generateAndPrintInvoice(result.data.invoice.id);
        toast.success("Invoice berhasil digenerate dan siap dicetak!");
      } catch (error) {
        console.error('Failed to generate invoice:', error);
        toast.error("Gagal generate invoice, silakan coba manual dari halaman invoice");
      }

      // Reset form after successful registration
      setRegistrationData({
        patient: null,
        room: null,
        paymentForm: null,
        paymentMethod: null,
        amountPaid: "0",
      });

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : "Gagal membuat registrasi");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Registrasi Pasien</h1>
      <Stepper.Provider className="space-y-4">
        {({ methods }) => (
          <>
            <Stepper.Navigation>
              {methods.all.map((step) => (
                <Stepper.Step key={step.id} of={step.id} onClick={() => methods.goTo(step.id)}>
                  <Stepper.Title className="hidden md:inline">{step.title}</Stepper.Title>
                </Stepper.Step>
              ))}
            </Stepper.Navigation>
            {methods.switch({
              "step-1": (step) => (
                <PatientStep
                  id={step.id}
                  stepper={Stepper}
                  selectedPatient={registrationData.patient}
                  onPatientSelect={(patient) => {
                    setRegistrationData({ ...registrationData, patient });
                  }}
                />
              ),
              "step-2": (step) => (
                <RoomStep
                  id={step.id}
                  stepper={Stepper}
                  selectedRoom={registrationData.room}
                  onRoomSelect={(room) => {
                    setRegistrationData({ ...registrationData, room });
                  }}
                />
              ),
              "step-3": (step) => (
                <PaymentFormStep
                  id={step.id}
                  stepper={Stepper}
                  onSubmit={(data) => {
                    setRegistrationData({ ...registrationData, paymentForm: data });
                    // Handle final submission here
                    console.log("Registration complete:", registrationData);
                  }}
                  registrationData={registrationData}
                />
              ),
              "step-4": (step) => (
                <PaymentMethodStep
                  id={step.id}
                  stepper={Stepper}
                  selectedPayment={registrationData.paymentMethod}
                  onPaymentSelect={(method) => {
                    setRegistrationData({ ...registrationData, paymentMethod: method });
                  }}
                  registrationData={registrationData}
                  amountPaid={registrationData.amountPaid}
                  onAmountPaidChange={(amount) => {
                    setRegistrationData({ ...registrationData, amountPaid: amount });
                  }}
                />
              ),
            })}
            <Stepper.Controls>
              <Button
                type="button"
                variant="secondary"
                onClick={methods.prev}
                disabled={methods.isFirst || isSubmitting}
              >
                Sebelumnya
              </Button>
              <Button
                onClick={async () => {
                  if (methods.isLast) {
                    const success = await handleSubmitRegistration();
                    if (success) {
                      methods.reset();
                    }
                  } else {
                    methods.next();
                  }
                }}
                disabled={
                  isSubmitting ||
                  (methods.current.id === "step-1" && !registrationData.patient) ||
                  (methods.current.id === "step-2" && !registrationData.room) ||
                  (methods.current.id === "step-3" && (
                    !registrationData.paymentForm ||
                    !registrationData.paymentForm.receivedFrom ||
                    // Check if at least one payment item is enabled and has a value
                    !(
                      (registrationData.paymentForm.nursingEnabled && registrationData.paymentForm.nursingFee) ||
                      (registrationData.paymentForm.snackEnabled && registrationData.paymentForm.snackFee) ||
                      (registrationData.paymentForm.doctorEnabled && registrationData.paymentForm.doctorCheckup) ||
                      (registrationData.paymentForm.customCategories &&
                        registrationData.paymentForm.customCategories.some(cat => cat.enabled && cat.amount && cat.description))
                    )
                  )) ||
                  (methods.isLast && !registrationData.paymentMethod) ||
                  (methods.isLast && (registrationData.paymentMethod === 'CASH' || registrationData.paymentMethod === 'TRANSFER') && Number(registrationData.amountPaid) <= 0)
                }
              >
                {isSubmitting ? "Memproses..." : methods.isLast ? "Selesai & Simpan" : "Selanjutnya"}
              </Button>
            </Stepper.Controls>
          </>
        )}
      </Stepper.Provider>
    </>
  )
}
