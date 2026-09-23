import os
import base64
import requests
from typing import Dict, Any, List, Optional

# Defaults for Aiosell Sandbox environment
DEFAULT_AIOSELL_BASE_URL = os.getenv("AIOSELL_BASE_URL", "https://live.aiosell.com/api/v2/cm")
DEFAULT_AIOSELL_USERNAME = os.getenv("AIOSELL_USERNAME", "aiosell")
DEFAULT_AIOSELL_PASSWORD = os.getenv("AIOSELL_PASSWORD", "AIOsell@123")
DEFAULT_AIOSELL_HOTEL_CODE = os.getenv("AIOSELL_HOTEL_CODE", "sandbox-pms")
DEFAULT_AIOSELL_PARTNER_ID = os.getenv("AIOSELL_PARTNER_ID", "sample-pms")


class AiosellClient:
    """
    Client for interacting with the Aiosell Channel Manager REST API.
    Follows strictly the specification defined in aiosell-api-context.md.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        partner_id: Optional[str] = None,
        hotel_code: Optional[str] = None,
    ):
        self.base_url = (base_url or DEFAULT_AIOSELL_BASE_URL).rstrip("/")
        self.username = username or DEFAULT_AIOSELL_USERNAME
        self.password = password or DEFAULT_AIOSELL_PASSWORD
        self.partner_id = partner_id or DEFAULT_AIOSELL_PARTNER_ID
        self.hotel_code = hotel_code or DEFAULT_AIOSELL_HOTEL_CODE

    def _get_headers(self) -> Dict[str, str]:
        auth_str = f"{self.username}:{self.password}"
        encoded_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
        return {
            "Content-Type": "application/json",
            "Authorization": f"Basic {encoded_auth}",
        }

    def get_property_details(
        self,
        hotel_code: Optional[str] = None,
        partner_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        GET /property_details/{hotelCode}?partnerId={partnerId}
        Fetches the full property configuration: hotel id, room codes, rate plan codes.
        """
        h_code = hotel_code or self.hotel_code
        p_id = partner_id or self.partner_id
        url = f"{self.base_url}/property_details/{h_code}?partnerId={p_id}"
        headers = self._get_headers()

        try:
            response = requests.get(url, headers=headers, timeout=20)
            if response.status_code >= 400:
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": response.text,
                }
            return {"success": True, "data": response.json()}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def push_inventory(
        self,
        updates: List[Dict[str, Any]],
        hotel_code: Optional[str] = None,
        partner_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        POST /update/{pms}
        Body: { hotelCode, updates: [{ startDate, endDate, rooms: [{ roomCode, available }] }] }
        """
        h_code = hotel_code or self.hotel_code
        p_id = partner_id or self.partner_id
        url = f"{self.base_url}/update/{p_id}"
        payload = {
            "hotelCode": h_code,
            "updates": updates,
        }
        headers = self._get_headers()

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=25)
            try:
                res_data = response.json()
            except Exception:
                res_data = {"raw": response.text}

            return {
                "success": response.status_code < 400 and (res_data.get("success") is not False),
                "status_code": response.status_code,
                "response": res_data,
                "message": res_data.get("message") if isinstance(res_data, dict) else str(res_data),
            }
        except Exception as e:
            return {"success": False, "error": str(e), "message": str(e)}

    def push_rates(
        self,
        updates: List[Dict[str, Any]],
        hotel_code: Optional[str] = None,
        partner_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        POST /update-rates/{pms}
        Body: { hotelCode, updates: [{ startDate, endDate, rates: [{ roomCode, rateplanCode, rate }] }] }
        """
        h_code = hotel_code or self.hotel_code
        p_id = partner_id or self.partner_id
        url = f"{self.base_url}/update-rates/{p_id}"
        payload = {
            "hotelCode": h_code,
            "updates": updates,
        }
        headers = self._get_headers()

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=25)
            try:
                res_data = response.json()
            except Exception:
                res_data = {"raw": response.text}

            return {
                "success": response.status_code < 400 and (res_data.get("success") is not False),
                "status_code": response.status_code,
                "response": res_data,
                "message": res_data.get("message") if isinstance(res_data, dict) else str(res_data),
            }
        except Exception as e:
            return {"success": False, "error": str(e), "message": str(e)}

    def push_inventory_restrictions(
        self,
        to_channels: List[str],
        updates: List[Dict[str, Any]],
        hotel_code: Optional[str] = None,
        partner_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        POST /update/{pms}
        Body: { hotelCode, toChannels: [...], updates: [{ startDate, endDate, rooms: [{ roomCode, restrictions: {...} }] }] }
        """
        h_code = hotel_code or self.hotel_code
        p_id = partner_id or self.partner_id
        url = f"{self.base_url}/update/{p_id}"
        payload = {
            "hotelCode": h_code,
            "toChannels": to_channels,
            "updates": updates,
        }
        headers = self._get_headers()

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=25)
            try:
                res_data = response.json()
            except Exception:
                res_data = {"raw": response.text}

            return {
                "success": response.status_code < 400 and (res_data.get("success") is not False),
                "status_code": response.status_code,
                "response": res_data,
                "message": res_data.get("message") if isinstance(res_data, dict) else str(res_data),
            }
        except Exception as e:
            return {"success": False, "error": str(e), "message": str(e)}

    def push_rate_restrictions(
        self,
        to_channels: List[str],
        updates: List[Dict[str, Any]],
        hotel_code: Optional[str] = None,
        partner_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        POST /update-rates/{pms}
        Body: { hotelCode, toChannels: [...], updates: [{ startDate, endDate, rates: [{ roomCode, rateplanCode, restrictions: {...} }] }] }
        """
        h_code = hotel_code or self.hotel_code
        p_id = partner_id or self.partner_id
        url = f"{self.base_url}/update-rates/{p_id}"
        payload = {
            "hotelCode": h_code,
            "toChannels": to_channels,
            "updates": updates,
        }
        headers = self._get_headers()

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=25)
            try:
                res_data = response.json()
            except Exception:
                res_data = {"raw": response.text}

            return {
                "success": response.status_code < 400 and (res_data.get("success") is not False),
                "status_code": response.status_code,
                "response": res_data,
                "message": res_data.get("message") if isinstance(res_data, dict) else str(res_data),
            }
        except Exception as e:
            return {"success": False, "error": str(e), "message": str(e)}

    def set_channel_multiplier(
        self,
        multiplier: float,
        channels: List[str],
        hotel_code: Optional[str] = None,
        partner_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        POST /channel_multiplier/{pms}
        Body: { hotelCode, multiplier, channels: ["gommt", "airbnb"] }
        """
        h_code = hotel_code or self.hotel_code
        p_id = partner_id or self.partner_id
        url = f"{self.base_url}/channel_multiplier/{p_id}"
        payload = {
            "hotelCode": h_code,
            "multiplier": multiplier,
            "channels": channels,
        }
        headers = self._get_headers()

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=25)
            try:
                res_data = response.json()
            except Exception:
                res_data = {"raw": response.text}

            return {
                "success": response.status_code < 400 and (res_data.get("status") is not False),
                "status_code": response.status_code,
                "response": res_data,
                "message": res_data.get("message") if isinstance(res_data, dict) else str(res_data),
            }
        except Exception as e:
            return {"success": False, "error": str(e), "message": str(e)}

    def mark_no_show(
        self,
        booking_id: str,
        channel: str,  # "booking.com" or "gommt"
        hotel_code: Optional[str] = None,
        partner_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        POST /marknoshow/{pms}
        Body: { hotelCode, bookingId, channel }
        """
        h_code = hotel_code or self.hotel_code
        p_id = partner_id or self.partner_id
        url = f"{self.base_url}/marknoshow/{p_id}"
        payload = {
            "hotelCode": h_code,
            "bookingId": booking_id,
            "channel": channel,
        }
        headers = self._get_headers()

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=25)
            try:
                res_data = response.json()
            except Exception:
                res_data = {"raw": response.text}

            return {
                "success": response.status_code < 400 and (res_data.get("success") is not False),
                "status_code": response.status_code,
                "response": res_data,
                "message": res_data.get("message") if isinstance(res_data, dict) else str(res_data),
            }
        except Exception as e:
            return {"success": False, "error": str(e), "message": str(e)}

    def fetch_data(
        self,
        data_type: str,  # "inventory", "rates", or "reservation"
        start_date: str,  # YYYY-MM-DD
        end_date: str,  # YYYY-MM-DD
        hotel_code: Optional[str] = None,
        partner_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        POST /data/{pms}
        Body: { type: "inventory"|"rates"|"reservation", hotelCode, startDate, endDate }
        """
        h_code = hotel_code or self.hotel_code
        p_id = partner_id or self.partner_id
        url = f"{self.base_url}/data/{p_id}"
        payload = {
            "type": data_type,
            "hotelCode": h_code,
            "startDate": start_date,
            "endDate": end_date,
        }
        headers = self._get_headers()

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            try:
                res_data = response.json()
            except Exception:
                res_data = {"raw": response.text}

            return {
                "success": response.status_code < 400,
                "status_code": response.status_code,
                "data": res_data,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
