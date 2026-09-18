from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TenantBase(BaseModel):
    name: str
    slug: str
    subdomain: str
    owner_name: str
    owner_email: str
    owner_phone: str
    plan: str = "Professional"
    status: str = "Active"
    billing_cycle: str = "Monthly"
    mrr: float = 0.0
    max_rooms: int = 50
    primary_property_id: Optional[str] = None
    features: Dict[str, Any] = Field(default_factory=dict)


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None
    features: Optional[Dict[str, Any]] = None
    max_rooms: Optional[int] = None
    primary_property_id: Optional[str] = None


class TenantPaymentCreate(BaseModel):
    amount: float
    reference: str
    method: str = "UPI"  # Bank Transfer, UPI, Card, Cheque
    date: Optional[str] = None
    notes: Optional[str] = None
    next_renewal_date: Optional[str] = None


class TenantResponse(TenantBase):
    id: str
    total_rooms_active: int = 0
    properties_count: int = 1
    joined_date: str
    renewal_date: str
    monthly_gmv: float = 0.0
    monthly_bookings: int = 0
    payment_status: str = "Paid"
    last_payment_date: str = "2026-03-01"
    payment_history: List[Dict[str, Any]] = Field(default_factory=list)
    deletion_allowed: bool = False
    suspended_reason: Optional[str] = None

    class Config:
        from_attributes = True


class PropertyBase(BaseModel):
    name: str
    code: str
    city: str
    state: str
    address: str = ""
    phone: str = ""
    email: str = ""
    currency: str = "INR"
    timezone: str = "Asia/Kolkata"
    total_rooms: int = 0
    rating: Optional[float] = 4.8
    gstin: Optional[str] = None


class PropertyCreate(PropertyBase):
    pass


class PropertyResponse(PropertyBase):
    id: str
    tenant_id: str

    class Config:
        from_attributes = True


class RoomTypeBase(BaseModel):
    property_id: str
    name: str
    code: str
    base_price: float
    max_occupancy: int = 2
    bed_configuration: str = "1 King Bed"
    size_sq_ft: int = 300
    description: str = ""
    amenities: List[str] = Field(default_factory=list)
    total_inventory: int = 0
    available_count: int = 0


class RoomTypeResponse(RoomTypeBase):
    id: str
    tenant_id: str

    class Config:
        from_attributes = True


class RoomBase(BaseModel):
    property_id: str
    room_number: str
    floor: int = 1
    room_type_id: Optional[str] = None
    room_type_name: str = ""
    occupancy_status: str = "Vacant"
    housekeeping_status: str = "Clean"
    maintenance_status: str = "Operational"
    current_reservation_id: Optional[str] = None
    current_guest_name: Optional[str] = None
    next_arrival_date: Optional[str] = None
    notes: Optional[str] = ""
    maintenance_notes: Optional[str] = ""
    key_card_assigned: Optional[bool] = False


class RoomUpdateStatus(BaseModel):
    occupancy_status: Optional[str] = None
    housekeeping_status: Optional[str] = None
    maintenance_status: Optional[str] = None


class RoomResponse(RoomBase):
    id: str
    tenant_id: str

    class Config:
        from_attributes = True


class GuestBase(BaseModel):
    first_name: str
    last_name: str
    email: str = ""
    phone: str = ""
    id_type: str = "Aadhaar"
    id_number: str = ""
    nationality: str = "Indian"
    vip_status: bool = False
    preferences: List[str] = Field(default_factory=list)
    notes: str = ""
    address: Optional[str] = ""
    city: Optional[str] = ""
    avatar_url: Optional[str] = None


class GuestResponse(GuestBase):
    id: str
    tenant_id: str
    lifetime_stays: int = 1
    lifetime_revenue: float = 0.0

    class Config:
        from_attributes = True


class ReservationCreate(BaseModel):
    property_id: Optional[str] = None
    guest: Optional[GuestBase] = None
    guest_id: Optional[str] = None
    room_id: Optional[str] = None
    room_number: Optional[str] = None
    room_type_id: str
    room_type_name: Optional[str] = ""
    check_in_date: str
    check_out_date: str
    nights: int = 1
    adults: int = 1
    children: int = 0
    booking_source: str = "Direct Website"
    nightly_rate: Optional[float] = 0.0
    total_amount: float
    paid_amount: float = 0.0
    rate_plan_code: str = "BAR-EP"
    special_requests: Optional[str] = ""
    eta: Optional[str] = "14:00"


class CheckInRequest(BaseModel):
    room_id: Optional[str] = None
    advance_paid: float = 0.0
    payment_method: str = "UPI"


class CheckOutRequest(BaseModel):
    settlement_amount: float = 0.0
    payment_method: str = "UPI"


class ReservationResponse(BaseModel):
    id: str
    tenant_id: str
    property_id: str
    ref_code: str
    guest_id: str
    guest: Optional[GuestResponse] = None
    room_id: Optional[str] = None
    room_number: Optional[str] = None
    room_type_id: str
    room_type_name: str
    check_in_date: str
    check_out_date: str
    nights: int
    adults: int
    children: int
    status: str
    booking_source: str
    nightly_rate: float
    total_amount: float
    paid_amount: float
    balance_amount: float
    payment_status: str
    rate_plan_code: str
    special_requests: Optional[str] = ""
    created_at: str
    eta: Optional[str] = "14:00"
    ota_reservation_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class FolioItemResponse(BaseModel):
    id: str
    folio_id: str
    date: str
    description: str
    category: str
    amount: float
    type: str
    payment_method: Optional[str] = None
    reference: Optional[str] = None
    added_by: str = "Front Desk"

    class Config:
        from_attributes = True


class FolioResponse(BaseModel):
    id: str
    tenant_id: str
    reservation_id: str
    reservation_ref: str
    guest_name: str
    room_number: Optional[str] = None
    total_charges: float = 0.0
    total_payments: float = 0.0
    total_discounts: float = 0.0
    total_taxes: float = 0.0
    balance: float = 0.0
    status: str = "Open"
    items: List[FolioItemResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class AddChargeRequest(BaseModel):
    description: str
    category: str = "Room"
    amount: float
    type: str = "Charge"
    added_by: str = "Front Desk"


class RecordPaymentRequest(BaseModel):
    amount: float
    method: str = "UPI"
    reference: str = ""
    notes: Optional[str] = ""


class PaymentResponse(BaseModel):
    id: str
    tenant_id: str
    reservation_id: Optional[str] = None
    reservation_ref: str
    guest_name: str
    amount: float
    currency: str = "INR"
    method: str
    status: str
    date: str
    reference: str
    notes: Optional[str] = ""

    class Config:
        from_attributes = True


class HousekeepingTaskResponse(BaseModel):
    id: str
    tenant_id: str
    room_id: str
    room_number: str
    room_type: str
    floor: int
    type: str
    priority: str
    status: str
    assigned_to: Optional[str] = None
    checklist: List[Dict[str, Any]] = Field(default_factory=list)
    notes: Optional[str] = ""
    last_updated: str
    estimated_minutes: int

    class Config:
        from_attributes = True


class MaintenanceTicketCreate(BaseModel):
    room_id: Optional[str] = None
    room_number: str
    title: str
    description: str = ""
    priority: str = "Medium"
    reported_by: str = "Housekeeping"
    category: str = "HVAC/AC"


class MaintenanceTicketResponse(BaseModel):
    id: str
    tenant_id: str
    room_id: Optional[str] = None
    room_number: str
    title: str
    description: str
    priority: str
    status: str
    reported_by: str
    reported_at: str
    resolved_at: Optional[str] = None
    category: str

    class Config:
        from_attributes = True


class ChannelConfigResponse(BaseModel):
    id: str
    tenant_id: str
    channel_name: str
    code: str
    status: str
    last_sync: str
    mapped_room_types: int
    total_room_types: int
    mapped_rate_plans: int
    total_rate_plans: int
    error_count: int
    error_summary: Optional[str] = None
    commission_rate: float
    revenue_this_month: float
    rate_multiplier: float
    bookings_this_month: int
    active_listings: int
    inbound_email_alias: Optional[str] = None
    ical_export_token: Optional[str] = None
    ical_import_url: Optional[str] = None
    last_email_received_at: Optional[str] = None
    auto_ingested_count: int = 0

    class Config:
        from_attributes = True


class RatePlanResponse(BaseModel):
    id: str
    tenant_id: str
    code: str
    name: str
    meal_plan: str
    base_price_multiplier: float
    cancellation_policy: str
    min_stay: int
    max_stay: Optional[int] = None
    stop_sell: bool
    cta: bool
    ctd: bool
    description: str
    rates_by_room_type: Dict[str, float] = Field(default_factory=dict)

    class Config:
        from_attributes = True


class StaffMemberResponse(BaseModel):
    id: str
    tenant_id: str
    property_id: Optional[str] = None
    name: str
    email: str
    phone: str
    role: str
    status: str
    pin_code: Optional[str] = "1234"
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: str
    tenant_id: str
    timestamp: str
    staff_name: str
    action: str
    entity_id: str
    details: str
    ip_address: str

    class Config:
        from_attributes = True
