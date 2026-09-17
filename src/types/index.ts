export type UserRole =
  | 'SIGNINN Super Admin'
  | 'Owner'
  | 'Group Admin'
  | 'Property Manager'
  | 'Front Desk'
  | 'Housekeeping'
  | 'Finance'
  | 'Maintenance'
  | 'Revenue Manager';

export type TenantPlan = 'Starter' | 'Professional' | 'Enterprise';
export type TenantStatus = 'Active' | 'Trial' | 'Past Due' | 'Suspended';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  plan: TenantPlan;
  status: TenantStatus;
  billingCycle: 'Monthly' | 'Annual';
  mrr: number;
  joinedDate: string;
  renewalDate: string;
  maxRooms: number;
  totalRoomsActive: number;
  propertiesCount: number;
  primaryPropertyId: string;
  features: {
    otaChannelManager: boolean;
    directBookingEngine: boolean;
    whatsappAutomations: boolean;
    multiProperty: boolean;
    advancedAnalytics: boolean;
    aiPricing?: boolean;
    housekeepingApp?: boolean;
  };
  monthlyGmv: number;
  monthlyBookings: number;
}

export interface AuthAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hotelName: string;
  propertyId: string;
  tenantId: string;
  avatarUrl?: string;
}

export interface PlatformMetrics {
  totalTenants: number;
  activeTenants: number;
  totalRoomsManaged: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  totalGmvProcessed: number;
  otaSyncSuccessRate: number;
  activeApiSessions: number;
}

export type ReservationStatus =
  | 'Inquiry'
  | 'Provisional'
  | 'Confirmed'
  | 'Checked In'
  | 'Checked Out'
  | 'Cancelled'
  | 'No-show';

export type RoomOccupancyStatus = 'Vacant' | 'Reserved' | 'Occupied';

export type HousekeepingStatus =
  | 'Dirty'
  | 'Assigned'
  | 'Cleaning'
  | 'Clean'
  | 'Inspected'
  | 'Ready';

export type MaintenanceStatus = 'Operational' | 'Maintenance Required' | 'Out of Order';

export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid' | 'Refunded' | 'Void';

export type BookingSource =
  | 'Direct Website'
  | 'Walk-in'
  | 'Booking.com'
  | 'MakeMyTrip'
  | 'Goibibo'
  | 'Agoda'
  | 'Airbnb'
  | 'Expedia'
  | 'Corporate';

export type ChannelStatus = 'Connected' | 'Attention' | 'Syncing' | 'Failed' | 'Disconnected';

export interface Property {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
  totalRooms: number;
  rating?: number;
  gstin?: string;
}

export interface RoomType {
  id: string;
  propertyId: string;
  name: string;
  code: string;
  basePrice: number;
  maxOccupancy: number;
  bedConfiguration: string;
  sizeSqFt: number;
  description: string;
  amenities: string[];
  totalInventory: number;
  availableCount: number;
}

export interface Room {
  id: string;
  propertyId: string;
  roomNumber: string;
  floor: number;
  roomTypeId: string;
  roomTypeName: string;
  occupancyStatus: RoomOccupancyStatus;
  housekeepingStatus: HousekeepingStatus;
  maintenanceStatus: MaintenanceStatus;
  currentReservationId?: string;
  currentGuestName?: string;
  nextArrivalDate?: string;
  notes?: string;
  maintenanceNotes?: string;
  keyCardAssigned?: boolean;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idType: 'Aadhaar' | 'Passport' | 'Driving License' | 'National ID';
  idNumber: string;
  nationality: string;
  vipStatus: boolean;
  lifetimeStays: number;
  lifetimeRevenue: number;
  preferences: string[];
  notes: string;
  address?: string;
  city?: string;
  isDuplicateWarning?: boolean;
  avatarUrl?: string;
}

export interface Reservation {
  id: string;
  refCode: string;
  propertyId: string;
  guestId: string;
  guest: Guest;
  roomId?: string;
  roomNumber?: string;
  roomTypeId: string;
  roomTypeName: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  nights: number;
  adults: number;
  children: number;
  status: ReservationStatus;
  bookingSource: BookingSource;
  source?: BookingSource;
  nightlyRate?: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  ratePlanCode: string;
  specialRequests?: string;
  createdAt: string;
  eta?: string;
  otaReservationId?: string;
  tags?: string[];
}

export interface FolioItem {
  id: string;
  folioId: string;
  date: string;
  description: string;
  category: 'Room' | 'Food & Beverage' | 'Laundry' | 'Spa' | 'Taxes' | 'Discount' | 'Misc';
  amount: number;
  type: 'Charge' | 'Payment' | 'Discount';
  paymentMethod?: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Payment Link';
  reference?: string;
  addedBy?: string;
}

export interface Folio {
  id: string;
  reservationId: string;
  reservationRef: string;
  guestName: string;
  roomNumber?: string;
  totalCharges: number;
  totalPayments: number;
  totalDiscounts: number;
  totalTaxes: number;
  balance: number;
  items: FolioItem[];
  status: 'Open' | 'Settled' | 'Closed';
}

export interface PaymentTransaction {
  id: string;
  reservationId: string;
  reservationRef: string;
  guestName: string;
  amount: number;
  currency?: string;
  method: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Payment Link' | string;
  status: 'Success' | 'Pending' | 'Failed' | 'Refunded';
  date: string;
  reference: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestGstin?: string;
  reservationRef: string;
  roomNumber?: string;
  stayDates: string;
  items: { description: string; qty: number; rate: number; taxRate: number; amount: number }[];
  subtotal: number;
  taxTotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Cancelled';
}

export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  type: 'Checkout' | 'Stayover' | 'Deep Clean' | 'Touch Up';
  priority: 'Normal' | 'High' | 'Urgent';
  status: HousekeepingStatus;
  assignedTo?: string;
  checklist: { id: string; label: string; done: boolean }[];
  notes?: string;
  lastUpdated: string;
  estimatedMinutes: number;
}

export interface MaintenanceTicket {
  id: string;
  roomId: string;
  roomNumber: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  severity?: 'Low' | 'Medium' | 'High' | 'Emergency' | string;
  status: 'Reported' | 'In Progress' | 'Resolved';
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  category: 'HVAC/AC' | 'Plumbing' | 'Electrical' | 'Furniture' | 'Wi-Fi/TV' | string;
}

export interface ChannelConfig {
  id: string;
  channelName: BookingSource;
  code: string;
  status: ChannelStatus;
  lastSync: string;
  mappedRoomTypes: number;
  totalRoomTypes: number;
  mappedRatePlans: number;
  totalRatePlans: number;
  errorCount: number;
  errorSummary?: string;
  commissionRate: number;
  revenueThisMonth?: number;
  rateMultiplier?: number;
  bookingsThisMonth?: number;
  activeListings?: number;
}

export type ChannelConnection = ChannelConfig;

export interface ChannelMapping {
  id: string;
  channelId: string;
  channelName: string;
  signinnRoomTypeId: string;
  signinnRoomTypeName: string;
  otaRoomTypeId: string;
  otaRoomTypeName: string;
  signinnRatePlanId: string;
  signinnRatePlanName: string;
  otaRatePlanId: string;
  otaRatePlanName: string;
  status: 'Mapped' | 'Partially Mapped' | 'Unmapped';
  validationErrors: string[];
}

export interface SyncHealthLog {
  id: string;
  channel: string;
  objectType: 'Rate update' | 'Inventory update' | 'Reservation pull' | 'Availability broadcast';
  timestamp: string;
  status: 'Success' | 'Processing' | 'Retrying' | 'Failed' | 'Blocked';
  errorReason?: string;
  retryCount: number;
  actionRequired?: string;
}

export interface RatePlan {
  id: string;
  code: string;
  name: string;
  mealPlan: 'EP' | 'CP' | 'MAP' | 'AP';
  basePriceMultiplier: number;
  cancellationPolicy: string;
  minStay: number;
  maxStay?: number;
  stopSell: boolean;
  cta: boolean; // Closed to arrival
  ctd: boolean; // Closed to departure
  description: string;
  ratesByRoomType: Record<string, number>;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  propertyId: string;
  status: 'Active' | 'Inactive';
  avatarUrl?: string;
  phone: string;
  lastActive: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  object: string;
  oldValue: string;
  newValue: string;
  property: string;
  source: string;
}

export interface OperationalNotification {
  id: string;
  title: string;
  message: string;
  type: 'reservation' | 'ota_failure' | 'payment_due' | 'housekeeping' | 'maintenance' | 'low_availability';
  timestamp: string;
  read: boolean;
  severity: 'info' | 'warning' | 'error' | 'success';
  link?: string;
}

export interface GuestMessage {
  id: string;
  guestId: string;
  guestName: string;
  phone: string;
  reservationRef: string;
  channel: 'WhatsApp' | 'Email' | 'Booking.com' | 'SMS';
  lastMessage: string;
  lastMessageTimestamp: string;
  unread: boolean;
  avatarUrl?: string;
  messages: {
    id: string;
    sender: 'guest' | 'staff';
    text: string;
    timestamp: string;
  }[];
}

export interface MessageThread {
  id: string;
  guestName: string;
  guestPhone: string;
  roomNumber?: string;
  reservationRef: string;
  channel: 'WhatsApp' | 'SMS' | 'Email';
  unreadCount: number;
  messages: {
    id: string;
    sender: 'guest' | 'hotel' | 'system';
    content: string;
    timestamp: string;
    status?: 'sent' | 'delivered' | 'read';
  }[];
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  assignedPropertyId: string;
  status: 'Active' | 'Inactive';
  pinCode?: string;
  avatarUrl?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  staffName: string;
  action: string;
  entityId: string;
  details: string;
  ipAddress?: string;
}
