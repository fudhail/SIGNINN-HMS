import { Reservation, ReservationStatus, BookingSource } from '../types';
import { simulateLatency } from './latency';
import { mockReservations } from '../mocks/mockData';

export interface ReservationFilterParams {
  status?: ReservationStatus;
  source?: BookingSource | string;
  search?: string;
  startDate?: string;
  endDate?: string;
  roomId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateReservationDTO {
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idNumber?: string;
    vipStatus?: boolean;
    city?: string;
  };
  roomId?: string;
  roomTypeId: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  source: BookingSource;
  nightlyRate: number;
  totalAmount: number;
  paidAmount?: number;
  notes?: string;
}

export interface ReservationService {
  getReservations(params?: ReservationFilterParams): Promise<PaginatedResponse<Reservation>>;
  getReservationById(id: string): Promise<Reservation | null>;
  createReservation(data: CreateReservationDTO): Promise<Reservation>;
  updateStatus(id: string, status: ReservationStatus): Promise<Reservation>;
  assignRoom(id: string, roomId: string, roomNumber: string): Promise<Reservation>;
  updateDates(id: string, checkInDate: string, checkOutDate: string): Promise<Reservation>;
}

// In-memory state holding the mock data
let localReservations: Reservation[] = [...mockReservations];

export const reservationService: ReservationService = {
  async getReservations(params?: ReservationFilterParams): Promise<PaginatedResponse<Reservation>> {
    await simulateLatency(300, 700);

    let list = [...localReservations];

    if (params?.status) {
      list = list.filter((r) => r.status === params.status);
    }
    if (params?.source) {
      list = list.filter((r) => r.bookingSource === params.source || r.source === params.source);
    }
    if (params?.roomId) {
      list = list.filter((r) => r.roomId === params.roomId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.refCode.toLowerCase().includes(q) ||
          r.guest.firstName.toLowerCase().includes(q) ||
          r.guest.lastName.toLowerCase().includes(q) ||
          r.guest.phone.includes(q) ||
          (r.roomNumber && r.roomNumber.toLowerCase().includes(q))
      );
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const total = list.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paginated = list.slice(start, start + pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages,
    };
  },

  async getReservationById(id: string): Promise<Reservation | null> {
    await simulateLatency(250, 500);
    const res = localReservations.find((r) => r.id === id);
    return res ? { ...res } : null;
  },

  async createReservation(data: CreateReservationDTO): Promise<Reservation> {
    await simulateLatency(350, 800);

    const d1 = new Date(data.checkInDate);
    const d2 = new Date(data.checkOutDate);
    const nights = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    const refCode = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRes: Reservation = {
      id: `res-${Date.now()}`,
      refCode,
      propertyId: 'prop-1',
      guestId: `gst-${Date.now()}`,
      guest: {
        id: `gst-${Date.now()}`,
        firstName: data.guest.firstName,
        lastName: data.guest.lastName,
        email: data.guest.email,
        phone: data.guest.phone,
        idType: 'Aadhaar',
        idNumber: data.guest.idNumber || '4829-1920-5819',
        nationality: 'Indian',
        vipStatus: data.guest.vipStatus || false,
        lifetimeStays: 1,
        lifetimeRevenue: data.totalAmount,
        preferences: [],
        notes: data.notes || '',
      },
      roomId: data.roomId || '',
      roomNumber: data.roomId ? data.roomId.replace('rm-', '') : undefined,
      roomTypeId: data.roomTypeId,
      roomTypeName: data.roomTypeName,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      nights,
      adults: data.adults,
      children: data.children,
      status: 'Confirmed',
      bookingSource: data.source,
      source: data.source,
      nightlyRate: data.nightlyRate,
      ratePlanCode: 'BAR',
      totalAmount: data.totalAmount,
      paidAmount: data.paidAmount || 0,
      balanceAmount: data.totalAmount - (data.paidAmount || 0),
      paymentStatus: (data.paidAmount || 0) >= data.totalAmount ? 'Paid' : (data.paidAmount || 0) > 0 ? 'Partially Paid' : 'Unpaid',
      specialRequests: data.notes,
      createdAt: new Date().toISOString(),
    };

    localReservations = [newRes, ...localReservations];
    return newRes;
  },

  async updateStatus(id: string, status: ReservationStatus): Promise<Reservation> {
    await simulateLatency(250, 600);
    const index = localReservations.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Reservation ${id} not found`);
    }
    const updated = {
      ...localReservations[index],
      status,
    };
    localReservations[index] = updated;
    return updated;
  },

  async assignRoom(id: string, roomId: string, roomNumber: string): Promise<Reservation> {
    await simulateLatency(250, 500);
    const index = localReservations.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Reservation ${id} not found`);
    }
    const updated = {
      ...localReservations[index],
      roomId,
      roomNumber,
    };
    localReservations[index] = updated;
    return updated;
  },

  async updateDates(id: string, checkInDate: string, checkOutDate: string): Promise<Reservation> {
    await simulateLatency(250, 500);
    const index = localReservations.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Reservation ${id} not found`);
    }
    const d1 = new Date(checkInDate);
    const d2 = new Date(checkOutDate);
    const nights = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));

    const updated = {
      ...localReservations[index],
      checkInDate,
      checkOutDate,
      nights,
    };
    localReservations[index] = updated;
    return updated;
  },
};
