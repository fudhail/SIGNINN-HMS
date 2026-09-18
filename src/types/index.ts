export type UserRole =
  | 'SIGNINN Super Admin'
  | 'Owner'
  | 'Group Admin'
  | 'Property Manager'
  | 'Front Desk'
  | 'Front Desk Agent'
  | 'Night Auditor'
  | 'Housekeeping'
  | 'Finance'
  | 'Maintenance'
  | 'Revenue Manager';

export type TenantPlan = 'Starter' | 'Professional' | 'Enterprise';
export type TenantStatus = 'Active' | 'Trial' | 'Past Due' | 'Suspended';

export interface TenantFeatures {
  otaChannelManager: boolean;
  directBookingEngine: boolean;
  whatsappAutomations: boolean;
  multiProperty: boolean;
  advancedAnalytics: boolean;
  qrRoomService?: boolean;
  aiPricing?: boolean;
  housekeepingApp?: boolean;
  smsGuestPortal?: boolean;
}

export interface PlanDefinition {
  id: TenantPlan;
  name: string;
  tagline: string;
  monthlyPrice: number;
  maxRooms: number;
  multiPropertyIncluded: boolean;
  featuresIncluded: string[];
  defaultFeatures: TenantFeatures;
}

export interface AddonDefinition {
  id: keyof TenantFeatures;
  name: string;
  category: 'Guest Experience' | 'Operations' | 'Distribution' | 'Portfolio';
  monthlyPrice: number;
  description: string;
  badge?: string;
  icon?: string;
}

export const PLAN_DEFINITIONS: Record<TenantPlan, PlanDefinition> = {
  Starter: {
    id: 'Starter',
    name: 'Starter',
    tagline: 'Ideal for small boutique inns, homestays & B&Bs',
    monthlyPrice: 4499,
    maxRooms: 25,
    multiPropertyIncluded: false,
    featuresIncluded: [
      'Up to 25 Rooms Capacity',
      '1 Single Physical Property',
      'Interactive Tape Chart & Room Rack',
      'Front Desk Check-in / Check-out',
      'Guest Folio & GST Invoicing (SAC 996311)',
      'Basic Housekeeping Room Status',
      'Direct Booking Engine',
    ],
    defaultFeatures: {
      otaChannelManager: false,
      directBookingEngine: true,
      whatsappAutomations: false,
      multiProperty: false,
      advancedAnalytics: false,
      qrRoomService: false,
      aiPricing: false,
      housekeepingApp: false,
      smsGuestPortal: false,
    },
  },
  Professional: {
    id: 'Professional',
    name: 'Professional',
    tagline: 'For independent hotels, resorts & boutique chains',
    monthlyPrice: 8999,
    maxRooms: 75,
    multiPropertyIncluded: false,
    featuresIncluded: [
      'Up to 75 Rooms Capacity',
      '1 Single Property (Multi-property available via add-on)',
      'OTA 2-Way Channel Manager (Booking.com, MMT, Agoda)',
      'Direct Booking Engine with Payment Gateway',
      'Housekeeping Turnover & Linen Board',
      'Advanced P&L, RevPAR & Manager Flash Reports',
      'Staff Role-Based Permissions (RBAC)',
    ],
    defaultFeatures: {
      otaChannelManager: true,
      directBookingEngine: true,
      whatsappAutomations: false,
      multiProperty: false,
      advancedAnalytics: true,
      qrRoomService: false,
      aiPricing: false,
      housekeepingApp: true,
      smsGuestPortal: false,
    },
  },
  Enterprise: {
    id: 'Enterprise',
    name: 'Enterprise',
    tagline: 'For hotel chains, management groups & resorts portfolios',
    monthlyPrice: 19999,
    maxRooms: 250,
    multiPropertyIncluded: true,
    featuresIncluded: [
      'Unlimited Rooms Quota',
      'Multi-Property Portfolio Switching Included',
      'All OTA Channels + Metasearch Integration',
      'AI Dynamic Pricing & Yield Management Included',
      'WhatsApp Guest Booking & Concierge Included',
      'QR Code In-Room Dining & Room Service Included',
      'Central Chain Audit Trail & Dedicated SLA',
    ],
    defaultFeatures: {
      otaChannelManager: true,
      directBookingEngine: true,
      whatsappAutomations: true,
      multiProperty: true,
      advancedAnalytics: true,
      qrRoomService: true,
      aiPricing: true,
      housekeepingApp: true,
      smsGuestPortal: true,
    },
  },
};

export const ADDON_DEFINITIONS: AddonDefinition[] = [
  {
    id: 'qrRoomService',
    name: 'QR Code Room Service & Digital Dining',
    category: 'Guest Experience',
    monthlyPrice: 1499,
    description: 'In-room contactless QR menu for food & beverage ordering directly billed to guest folio.',
    badge: 'Popular',
  },
  {
    id: 'whatsappAutomations',
    name: 'WhatsApp Booking & Guest Concierge',
    category: 'Guest Experience',
    monthlyPrice: 2499,
    description: 'Automated 2-way WhatsApp booking vouchers, pre-arrival registration link & AI concierge.',
    badge: 'High Value',
  },
  {
    id: 'multiProperty',
    name: 'Multi-Property Portfolio Group',
    category: 'Portfolio',
    monthlyPrice: 4999,
    description: 'Multi-hotel portfolio switching, group reporting, and cross-property guest profile lookup (Included in Enterprise).',
    badge: 'Enterprise Feature',
  },
  {
    id: 'aiPricing',
    name: 'AI Dynamic Pricing & Yield Engine',
    category: 'Distribution',
    monthlyPrice: 3499,
    description: 'Real-time algorithmic rate adjustments based on occupancy velocity and local market demand.',
  },
  {
    id: 'housekeepingApp',
    name: 'Mobile Staff Housekeeping App',
    category: 'Operations',
    monthlyPrice: 999,
    description: 'Dedicated lightweight mobile attendant turnover screen and inspection checklist.',
  },
  {
    id: 'smsGuestPortal',
    name: 'SMS Alerts & Self Check-in Portal',
    category: 'Guest Experience',
    monthlyPrice: 999,
    description: 'Transactional SMS alerts and digital self-service contactless check-in/out link.',
  },
];

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
  features: TenantFeatures;
  monthlyGmv: number;
  monthlyBookings: number;
  paymentStatus?: 'Paid' | 'Past Due' | 'Unpaid';
  lastPaymentDate?: string;
  paymentHistory?: Array<{
    id: string;
    date: string;
    amount: number;
    reference: string;
    method: string;
    notes?: string;
    status: string;
  }>;
  deletionAllowed?: boolean;
  suspendedReason?: string;
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
  | 'Ready'
  | 'In Progress';

export type MaintenanceStatus = 'Operational' | 'Maintenance Required' | 'Out of Order';

export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid' | 'Refunded' | 'Void';

export type BookingSource =
  | 'Direct Website'
  | 'Direct Walk-in'
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
  tenant_id?: string;
  tenantId?: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
  totalRooms?: number;
  total_rooms?: number;
  rating?: number;
  gstin?: string;
  tagline?: string;
  checkInTime?: string;
  checkOutTime?: string;
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
  notes?: string;
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
  category: 'Room' | 'Food & Beverage' | 'F&B' | 'Laundry' | 'Spa' | 'Taxes' | 'Discount' | 'Misc';
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
  roomNumber?: string;
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
  totalAmount?: number;
  taxableAmount?: number;
}

export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  roomTypeName?: string;
  floor: number;
  type: 'Checkout' | 'Stayover' | 'Deep Clean' | 'Touch Up';
  priority: 'Normal' | 'High' | 'Urgent';
  status: HousekeepingStatus;
  assignedTo?: string;
  assignedStaff?: string;
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
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Emergency';
  severity?: 'Low' | 'Medium' | 'High' | 'Emergency' | string;
  status: 'Reported' | 'In Progress' | 'Resolved' | 'Open';
  reportedBy: string;
  reportedAt?: string;
  resolvedAt?: string;
  category: 'HVAC/AC' | 'Plumbing' | 'Electrical' | 'Furniture' | 'Wi-Fi/TV' | string;
  isRoomBlocked?: boolean;
  assignedTo?: string;
  createdAt?: string;
  estimatedHours?: number;
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
  inbound_email_alias?: string;
  ical_export_token?: string;
  ical_import_url?: string;
  last_email_received_at?: string;
  auto_ingested_count?: number;
}

export type ChannelConnection = ChannelConfig;

export interface OtaIngestionLog {
  id: string;
  tenant_id: string;
  property_id?: string;
  channel: string;
  ota_reservation_id: string;
  guest_name: string;
  check_in_date: string;
  check_out_date: string;
  room_type_name?: string;
  total_amount: number;
  commission_amount?: number;
  status: string;
  method: string;
  created_at: string;
  raw_payload_snippet?: string;
}

export interface EmailSimulationPayload {
  channel: string;
  property_id?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  check_in_date?: string;
  check_out_date?: string;
  nights?: number;
  room_type_name?: string;
  total_amount?: number;
  commission_rate?: number;
  payment_mode?: string;
}

export interface CsvReconcilePayload {
  property_id?: string;
  csv_content: string;
  channel?: string;
}

export interface CsvReconcileRecord {
  ota_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  amount: number;
  commission: number;
  status: string;
  action: 'created' | 'verified' | 'error';
}

export interface CsvReconcileResponse {
  total_rows: number;
  created_count: number;
  matched_count: number;
  total_revenue: number;
  total_commission: number;
  records: CsvReconcileRecord[];
  message: string;
}

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
  status?: string;
  markupPercent?: number;
  discountPercent?: number;
  minNights?: number;
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
