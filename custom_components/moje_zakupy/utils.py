"""Wspomagacze współdzielone przez platformy encji."""
from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.util import slugify

from .const import DOMAIN


def shop_device_info(entry: ConfigEntry, shop: str) -> DeviceInfo:
    """Definicja urządzenia dla danego sklepu."""
    return DeviceInfo(
        identifiers={(DOMAIN, f"shop-{entry.entry_id}-{slugify(shop)}")},
        name=shop.strip() or shop,
    )


def product_display_name(data: dict, shop: str, category: str, product: str) -> str:
    """Nazwa wyświetlana produktu; przy duplikatach w sklepie dopisuje kategorię."""
    name = product.strip()
    if name:
        target = name.lower()
        duplicates = [
            cat
            for cat, prods in data.get(shop, {}).items()
            if cat != category
            for prod in prods
            if prod.strip().lower() == target
        ]
        if duplicates:
            name += f" ({category.strip()})"
    return name or product
