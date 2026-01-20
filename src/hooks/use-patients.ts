import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Patient {
  id: string;
  patientCode: string;
  name: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePatientData {
  name: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalNotes?: string;
}

// Fetch patients with optional search
export function usePatients(search?: string) {
  return useQuery<Patient[]>({
    queryKey: ['patients', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/patients?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const result = await response.json();
      return result.data;
    },
  });
}

// Search patients by name, phone, or code
export function useSearchPatients(searchTerm: string) {
  return useQuery<Patient[]>({
    queryKey: ['patients', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const params = new URLSearchParams({ search: searchTerm });
      const response = await fetch(`/api/patients?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to search patients');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: searchTerm.length >= 2,
  });
}

// Create new patient
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation<Patient, Error, CreatePatientData>({
    mutationFn: async (data: CreatePatientData) => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create patient');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch patients
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

// Get patient by ID
export function usePatient(id?: string) {
  return useQuery<Patient>({
    queryKey: ['patients', id],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch patient');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
  });
}
