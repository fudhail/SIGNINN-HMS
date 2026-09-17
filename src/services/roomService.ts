import { Room, RoomOccupancyStatus, HousekeepingStatus, MaintenanceStatus } from '../types';
import { simulateLatency } from './latency';
import { mockRooms } from '../mocks/mockData';

export interface RoomFilterParams {
  floor?: number | string;
  roomTypeId?: string;
  occupancyStatus?: RoomOccupancyStatus;
  housekeepingStatus?: HousekeepingStatus;
  maintenanceStatus?: MaintenanceStatus;
  search?: string;
}

export interface RoomService {
  getRooms(params?: RoomFilterParams): Promise<Room[]>;
  getRoomById(id: string): Promise<Room | null>;
  updateHousekeepingStatus(id: string, status: HousekeepingStatus): Promise<Room>;
  updateMaintenanceStatus(id: string, status: MaintenanceStatus, notes?: string): Promise<Room>;
  assignGuest(id: string, guestName: string, reservationId: string): Promise<Room>;
  vacateRoom(id: string): Promise<Room>;
}

let localRooms: Room[] = [...mockRooms];

export const roomService: RoomService = {
  async getRooms(params?: RoomFilterParams): Promise<Room[]> {
    await simulateLatency(300, 600);

    let list = [...localRooms];
    if (params?.floor && params.floor !== 'all') {
      list = list.filter((r) => r.floor.toString() === params.floor?.toString());
    }
    if (params?.roomTypeId && params.roomTypeId !== 'all') {
      list = list.filter((r) => r.roomTypeId === params.roomTypeId);
    }
    if (params?.occupancyStatus) {
      list = list.filter((r) => r.occupancyStatus === params.occupancyStatus);
    }
    if (params?.housekeepingStatus) {
      list = list.filter((r) => r.housekeepingStatus === params.housekeepingStatus);
    }
    if (params?.maintenanceStatus) {
      list = list.filter((r) => r.maintenanceStatus === params.maintenanceStatus);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.roomNumber.toLowerCase().includes(q) ||
          r.roomTypeName.toLowerCase().includes(q) ||
          (r.currentGuestName && r.currentGuestName.toLowerCase().includes(q))
      );
    }

    return list;
  },

  async getRoomById(id: string): Promise<Room | null> {
    await simulateLatency(200, 400);
    const room = localRooms.find((r) => r.id === id);
    return room ? { ...room } : null;
  },

  async updateHousekeepingStatus(id: string, status: HousekeepingStatus): Promise<Room> {
    await simulateLatency(250, 500);
    const idx = localRooms.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Room ${id} not found`);

    const updated = {
      ...localRooms[idx],
      housekeepingStatus: status,
    };
    localRooms[idx] = updated;
    return updated;
  },

  async updateMaintenanceStatus(id: string, status: MaintenanceStatus, notes?: string): Promise<Room> {
    await simulateLatency(250, 500);
    const idx = localRooms.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Room ${id} not found`);

    const updated = {
      ...localRooms[idx],
      maintenanceStatus: status,
      maintenanceNotes: notes !== undefined ? notes : localRooms[idx].maintenanceNotes,
    };
    localRooms[idx] = updated;
    return updated;
  },

  async assignGuest(id: string, guestName: string, reservationId: string): Promise<Room> {
    await simulateLatency(250, 500);
    const idx = localRooms.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Room ${id} not found`);

    const updated: Room = {
      ...localRooms[idx],
      occupancyStatus: 'Occupied',
      currentGuestName: guestName,
      currentReservationId: reservationId,
    };
    localRooms[idx] = updated;
    return updated;
  },

  async vacateRoom(id: string): Promise<Room> {
    await simulateLatency(250, 500);
    const idx = localRooms.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Room ${id} not found`);

    const updated: Room = {
      ...localRooms[idx],
      occupancyStatus: 'Vacant',
      housekeepingStatus: 'Dirty',
      currentGuestName: undefined,
      currentReservationId: undefined,
    };
    localRooms[idx] = updated;
    return updated;
  },
};
