import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from backend.database import Base


def generate_id(prefix="id"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    subdomain = Column(String(100), unique=True, index=True, nullable=False)
    owner_name = Column(String(255), nullable=False)
    owner_email = Column(String(255), nullable=False)
    owner_phone = Column(String(50), nullable=False)
    plan = Column(String(50), default="Professional")  # Starter, Professional, Enterprise
    status = Column(String(50), default="Active")  # Active, Trial, Past Due, Suspended
    billing_cycle = Column(String(50), default="Monthly")  # Monthly, Annual
    mrr = Column(Float, default=0.0)
    joined_date = Column(String(50), default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    renewal_date = Column(String(50), default="2027-01-01")
    max_rooms = Column(Integer, default=50)
    total_rooms_active = Column(Integer, default=0)
    properties_count = Column(Integer, default=1)
    primary_property_id = Column(String(64), nullable=True)
    features = Column(JSON, default=dict)
    monthly_gmv = Column(Float, default=0.0)
    monthly_bookings = Column(Integer, default=0)
    payment_status = Column(String(50), default="Paid")
    last_payment_date = Column(String(50), default="2026-03-01")
    payment_history = Column(JSON, default=list)
    deletion_allowed = Column(Boolean, default=False)
    suspended_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    properties = relationship("Property", back_populates="tenant", cascade="all, delete-orphan")
    memberships = relationship("TenantMembership", back_populates="tenant", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), default="")
    is_platform_user = Column(Boolean, default=False)
    platform_role = Column(String(100), nullable=True)  # "SIGNINN Super Admin", "SIGNINN Support Admin", "SIGNINN Billing Admin"
    status = Column(String(50), default="Active")  # Active, Inactive, Suspended
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    memberships = relationship("TenantMembership", back_populates="user", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String(64), primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    scope = Column(String(50), default="PROPERTY")  # TENANT, PROPERTY, PLATFORM
    description = Column(String(255), default="")

    roles = relationship("Role", secondary="role_permissions", back_populates="permissions")


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id = Column(String(64), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id = Column(String(64), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)


class Role(Base):
    __tablename__ = "roles"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    code = Column(String(50), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), default="")
    is_system_role = Column(Boolean, default=True)

    permissions = relationship("Permission", secondary="role_permissions", back_populates="roles")
    memberships = relationship("TenantMembership", back_populates="role")


class TenantMembership(Base):
    __tablename__ = "tenant_memberships"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(String(64), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = Column(String(50), default="Active")  # Active, Inactive
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="memberships")
    tenant = relationship("Tenant", back_populates="memberships")
    role = relationship("Role", back_populates="memberships")
    property_accesses = relationship("PropertyAccess", back_populates="membership", cascade="all, delete-orphan")


class PropertyAccess(Base):
    __tablename__ = "property_accesses"

    id = Column(String(64), primary_key=True, index=True)
    membership_id = Column(String(64), ForeignKey("tenant_memberships.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(64), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    membership = relationship("TenantMembership", back_populates="property_accesses")
    property = relationship("Property", back_populates="property_accesses")


class StaffInvitation(Base):
    __tablename__ = "staff_invitations"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    role_id = Column(String(64), ForeignKey("roles.id"), nullable=False)
    property_ids = Column(JSON, default=list)
    status = Column(String(50), default="PENDING")  # PENDING, ACCEPTED, EXPIRED, REVOKED
    invited_by_user_id = Column(String(64), nullable=True)
    token = Column(String(128), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Property(Base):
    __tablename__ = "properties"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    address = Column(String(255), default="")
    phone = Column(String(50), default="")
    email = Column(String(255), default="")
    currency = Column(String(10), default="INR")
    timezone = Column(String(50), default="Asia/Kolkata")
    total_rooms = Column(Integer, default=0)
    rating = Column(Float, default=4.8)
    gstin = Column(String(50), nullable=True)
    inbound_email_alias = Column(String(255), nullable=True)
    ical_token = Column(String(64), default=lambda: uuid.uuid4().hex[:16])

    tenant = relationship("Tenant", back_populates="properties")
    property_accesses = relationship("PropertyAccess", back_populates="property", cascade="all, delete-orphan")


class RoomType(Base):
    __tablename__ = "room_types"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(64), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    base_price = Column(Float, default=0.0)
    max_occupancy = Column(Integer, default=2)
    bed_configuration = Column(String(100), default="1 King Bed")
    size_sq_ft = Column(Integer, default=300)
    description = Column(Text, default="")
    amenities = Column(JSON, default=list)
    total_inventory = Column(Integer, default=0)
    available_count = Column(Integer, default=0)


class Room(Base):
    __tablename__ = "rooms"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(64), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    room_number = Column(String(20), nullable=False, index=True)
    floor = Column(Integer, default=1)
    room_type_id = Column(String(64), ForeignKey("room_types.id", ondelete="SET NULL"), nullable=True)
    room_type_name = Column(String(100), default="")
    occupancy_status = Column(String(50), default="Vacant")  # Vacant, Reserved, Occupied
    housekeeping_status = Column(String(50), default="Clean")  # Dirty, Assigned, Cleaning, Clean, Inspected, Ready
    maintenance_status = Column(String(50), default="Operational")  # Operational, Maintenance Required, Out of Order
    current_reservation_id = Column(String(64), nullable=True)
    current_guest_name = Column(String(255), nullable=True)
    next_arrival_date = Column(String(50), nullable=True)
    notes = Column(Text, default="")
    maintenance_notes = Column(Text, default="")
    key_card_assigned = Column(Boolean, default=False)


class Guest(Base):
    __tablename__ = "guests"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), default="", index=True)
    phone = Column(String(50), default="", index=True)
    id_type = Column(String(50), default="Aadhaar")
    id_number = Column(String(100), default="")
    nationality = Column(String(100), default="Indian")
    vip_status = Column(Boolean, default=False)
    lifetime_stays = Column(Integer, default=1)
    lifetime_revenue = Column(Float, default=0.0)
    preferences = Column(JSON, default=list)
    notes = Column(Text, default="")
    address = Column(String(255), default="")
    city = Column(String(100), default="")
    avatar_url = Column(String(255), nullable=True)


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(64), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    ref_code = Column(String(50), nullable=False, index=True)
    guest_id = Column(String(64), ForeignKey("guests.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(String(64), ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    room_number = Column(String(20), nullable=True)
    room_type_id = Column(String(64), ForeignKey("room_types.id", ondelete="CASCADE"), nullable=False)
    room_type_name = Column(String(100), default="")
    check_in_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    check_out_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    nights = Column(Integer, default=1)
    adults = Column(Integer, default=1)
    children = Column(Integer, default=0)
    status = Column(String(50), default="Confirmed", index=True)  # Inquiry, Provisional, Confirmed, Checked In, Checked Out, Cancelled, No-show
    booking_source = Column(String(50), default="Direct Website")
    nightly_rate = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    balance_amount = Column(Float, default=0.0)
    payment_status = Column(String(50), default="Unpaid")  # Paid, Partially Paid, Unpaid, Refunded
    rate_plan_code = Column(String(50), default="BAR-EP")
    special_requests = Column(Text, default="")
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())
    eta = Column(String(20), default="14:00")
    ota_reservation_id = Column(String(100), nullable=True)
    ota_commission_rate = Column(Float, default=0.0)
    ota_commission_amount = Column(Float, default=0.0)
    ota_payment_mode = Column(String(50), default="Hotel Collect")  # Hotel Collect, Virtual Card (VCC), Prepaid OTA
    ota_raw_payload = Column(Text, nullable=True)
    tags = Column(JSON, default=list)

    guest = relationship("Guest")
    room = relationship("Room")


class Folio(Base):
    __tablename__ = "folios"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    reservation_id = Column(String(64), ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False, index=True)
    reservation_ref = Column(String(50), nullable=False)
    guest_name = Column(String(255), nullable=False)
    room_number = Column(String(20), nullable=True)
    total_charges = Column(Float, default=0.0)
    total_payments = Column(Float, default=0.0)
    total_discounts = Column(Float, default=0.0)
    total_taxes = Column(Float, default=0.0)
    balance = Column(Float, default=0.0)
    status = Column(String(50), default="Open")  # Open, Settled, Closed

    items = relationship("FolioItem", back_populates="folio", cascade="all, delete-orphan")


class FolioItem(Base):
    __tablename__ = "folio_items"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    folio_id = Column(String(64), ForeignKey("folios.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(50), default=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M"))
    description = Column(String(255), nullable=False)
    category = Column(String(50), default="Room")  # Room, Food & Beverage, Laundry, Spa, Taxes, Discount, Misc
    amount = Column(Float, default=0.0)
    type = Column(String(50), default="Charge")  # Charge, Payment, Discount
    payment_method = Column(String(50), nullable=True)
    reference = Column(String(100), nullable=True)
    added_by = Column(String(100), default="Front Desk")

    folio = relationship("Folio", back_populates="items")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    reservation_id = Column(String(64), ForeignKey("reservations.id", ondelete="SET NULL"), nullable=True, index=True)
    reservation_ref = Column(String(50), nullable=False)
    guest_name = Column(String(255), nullable=False)
    amount = Column(Float, default=0.0)
    currency = Column(String(10), default="INR")
    method = Column(String(50), default="UPI")  # Cash, Card, UPI, Bank Transfer, Payment Link
    status = Column(String(50), default="Success")  # Success, Pending, Failed, Refunded
    date = Column(String(50), default=lambda: datetime.utcnow().isoformat())
    reference = Column(String(100), nullable=False)
    notes = Column(Text, default="")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_number = Column(String(100), nullable=False, index=True)
    date = Column(String(50), default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    due_date = Column(String(50), default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    guest_name = Column(String(255), nullable=False)
    guest_email = Column(String(255), default="")
    guest_phone = Column(String(50), default="")
    guest_gstin = Column(String(50), nullable=True)
    reservation_ref = Column(String(50), default="")
    room_number = Column(String(20), default="")
    stay_dates = Column(String(100), default="")
    items = Column(JSON, default=list)
    subtotal = Column(Float, default=0.0)
    tax_total = Column(Float, default=0.0)
    cgst = Column(Float, default=0.0)
    sgst = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    balance_due = Column(Float, default=0.0)
    status = Column(String(50), default="Paid")  # Paid, Partially Paid, Unpaid, Cancelled


class HousekeepingTask(Base):
    __tablename__ = "housekeeping_tasks"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id = Column(String(64), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    room_number = Column(String(20), nullable=False)
    room_type = Column(String(100), default="")
    floor = Column(Integer, default=1)
    type = Column(String(50), default="Stayover")  # Checkout, Stayover, Deep Clean, Touch Up
    priority = Column(String(50), default="Normal")  # Normal, High, Urgent
    status = Column(String(50), default="Assigned")  # Dirty, Assigned, Cleaning, Clean, Inspected, Ready
    assigned_to = Column(String(100), nullable=True)
    checklist = Column(JSON, default=list)
    notes = Column(Text, default="")
    last_updated = Column(String(50), default=lambda: datetime.utcnow().isoformat())
    estimated_minutes = Column(Integer, default=30)


class MaintenanceTicket(Base):
    __tablename__ = "maintenance_tickets"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id = Column(String(64), ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    room_number = Column(String(20), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    priority = Column(String(50), default="Medium")  # Low, Medium, High, Emergency
    severity = Column(String(50), default="Medium")
    status = Column(String(50), default="Reported")  # Reported, In Progress, Resolved
    reported_by = Column(String(100), default="Staff")
    reported_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())
    resolved_at = Column(String(50), nullable=True)
    category = Column(String(100), default="HVAC/AC")


class ChannelConfig(Base):
    __tablename__ = "channels"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    channel_name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    status = Column(String(50), default="Connected")  # Connected, Attention, Syncing, Failed, Disconnected
    last_sync = Column(String(50), default="Just now")
    mapped_room_types = Column(Integer, default=3)
    total_room_types = Column(Integer, default=3)
    mapped_rate_plans = Column(Integer, default=2)
    total_rate_plans = Column(Integer, default=2)
    error_count = Column(Integer, default=0)
    error_summary = Column(Text, nullable=True)
    commission_rate = Column(Float, default=15.0)
    revenue_this_month = Column(Float, default=0.0)
    rate_multiplier = Column(Float, default=1.0)
    bookings_this_month = Column(Integer, default=0)
    active_listings = Column(Integer, default=1)
    inbound_email_alias = Column(String(255), nullable=True)
    ical_export_token = Column(String(64), default=lambda: uuid.uuid4().hex[:16])
    ical_import_url = Column(String(500), nullable=True)
    last_email_received_at = Column(String(50), nullable=True)
    auto_ingested_count = Column(Integer, default=0)


class RatePlan(Base):
    __tablename__ = "rate_plans"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    meal_plan = Column(String(20), default="EP")  # EP, CP, MAP, AP
    base_price_multiplier = Column(Float, default=1.0)
    cancellation_policy = Column(String(255), default="Free cancellation up to 24h prior")
    min_stay = Column(Integer, default=1)
    max_stay = Column(Integer, nullable=True)
    stop_sell = Column(Boolean, default=False)
    cta = Column(Boolean, default=False)
    ctd = Column(Boolean, default=False)
    description = Column(Text, default="")
    rates_by_room_type = Column(JSON, default=dict)


class StaffMember(Base):
    __tablename__ = "staff_members"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(64), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), default="")
    role = Column(String(50), default="Front Desk")
    status = Column(String(50), default="Active")
    pin_code = Column(String(20), default="1234")
    avatar_url = Column(String(255), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(String(50), default=lambda: datetime.utcnow().isoformat())
    staff_name = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=False)
    details = Column(Text, default="")
    ip_address = Column(String(50), default="127.0.0.1")


class OtaIngestionLog(Base):
    __tablename__ = "ota_ingestion_logs"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(64), ForeignKey("properties.id", ondelete="CASCADE"), nullable=True, index=True)
    channel = Column(String(50), nullable=False)
    ota_reservation_id = Column(String(100), nullable=False, index=True)
    guest_name = Column(String(200), default="")
    check_in_date = Column(String(20), default="")
    check_out_date = Column(String(20), default="")
    room_type_name = Column(String(100), default="")
    total_amount = Column(Float, default=0.0)
    commission_amount = Column(Float, default=0.0)
    status = Column(String(50), default="Ingested")  # Ingested, Duplicate, Modified, Cancelled, Failed
    method = Column(String(50), default="Email Ingestion")  # Email Ingestion, iCal Sync, CSV Import
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())
    raw_payload_snippet = Column(Text, nullable=True)

