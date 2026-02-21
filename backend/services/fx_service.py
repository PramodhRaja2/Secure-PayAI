import requests
import time
import threading
from datetime import datetime

# ─── Rate Cache with 6-hour TTL ───
_rate_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL_SECONDS = 6 * 60 * 60  # 6 hours

BASE_URL = "https://open.er-api.com/v6/latest/"

def get_live_fx_rates(base_currency="USD"):
    """Fetch live FX rates with 6-hour cache. Always internet-connected."""
    now = time.time()

    with _cache_lock:
        cached = _rate_cache.get(base_currency)
        if cached and (now - cached["fetched_at"]) < CACHE_TTL_SECONDS:
            return cached["data"]

    # Fetch fresh from internet
    try:
        response = requests.get(f"{BASE_URL}{base_currency}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("result") == "success":
                result = {
                    "rates": data.get("rates"),
                    "time_last_update_utc": data.get("time_last_update_utc"),
                    "time_next_update_utc": data.get("time_next_update_utc"),
                    "provider": "ExchangeRate-API (Live)",
                    "cached": False,
                    "fetched_at": datetime.utcnow().isoformat() + "Z",
                }
                with _cache_lock:
                    _rate_cache[base_currency] = {"data": result, "fetched_at": now}
                return result
        return None
    except Exception as e:
        print(f"[FX Service] Error fetching rates: {e}")
        # Return stale cache if available
        with _cache_lock:
            if cached:
                cached["data"]["cached"] = True
                return cached["data"]
        return None


def calculate_spread(mid_rate, provider_rate):
    """Calculate the spread percentage between mid-market and provider rates."""
    if mid_rate == 0:
        return 0
    return abs((mid_rate - provider_rate) / mid_rate) * 100


def get_cache_status():
    """Return cache health info."""
    with _cache_lock:
        entries = []
        now = time.time()
        for currency, cached in _rate_cache.items():
            age_seconds = now - cached["fetched_at"]
            entries.append({
                "currency": currency,
                "age_minutes": round(age_seconds / 60, 1),
                "ttl_remaining_minutes": round((CACHE_TTL_SECONDS - age_seconds) / 60, 1),
                "stale": age_seconds >= CACHE_TTL_SECONDS,
            })
        return entries
