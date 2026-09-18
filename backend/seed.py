import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
from datetime import datetime, timedelta
from backend.database import engine, SessionLocal, Base
from backend.security import hash_password
from backend.models import (
    Tenant,
    Property,
    RoomType,
    Room,
    Guest,
    Reservation,
    Folio,
    FolioItem,
    Payment,
    HousekeepingTask,
    MaintenanceTicket,
    ChannelConfig,
    RatePlan,
    StaffMember,
    AuditLog,
    User,
    Role,
    Permission,
    RolePermission,
    TenantMembership,
    PropertyAccess,
)


def seed_identity(db: SessionLocal):
    existing_user = db.query(User).first()
    if existing_user:
        print("Identity and RBAC already seeded.")
        return

    print("Seeding normalized permissions, roles, users, and multi-property access...")

    # 1. Permissions
    permissions_data = [
        # Reservations
        ("reservation.view", "PROPERTY", "View reservations"),
        ("reservation.create", "PROPERTY", "Create reservations"),
        ("reservation.modify", "PROPERTY", "Modify reservations"),
        ("reservation.cancel", "PROPERTY", "Cancel reservations"),
        # Stays
        ("stay.view", "PROPERTY", "View stays"),
        ("stay.checkin", "PROPERTY", "Perform guest check-in"),
        ("stay.checkout", "PROPERTY", "Perform guest check-out"),
        ("stay.room_move", "PROPERTY", "Execute room move"),
        # Guests
        ("guest.view", "PROPERTY", "View guest profiles"),
        ("guest.create", "PROPERTY", "Create guest profile"),
        ("guest.modify", "PROPERTY", "Modify guest profile"),
        # Folios
        ("folio.view", "PROPERTY", "View billing folios"),
        ("folio.charge", "PROPERTY", "Post charges to folios"),
        ("folio.adjust", "PROPERTY", "Apply adjustments/discounts to folios"),
        ("folio.transfer", "PROPERTY", "Transfer folio charges"),
        # Payments
        ("payment.view", "PROPERTY", "View payments"),
        ("payment.collect", "PROPERTY", "Collect guest payments"),
        ("payment.refund", "PROPERTY", "Issue payment refunds"),
        # Rooms
        ("room.view", "PROPERTY", "View room list and tape chart"),
        ("room.modify", "PROPERTY", "Modify room details"),
        # Housekeeping
        ("housekeeping.view", "PROPERTY", "View housekeeping tasks"),
        ("housekeeping.update", "PROPERTY", "Update housekeeping status"),
        ("housekeeping.inspect", "PROPERTY", "Inspect and approve clean rooms"),
        # Maintenance
        ("maintenance.view", "PROPERTY", "View maintenance tickets"),
        ("maintenance.create", "PROPERTY", "Create maintenance tickets"),
        ("maintenance.update", "PROPERTY", "Resolve maintenance tickets"),
        # Rates & Inventory
        ("rate.view", "PROPERTY", "View rate plans"),
        ("rate.modify", "PROPERTY", "Modify rate plans"),
        ("inventory.view", "PROPERTY", "View availability and inventory"),
        ("inventory.modify", "PROPERTY", "Modify inventory restrictions"),
        # Distribution
        ("distribution.view", "PROPERTY", "View channel distribution"),
        ("distribution.manage", "PROPERTY", "Manage OTA channels"),
        # Reports
        ("report.operational.view", "PROPERTY", "View operational reports"),
        ("report.financial.view", "PROPERTY", "View financial and revenue reports"),
        # Staff & Settings
        ("staff.view", "TENANT", "View staff directory"),
        ("staff.manage", "TENANT", "Invite and manage staff"),
        ("property.settings.view", "PROPERTY", "View property settings"),
        ("property.settings.manage", "PROPERTY", "Manage property settings"),
        ("tenant.settings.view", "TENANT", "View tenant organization settings"),
        ("tenant.settings.manage", "TENANT", "Manage tenant organization settings"),
        ("audit.view", "TENANT", "View security and audit log"),
    ]

    perm_map = {}
    for code, scope, desc in permissions_data:
        p = Permission(
            id=f"perm-{code.replace('.', '-')}",
            code=code,
            scope=scope,
            description=desc,
        )
        db.add(p)
        perm_map[code] = p
    db.commit()

    # 2. Roles
    roles_def = [
        ("role-owner", "OWNER", "Owner", "Executive with full tenant-wide and property-wide control", list(perm_map.keys())),
        ("role-gm", "PROPERTY_MANAGER", "Property Manager", "General Manager with operational and financial oversight", [
            "reservation.view", "reservation.create", "reservation.modify", "reservation.cancel",
            "stay.view", "stay.checkin", "stay.checkout", "stay.room_move",
            "guest.view", "guest.create", "guest.modify",
            "folio.view", "folio.charge", "folio.adjust",
            "payment.view", "payment.collect",
            "room.view", "room.modify",
            "housekeeping.view", "housekeeping.update", "housekeeping.inspect",
            "maintenance.view", "maintenance.create", "maintenance.update",
            "rate.view", "rate.modify",
            "inventory.view", "inventory.modify",
            "distribution.view",
            "report.operational.view", "report.financial.view",
            "staff.view",
            "property.settings.view", "property.settings.manage",
            "audit.view",
        ]),
        ("role-frontdesk", "FRONT_DESK", "Front Desk", "Front desk operator for reservations, arrivals, departures, check-in, check-out", [
            "reservation.view", "reservation.create", "reservation.modify", "reservation.cancel",
            "stay.view", "stay.checkin", "stay.checkout", "stay.room_move",
            "guest.view", "guest.create", "guest.modify",
            "room.view",
            "folio.view", "folio.charge",
            "payment.view", "payment.collect",
            "housekeeping.view",
            "maintenance.view", "maintenance.create",
            "inventory.view",
            "report.operational.view",
        ]),
        ("role-nightaudit", "NIGHT_AUDITOR", "Night Auditor", "End-of-day room charge posting, daily reconciliation, business date close", [
            "reservation.view",
            "stay.view",
            "guest.view",
            "room.view",
            "folio.view", "folio.charge", "folio.adjust",
            "payment.view", "payment.collect",
            "report.operational.view", "report.financial.view",
            "audit.view",
        ]),
        ("role-housekeeping", "HOUSEKEEPING", "Housekeeping", "Room cleanliness status, assigned tasks, inspection readiness", [
            "room.view",
            "housekeeping.view", "housekeeping.update", "housekeeping.inspect",
            "maintenance.create",
        ]),
        ("role-maintenance", "MAINTENANCE", "Maintenance", "Engineering, work orders, room repairs, Out-of-Order tracking", [
            "room.view",
            "maintenance.view", "maintenance.create", "maintenance.update",
        ]),
        ("role-revenue", "REVENUE_MANAGER", "Revenue Manager", "Rate plans, yield management, OTA inventory, and revenue analytics", [
            "reservation.view",
            "rate.view", "rate.modify",
            "inventory.view", "inventory.modify",
            "distribution.view", "distribution.manage",
            "report.operational.view", "report.financial.view",
        ]),
        ("role-finance", "FINANCE", "Finance", "Folios, payments, refunds, invoices, and accounting reports", [
            "folio.view", "folio.charge", "folio.adjust", "folio.transfer",
            "payment.view", "payment.collect", "payment.refund",
            "report.financial.view", "report.operational.view",
            "audit.view",
        ]),
    ]

    role_map = {}
    for r_id, code, name, desc, perms in roles_def:
        role = Role(
            id=r_id,
            tenant_id=None,  # System roles
            code=code,
            name=name,
            description=desc,
            is_system_role=True,
        )
        for p_code in perms:
            if p_code in perm_map:
                role.permissions.append(perm_map[p_code])
        db.add(role)
        role_map[code] = role
    db.commit()

    # 3. Multi-Property Setup: Ensure tenant-1 has two physical hotels
    prop_1b = db.query(Property).filter(Property.id == "prop-1b").first()
    if not prop_1b:
        prop_1b = Property(
            id="prop-1b",
            tenant_id="tenant-1",
            name="Grand Azure Heritage Beachfront",
            code="GA-GOA",
            city="Goa",
            state="Goa",
            address="Candolim Beach Road, North Goa",
            phone="+91 832 248 9911",
            email="goa@grandazure.com",
            currency="INR",
            timezone="Asia/Kolkata",
            total_rooms=25,
            rating=4.9,
            gstin="30AAAAA0000A1Z5",
        )
        db.add(prop_1b)
        tenant_1 = db.query(Tenant).filter(Tenant.id == "tenant-1").first()
        if tenant_1:
            tenant_1.properties_count = 2
        db.commit()

    # 4. Users
    pwd_hash = hash_password("password123")
    users_data = [
        # Platform Admin (SIGNINN HQ)
        User(
            id="usr-superadmin",
            email="superadmin@signinn.com",
            hashed_password=pwd_hash,
            name="Vikramaditya Roy",
            phone="+91 98201 00000",
            is_platform_user=True,
            platform_role="SIGNINN Super Admin",
            status="Active",
        ),
        # Hotel Owner
        User(
            id="usr-owner",
            email="alex.morgan@grandazure.com",
            hashed_password=pwd_hash,
            name="Alex Morgan",
            phone="+91 98201 55432",
            is_platform_user=False,
            status="Active",
        ),
        # Property Manager (General Manager)
        User(
            id="usr-gm",
            email="rohit.gm@grandazure.com",
            hashed_password=pwd_hash,
            name="Rohit Verma",
            phone="+91 98110 44321",
            is_platform_user=False,
            status="Active",
        ),
        # Front Desk
        User(
            id="usr-frontdesk",
            email="priya.desk@grandazure.com",
            hashed_password=pwd_hash,
            name="Priya Sharma",
            phone="+91 98765 43210",
            is_platform_user=False,
            status="Active",
        ),
        # Night Auditor
        User(
            id="usr-nightaudit",
            email="kiran.audit@grandazure.com",
            hashed_password=pwd_hash,
            name="Kiran Patel",
            phone="+91 98450 11223",
            is_platform_user=False,
            status="Active",
        ),
        # Housekeeping
        User(
            id="usr-housekeeping",
            email="sunita.clean@grandazure.com",
            hashed_password=pwd_hash,
            name="Sunita Devi",
            phone="+91 97123 45678",
            is_platform_user=False,
            status="Active",
        ),
        # Maintenance
        User(
            id="usr-maintenance",
            email="rajesh.fix@grandazure.com",
            hashed_password=pwd_hash,
            name="Rajesh Kumar",
            phone="+91 96543 21098",
            is_platform_user=False,
            status="Active",
        ),
        # Revenue Manager
        User(
            id="usr-revenue",
            email="kavita.rev@grandazure.com",
            hashed_password=pwd_hash,
            name="Kavita Nair",
            phone="+91 99887 76655",
            is_platform_user=False,
            status="Active",
        ),
        # Finance
        User(
            id="usr-finance",
            email="arun.finance@grandazure.com",
            hashed_password=pwd_hash,
            name="Arun Menon",
            phone="+91 98701 23456",
            is_platform_user=False,
            status="Active",
        ),
    ]

    for u in users_data:
        db.add(u)
    db.commit()

    # 5. Memberships & Property Access for Hotel Staff (Tenant: tenant-1)
    # Owner has membership with OWNER role
    mem_owner = TenantMembership(
        id="mem-owner",
        user_id="usr-owner",
        tenant_id="tenant-1",
        role_id=role_map["OWNER"].id,
        status="Active",
    )
    db.add(mem_owner)
    db.commit()

    # Property Manager (Rohit Verma) -> access to both Kochi (prop-1) and Goa (prop-1b)
    mem_gm = TenantMembership(
        id="mem-gm",
        user_id="usr-gm",
        tenant_id="tenant-1",
        role_id=role_map["PROPERTY_MANAGER"].id,
        status="Active",
    )
    db.add(mem_gm)
    db.commit()
    db.add(PropertyAccess(id="pa-gm-1", membership_id="mem-gm", property_id="prop-1"))
    db.add(PropertyAccess(id="pa-gm-2", membership_id="mem-gm", property_id="prop-1b"))

    # Front Desk (Priya Sharma) -> access to Kochi (prop-1)
    mem_fd = TenantMembership(
        id="mem-fd",
        user_id="usr-frontdesk",
        tenant_id="tenant-1",
        role_id=role_map["FRONT_DESK"].id,
        status="Active",
    )
    db.add(mem_fd)
    db.commit()
    db.add(PropertyAccess(id="pa-fd-1", membership_id="mem-fd", property_id="prop-1"))

    # Night Auditor (Kiran Patel) -> access to Kochi (prop-1)
    mem_na = TenantMembership(
        id="mem-na",
        user_id="usr-nightaudit",
        tenant_id="tenant-1",
        role_id=role_map["NIGHT_AUDITOR"].id,
        status="Active",
    )
    db.add(mem_na)
    db.commit()
    db.add(PropertyAccess(id="pa-na-1", membership_id="mem-na", property_id="prop-1"))

    # Housekeeping (Sunita Devi) -> access to Kochi (prop-1)
    mem_hk = TenantMembership(
        id="mem-hk",
        user_id="usr-housekeeping",
        tenant_id="tenant-1",
        role_id=role_map["HOUSEKEEPING"].id,
        status="Active",
    )
    db.add(mem_hk)
    db.commit()
    db.add(PropertyAccess(id="pa-hk-1", membership_id="mem-hk", property_id="prop-1"))

    # Maintenance (Rajesh Kumar) -> access to Kochi (prop-1)
    mem_mt = TenantMembership(
        id="mem-mt",
        user_id="usr-maintenance",
        tenant_id="tenant-1",
        role_id=role_map["MAINTENANCE"].id,
        status="Active",
    )
    db.add(mem_mt)
    db.commit()
    db.add(PropertyAccess(id="pa-mt-1", membership_id="mem-mt", property_id="prop-1"))

    # Revenue Manager (Kavita Nair) -> access to both Kochi (prop-1) and Goa (prop-1b)
    mem_rev = TenantMembership(
        id="mem-rev",
        user_id="usr-revenue",
        tenant_id="tenant-1",
        role_id=role_map["REVENUE_MANAGER"].id,
        status="Active",
    )
    db.add(mem_rev)
    db.commit()
    db.add(PropertyAccess(id="pa-rev-1", membership_id="mem-rev", property_id="prop-1"))
    db.add(PropertyAccess(id="pa-rev-2", membership_id="mem-rev", property_id="prop-1b"))

    # Finance (Arun Menon) -> access to both Kochi (prop-1) and Goa (prop-1b)
    mem_fin = TenantMembership(
        id="mem-fin",
        user_id="usr-finance",
        tenant_id="tenant-1",
        role_id=role_map["FINANCE"].id,
        status="Active",
    )
    db.add(mem_fin)
    db.commit()
    db.add(PropertyAccess(id="pa-fin-1", membership_id="mem-fin", property_id="prop-1"))
    db.add(PropertyAccess(id="pa-fin-2", membership_id="mem-fin", property_id="prop-1b"))

    db.commit()
    print("Seeded all roles, permissions, users, and multi-property memberships successfully!")


def seed_database():
    from backend.seed_50_rooms_yearly import seed_50_rooms_yearly
    return seed_50_rooms_yearly()

def _legacy_seed_database():
    print("Seeding multi-tenant hotel data...")

    # 1. Tenants (SaaS Organizations)
    tenants = [
        Tenant(
            id="tenant-1",
            name="Grand Azure Resort & Spa",
            slug="grand-azure",
            subdomain="grandazure.signinn.app",
            owner_name="Vikramaditya Roy",
            owner_email="roy@grandazure.com",
            owner_phone="+91 98201 55432",
            plan="Enterprise",
            status="Active",
            billing_cycle="Annual",
            mrr=14999.0,
            joined_date="2025-04-10",
            renewal_date="2027-04-10",
            max_rooms=60,
            total_rooms_active=45,
            properties_count=2,
            primary_property_id="prop-1",
            features={
                "otaChannelManager": True,
                "directBookingEngine": True,
                "whatsappAutomations": True,
                "multiProperty": True,
                "qrRoomService": True,
                "advancedAnalytics": True,
                "aiPricing": True,
                "housekeepingApp": True,
            },
            monthly_gmv=1250000.0,
            monthly_bookings=124,
        ),
        Tenant(
            id="tenant-2",
            name="Mountain Peak Boutique Inn",
            slug="mountain-peak",
            subdomain="mountainpeak.signinn.app",
            owner_name="Ananya Sharma",
            owner_email="ananya@mountainpeak.in",
            owner_phone="+91 94180 88214",
            plan="Professional",
            status="Active",
            billing_cycle="Monthly",
            mrr=7999.0,
            joined_date="2025-08-15",
            renewal_date="2026-10-15",
            max_rooms=30,
            total_rooms_active=20,
            properties_count=1,
            primary_property_id="prop-2",
            features={
                "otaChannelManager": True,
                "directBookingEngine": True,
                "whatsappAutomations": True,
                "multiProperty": False,
                "advancedAnalytics": False,
                "aiPricing": False,
                "housekeepingApp": True,
            },
            monthly_gmv=540000.0,
            monthly_bookings=68,
        ),
        Tenant(
            id="tenant-3",
            name="Urban Hive Executive Suites",
            slug="urban-hive",
            subdomain="urbanhive.signinn.app",
            owner_name="Karthik Narayan",
            owner_email="knarayan@urbanhive.com",
            owner_phone="+91 98450 12890",
            plan="Starter",
            status="Active",
            billing_cycle="Monthly",
            mrr=4499.0,
            joined_date="2026-01-05",
            renewal_date="2026-10-05",
            max_rooms=35,
            total_rooms_active=25,
            properties_count=1,
            primary_property_id="prop-3",
            features={
                "otaChannelManager": False,
                "directBookingEngine": True,
                "whatsappAutomations": False,
                "multiProperty": False,
                "advancedAnalytics": False,
                "aiPricing": False,
                "housekeepingApp": False,
            },
            monthly_gmv=780000.0,
            monthly_bookings=92,
        ),
    ]
    for t in tenants:
        db.add(t)
    db.commit()

    # 2. Properties
    properties = [
        Property(
            id="prop-1",
            tenant_id="tenant-1",
            name="Grand Azure Resort & Spa, North Goa",
            code="GA-GOA",
            city="Candolim, Goa",
            state="Goa",
            address="Pinnacle Cliff, Sinquerim Road, Candolim 403515",
            phone="+91 832 249 9000",
            email="reservations@grandazuregoa.com",
            currency="INR",
            timezone="Asia/Kolkata",
            total_rooms=45,
            rating=4.9,
            gstin="30AAAAA0000A1Z5",
        ),
        Property(
            id="prop-2",
            tenant_id="tenant-2",
            name="Mountain Peak Boutique Inn, Manali",
            code="MP-MNL",
            city="Old Manali",
            state="Himachal Pradesh",
            address="Club House Road, Old Manali 175131",
            phone="+91 1902 252 110",
            email="stay@mountainpeak.in",
            currency="INR",
            timezone="Asia/Kolkata",
            total_rooms=20,
            rating=4.7,
            gstin="02AAAAA1111B1Z2",
        ),
        Property(
            id="prop-3",
            tenant_id="tenant-3",
            name="Urban Hive Executive Suites, Indiranagar",
            code="UH-BLR",
            city="Bengaluru",
            state="Karnataka",
            address="100ft Road, HAL 2nd Stage, Indiranagar 560038",
            phone="+91 80 4122 7800",
            email="frontdesk@urbanhive.com",
            currency="INR",
            timezone="Asia/Kolkata",
            total_rooms=25,
            rating=4.6,
            gstin="29AAAAA2222C1Z8",
        ),
    ]
    for p in properties:
        db.add(p)
    db.commit()

    # 3. Room Types for Grand Azure (tenant-1)
    room_types_t1 = [
        RoomType(
            id="rt-101",
            tenant_id="tenant-1",
            property_id="prop-1",
            name="Deluxe Sea View",
            code="DSV",
            base_price=6500.0,
            max_occupancy=2,
            bed_configuration="1 King Bed",
            size_sq_ft=380,
            description="Breathtaking panoramic Arabian Sea view with private balcony.",
            amenities=["Ocean View", "Balcony", "King Bed", "Minibar", "Bathtub", "High-speed Wi-Fi"],
            total_inventory=18,
            available_count=12,
        ),
        RoomType(
            id="rt-102",
            tenant_id="tenant-1",
            property_id="prop-1",
            name="Executive Garden Suite",
            code="EGS",
            base_price=9200.0,
            max_occupancy=3,
            bed_configuration="1 King + 1 Sofa Bed",
            size_sq_ft=520,
            description="Expansive suite with serene tropical garden terrace.",
            amenities=["Garden Terrace", "Living Room", "Espresso Machine", "Rain Shower", "Work Desk"],
            total_inventory=15,
            available_count=10,
        ),
        RoomType(
            id="rt-103",
            tenant_id="tenant-1",
            property_id="prop-1",
            name="Presidential Pool Villa",
            code="PPV",
            base_price=18500.0,
            max_occupancy=4,
            bed_configuration="2 King Beds",
            size_sq_ft=1100,
            description="Private plunge pool, butler service, and direct beach trail access.",
            amenities=["Private Pool", "Butler Service", "Jacuzzi", "Kitchenette", "Sun Loungers"],
            total_inventory=12,
            available_count=8,
        ),
    ]
    for rt in room_types_t1:
        db.add(rt)
    db.commit()

    # 4. Rooms for Grand Azure (tenant-1)
    rooms_data = [
        # Floor 1 - Deluxe Sea View
        ("rm-101", "101", 1, "rt-101", "Deluxe Sea View", "Occupied", "Clean", "Operational", "res-101", "Aarav Mehta"),
        ("rm-102", "102", 1, "rt-101", "Deluxe Sea View", "Reserved", "Ready", "Operational", "res-102", "Pooja Hegde"),
        ("rm-103", "103", 1, "rt-101", "Deluxe Sea View", "Vacant", "Clean", "Operational", None, None),
        ("rm-104", "104", 1, "rt-101", "Deluxe Sea View", "Vacant", "Dirty", "Operational", None, None),
        ("rm-105", "105", 1, "rt-101", "Deluxe Sea View", "Vacant", "Inspected", "Operational", None, None),
        ("rm-106", "106", 1, "rt-101", "Deluxe Sea View", "Vacant", "Ready", "Operational", None, None),
        # Floor 2 - Executive Garden Suite
        ("rm-201", "201", 2, "rt-102", "Executive Garden Suite", "Occupied", "Clean", "Operational", "res-103", "Rohan Singhal"),
        ("rm-202", "202", 2, "rt-102", "Executive Garden Suite", "Vacant", "Assigned", "Operational", None, None),
        ("rm-203", "203", 2, "rt-102", "Executive Garden Suite", "Vacant", "Cleaning", "Operational", None, None),
        ("rm-204", "204", 2, "rt-102", "Executive Garden Suite", "Occupied", "Clean", "Operational", "res-104", "David Miller"),
        ("rm-205", "205", 2, "rt-102", "Executive Garden Suite", "Vacant", "Ready", "Maintenance Required", None, None),
        # Floor 3 - Presidential Pool Villa
        ("rm-301", "301", 3, "rt-103", "Presidential Pool Villa", "Occupied", "Clean", "Operational", "res-105", "Kabir Bedi"),
        ("rm-302", "302", 3, "rt-103", "Presidential Pool Villa", "Reserved", "Ready", "Operational", "res-106", "Natasha Cooper"),
        ("rm-303", "303", 3, "rt-103", "Presidential Pool Villa", "Vacant", "Ready", "Operational", None, None),
    ]

    for rid, rnum, flr, rtid, rtname, occ, hsk, mnt, crid, cgname in rooms_data:
        room = Room(
            id=rid,
            tenant_id="tenant-1",
            property_id="prop-1",
            room_number=rnum,
            floor=flr,
            room_type_id=rtid,
            room_type_name=rtname,
            occupancy_status=occ,
            housekeeping_status=hsk,
            maintenance_status=mnt,
            current_reservation_id=crid,
            current_guest_name=cgname,
            notes="Keycard active at front desk" if occ == "Occupied" else "",
            key_card_assigned=occ == "Occupied",
        )
        db.add(room)
    db.commit()

    # 5. Guests
    guests = [
        Guest(
            id="gst-1",
            tenant_id="tenant-1",
            first_name="Aarav",
            last_name="Mehta",
            email="aarav.mehta@techcorp.in",
            phone="+91 98200 11223",
            id_type="Aadhaar",
            id_number="XXXX-XXXX-8491",
            nationality="Indian",
            vip_status=True,
            lifetime_stays=4,
            lifetime_revenue=58000.0,
            preferences=["High Floor", "Quiet Room", "Extra Pillow"],
            notes="Prefers sea view and early morning espresso",
            city="Mumbai",
        ),
        Guest(
            id="gst-2",
            tenant_id="tenant-1",
            first_name="Pooja",
            last_name="Hegde",
            email="pooja.hegde@designstudio.com",
            phone="+91 97112 33445",
            id_type="Passport",
            id_number="M8920194",
            nationality="Indian",
            vip_status=False,
            lifetime_stays=2,
            lifetime_revenue=24000.0,
            preferences=["King Bed", "Late Checkout"],
            notes="Attending corporate leadership offsite",
            city="Bengaluru",
        ),
        Guest(
            id="gst-3",
            tenant_id="tenant-1",
            first_name="Rohan",
            last_name="Singhal",
            email="rohan.singhal@capitalventures.com",
            phone="+91 98110 55667",
            id_type="Aadhaar",
            id_number="XXXX-XXXX-3312",
            nationality="Indian",
            vip_status=True,
            lifetime_stays=6,
            lifetime_revenue=92000.0,
            preferences=["Non-smoking", "Airport Pickup"],
            notes="Loyalty Tier: Platinum Member",
            city="New Delhi",
        ),
        Guest(
            id="gst-4",
            tenant_id="tenant-1",
            first_name="David",
            last_name="Miller",
            email="d.miller@londonconsult.co.uk",
            phone="+44 7700 900123",
            id_type="Passport",
            id_number="GB5928104",
            nationality="British",
            vip_status=False,
            lifetime_stays=1,
            lifetime_revenue=36800.0,
            preferences=["Sea Facing", "Fruit Basket"],
            notes="International guest visiting for leisure",
            city="London",
        ),
        Guest(
            id="gst-5",
            tenant_id="tenant-1",
            first_name="Kabir",
            last_name="Bedi",
            email="kabir.bedi@globalfilms.org",
            phone="+91 99300 44556",
            id_type="Passport",
            id_number="Z4492011",
            nationality="Indian",
            vip_status=True,
            lifetime_stays=8,
            lifetime_revenue=148000.0,
            preferences=["Pool Villa", "Private Dining", "Butler"],
            notes="VIP guest. Always ensure welcome amenity upon check-in.",
            city="Mumbai",
        ),
    ]
    for g in guests:
        db.add(g)
    db.commit()

    today_str = "2026-09-17"
    yesterday_str = "2026-09-16"
    tomorrow_str = "2026-09-18"
    three_days_str = "2026-09-20"

    # 6. Reservations
    reservations = [
        Reservation(
            id="res-101",
            tenant_id="tenant-1",
            property_id="prop-1",
            ref_code="SGN-26-8901",
            guest_id="gst-1",
            room_id="rm-101",
            room_number="101",
            room_type_id="rt-101",
            room_type_name="Deluxe Sea View",
            check_in_date=yesterday_str,
            check_out_date=tomorrow_str,
            nights=2,
            adults=2,
            children=0,
            status="Checked In",
            booking_source="Direct Website",
            nightly_rate=6500.0,
            total_amount=13000.0,
            paid_amount=13000.0,
            balance_amount=0.0,
            payment_status="Paid",
            rate_plan_code="BAR-EP",
            special_requests="High floor with ocean sunset view",
            tags=["Direct", "VIP", "Prepaid"],
        ),
        Reservation(
            id="res-102",
            tenant_id="tenant-1",
            property_id="prop-1",
            ref_code="SGN-26-8902",
            guest_id="gst-2",
            room_id="rm-102",
            room_number="102",
            room_type_id="rt-101",
            room_type_name="Deluxe Sea View",
            check_in_date=today_str,
            check_out_date=three_days_str,
            nights=3,
            adults=1,
            children=0,
            status="Confirmed",
            booking_source="Booking.com",
            nightly_rate=6800.0,
            total_amount=20400.0,
            paid_amount=5000.0,
            balance_amount=15400.0,
            payment_status="Partially Paid",
            rate_plan_code="BAR-CP",
            special_requests="Arriving at 3 PM, quiet room",
            tags=["OTA", "Arrival Today"],
        ),
        Reservation(
            id="res-103",
            tenant_id="tenant-1",
            property_id="prop-1",
            ref_code="SGN-26-8903",
            guest_id="gst-3",
            room_id="rm-201",
            room_number="201",
            room_type_id="rt-102",
            room_type_name="Executive Garden Suite",
            check_in_date=yesterday_str,
            check_out_date=three_days_str,
            nights=4,
            adults=2,
            children=1,
            status="Checked In",
            booking_source="Walk-in",
            nightly_rate=9200.0,
            total_amount=36800.0,
            paid_amount=20000.0,
            balance_amount=16800.0,
            payment_status="Partially Paid",
            rate_plan_code="BAR-MAP",
            special_requests="Extra bed setup in suite living area",
            tags=["Walk-In", "Family"],
        ),
        Reservation(
            id="res-104",
            tenant_id="tenant-1",
            property_id="prop-1",
            ref_code="SGN-26-8904",
            guest_id="gst-4",
            room_id="rm-204",
            room_number="204",
            room_type_id="rt-102",
            room_type_name="Executive Garden Suite",
            check_in_date=yesterday_str,
            check_out_date=today_str,
            nights=1,
            adults=1,
            children=0,
            status="Checked In",
            booking_source="MakeMyTrip",
            nightly_rate=9200.0,
            total_amount=9200.0,
            paid_amount=9200.0,
            balance_amount=0.0,
            payment_status="Paid",
            rate_plan_code="BAR-EP",
            special_requests="Late checkout requested at 1 PM",
            tags=["Departure Today", "Corporate"],
        ),
        Reservation(
            id="res-105",
            tenant_id="tenant-1",
            property_id="prop-1",
            ref_code="SGN-26-8905",
            guest_id="gst-5",
            room_id="rm-301",
            room_number="301",
            room_type_id="rt-103",
            room_type_name="Presidential Pool Villa",
            check_in_date=yesterday_str,
            check_out_date=three_days_str,
            nights=4,
            adults=2,
            children=0,
            status="Checked In",
            booking_source="Direct Website",
            nightly_rate=18500.0,
            total_amount=74000.0,
            paid_amount=74000.0,
            balance_amount=0.0,
            payment_status="Paid",
            rate_plan_code="BAR-AP",
            special_requests="Champagne on arrival, private chef breakfast",
            tags=["Direct", "VIP", "Suite"],
        ),
    ]
    for r in reservations:
        db.add(r)
    db.commit()

    # 7. Folios and Line Items
    folios_data = [
        ("fol-101", "res-101", "SGN-26-8901", "Aarav Mehta", "101", 13000.0, 13000.0, 0.0, "Settled"),
        ("fol-102", "res-102", "SGN-26-8902", "Pooja Hegde", "102", 20400.0, 5000.0, 15400.0, "Open"),
        ("fol-103", "res-103", "SGN-26-8903", "Rohan Singhal", "201", 39200.0, 20000.0, 19200.0, "Open"),
        ("fol-104", "res-104", "SGN-26-8904", "David Miller", "204", 9200.0, 9200.0, 0.0, "Open"),
        ("fol-105", "res-105", "SGN-26-8905", "Kabir Bedi", "301", 74000.0, 74000.0, 0.0, "Settled"),
    ]
    for fid, rid, rref, gname, rnum, chg, pmt, bal, st in folios_data:
        folio = Folio(
            id=fid,
            tenant_id="tenant-1",
            reservation_id=rid,
            reservation_ref=rref,
            guest_name=gname,
            room_number=rnum,
            total_charges=chg,
            total_payments=pmt,
            total_discounts=0.0,
            total_taxes=chg * 0.12,
            balance=bal,
            status=st,
        )
        db.add(folio)
    db.commit()

    # Folio Items
    items = [
        FolioItem(id="fi-1", tenant_id="tenant-1", folio_id="fol-101", description="Room Tariff (2 nights)", category="Room", amount=13000.0, type="Charge"),
        FolioItem(id="fi-2", tenant_id="tenant-1", folio_id="fol-101", description="Advance Online Payment", category="Taxes", amount=13000.0, type="Payment", payment_method="UPI", reference="UPI-ADV-8901"),
        FolioItem(id="fi-3", tenant_id="tenant-1", folio_id="fol-102", description="Room Tariff (3 nights)", category="Room", amount=20400.0, type="Charge"),
        FolioItem(id="fi-4", tenant_id="tenant-1", folio_id="fol-102", description="Advance Booking Deposit", category="Misc", amount=5000.0, type="Payment", payment_method="Card", reference="CC-DEP-8902"),
        FolioItem(id="fi-5", tenant_id="tenant-1", folio_id="fol-103", description="Room Tariff (4 nights)", category="Room", amount=36800.0, type="Charge"),
        FolioItem(id="fi-6", tenant_id="tenant-1", folio_id="fol-103", description="Room Service F&B Dinner", category="Food & Beverage", amount=2400.0, type="Charge"),
        FolioItem(id="fi-7", tenant_id="tenant-1", folio_id="fol-103", description="Check-in Advance Deposit", category="Misc", amount=20000.0, type="Payment", payment_method="UPI", reference="UPI-CKIN-8903"),
    ]
    for it in items:
        db.add(it)
    db.commit()

    # 8. Payments
    payments = [
        Payment(
            id="pay-1",
            tenant_id="tenant-1",
            reservation_id="res-101",
            reservation_ref="SGN-26-8901",
            guest_name="Aarav Mehta",
            amount=13000.0,
            currency="INR",
            method="UPI",
            status="Success",
            date="2026-09-16T10:15:00Z",
            reference="PAY-UPI-101928",
            notes="Full settlement received via Razorpay UPI QR",
        ),
        Payment(
            id="pay-2",
            tenant_id="tenant-1",
            reservation_id="res-102",
            reservation_ref="SGN-26-8902",
            guest_name="Pooja Hegde",
            amount=5000.0,
            currency="INR",
            method="Card",
            status="Success",
            date="2026-09-15T14:30:00Z",
            reference="PAY-CARD-589201",
            notes="OTA advance deposit",
        ),
        Payment(
            id="pay-3",
            tenant_id="tenant-1",
            reservation_id="res-103",
            reservation_ref="SGN-26-8903",
            guest_name="Rohan Singhal",
            amount=20000.0,
            currency="INR",
            method="UPI",
            status="Success",
            date="2026-09-16T12:00:00Z",
            reference="PAY-UPI-339102",
            notes="Front Desk QR payment",
        ),
    ]
    for p in payments:
        db.add(p)
    db.commit()

    # 9. Housekeeping Tasks
    tasks = [
        HousekeepingTask(
            id="tsk-1",
            tenant_id="tenant-1",
            room_id="rm-104",
            room_number="104",
            room_type="Deluxe Sea View",
            floor=1,
            type="Stayover",
            priority="High",
            status="Dirty",
            assigned_to="Sunita Patil",
            checklist=[
                {"id": "c1", "label": "Linen strip and replacement", "done": False},
                {"id": "c2", "label": "Bathroom sanitized & towels replaced", "done": False},
                {"id": "c3", "label": "Minibar restocking", "done": False},
                {"id": "c4", "label": "Balcony glass cleaning", "done": False},
            ],
            notes="Guest requested early morning housekeeping",
            estimated_minutes=35,
        ),
        HousekeepingTask(
            id="tsk-2",
            tenant_id="tenant-1",
            room_id="rm-203",
            room_number="203",
            room_type="Executive Garden Suite",
            floor=2,
            type="Checkout",
            priority="Urgent",
            status="Cleaning",
            assigned_to="Ramesh Kumar",
            checklist=[
                {"id": "c1", "label": "Bedding renewal with fresh duvet", "done": True},
                {"id": "c2", "label": "Surface dust and disinfection", "done": True},
                {"id": "c3", "label": "Restock complimentary tea/coffee amenities", "done": False},
                {"id": "c4", "label": "Bathroom scrub & inspect plumbing", "done": False},
            ],
            notes="Priority turnover for incoming guest arrival",
            estimated_minutes=45,
        ),
    ]
    for t in tasks:
        db.add(t)
    db.commit()

    # 10. Maintenance Tickets
    tickets = [
        MaintenanceTicket(
            id="mnt-1",
            tenant_id="tenant-1",
            room_id="rm-205",
            room_number="205",
            title="Daikin Inverter AC Cooling Insufficient",
            description="AC unit blower running normally but compressor tripping after 10 mins. Needs technician review.",
            priority="High",
            status="Reported",
            reported_by="Housekeeping Attendant",
            category="HVAC/AC",
        ),
        MaintenanceTicket(
            id="mnt-2",
            tenant_id="tenant-1",
            room_id="rm-102",
            room_number="102",
            title="Balcony Sliding Door Latch Loose",
            description="Latch alignment slightly off when locking from inside.",
            priority="Low",
            status="Resolved",
            reported_by="Front Desk",
            category="Furniture",
        ),
    ]
    for m in tickets:
        db.add(m)
    db.commit()

    # 11. OTA Channels
    channels = [
        ChannelConfig(
            id="ch-1",
            tenant_id="tenant-1",
            channel_name="Booking.com",
            code="BDC",
            status="Connected",
            last_sync="1 min ago",
            mapped_room_types=3,
            total_room_types=3,
            mapped_rate_plans=2,
            total_rate_plans=2,
            commission_rate=15.0,
            revenue_this_month=425000.0,
            bookings_this_month=48,
            active_listings=3,
        ),
        ChannelConfig(
            id="ch-2",
            tenant_id="tenant-1",
            channel_name="MakeMyTrip",
            code="MMT",
            status="Connected",
            last_sync="3 mins ago",
            mapped_room_types=3,
            total_room_types=3,
            mapped_rate_plans=2,
            total_rate_plans=2,
            commission_rate=18.0,
            revenue_this_month=312000.0,
            bookings_this_month=36,
            active_listings=3,
        ),
        ChannelConfig(
            id="ch-3",
            tenant_id="tenant-1",
            channel_name="Agoda",
            code="AGD",
            status="Connected",
            last_sync="5 mins ago",
            mapped_room_types=3,
            total_room_types=3,
            mapped_rate_plans=2,
            total_rate_plans=2,
            commission_rate=16.0,
            revenue_this_month=185000.0,
            bookings_this_month=19,
            active_listings=3,
        ),
        ChannelConfig(
            id="ch-4",
            tenant_id="tenant-1",
            channel_name="Airbnb",
            code="ABNB",
            status="Connected",
            last_sync="8 mins ago",
            mapped_room_types=1,
            total_room_types=3,
            mapped_rate_plans=1,
            total_rate_plans=2,
            commission_rate=14.0,
            revenue_this_month=110000.0,
            bookings_this_month=9,
            active_listings=1,
        ),
    ]
    for ch in channels:
        db.add(ch)
    db.commit()

    # 12. Rate Plans
    rate_plans = [
        RatePlan(
            id="rp-1",
            tenant_id="tenant-1",
            code="BAR-EP",
            name="Best Available Rate (Room Only - EP)",
            meal_plan="EP",
            base_price_multiplier=1.0,
            cancellation_policy="Free cancellation up to 24 hours before check-in",
            min_stay=1,
            description="Standard flexible rate with room-only accommodation.",
            rates_by_room_type={"rt-101": 6500.0, "rt-102": 9200.0, "rt-103": 18500.0},
        ),
        RatePlan(
            id="rp-2",
            tenant_id="tenant-1",
            code="BAR-CP",
            name="Bed & Gourmet Breakfast (CP)",
            meal_plan="CP",
            base_price_multiplier=1.15,
            cancellation_policy="Free cancellation up to 48 hours before check-in",
            min_stay=1,
            description="Includes daily buffet breakfast at Azure Bay Cafe.",
            rates_by_room_type={"rt-101": 7475.0, "rt-102": 10580.0, "rt-103": 21275.0},
        ),
        RatePlan(
            id="rp-3",
            tenant_id="tenant-1",
            code="BAR-MAP",
            name="Breakfast & Coastal Dinner Package (MAP)",
            meal_plan="MAP",
            base_price_multiplier=1.35,
            cancellation_policy="Non-refundable special package rate",
            min_stay=2,
            description="Includes buffet breakfast and 3-course chef dinner daily.",
            rates_by_room_type={"rt-101": 8775.0, "rt-102": 12420.0, "rt-103": 24975.0},
        ),
    ]
    for rp in rate_plans:
        db.add(rp)
    db.commit()

    # 13. Staff Members
    staff = [
        StaffMember(
            id="stf-1",
            tenant_id="tenant-1",
            property_id="prop-1",
            name="Vikramaditya Roy",
            email="roy@grandazure.com",
            phone="+91 98201 55432",
            role="Owner",
            status="Active",
        ),
        StaffMember(
            id="stf-2",
            tenant_id="tenant-1",
            property_id="prop-1",
            name="Devendra Joshi",
            email="devendra.joshi@grandazure.com",
            phone="+91 832 991 0021",
            role="Front Desk",
            status="Active",
        ),
        StaffMember(
            id="stf-3",
            tenant_id="tenant-1",
            property_id="prop-1",
            name="Sunita Patil",
            email="sunita.hsk@grandazure.com",
            phone="+91 832 991 0033",
            role="Housekeeping",
            status="Active",
        ),
        StaffMember(
            id="stf-4",
            tenant_id="tenant-1",
            property_id="prop-1",
            name="Marcus Fernandes",
            email="marcus.rev@grandazure.com",
            phone="+91 832 991 0044",
            role="Revenue Manager",
            status="Active",
        ),
    ]
    for s in staff:
        db.add(s)
    db.commit()

    # 14. Audit Logs
    logs = [
        AuditLog(
            id="log-1",
            tenant_id="tenant-1",
            timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            staff_name="Devendra Joshi",
            action="Check-In",
            entity_id="res-101",
            details="Guest Aarav Mehta checked in to Room 101. Keycard issued.",
            ip_address="192.168.1.15",
        ),
        AuditLog(
            id="log-2",
            tenant_id="tenant-1",
            timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            staff_name="Devendra Joshi",
            action="Payment Recorded",
            entity_id="fol-101",
            details="Recorded advance settlement of INR 13,000 via UPI.",
            ip_address="192.168.1.15",
        ),
    ]
    for l in logs:
        db.add(l)
    db.commit()

    seed_identity(db)

    db.close()
    print("Database seeding completed successfully! Created 3 tenants with rich hotel operations and identity RBAC data.")


if __name__ == "__main__":
    seed_database()
