import { Folio, FolioItem, PaymentTransaction } from '../types';
import { simulateLatency } from './latency';
import { mockFolios, mockPayments } from '../mocks/mockData';

export interface AddChargeDTO {
  folioId: string;
  description: string;
  category: 'Room' | 'Food & Beverage' | 'Laundry' | 'Spa' | 'Taxes' | 'Misc';
  amount: number;
}

export interface RecordPaymentDTO {
  folioId: string;
  reservationId: string;
  reservationRef: string;
  guestName: string;
  amount: number;
  method: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Payment Link';
  reference?: string;
}

export interface FolioService {
  getFolioByReservationId(reservationId: string): Promise<Folio | null>;
  getFolioById(id: string): Promise<Folio | null>;
  addCharge(dto: AddChargeDTO): Promise<Folio>;
  recordPayment(dto: RecordPaymentDTO): Promise<{ folio: Folio; payment: PaymentTransaction }>;
  issueRefund(folioId: string, paymentId: string, amount: number, reason: string): Promise<Folio>;
}

let localFolios: Folio[] = [...mockFolios];
let localPayments: PaymentTransaction[] = [...mockPayments];

export const folioService: FolioService = {
  async getFolioByReservationId(reservationId: string): Promise<Folio | null> {
    await simulateLatency(250, 500);
    const folio = localFolios.find((f) => f.reservationId === reservationId);
    return folio ? { ...folio } : null;
  },

  async getFolioById(id: string): Promise<Folio | null> {
    await simulateLatency(200, 450);
    const folio = localFolios.find((f) => f.id === id);
    return folio ? { ...folio } : null;
  },

  async addCharge(dto: AddChargeDTO): Promise<Folio> {
    await simulateLatency(300, 600);
    const idx = localFolios.findIndex((f) => f.id === dto.folioId);
    if (idx === -1) throw new Error(`Folio ${dto.folioId} not found`);

    const folio = localFolios[idx];
    const newItem: FolioItem = {
      id: `item-${Date.now()}`,
      folioId: dto.folioId,
      date: new Date().toISOString().split('T')[0],
      description: dto.description,
      category: dto.category,
      amount: dto.amount,
      type: 'Charge',
      addedBy: 'Duty Manager',
    };

    const updatedItems = [...folio.items, newItem];
    const newTotalCharges = folio.totalCharges + dto.amount;
    const newBalance = newTotalCharges - folio.totalPayments - folio.totalDiscounts;

    const updatedFolio: Folio = {
      ...folio,
      totalCharges: newTotalCharges,
      balance: newBalance,
      items: updatedItems,
      status: newBalance <= 0 ? 'Settled' : 'Open',
    };

    localFolios[idx] = updatedFolio;
    return updatedFolio;
  },

  async recordPayment(dto: RecordPaymentDTO): Promise<{ folio: Folio; payment: PaymentTransaction }> {
    await simulateLatency(350, 700);
    const idx = localFolios.findIndex((f) => f.id === dto.folioId);
    if (idx === -1) throw new Error(`Folio ${dto.folioId} not found`);

    const folio = localFolios[idx];
    const newPaymentItem: FolioItem = {
      id: `pay-item-${Date.now()}`,
      folioId: dto.folioId,
      date: new Date().toISOString().split('T')[0],
      description: `Payment via ${dto.method}`,
      category: 'Misc',
      amount: dto.amount,
      type: 'Payment',
      paymentMethod: dto.method,
      reference: dto.reference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    const newPaymentTxn: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      reservationId: dto.reservationId,
      reservationRef: dto.reservationRef,
      guestName: dto.guestName,
      amount: dto.amount,
      currency: 'INR',
      method: dto.method,
      status: 'Success',
      date: new Date().toISOString(),
      reference: newPaymentItem.reference || `TXN-${Date.now()}`,
    };

    localPayments = [newPaymentTxn, ...localPayments];

    const updatedItems = [...folio.items, newPaymentItem];
    const newTotalPayments = folio.totalPayments + dto.amount;
    const newBalance = Math.max(0, folio.totalCharges - newTotalPayments - folio.totalDiscounts);

    const updatedFolio: Folio = {
      ...folio,
      totalPayments: newTotalPayments,
      balance: newBalance,
      items: updatedItems,
      status: newBalance <= 0 ? 'Settled' : 'Open',
    };

    localFolios[idx] = updatedFolio;
    return { folio: updatedFolio, payment: newPaymentTxn };
  },

  async issueRefund(folioId: string, paymentId: string, amount: number, reason: string): Promise<Folio> {
    await simulateLatency(350, 700);
    const idx = localFolios.findIndex((f) => f.id === folioId);
    if (idx === -1) throw new Error(`Folio ${folioId} not found`);

    const folio = localFolios[idx];
    const refundItem: FolioItem = {
      id: `ref-item-${Date.now()}`,
      folioId,
      date: new Date().toISOString().split('T')[0],
      description: `Refund: ${reason}`,
      category: 'Misc',
      amount: -amount,
      type: 'Payment',
      reference: `REFUND-${Date.now()}`,
    };

    const updatedItems = [...folio.items, refundItem];
    const newTotalPayments = Math.max(0, folio.totalPayments - amount);
    const newBalance = folio.totalCharges - newTotalPayments - folio.totalDiscounts;

    const updatedFolio: Folio = {
      ...folio,
      totalPayments: newTotalPayments,
      balance: newBalance,
      items: updatedItems,
      status: newBalance <= 0 ? 'Settled' : 'Open',
    };

    localFolios[idx] = updatedFolio;
    return updatedFolio;
  },
};
