import { Guest } from '../types';
import { simulateLatency } from './latency';
import { mockGuests } from '../mocks/mockData';

export interface GuestService {
  getGuests(search?: string): Promise<Guest[]>;
  getGuestById(id: string): Promise<Guest | null>;
  createGuest(guest: Omit<Guest, 'id'>): Promise<Guest>;
  updateGuest(id: string, updates: Partial<Guest>): Promise<Guest>;
  findPotentialDuplicates(): Promise<Array<{ original: Guest; duplicate: Guest; reason: string }>>;
  mergeGuests(primaryId: string, secondaryId: string): Promise<Guest>;
}

let localGuests: Guest[] = [...mockGuests];

export const guestService: GuestService = {
  async getGuests(search?: string): Promise<Guest[]> {
    await simulateLatency(300, 600);
    let list = [...localGuests];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) ||
          g.phone.includes(q) ||
          g.email.toLowerCase().includes(q) ||
          g.idNumber.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async getGuestById(id: string): Promise<Guest | null> {
    await simulateLatency(200, 400);
    const g = localGuests.find((guest) => guest.id === id);
    return g ? { ...g } : null;
  },

  async createGuest(guest: Omit<Guest, 'id'>): Promise<Guest> {
    await simulateLatency(300, 600);
    const newGuest: Guest = {
      ...guest,
      id: `gst-${Date.now()}`,
    };
    localGuests = [newGuest, ...localGuests];
    return newGuest;
  },

  async updateGuest(id: string, updates: Partial<Guest>): Promise<Guest> {
    await simulateLatency(250, 500);
    const idx = localGuests.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error(`Guest ${id} not found`);

    const updated = {
      ...localGuests[idx],
      ...updates,
    };
    localGuests[idx] = updated;
    return updated;
  },

  async findPotentialDuplicates(): Promise<Array<{ original: Guest; duplicate: Guest; reason: string }>> {
    await simulateLatency(200, 400);
    const duplicates: Array<{ original: Guest; duplicate: Guest; reason: string }> = [];

    for (let i = 0; i < localGuests.length; i++) {
      for (let j = i + 1; j < localGuests.length; j++) {
        const g1 = localGuests[i];
        const g2 = localGuests[j];

        const cleanPhone1 = g1.phone.replace(/[^0-9]/g, '').slice(-10);
        const cleanPhone2 = g2.phone.replace(/[^0-9]/g, '').slice(-10);

        if (cleanPhone1 && cleanPhone1 === cleanPhone2) {
          duplicates.push({
            original: g1,
            duplicate: g2,
            reason: `Matching phone number (${g1.phone})`,
          });
        } else if (g1.email && g2.email && g1.email.toLowerCase() === g2.email.toLowerCase()) {
          duplicates.push({
            original: g1,
            duplicate: g2,
            reason: `Matching email address (${g1.email})`,
          });
        }
      }
    }

    return duplicates;
  },

  async mergeGuests(primaryId: string, secondaryId: string): Promise<Guest> {
    await simulateLatency(350, 700);
    const pIdx = localGuests.findIndex((g) => g.id === primaryId);
    const sIdx = localGuests.findIndex((g) => g.id === secondaryId);

    if (pIdx === -1 || sIdx === -1) {
      throw new Error('One or both guest records not found');
    }

    const primary = localGuests[pIdx];
    const secondary = localGuests[sIdx];

    const merged: Guest = {
      ...primary,
      lifetimeStays: primary.lifetimeStays + secondary.lifetimeStays,
      lifetimeRevenue: primary.lifetimeRevenue + secondary.lifetimeRevenue,
      preferences: Array.from(new Set([...primary.preferences, ...secondary.preferences])),
      notes: primary.notes
        ? `${primary.notes} | Merged from ${secondary.id}: ${secondary.notes || ''}`
        : secondary.notes,
    };

    localGuests[pIdx] = merged;
    localGuests.splice(sIdx, 1);
    return merged;
  },
};
