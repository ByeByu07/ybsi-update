import { useQuery } from '@tanstack/react-query';

export interface Facility {
  id: string;
  name: string;
  additionalPrice: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  roomType: 'VIP' | 'STANDARD' | 'ICU';
  capacity: number;
  baseRate: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  description?: string;
  isActive: boolean;
  facilities: Facility[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomStats {
  status: string;
  count: number;
}

export interface RoomsResponse {
  data: Room[];
  stats: RoomStats[];
}

export interface UseRoomsParams {
  roomType?: string;
  status?: string;
  search?: string;
  isActive?: string;
}

// Fetch all rooms with optional filters
export function useRooms(params?: UseRoomsParams) {
  return useQuery<RoomsResponse>({
    queryKey: ['rooms', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params?.roomType && params.roomType !== 'all') {
        searchParams.append('roomType', params.roomType);
      }
      if (params?.status && params.status !== 'all') {
        searchParams.append('status', params.status);
      }
      if (params?.search) {
        searchParams.append('search', params.search);
      }
      if (params?.isActive) {
        searchParams.append('isActive', params.isActive);
      }

      const response = await fetch(`/api/rooms?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }

      const result = await response.json();
      return result;
    },
  });
}

// Fetch only available rooms
export function useAvailableRooms(roomType?: string) {
  return useQuery<Room[]>({
    queryKey: ['rooms', 'available', roomType],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        status: 'AVAILABLE',
        isActive: 'true',
      });

      if (roomType && roomType !== 'all') {
        searchParams.append('roomType', roomType);
      }

      const response = await fetch(`/api/rooms?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch available rooms');
      }

      const result = await response.json();
      return result.data;
    },
  });
}

// Get room by ID
export function useRoom(id?: string) {
  return useQuery<Room>({
    queryKey: ['rooms', id],
    queryFn: async () => {
      const response = await fetch(`/api/rooms/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch room');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
  });
}
