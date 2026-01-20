import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
// import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

const paymentFormSchema = z.object({
  receivedFrom: z.string().min(1, "Nama penerima harus diisi"),
  nursingEnabled: z.boolean().optional(),
  nursingFee: z.string().optional(),
  snackEnabled: z.boolean().optional(),
  snackFee: z.string().optional(),
  doctorEnabled: z.boolean().optional(),
  doctorCheckup: z.string().optional(),
  customCategories: z.array(z.object({
    id: z.string(),
    enabled: z.boolean(),
    description: z.string(),
    amount: z.string(),
  })).optional(),
  additionalNotes: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;

export const PaymentFormStep = ({
  id,
  stepper,
  onSubmit,
  registrationData,
}: {
  id: string;
  stepper: any;
  onSubmit: (data: PaymentFormData) => void;
  registrationData: any;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentFormData>({
    defaultValues: {
      receivedFrom: "",
      nursingEnabled: false,
      nursingFee: "",
      snackEnabled: false,
      snackFee: "",
      doctorEnabled: false,
      doctorCheckup: "",
      customCategories: [],
      additionalNotes: "",
    },
    // validatorAdapter: zodValidator(),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        onSubmit(values.value);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? value.replace(/\D/g, "") : value.toString();
    if (!numValue || numValue === "0") return "0";
    return new Intl.NumberFormat("id-ID").format(Number(numValue));
  };

  const parseFormattedNumber = (value: string) => {
    return value.replace(/\./g, "");
  };

  const addCustomCategory = () => {
    const currentCategories = form.getFieldValue("customCategories") || [];
    form.setFieldValue("customCategories", [
      ...currentCategories,
      {
        id: `custom-${Date.now()}`,
        enabled: true,
        description: "",
        amount: "",
      },
    ]);
  };

  const removeCustomCategory = (categoryId: string) => {
    const currentCategories = form.getFieldValue("customCategories") || [];
    form.setFieldValue(
      "customCategories",
      currentCategories.filter((cat) => cat.id !== categoryId)
    );
  };

  const handleSubmit = () => {
    form.handleSubmit();
  };

  // Auto-save form data to parent whenever it changes
  useEffect(() => {
    const subscription = form.store.subscribe(() => {
      const currentValues = form.state.values;
      // Save to parent whenever form values change
      onSubmit(currentValues as PaymentFormData);
    });

    return () => subscription();
  }, [form.store, onSubmit]);

  return (
    <div className="min-h-[600px] rounded-lg border bg-white p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Perjanjian Pembayaran</h3>
          <p className="text-sm text-muted-foreground">
            Isi detail perjanjian pembayaran untuk registrasi pasien
          </p>
        </div>

        {/* Patient Summary */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Ringkasan Pasien</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Pasien:</span> {registrationData.patient?.name}
            </div>
            <div>
              <span className="font-medium">Kamar:</span> {registrationData.room?.roomNumber}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Received From */}
          <div>
            <form.Field
              name="receivedFrom"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Nama penerima harus diisi" : undefined,
              }}
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>
                    Diterima dari <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Nama yang melakukan pembayaran"
                  />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500 mt-1">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Payment Details */}
          <div>
            <Label className="mb-3 block">
              Rincian Perjanjian Pembayaran <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-4">
              {/* Nursing */}
              <div className="flex items-center space-x-3">
                <form.Field
                  name="nursingEnabled"
                  children={(field) => (
                    <Checkbox
                      id="nursing"
                      checked={field.state.value}
                      onCheckedChange={(checked) => {
                        field.handleChange(checked);
                        if (!checked) {
                          form.setFieldValue("nursingFee", "");
                        }
                      }}
                    />
                  )}
                />
                <Label htmlFor="nursing" className="cursor-pointer flex-shrink-0 w-36">
                  Perawatan:
                </Label>
                <div className="flex items-center flex-1">
                  <span className="text-sm text-muted-foreground mr-2">Rp</span>
                  <form.Field
                    name="nursingFee"
                    children={(field) => (
                      <Input
                        className="w-full"
                        placeholder="0"
                        value={formatCurrency(field.state.value || "")}
                        onChange={(e) => {
                          const rawValue = parseFormattedNumber(e.target.value);
                          field.handleChange(rawValue);
                          if (rawValue && !form.getFieldValue("nursingEnabled")) {
                            form.setFieldValue("nursingEnabled", true);
                          }
                        }}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Snack */}
              <div className="flex items-center space-x-3">
                <form.Field
                  name="snackEnabled"
                  children={(field) => (
                    <Checkbox
                      id="snack"
                      checked={field.state.value}
                      onCheckedChange={(checked) => {
                        field.handleChange(checked);
                        if (!checked) {
                          form.setFieldValue("snackFee", "");
                        }
                      }}
                    />
                  )}
                />
                <Label htmlFor="snack" className="cursor-pointer flex-shrink-0 w-36">
                  Snack/ keb. Diri:
                </Label>
                <div className="flex items-center flex-1">
                  <span className="text-sm text-muted-foreground mr-2">Rp</span>
                  <form.Field
                    name="snackFee"
                    children={(field) => (
                      <Input
                        className="w-full"
                        placeholder="0"
                        value={formatCurrency(field.state.value || "")}
                        onChange={(e) => {
                          const rawValue = parseFormattedNumber(e.target.value);
                          field.handleChange(rawValue);
                          if (rawValue && !form.getFieldValue("snackEnabled")) {
                            form.setFieldValue("snackEnabled", true);
                          }
                        }}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Doctor */}
              <div className="flex items-center space-x-3">
                <form.Field
                  name="doctorEnabled"
                  children={(field) => (
                    <Checkbox
                      id="doctor"
                      checked={field.state.value}
                      onCheckedChange={(checked) => {
                        field.handleChange(checked);
                        if (!checked) {
                          form.setFieldValue("doctorCheckup", "");
                        }
                      }}
                    />
                  )}
                />
                <Label htmlFor="doctor" className="cursor-pointer flex-shrink-0 w-36">
                  Kontrol dokter:
                </Label>
                <div className="flex items-center flex-1">
                  <span className="text-sm text-muted-foreground mr-2">Rp</span>
                  <form.Field
                    name="doctorCheckup"
                    children={(field) => (
                      <Input
                        className="w-full"
                        placeholder="0"
                        value={formatCurrency(field.state.value || "")}
                        onChange={(e) => {
                          const rawValue = parseFormattedNumber(e.target.value);
                          field.handleChange(rawValue);
                          if (rawValue && !form.getFieldValue("doctorEnabled")) {
                            form.setFieldValue("doctorEnabled", true);
                          }
                        }}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Custom Categories */}
              <form.Field
                name="customCategories"
                mode="array"
                children={(field) => (
                  <div className="space-y-3">
                    {field.state.value?.map((category, index) => (
                      <div key={category.id} className="space-y-2 p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`custom-${category.id}`}
                            checked={category.enabled}
                            onCheckedChange={(checked) => {
                              const updatedCategories = [...(field.state.value || [])];
                              updatedCategories[index] = {
                                ...updatedCategories[index],
                                enabled: !!checked,
                              };
                              field.handleChange(updatedCategories);
                            }}
                          />
                          <Input
                            className="flex-1"
                            placeholder="Deskripsi kategori"
                            value={category.description}
                            onChange={(e) => {
                              const updatedCategories = [...(field.state.value || [])];
                              updatedCategories[index] = {
                                ...updatedCategories[index],
                                description: e.target.value,
                              };
                              field.handleChange(updatedCategories);
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCustomCategory(category.id)}
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
                            value={formatCurrency(category.amount || "")}
                            onChange={(e) => {
                              const rawValue = parseFormattedNumber(e.target.value);
                              const updatedCategories = [...(field.state.value || [])];
                              updatedCategories[index] = {
                                ...updatedCategories[index],
                                amount: rawValue,
                                enabled: rawValue ? true : updatedCategories[index].enabled,
                              };
                              field.handleChange(updatedCategories);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              />

              {/* Add Custom Category Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomCategory}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kategori Baru
              </Button>
            </div>
          </div>

          {/* Total - Using form.Subscribe for reactivity */}
          <form.Subscribe
            selector={(state) => ({
              nursingEnabled: state.values.nursingEnabled,
              nursingFee: state.values.nursingFee,
              snackEnabled: state.values.snackEnabled,
              snackFee: state.values.snackFee,
              doctorEnabled: state.values.doctorEnabled,
              doctorCheckup: state.values.doctorCheckup,
              customCategories: state.values.customCategories,
            })}
            children={(state) => {
              let total = 0;

              if (state.nursingEnabled && state.nursingFee) {
                total += Number(state.nursingFee);
              }
              if (state.snackEnabled && state.snackFee) {
                total += Number(state.snackFee);
              }
              if (state.doctorEnabled && state.doctorCheckup) {
                total += Number(state.doctorCheckup);
              }
              if (state.customCategories) {
                state.customCategories.forEach((cat) => {
                  if (cat.enabled && cat.amount) {
                    total += Number(cat.amount);
                  }
                });
              }

              return (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <Label className="font-semibold">Total:</Label>
                    <span className="text-lg font-bold">
                      Rp {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              );
            }}
          />

          {/* Additional Notes */}
          <div>
            <form.Field
              name="additionalNotes"
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Catatan Tambahan</Label>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Catatan tambahan (opsional)"
                    rows={3}
                  />
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}