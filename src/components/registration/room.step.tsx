"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAvailableRooms,
  type Room
} from "@/hooks/use-rooms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { CardDescription } from "@/components/ui/card";
import { useState } from "react";

export const RoomStep = ({
  id,
  stepper,
  selectedRoom,
  onRoomSelect
}: {
  id: string;
  stepper: any;
  selectedRoom: Room | null;
  onRoomSelect: (room: Room) => void;
}) => {
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all");
  const { data: rooms, isLoading } = useAvailableRooms(roomTypeFilter);

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(value));
  };

  return (
    <stepper.Panel className="min-h-[400px] rounded-lg border bg-white p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pilih Kamar</h3>
          <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Tipe Kamar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="STANDARD">Standard</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="ICU">ICU</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Memuat kamar...</p>}

        {rooms && rooms.length === 0 && (
          <Card className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Tidak ada kamar tersedia</p>
          </Card>
        )}

        {rooms && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className={`cursor-pointer transition-all ${selectedRoom?.id === room.id
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md"
                  }`}
                onClick={() => onRoomSelect(room)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{room.roomNumber}</CardTitle>
                      <CardDescription>{room.roomType}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatCurrency(room.baseRate)}
                      </p>
                      <p className="text-xs text-muted-foreground">per hari</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Kapasitas:</span>
                      <span className="font-medium">{room.capacity} orang</span>
                    </div>
                    {room.description && (
                      <p className="text-muted-foreground text-xs">{room.description}</p>
                    )}
                    {room.facilities && room.facilities.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium mb-1">Fasilitas:</p>
                        <div className="flex flex-wrap gap-1">
                          {room.facilities.map((facility) => (
                            <span
                              key={facility.id}
                              className="text-xs bg-muted px-2 py-1 rounded"
                            >
                              {facility.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </stepper.Panel>
  );
};