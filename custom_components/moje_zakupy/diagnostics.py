"""Diagnostyka integracji ShopingListPro."""
from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ConfigEntry
) -> dict[str, Any]:
    """Zwróć dane diagnostyczne wpisu."""
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)
    data = coordinator.data if coordinator and coordinator.last_update_success else {}

    shops: dict[str, Any] = {}
    total_products = 0
    total_to_buy = 0
    for shop, cats in data.items():
        count = 0
        to_buy = 0
        for prods in cats.values():
            count += len(prods)
            to_buy += sum(1 for bought in prods.values() if not bought)
        shops[shop] = {"products": count, "to_buy": to_buy}
        total_products += count
        total_to_buy += to_buy

    result: dict[str, Any] = {
        "config": dict(entry.data),
        "options": dict(entry.options),
        "summary": {
            "shops": shops,
            "total_products": total_products,
            "total_to_buy": total_to_buy,
        },
    }
    if coordinator is not None:
        result["coordinator"] = {
            "last_update_success": coordinator.last_update_success,
            "last_update_time": (
                coordinator.last_updated.isoformat() if coordinator.last_updated else None
            ),
            "last_exception": str(coordinator.last_exception)
            if coordinator.last_exception
            else None,
        }
    result["data"] = data
    return result
