"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useSearchPatients,
  useCreatePatient,
  type Patient,
  type CreatePatientData
} from "@/hooks/use-patients";
import { Search, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Step 1: Patient Selection/Creation
export const PatientStep = ({
  id,
  stepper,
  selectedPatient,
  onPatientSelect
}: {
  id: string;
  stepper: any;
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: searchResults, isLoading } = useSearchPatients(searchTerm);
  const createPatient = useCreatePatient();

  const [formData, setFormData] = useState<CreatePatientData>({
    name: "",
    birthDate: "",
    gender: "MALE",
    address: "",
    phone: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalNotes: "",
  });

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPatient = await createPatient.mutateAsync(formData);
      onPatientSelect(newPatient);
      setShowCreateForm(false);
      // Reset form
      setFormData({
        name: "",
        birthDate: "",
        gender: "MALE",
        address: "",
        phone: "",
        emergencyContact: "",
        emergencyPhone: "",
        medicalNotes: "",
      });
    } catch (error) {
      console.error("Failed to create patient:", error);
    }
  };

  return (
    <stepper.Panel className="min-h-[400px] rounded-lg border bg-white p-6">
      {selectedPatient ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pasien Terpilih</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPatientSelect(null as any)}
            >
              Ganti Pasien
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{selectedPatient.name}</CardTitle>
              <CardDescription>Kode: {selectedPatient.patientCode}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Jenis Kelamin:</span> {selectedPatient.gender}
                </div>
                <div>
                  <span className="font-medium">Tanggal Lahir:</span>{" "}
                  {format(new Date(selectedPatient.birthDate), "dd MMMM yyyy", { locale: localeId })}
                </div>
                {selectedPatient.phone && (
                  <div>
                    <span className="font-medium">Telepon:</span> {selectedPatient.phone}
                  </div>
                )}
                {selectedPatient.address && (
                  <div className="col-span-2">
                    <span className="font-medium">Alamat:</span> {selectedPatient.address}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {!showCreateForm ? (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-4">Cari Pasien</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama, kode pasien, atau nomor telepon..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {isLoading && searchTerm.length >= 2 && (
                <p className="text-sm text-muted-foreground">Mencari...</p>
              )}

              {searchResults && searchResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Hasil Pencarian</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <Card
                        key={patient.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => onPatientSelect(patient)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {patient.patientCode} • {patient.phone}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost">
                              Pilih
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {searchResults && searchResults.length === 0 && searchTerm.length >= 2 && (
                <p className="text-sm text-muted-foreground">Tidak ada hasil ditemukan</p>
              )}

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCreateForm(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Tambah Pasien Baru
                </Button>
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tambah Pasien Baru</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  Batal
                </Button>
              </div>

              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="birthDate">Tanggal Lahir *</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Jenis Kelamin *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value: any) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Laki-laki</SelectItem>
                        <SelectItem value="FEMALE">Perempuan</SelectItem>
                        <SelectItem value="OTHER">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyPhone">Telepon Darurat</Label>
                    <Input
                      id="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="emergencyContact">Kontak Darurat</Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="medicalNotes">Catatan Medis</Label>
                    <Textarea
                      id="medicalNotes"
                      value={formData.medicalNotes}
                      onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createPatient.isPending}>
                  {createPatient.isPending ? "Menyimpan..." : "Simpan Pasien"}
                </Button>
              </form>
            </div>
          )}
        </div>
      )}
    </stepper.Panel>
  );
};