import re
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import get_db
from backend.models import (
    Tenant,
    Property,
    RoomType,
    Room,
    Guest,
    Reservation,
    Folio,
    FolioItem,
    ChannelConfig,
    OtaIngestionLog,
    AuditLog,
)
from backend.dependencies import get_auth_context, AuthContext

router = APIRouter(prefix="/api/ota", tags=["OTA Direct Ingestion"])


class EmailSimulationRequest(BaseModel):
    channel: str = "Booking.com"  # Booking.com, MakeMyTrip, Agoda, Airbnb, Expedia
    property_id: Optional[str] = None
    guest_name: Optional[str] = "Aditya Singhania"
    guest_phone: Optional[str] = "+91 98201 44521"
    guest_email: Optional[str] = "aditya.singhania@gmail.com"
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    nights: Optional[int] = 2
    room_type_name: Optional[str] = "Deluxe Ocean Suite"
    total_amount: Optional[float] = 18500.0
    commission_rate: Optional[float] = 15.0
    payment_mode: Optional[str] = "Virtual Card (VCC)"


class CsvReconcileRequest(BaseModel):
    property_id: Optional[str] = None
    csv_content: str
    channel: Optional[str] = "Auto-detect"


def parse_jsonld_reservation(html_content: str) -> Optional[Dict[str, Any]]:
    """Extracts schema.org/LodgingReservation from HTML application/ld+json script tags."""
    matches = re.findall(
        r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html_content,
        re.DOTALL | re.IGNORECASE,
    )
    for match in matches:
        try:
            data = json.loads(match.strip())
            items = data if isinstance(data, list) else data.get("@graph", [data])
            for item in items:
                if item.get("@type") == "LodgingReservation":
                    return {
                        "reservation_id": item.get("reservationNumber") or item.get("bookingId"),
                        "status": item.get("reservationStatus", "Confirmed"),
                        "guest_name": (
                            item.get("underName", {}).get("name")
                            if isinstance(item.get("underName"), dict)
                            else item.get("underName", "")
                        ),
                        "check_in": (item.get("checkinDate") or item.get("checkinTime", ""))[:10],
                        "check_out": (item.get("checkoutDate") or item.get("checkoutTime", ""))[:10],
                        "total_amount": float(item.get("totalPrice") or 0.0),
                        "currency": item.get("priceCurrency", "INR"),
                        "room_type": item.get("reservedRoom", {}).get("name") if isinstance(item.get("reservedRoom"), dict) else "",
                    }
        except Exception:
            continue
    return None


def parse_regex_reservation(text_content: str, channel: str) -> Dict[str, Any]:
    """Fallback parser using regex patterns tuned for Indian and global OTAs."""
    ref_match = re.search(
        r'(?:Booking (?:ID|Reference|Number)|Reservation (?:ID|Number)|Confirm(?:ation)? Code|PNR)[\s:]*([A-Za-z0-9\-_]{6,25})',
        text_content,
        re.IGNORECASE,
    )
    res_id = ref_match.group(1) if ref_match else f"{channel[:3].upper()}-{uuid.uuid4().hex[:8].upper()}"

    name_match = re.search(
        r'(?:Guest Name|Booked by|Lead Guest|Primary Guest)[\s:]*([A-Za-z\s\.\-]{3,40})(?:\r|\n|,|<)',
        text_content,
        re.IGNORECASE,
    )
    guest_name = name_match.group(1).strip() if name_match else "OTA Verified Guest"

    today = datetime.utcnow().date()
    dates = re.findall(r'\b(202[0-9]-[0-1][0-9]-[0-3][0-9])\b', text_content)
    if len(dates) >= 2:
        check_in, check_out = dates[0], dates[1]
    else:
        check_in = (today + timedelta(days=1)).isoformat()
        check_out = (today + timedelta(days=3)).isoformat()

    amt_match = re.search(
        r'(?:Total (?:Amount|Payable|Price|Rate|Payout)|Gross Rate|Tariff)[\s:₹Rs\.\sINR]*([0-9,]+(?:\.[0-9]{2})?)',
        text_content,
        re.IGNORECASE,
    )
    if amt_match:
        try:
            total_amt = float(amt_match.group(1).replace(",", ""))
        except ValueError:
            total_amt = 12500.0
    else:
        total_amt = 12500.0

    return {
        "reservation_id": res_id,
        "guest_name": guest_name,
        "check_in": check_in,
        "check_out": check_out,
        "total_amount": total_amt,
        "currency": "INR",
        "room_type": "Standard Deluxe",
        "status": "Confirmed",
    }


def ingest_parsed_booking(
    db: Session,
    tenant_id: str,
    property_id: str,
    channel_name: str,
    booking_data: Dict[str, Any],
    method: str = "Email Ingestion",
    raw_snippet: str = "",
) -> Dict[str, Any]:
    prop = db.query(Property).filter(Property.id == property_id, Property.tenant_id == tenant_id).first()
    if not prop:
        prop = db.query(Property).filter(Property.tenant_id == tenant_id).first()
        if not prop:
            raise HTTPException(status_code=404, detail="No property found for this tenant")

    ota_res_id = booking_data["reservation_id"]

    existing_res = (
        db.query(Reservation)
        .filter(
            Reservation.tenant_id == tenant_id,
            Reservation.ota_reservation_id == ota_res_id,
        )
        .first()
    )

    if existing_res:
        if "cancel" in booking_data.get("status", "").lower():
            existing_res.status = "Cancelled"
            if existing_res.room_id:
                room = db.query(Room).filter(Room.id == existing_res.room_id).first()
                if room:
                    room.occupancy_status = "Vacant"
                    room.current_reservation_id = None
            db.commit()

            log = OtaIngestionLog(
                id=f"log-{uuid.uuid4().hex[:8]}",
                tenant_id=tenant_id,
                property_id=prop.id,
                channel=channel_name,
                ota_reservation_id=ota_res_id,
                guest_name=existing_res.guest.first_name + " " + existing_res.guest.last_name if existing_res.guest else "",
                check_in_date=existing_res.check_in_date,
                check_out_date=existing_res.check_out_date,
                total_amount=existing_res.total_amount,
                status="Cancelled",
                method=method,
                raw_payload_snippet=raw_snippet[:500] if raw_snippet else None,
            )
            db.add(log)
            db.commit()
            return {
                "action": "cancelled",
                "reservation_id": existing_res.id,
                "ref_code": existing_res.ref_code,
                "message": f"Reservation {ota_res_id} was successfully marked Cancelled.",
            }

        return {
            "action": "duplicate",
            "reservation_id": existing_res.id,
            "ref_code": existing_res.ref_code,
            "message": f"Reservation {ota_res_id} already exists in HMS.",
        }

    guest_name_parts = booking_data.get("guest_name", "OTA Guest").split(" ")
    first_name = guest_name_parts[0]
    last_name = " ".join(guest_name_parts[1:]) if len(guest_name_parts) > 1 else "Guest"
    guest_email = booking_data.get("guest_email") or f"{ota_res_id.lower()}@guest.{channel_name.lower().replace('.', '')}.com"
    guest_phone = booking_data.get("guest_phone") or "+91 98000 00000"

    guest = (
        db.query(Guest)
        .filter(Guest.tenant_id == tenant_id, Guest.email == guest_email)
        .first()
    )
    if not guest:
        guest = Guest(
            id=f"gst-{uuid.uuid4().hex[:8]}",
            tenant_id=tenant_id,
            first_name=first_name,
            last_name=last_name,
            email=guest_email,
            phone=guest_phone,
            nationality="Indian",
            vip_status=False,
            lifetime_stays=1,
            lifetime_revenue=float(booking_data.get("total_amount", 0)),
            notes=f"Auto-provisioned via {channel_name} Direct Ingestion (ID: {ota_res_id})",
        )
        db.add(guest)
        db.flush()

    room_types = db.query(RoomType).filter(RoomType.property_id == prop.id).all()
    room_type = room_types[0] if room_types else None
    if booking_data.get("room_type"):
        for rt in room_types:
            if rt.name.lower() in booking_data["room_type"].lower() or rt.code.lower() in booking_data["room_type"].lower():
                room_type = rt
                break

    if not room_type:
        raise HTTPException(status_code=400, detail="No room type configured for property.")

    vacant_room = (
        db.query(Room)
        .filter(
            Room.property_id == prop.id,
            Room.room_type_id == room_type.id,
            Room.occupancy_status == "Vacant",
        )
        .first()
    )

    check_in = booking_data.get("check_in") or datetime.utcnow().date().isoformat()
    check_out = booking_data.get("check_out") or (datetime.utcnow().date() + timedelta(days=1)).isoformat()
    try:
        d1 = datetime.strptime(check_in, "%Y-%m-%d")
        d2 = datetime.strptime(check_out, "%Y-%m-%d")
        nights = max(1, (d2 - d1).days)
    except Exception:
        nights = 1

    total_amount = float(booking_data.get("total_amount") or 10000.0)
    nightly_rate = round(total_amount / nights, 2)

    comm_rate = float(booking_data.get("commission_rate") or 15.0)
    comm_amount = round((total_amount * comm_rate) / 100.0, 2)
    payment_mode = booking_data.get("payment_mode", "Virtual Card (VCC)")

    res_id = f"res-{uuid.uuid4().hex[:8]}"
    ref_code = f"OTA-{channel_name[:3].upper()}-{uuid.uuid4().hex[:5].upper()}"

    res = Reservation(
        id=res_id,
        tenant_id=tenant_id,
        property_id=prop.id,
        ref_code=ref_code,
        guest_id=guest.id,
        room_id=vacant_room.id if vacant_room else None,
        room_number=vacant_room.room_number if vacant_room else "Unassigned",
        room_type_id=room_type.id,
        room_type_name=room_type.name,
        check_in_date=check_in,
        check_out_date=check_out,
        nights=nights,
        adults=2,
        children=0,
        status="Confirmed",
        booking_source=channel_name,
        nightly_rate=nightly_rate,
        total_amount=total_amount,
        paid_amount=total_amount if "VCC" in payment_mode or "Prepaid" in payment_mode else 0.0,
        balance_amount=0.0 if "VCC" in payment_mode or "Prepaid" in payment_mode else total_amount,
        payment_status="Paid" if "VCC" in payment_mode or "Prepaid" in payment_mode else "Unpaid",
        ota_reservation_id=ota_res_id,
        ota_commission_rate=comm_rate,
        ota_commission_amount=comm_amount,
        ota_payment_mode=payment_mode,
        ota_raw_payload=raw_snippet[:2000] if raw_snippet else None,
        special_requests=f"Direct OTA Ingestion ({method}). Booking Ref: {ota_res_id}. Payment: {payment_mode}",
        tags=["OTA Direct Ingest", channel_name],
    )
    db.add(res)
    db.flush()

    folio_id = f"fol-{uuid.uuid4().hex[:8]}"
    folio_ref = f"FOL-{ref_code}"
    gst_rate = 0.12 if nightly_rate < 7500 else 0.18
    tax_amount = round(total_amount - (total_amount / (1 + gst_rate)), 2)
    base_charge = round(total_amount - tax_amount, 2)

    folio = Folio(
        id=folio_id,
        tenant_id=tenant_id,
        reservation_id=res.id,
        reservation_ref=ref_code,
        guest_name=f"{guest.first_name} {guest.last_name}",
        room_number=vacant_room.room_number if vacant_room else "Unassigned",
        total_charges=total_amount,
        total_payments=total_amount if "VCC" in payment_mode or "Prepaid" in payment_mode else 0.0,
        total_taxes=tax_amount,
        balance=0.0 if "VCC" in payment_mode or "Prepaid" in payment_mode else total_amount,
        status="Open",
    )
    db.add(folio)
    db.flush()

    item = FolioItem(
        id=f"item-{uuid.uuid4().hex[:8]}",
        tenant_id=tenant_id,
        folio_id=folio.id,
        date=check_in,
        description=f"Accommodation Tariff — {nights} Nights ({room_type.name}) [SAC 996311]",
        category="Room",
        amount=total_amount,
        type="Charge",
        reference=ref_code,
    )
    db.add(item)

    if vacant_room and check_in == datetime.utcnow().date().isoformat():
        vacant_room.occupancy_status = "Reserved"
        vacant_room.current_reservation_id = res.id
        vacant_room.current_guest_name = f"{guest.first_name} {guest.last_name}"

    log = OtaIngestionLog(
        id=f"log-{uuid.uuid4().hex[:8]}",
        tenant_id=tenant_id,
        property_id=prop.id,
        channel=channel_name,
        ota_reservation_id=ota_res_id,
        guest_name=f"{guest.first_name} {guest.last_name}",
        check_in_date=check_in,
        check_out_date=check_out,
        room_type_name=room_type.name,
        total_amount=total_amount,
        commission_amount=comm_amount,
        status="Ingested",
        method=method,
        raw_payload_snippet=raw_snippet[:500] if raw_snippet else None,
    )
    db.add(log)

    ch_config = (
        db.query(ChannelConfig)
        .filter(ChannelConfig.tenant_id == tenant_id, ChannelConfig.channel_name == channel_name)
        .first()
    )
    if ch_config:
        ch_config.last_sync = "Just now"
        ch_config.last_email_received_at = datetime.utcnow().isoformat()
        ch_config.auto_ingested_count = (ch_config.auto_ingested_count or 0) + 1
        ch_config.revenue_this_month = (ch_config.revenue_this_month or 0.0) + total_amount
        ch_config.bookings_this_month = (ch_config.bookings_this_month or 0) + 1

    db.add(
        AuditLog(
            id=f"aud-{uuid.uuid4().hex[:8]}",
            tenant_id=tenant_id,
            staff_name="OTA Ingestion Engine",
            action="OTA_RESERVATION_INGESTED",
            entity_id=res.id,
            details=f"Directly ingested {channel_name} reservation {ota_res_id} for {guest.first_name} {guest.last_name}. Folio {folio_ref} generated.",
        )
    )

    db.commit()

    return {
        "action": "created",
        "reservation_id": res.id,
        "ref_code": ref_code,
        "ota_reservation_id": ota_res_id,
        "guest_name": f"{guest.first_name} {guest.last_name}",
        "property_name": prop.name,
        "room_number": vacant_room.room_number if vacant_room else "Unassigned",
        "room_type": room_type.name,
        "check_in": check_in,
        "check_out": check_out,
        "nights": nights,
        "total_amount": total_amount,
        "commission_amount": comm_amount,
        "net_payout": total_amount - comm_amount,
        "folio_id": folio.id,
        "message": f"Successfully ingested {channel_name} booking {ota_res_id} into HMS.",
    }


# ==============================================================================
# ENDPOINTS
# ==============================================================================

@router.post("/webhook/email-inbound")
async def handle_inbound_email(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        form = await request.form()
        body = dict(form)

    recipient = str(body.get("to") or body.get("recipient") or "")
    sender = str(body.get("from") or body.get("sender") or "")
    subject = str(body.get("subject") or "")
    html_content = str(body.get("html") or "")
    text_content = str(body.get("text") or body.get("plain") or html_content)

    prop_tag_match = re.search(r'ota\+([a-zA-Z0-9\-_]+)@', recipient)
    property_id = prop_tag_match.group(1) if prop_tag_match else None

    prop = None
    if property_id:
        prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        prop = db.query(Property).first()
    if not prop:
        raise HTTPException(status_code=400, detail="Unable to resolve target hotel property.")

    full_text = f"{sender} {subject} {text_content}".lower()
    if "booking.com" in full_text:
        channel_name = "Booking.com"
    elif "makemytrip" in full_text or "goibibo" in full_text:
        channel_name = "MakeMyTrip"
    elif "agoda" in full_text:
        channel_name = "Agoda"
    elif "airbnb" in full_text:
        channel_name = "Airbnb"
    elif "expedia" in full_text:
        channel_name = "Expedia"
    else:
        channel_name = "OTA Channel"

    booking_data = parse_jsonld_reservation(html_content)
    if not booking_data:
        booking_data = parse_regex_reservation(text_content or subject, channel_name)

    result = ingest_parsed_booking(
        db=db,
        tenant_id=prop.tenant_id,
        property_id=prop.id,
        channel_name=channel_name,
        booking_data=booking_data,
        method="Email Ingestion",
        raw_snippet=f"Subject: {subject}\nSender: {sender}\nSnippet: {text_content[:300]}",
    )

    return result


@router.post("/simulate-email")
def simulate_ota_email(
    payload: EmailSimulationRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    tenant_id = auth.tenant_id
    property_id = (
        payload.property_id
        or getattr(auth, "property_id", None)
        or (auth.allowed_property_ids[0] if auth.allowed_property_ids else None)
    )

    prop = (
        db.query(Property).filter(Property.id == property_id, Property.tenant_id == tenant_id).first()
        if property_id
        else db.query(Property).filter(Property.tenant_id == tenant_id).first()
    )
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found for this tenant.")

    today = datetime.utcnow().date()
    check_in = payload.check_in_date or (today + timedelta(days=1)).isoformat()
    check_out = payload.check_out_date or (today + timedelta(days=1 + (payload.nights or 2))).isoformat()
    ota_id = f"{payload.channel[:3].upper()}-{uuid.uuid4().hex[:8].upper()}"

    booking_data = {
        "reservation_id": ota_id,
        "guest_name": payload.guest_name,
        "guest_email": payload.guest_email,
        "guest_phone": payload.guest_phone,
        "check_in": check_in,
        "check_out": check_out,
        "room_type": payload.room_type_name,
        "total_amount": payload.total_amount,
        "commission_rate": payload.commission_rate,
        "payment_mode": payload.payment_mode,
        "status": "Confirmed",
    }

    raw_simulation_email = f"""
From: customer.service@{payload.channel.lower().replace(' ', '')}.com
To: ota+{prop.id}@inbound.signinn.app
Subject: New Reservation Confirmed - Booking ID: {ota_id} - {payload.guest_name}
Date: {datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')}

*** NEW RESERVATION NOTIFICATION - {payload.channel.upper()} ***
Booking ID: {ota_id}
Guest Name: {payload.guest_name}
Contact: {payload.guest_phone} | {payload.guest_email}
Property: {prop.name}
Check-in Date: {check_in}
Check-out Date: {check_out} ({payload.nights} Nights)
Category: {payload.room_type_name}
Rate Plan: Standard Flexible (SAC 996311)
Total Gross Tariff: INR {payload.total_amount:,.2f}
Channel Commission ({payload.commission_rate}%): INR {(payload.total_amount * payload.commission_rate / 100):,.2f}
Payment Settlement: {payload.payment_mode}
"""

    return ingest_parsed_booking(
        db=db,
        tenant_id=tenant_id,
        property_id=prop.id,
        channel_name=payload.channel,
        booking_data=booking_data,
        method="Email Simulator",
        raw_snippet=raw_simulation_email.strip(),
    )


@router.post("/reconcile-csv")
def reconcile_extranet_csv(
    payload: CsvReconcileRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    tenant_id = auth.tenant_id
    property_id = (
        payload.property_id
        or getattr(auth, "property_id", None)
        or (auth.allowed_property_ids[0] if auth.allowed_property_ids else None)
    )
    lines = [l.strip() for l in payload.csv_content.strip().splitlines() if l.strip()]

    if len(lines) < 2:
        raise HTTPException(status_code=400, detail="CSV must contain a header row and at least one data row.")

    header = [h.strip().strip('"').lower() for h in lines[0].split(",")]
    
    def find_idx(keywords: List[str]):
        for i, col in enumerate(header):
            for kw in keywords:
                if kw in col:
                    return i
        return None

    id_idx = find_idx(["booking number", "booking id", "reference", "pnr", "res id", "id"])
    name_idx = find_idx(["guest name", "booker", "name", "guest"])
    in_idx = find_idx(["check-in", "arrival", "start", "checkin"])
    out_idx = find_idx(["check-out", "departure", "end", "checkout"])
    amt_idx = find_idx(["total", "gross", "amount", "price", "payout"])
    comm_idx = find_idx(["commission", "fee", "ota cut"])
    status_idx = find_idx(["status"])

    records = []
    created_count = 0
    matched_count = 0
    total_rev = 0.0
    total_comm = 0.0

    prop = db.query(Property).filter(Property.tenant_id == tenant_id).first()

    for line in lines[1:]:
        cols = [c.strip().strip('"') for c in line.split(",")]
        if len(cols) < 3:
            continue

        raw_id = cols[id_idx] if id_idx is not None and id_idx < len(cols) else f"CSV-{uuid.uuid4().hex[:6]}"
        guest_name = cols[name_idx] if name_idx is not None and name_idx < len(cols) else "OTA Guest"
        check_in = cols[in_idx] if in_idx is not None and in_idx < len(cols) else datetime.utcnow().date().isoformat()
        check_out = cols[out_idx] if out_idx is not None and out_idx < len(cols) else (datetime.utcnow().date() + timedelta(days=2)).isoformat()
        
        try:
            amt = float(cols[amt_idx].replace(",", "").replace("₹", "").replace("$", "")) if amt_idx is not None and amt_idx < len(cols) else 10000.0
        except Exception:
            amt = 10000.0

        comm_val = 0.0
        if comm_idx is not None and comm_idx < len(cols):
            try:
                comm_val = float(cols[comm_idx].replace(",", "").replace("%", ""))
                if comm_val < 100:
                    comm_val = round((amt * comm_val) / 100, 2)
            except Exception:
                comm_val = round(amt * 0.15, 2)
        else:
            comm_val = round(amt * 0.15, 2)

        total_rev += amt
        total_comm += comm_val

        existing = (
            db.query(Reservation)
            .filter(Reservation.tenant_id == tenant_id, Reservation.ota_reservation_id == raw_id)
            .first()
        )

        if existing:
            matched_count += 1
            records.append({
                "ota_id": raw_id,
                "guest_name": guest_name,
                "check_in": check_in,
                "check_out": check_out,
                "amount": amt,
                "commission": comm_val,
                "status": "Matched (Already in HMS)",
                "action": "verified",
            })
        else:
            try:
                ingest_parsed_booking(
                    db=db,
                    tenant_id=tenant_id,
                    property_id=prop.id if prop else "prop-1",
                    channel_name=payload.channel if payload.channel != "Auto-detect" else "Booking.com",
                    booking_data={
                        "reservation_id": raw_id,
                        "guest_name": guest_name,
                        "check_in": check_in,
                        "check_out": check_out,
                        "total_amount": amt,
                        "commission_rate": 15.0,
                        "payment_mode": "Virtual Card (VCC)",
                    },
                    method="CSV Import",
                )
                created_count += 1
                records.append({
                    "ota_id": raw_id,
                    "guest_name": guest_name,
                    "check_in": check_in,
                    "check_out": check_out,
                    "amount": amt,
                    "commission": comm_val,
                    "status": "Imported & Folio Created",
                    "action": "created",
                })
            except Exception:
                records.append({
                    "ota_id": raw_id,
                    "guest_name": guest_name,
                    "check_in": check_in,
                    "check_out": check_out,
                    "amount": amt,
                    "commission": comm_val,
                    "status": "Failed to Parse Row",
                    "action": "error",
                })

    return {
        "total_rows": len(records),
        "created_count": created_count,
        "matched_count": matched_count,
        "total_revenue": total_rev,
        "total_commission": total_comm,
        "records": records,
        "message": f"Reconciled {len(records)} records: {created_count} imported into folios, {matched_count} verified.",
    }


@router.get("/ingestion-logs")
def get_ingestion_logs(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
    limit: int = Query(25, ge=1, le=100),
):
    logs = (
        db.query(OtaIngestionLog)
        .filter(OtaIngestionLog.tenant_id == auth.tenant_id)
        .order_by(OtaIngestionLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return logs
