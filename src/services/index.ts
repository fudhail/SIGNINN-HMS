import {
  mockProperties,
  mockRoomTypes,
  mockRooms,
  mockGuests,
  mockReservations,
  mockFolios,
  mockPayments,
  mockInvoices,
  mockHousekeepingTasks,
  mockMaintenanceTickets,
  mockChannels,
  mockChannelMappings,
  mockSyncHealthLogs,
  mockRatePlans,
  mockStaffUsers,
  mockAuditLogs,
  mockNotifications,
  mockMessages,
} from '../mocks/mockData';
import { mockTenants } from '../mocks/mockTenants';

import {
  Reservation,
  Room,
  Guest,
  Folio,
  PaymentTransaction,
  Invoice,
  HousekeepingTask,
  MaintenanceTicket,
  ChannelConfig,
  ChannelMapping,
  SyncHealthLog,
  OperationalNotification,
  GuestMessage,
  StaffUser,
  AuditLogItem,
  Property,
  RatePlan,
  MessageThread,
  StaffMember,
  AuditLogEntry,
  Tenant,
  TenantPlan,
  TenantStatus,
} from '../types';

// In-memory active stores to allow live mutations during user interactions
let tenantsState: Tenant[] = [...mockTenants];
let propertyState: Property = { ...mockProperties[0] };
let propertiesState: Property[] = [...mockProperties];
let roomTypesState = [...mockRoomTypes];
let roomsState: Room[] = [...mockRooms];
let reservationsState: Reservation[] = [...mockReservations];
let guestsState: Guest[] = [...mockGuests];
let foliosState: Folio[] = [...mockFolios];
let paymentsState: PaymentTransaction[] = [...mockPayments];
let invoicesState: Invoice[] = [...mockInvoices];
let housekeepingTasksState: HousekeepingTask[] = [...mockHousekeepingTasks];
let maintenanceTicketsState: MaintenanceTicket[] = [...mockMaintenanceTickets];
let channelsState: ChannelConfig[] = [...mockChannels];
let channelMappingsState: ChannelMapping[] = [...mockChannelMappings];
let syncHealthLogsState: SyncHealthLog[] = [...mockSyncHealthLogs];
let ratePlansState: RatePlan[] = [...mockRatePlans];
let notificationsState: OperationalNotification[] = [...mockNotifications];

let staffMembersState: StaffMember[] = mockStaffUsers.map((u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  assignedPropertyId: u.propertyId,
  status: u.status,
  pinCode: '1234',
  avatarUrl: u.avatarUrl,
}));

let auditLogsState: AuditLogEntry[] = mockAuditLogs.map((log) => ({
  id: log.id,
  timestamp: log.timestamp,
  staffName: log.user,
  action: log.action,
  entityId: log.object,
  details: `${log.action}: ${log.oldValue} → ${log.newValue} (${log.source})`,
  ipAddress: '192.168.1.102',
}));

let messageThreadsState: MessageThread[] = mockMessages.map((m) => ({
  id: m.id,
  guestName: m.guestName,
  guestPhone: m.phone,
  roomNumber: m.id === 'msg-1' ? '102' : m.id === 'msg-2' ? '205' : '304',
  reservationRef: m.reservationRef,
  channel: (m.channel === 'WhatsApp' ? 'WhatsApp' : 'Email') as any,
  unreadCount: m.unread ? 1 : 0,
  messages: m.messages.map((item) => ({
    id: item.id,
    sender: item.sender === 'staff' ? 'hotel' : 'guest',
    content: item.text,
    timestamp: item.timestamp.includes('T') ? item.timestamp : `2026-09-16T${item.timestamp.replace(/[^0-9:]/g, '') || '10:00'}:00Z`,
    status: 'read',
  })),
}));

import { simulateLatency } from './latency';
export { simulateLatency };
export * from './latency';
export * from './reservationService';
export * from './roomService';
export * from './guestService';
export * from './folioService';
export * from './channelService';

const simulateDelay = (ms = 80) => simulateLatency(ms, ms + 100);

// Central export of current in-memory database snapshot
export function getInitialData() {
  return {
    property: propertyState,
    properties: propertiesState,
    roomTypes: roomTypesState,
    rooms: roomsState,
    guests: guestsState,
    reservations: reservationsState,
    folios: foliosState,
    payments: paymentsState,
    invoices: invoicesState,
    housekeepingTasks: housekeepingTasksState,
    maintenanceTickets: maintenanceTicketsState,
    channels: channelsState,
    channelMappings: channelMappingsState,
    syncHealthLogs: syncHealthLogsState,
    ratePlans: ratePlansState,
    staff: staffMembersState,
    auditLogs: auditLogsState,
    messageThreads: messageThreadsState,
    tenants: tenantsState,
  };
}

export function provisionTenant(
  tenantData: Omit<Tenant, 'id' | 'joinedDate' | 'renewalDate' | 'monthlyGmv' | 'monthlyBookings'>
): Tenant {
  const newTenant: Tenant = {
    ...tenantData,
    id: `tenant-${Date.now()}`,
    joinedDate: new Date().toISOString().split('T')[0],
    renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    monthlyGmv: 0,
    monthlyBookings: 0,
  };
  tenantsState = [newTenant, ...tenantsState];
  auditLogsState.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staffName: 'SIGNINN Super Admin',
    action: 'Hotel Client Provisioned',
    entityId: newTenant.subdomain,
    details: `Created tenant organization "${newTenant.name}" on ${newTenant.plan} plan`,
    ipAddress: '10.0.0.1 (SIGNINN Internal)',
  });
  return newTenant;
}

export function updateTenantStatus(tenantId: string, status: TenantStatus): void {
  const idx = tenantsState.findIndex((t) => t.id === tenantId);
  if (idx !== -1) {
    tenantsState[idx].status = status;
  }
}

export function updateTenantPlan(tenantId: string, plan: TenantPlan): void {
  const idx = tenantsState.findIndex((t) => t.id === tenantId);
  if (idx !== -1) {
    tenantsState[idx].plan = plan;
    tenantsState[idx].mrr = plan === 'Starter' ? 2499 : plan === 'Professional' ? 5999 : 12999;
  }
}

export function updateTenantFeatures(tenantId: string, features: Partial<Tenant['features']>): void {
  const idx = tenantsState.findIndex((t) => t.id === tenantId);
  if (idx !== -1) {
    tenantsState[idx] = {
      ...tenantsState[idx],
      features: {
        ...tenantsState[idx].features,
        ...features,
      },
    };
  }
}


// Global action handlers consumed by App.tsx
export async function createReservation(data: Partial<Reservation>): Promise<Reservation> {
  await simulateDelay();
  const newId = `res-${Date.now()}`;
  const newRef = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
  const guest: Guest = data.guest || {
    id: `guest-${Date.now()}`,
    firstName: 'New',
    lastName: 'Guest',
    email: 'guest@example.com',
    phone: '+91 99999 88888',
    idType: 'Aadhaar',
    idNumber: '•••• •••• 9999',
    nationality: 'Indian',
    vipStatus: false,
    lifetimeStays: 1,
    lifetimeRevenue: data.totalAmount || 5000,
    preferences: [],
    notes: 'Direct reservation',
  };

  const newRes: Reservation = {
    id: newId,
    refCode: newRef,
    propertyId: data.propertyId || 'prop-1',
    guestId: guest.id,
    guest,
    roomId: data.roomId,
    roomNumber: data.roomNumber,
    roomTypeId: data.roomTypeId || 'rt-1',
    roomTypeName: data.roomTypeName || 'Deluxe King Sea View',
    checkInDate: data.checkInDate || new Date().toISOString().split('T')[0],
    checkOutDate: data.checkOutDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    nights: data.nights || 2,
    adults: data.adults || 1,
    children: data.children || 0,
    status: data.status || 'Confirmed',
    bookingSource: data.bookingSource || 'Direct Website',
    totalAmount: data.totalAmount || 9000,
    paidAmount: data.paidAmount || 0,
    balanceAmount: (data.totalAmount || 9000) - (data.paidAmount || 0),
    paymentStatus:
      (data.paidAmount || 0) >= (data.totalAmount || 9000)
        ? 'Paid'
        : (data.paidAmount || 0) > 0
        ? 'Partially Paid'
        : 'Unpaid',
    ratePlanCode: data.ratePlanCode || 'BAR-CP',
    specialRequests: data.specialRequests,
    createdAt: new Date().toISOString(),
    eta: data.eta || '14:00',
  };

  reservationsState = [newRes, ...reservationsState];

  // If room is assigned, mark room as Reserved
  if (newRes.roomId) {
    const rIdx = roomsState.findIndex((rm) => rm.id === newRes.roomId);
    if (rIdx !== -1) {
      roomsState[rIdx] = {
        ...roomsState[rIdx],
        occupancyStatus: 'Reserved',
        currentGuestName: `${guest.firstName} ${guest.lastName}`,
        currentReservationId: newRes.id,
      };
    }
  }

  // Auto create Folio
  const newFolio: Folio = {
    id: `fol-${Date.now()}`,
    reservationId: newRes.id,
    reservationRef: newRes.refCode,
    guestName: `${guest.firstName} ${guest.lastName}`,
    roomNumber: newRes.roomNumber,
    totalCharges: newRes.totalAmount,
    totalPayments: newRes.paidAmount,
    totalDiscounts: 0,
    totalTaxes: Math.round(newRes.totalAmount * 0.12),
    balance: newRes.balanceAmount,
    status: 'Open',
    items: [
      {
        id: `fi-${Date.now()}`,
        folioId: `fol-${Date.now()}`,
        date: newRes.checkInDate,
        description: `Room Stay: ${newRes.roomTypeName} (${newRes.nights} nights)`,
        category: 'Room',
        amount: newRes.totalAmount,
        type: 'Charge',
      },
    ],
  };
  foliosState = [newFolio, ...foliosState];

  auditLogsState.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staffName: 'Front Desk Operator',
    action: 'Reservation Created',
    entityId: newRes.refCode,
    details: `Created reservation for ${guest.firstName} ${guest.lastName} (${newRes.roomTypeName})`,
    ipAddress: '192.168.1.102',
  });

  return newRes;
}

export async function updateReservationStatus(
  id: string,
  status: Reservation['status'],
  assignedRoomId?: string
): Promise<Reservation | null> {
  await simulateDelay();
  const index = reservationsState.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const oldStatus = reservationsState[index].status;
  const targetRoomId = assignedRoomId || reservationsState[index].roomId;

  reservationsState[index] = {
    ...reservationsState[index],
    status,
    roomId: targetRoomId,
    roomNumber: targetRoomId
      ? roomsState.find((r) => r.id === targetRoomId)?.roomNumber || reservationsState[index].roomNumber
      : reservationsState[index].roomNumber,
  };

  if (targetRoomId) {
    const roomIndex = roomsState.findIndex((rm) => rm.id === targetRoomId);
    if (roomIndex !== -1) {
      if (status === 'Checked In') {
        roomsState[roomIndex] = {
          ...roomsState[roomIndex],
          occupancyStatus: 'Occupied',
          currentGuestName: `${reservationsState[index].guest.firstName} ${reservationsState[index].guest.lastName}`,
          currentReservationId: reservationsState[index].id,
          keyCardAssigned: true,
        };
      } else if (status === 'Checked Out') {
        roomsState[roomIndex] = {
          ...roomsState[roomIndex],
          occupancyStatus: 'Vacant',
          housekeepingStatus: 'Dirty',
          currentGuestName: undefined,
          currentReservationId: undefined,
          keyCardAssigned: false,
        };

        // Create housekeeping turnover task
        const newTask: HousekeepingTask = {
          id: `hk-task-${Date.now()}`,
          roomId: roomsState[roomIndex].id,
          roomNumber: roomsState[roomIndex].roomNumber,
          roomType: roomsState[roomIndex].roomTypeName,
          floor: roomsState[roomIndex].floor,
          type: 'Checkout',
          priority: 'Urgent',
          status: 'Dirty',
          lastUpdated: 'Just now',
          estimatedMinutes: 30,
          checklist: [
            { id: 'c1', label: 'Strip and replace all bed linens', done: false },
            { id: 'c2', label: 'Sanitize bathroom and replace toiletries', done: false },
            { id: 'c3', label: 'Vacuum carpet & mop floor', done: false },
            { id: 'c4', label: 'Restock tea/coffee amenities & water bottles', done: false },
          ],
        };
        housekeepingTasksState = [newTask, ...housekeepingTasksState];
      }
    }
  }

  auditLogsState.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staffName: 'Rahul Varma (Front Desk)',
    action: `Status Changed to ${status}`,
    entityId: reservationsState[index].refCode,
    details: `${oldStatus} -> ${status}`,
    ipAddress: '192.168.1.102',
  });

  return reservationsState[index];
}

export async function reassignRoom(resId: string, newRoomId: string): Promise<Reservation | null> {
  await simulateDelay();
  const resIndex = reservationsState.findIndex((r) => r.id === resId);
  const room = roomsState.find((r) => r.id === newRoomId);
  if (resIndex === -1 || !room) return null;

  const oldRoom = reservationsState[resIndex].roomNumber;
  reservationsState[resIndex] = {
    ...reservationsState[resIndex],
    roomId: room.id,
    roomNumber: room.roomNumber,
    roomTypeId: room.roomTypeId,
    roomTypeName: room.roomTypeName,
  };

  auditLogsState.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staffName: 'Front Desk Operator',
    action: 'Room Reassigned',
    entityId: reservationsState[resIndex].refCode,
    details: `Moved from Room ${oldRoom || 'None'} to Room ${room.roomNumber}`,
    ipAddress: '192.168.1.102',
  });

  return reservationsState[resIndex];
}

export async function updateHousekeepingStatus(
  roomId: string,
  status: Room['housekeepingStatus']
): Promise<Room | null> {
  await simulateDelay();
  const index = roomsState.findIndex((r) => r.id === roomId);
  if (index === -1) return null;
  roomsState[index] = { ...roomsState[index], housekeepingStatus: status };
  return roomsState[index];
}

export async function updateMaintenanceStatus(
  roomId: string,
  status: Room['maintenanceStatus']
): Promise<Room | null> {
  await simulateDelay();
  const index = roomsState.findIndex((r) => r.id === roomId);
  if (index === -1) return null;
  roomsState[index] = { ...roomsState[index], maintenanceStatus: status };
  return roomsState[index];
}

export async function addFolioCharge(
  folioId: string,
  item: Omit<Folio['items'][0], 'id' | 'folioId'>
): Promise<Folio | null> {
  await simulateDelay();
  const index = foliosState.findIndex((f) => f.id === folioId);
  if (index === -1) return null;

  const newItem = {
    ...item,
    id: `fi-${Date.now()}`,
    folioId,
  };
  const items = [...foliosState[index].items, newItem];
  const charges = items.filter((i) => i.type === 'Charge').reduce((acc, curr) => acc + curr.amount, 0);
  const payments = items.filter((i) => i.type === 'Payment').reduce((acc, curr) => acc + curr.amount, 0);
  const discounts = items.filter((i) => i.type === 'Discount').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = charges - discounts - payments;

  foliosState[index] = {
    ...foliosState[index],
    items,
    totalCharges: charges,
    totalPayments: payments,
    totalDiscounts: discounts,
    balance,
  };

  auditLogsState.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staffName: 'Front Desk Operator',
    action: 'Folio Charge Added',
    entityId: foliosState[index].reservationRef,
    details: `Added ${item.description} (₹${item.amount})`,
    ipAddress: '192.168.1.102',
  });

  return foliosState[index];
}

export async function recordPayment(
  folioId: string,
  amount: number,
  method: string,
  reference: string
): Promise<PaymentTransaction> {
  await simulateDelay();
  const folio = foliosState.find((f) => f.id === folioId);
  const reservation = folio ? reservationsState.find((r) => r.id === folio.reservationId) : undefined;

  const newPayment: PaymentTransaction = {
    id: `pay-${Date.now()}`,
    reservationId: reservation?.id || 'res-gen',
    reservationRef: folio?.reservationRef || 'RES-PAY',
    guestName: folio?.guestName || 'Guest',
    amount,
    currency: 'INR',
    method: method as any,
    status: 'Success',
    date: new Date().toISOString(),
    reference,
    notes: 'Settled via Front Desk cashiering',
  };

  paymentsState = [newPayment, ...paymentsState];

  if (folio) {
    const fIdx = foliosState.findIndex((f) => f.id === folioId);
    foliosState[fIdx].totalPayments += amount;
    foliosState[fIdx].balance = Math.max(0, foliosState[fIdx].balance - amount);
    if (foliosState[fIdx].balance <= 0) {
      foliosState[fIdx].status = 'Settled';
    }
    foliosState[fIdx].items.push({
      id: `fi-${Date.now()}`,
      folioId: folio.id,
      date: new Date().toISOString().split('T')[0],
      description: `Payment via ${method} (${reference})`,
      category: 'Misc',
      amount,
      type: 'Payment',
      paymentMethod: method as any,
      reference,
      addedBy: 'Front Desk Cashier',
    });
  }

  if (reservation) {
    const rIdx = reservationsState.findIndex((r) => r.id === reservation.id);
    const newPaid = reservationsState[rIdx].paidAmount + amount;
    reservationsState[rIdx].paidAmount = newPaid;
    reservationsState[rIdx].balanceAmount = Math.max(0, reservationsState[rIdx].totalAmount - newPaid);
    reservationsState[rIdx].paymentStatus =
      reservationsState[rIdx].balanceAmount <= 0 ? 'Paid' : 'Partially Paid';
  }

  auditLogsState.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    staffName: 'Cashier Terminal',
    action: 'Payment Recorded',
    entityId: folio?.reservationRef || 'PAY-TRANS',
    details: `Collected ₹${amount} via ${method} (Ref: ${reference})`,
    ipAddress: '192.168.1.102',
  });

  return newPayment;
}

export async function forceChannelSync(channelId?: string): Promise<void> {
  await simulateDelay(400);
  channelsState = channelsState.map((c) => {
    if (!channelId || c.id === channelId) {
      return {
        ...c,
        lastSync: 'Just now',
        status: 'Connected',
        errorCount: 0,
        errorSummary: undefined,
      };
    }
    return c;
  });
}

export async function toggleChannelStatus(channelId: string): Promise<void> {
  await simulateDelay(200);
  const idx = channelsState.findIndex((c) => c.id === channelId);
  if (idx !== -1) {
    channelsState[idx].status =
      channelsState[idx].status === 'Disconnected' ? 'Connected' : 'Disconnected';
  }
}

export async function updateChannelMarkup(channelId: string, markup: number): Promise<void> {
  await simulateDelay(150);
  const idx = channelsState.findIndex((c) => c.id === channelId);
  if (idx !== -1) {
    channelsState[idx].commissionRate = markup;
  }
}

export async function sendMessage(threadId: string, content: string): Promise<void> {
  await simulateDelay(150);
  const idx = messageThreadsState.findIndex((t) => t.id === threadId);
  if (idx !== -1) {
    messageThreadsState[idx].messages.push({
      id: `m-${Date.now()}`,
      sender: 'hotel',
      content,
      timestamp: new Date().toISOString(),
      status: 'sent',
    });
  }
}

export async function toggleChecklistItem(taskId: string, checklistItemId: string): Promise<void> {
  await simulateDelay(50);
  const idx = housekeepingTasksState.findIndex((t) => t.id === taskId);
  if (idx !== -1) {
    housekeepingTasksState[idx].checklist = housekeepingTasksState[idx].checklist.map((item) =>
      item.id === checklistItemId ? { ...item, done: !item.done } : item
    );
  }
}

export async function updateTaskStatus(taskId: string, status: HousekeepingTask['status']): Promise<void> {
  await simulateDelay(100);
  const idx = housekeepingTasksState.findIndex((t) => t.id === taskId);
  if (idx !== -1) {
    housekeepingTasksState[idx].status = status;
    const roomIdx = roomsState.findIndex((r) => r.id === housekeepingTasksState[idx].roomId);
    if (roomIdx !== -1) {
      roomsState[roomIdx].housekeepingStatus = status;
    }
  }
}

export function addMaintenanceTicket(ticket: Omit<MaintenanceTicket, 'id' | 'reportedAt' | 'status'>): MaintenanceTicket {
  const newTicket: MaintenanceTicket = {
    ...ticket,
    id: `maint-${Date.now()}`,
    status: 'Reported',
    reportedAt: new Date().toISOString(),
  };
  maintenanceTicketsState = [newTicket, ...maintenanceTicketsState];

  const rIdx = roomsState.findIndex((r) => r.id === ticket.roomId);
  if (rIdx !== -1) {
    roomsState[rIdx].maintenanceStatus = ticket.priority === 'Emergency' || ticket.priority === 'High' ? 'Out of Order' : 'Maintenance Required';
  }

  return newTicket;
}

export function updateTicketStatus(ticketId: string, status: MaintenanceTicket['status']): void {
  const idx = maintenanceTicketsState.findIndex((t) => t.id === ticketId);
  if (idx !== -1) {
    maintenanceTicketsState[idx].status = status;
    if (status === 'Resolved') {
      maintenanceTicketsState[idx].resolvedAt = new Date().toISOString();
      const rIdx = roomsState.findIndex((r) => r.id === maintenanceTicketsState[idx].roomId);
      if (rIdx !== -1) {
        roomsState[rIdx].maintenanceStatus = 'Operational';
      }
    }
  }
}

export function addStaffMember(staff: Omit<StaffMember, 'id'>): StaffMember {
  const newMember: StaffMember = {
    ...staff,
    id: `staff-${Date.now()}`,
  };
  staffMembersState = [newMember, ...staffMembersState];
  return newMember;
}

export function updateStaffStatus(staffId: string, status: StaffMember['status']): void {
  const idx = staffMembersState.findIndex((s) => s.id === staffId);
  if (idx !== -1) {
    staffMembersState[idx].status = status;
  }
}

export function updateProperty(prop: Partial<Property>): void {
  propertyState = { ...propertyState, ...prop };
}

export async function updateRatePlan(plan: RatePlan): Promise<void> {
  await simulateDelay(150);
  const idx = ratePlansState.findIndex((p) => p.id === plan.id);
  if (idx !== -1) {
    ratePlansState[idx] = plan;
  }
}

// Retain legacy service exports for component backward compatibility
export const reservationService = {
  getReservations: async () => reservationsState,
  getReservationById: async (id: string) => reservationsState.find((r) => r.id === id),
  createReservation,
  updateReservationStatus,
};

export const roomService = {
  getRooms: async () => roomsState,
  updateRoomHousekeepingStatus: updateHousekeepingStatus,
  updateRoomMaintenanceStatus: updateMaintenanceStatus,
};

export const guestService = {
  getGuests: async () => guestsState,
};

export const folioService = {
  getFolios: async () => foliosState,
  addFolioItem: addFolioCharge,
};

export const paymentService = {
  getPayments: async () => paymentsState,
  recordPayment,
};

export const housekeepingService = {
  getTasks: async () => housekeepingTasksState,
  toggleChecklistItem,
  updateTaskStatus,
};

export const channelService = {
  getChannels: async () => channelsState,
  triggerSync: forceChannelSync,
};

export const reportService = {
  getPerformanceSummary: async () => ({
    totalRooms: 30,
    occupiedRooms: roomsState.filter((r) => r.occupancyStatus === 'Occupied').length,
    occupancyRate: Math.round((roomsState.filter((r) => r.occupancyStatus === 'Occupied').length / 30) * 100),
  }),
};

export const notificationService = {
  getNotifications: async () => notificationsState,
  markAllRead: async () => {
    notificationsState = notificationsState.map((n) => ({ ...n, read: true }));
  },
};
