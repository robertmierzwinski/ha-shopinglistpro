"""Encje sensor — postęp zakupów per sklep oraz ogółem."""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .coordinator import DataShape, ZakupyCoordinator
from .utils import shop_device_info

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Utwórz sensory postępu."""
    coordinator: ZakupyCoordinator = hass.data[DOMAIN][entry.entry_id]
    data = coordinator.data or {}
    entities: list[SensorEntity] = []
    for shop in data:
        entities.append(ShopRemainingSensor(coordinator, entry, shop))
    entities.append(OverallRemainingSensor(coordinator, entry))
    entities.append(OverallPercentSensor(coordinator, entry))
    async_add_entities(entities)


def _shop_stats(data: DataShape, shop: str) -> tuple[int, int, float]:
    """(do kupienia, kupione, procent) dla sklepu."""
    total = 0
    bought = 0
    for prods in data.get(shop, {}).values():
        for is_bought in prods.values():
            total += 1
            bought += int(bool(is_bought))
    percent = round(bought / total * 100, 1) if total else 0.0
    return total - bought, bought, percent


def _overall_stats(data: DataShape) -> tuple[int, int, int, float]:
    """(do kupienia, kupione, produktów, procent) ogółem."""
    total = 0
    bought = 0
    for cats in data.values():
        for prods in cats.values():
            for is_bought in prods.values():
                total += 1
                bought += int(bool(is_bought))
    percent = round(bought / total * 100, 1) if total else 0.0
    return total - bought, bought, total, percent


class ShopRemainingSensor(CoordinatorEntity[ZakupyCoordinator], SensorEntity):
    """Liczba produktów do kupienia w danym sklepie."""

    _attr_has_entity_name = True
    _attr_name = "Do kupienia"
    _attr_icon = "mdi:cart-check"

    def __init__(
        self,
        coordinator: ZakupyCoordinator,
        entry: ConfigEntry,
        shop: str,
    ) -> None:
        super().__init__(coordinator)
        self._coordinator = coordinator
        self._entry = entry
        self._shop = shop
        slug = coordinator.shop_slugs.get(shop, shop.lower())
        tag = coordinator.id_tag
        self._attr_entity_id = f"sensor.{slug}_{tag}_do_kupienia"
        self._attr_unique_id = f"{entry.entry_id}:sensor:{shop}"
        self._attr_device_info = shop_device_info(entry, shop)

    @property
    def available(self) -> bool:
        """Dostępna, gdy dane są wczytane."""
        return self._coordinator.last_update_success

    @property
    def state(self) -> int | None:
        """Liczba produktów do kupienia."""
        remaining, _, _ = _shop_stats(self._coordinator.data or {}, self._shop)
        return remaining

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Szczegóły postępu (wykorzystuje też panel/karta)."""
        remaining, bought, percent = _shop_stats(self._coordinator.data or {}, self._shop)
        cats = (self._coordinator.data or {}).get(self._shop, {})
        return {
            "mz": "1",
            "mz_entry": self._entry.entry_id,
            "shop": self._shop,
            "shop_index": self._coordinator.shop_indices.get(self._shop),
            "bought": bought,
            "total": bought + remaining,
            "percent": percent,
            "categories": [
                {"name": cat, "count": len(prods)} for cat, prods in cats.items()
            ],
        }


class OverallRemainingSensor(CoordinatorEntity[ZakupyCoordinator], SensorEntity):
    """Łączna liczba produktów do kupienia we wszystkich sklepach."""

    _attr_has_entity_name = True
    _attr_name = "Zakupy — do kupienia"
    _attr_icon = "mdi:cart"

    def __init__(
        self,
        coordinator: ZakupyCoordinator,
        entry: ConfigEntry,
    ) -> None:
        super().__init__(coordinator)
        self._coordinator = coordinator
        self._entry = entry
        tag = coordinator.id_tag
        self._attr_entity_id = f"sensor.zakupy_{tag}_do_kupienia"
        self._attr_unique_id = f"{entry.entry_id}:sensor:all:remaining"

    @property
    def available(self) -> bool:
        """Dostępna, gdy dane są wczytane."""
        return self._coordinator.last_update_success

    @property
    def state(self) -> int | None:
        """Liczba produktów do kupienia."""
        remaining, _, _, _ = _overall_stats(self._coordinator.data or {})
        return remaining

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Szczegóły postępu ogólnego."""
        remaining, bought, total, percent = _overall_stats(self._coordinator.data or {})
        return {
            "mz": "1",
            "mz_entry": self._entry.entry_id,
            "bought": bought,
            "total": total,
            "percent": percent,
            "shops": len(self._coordinator.data or {}),
        }


class OverallPercentSensor(CoordinatorEntity[ZakupyCoordinator], SensorEntity):
    """Postęp zakupów w procentach."""

    _attr_has_entity_name = True
    _attr_name = "Zakupy — postęp"
    _attr_icon = "mdi:chart-donut-variant"
    _attr_native_unit_of_measurement = "%"

    def __init__(
        self,
        coordinator: ZakupyCoordinator,
        entry: ConfigEntry,
    ) -> None:
        super().__init__(coordinator)
        self._coordinator = coordinator
        self._entry = entry
        tag = coordinator.id_tag
        self._attr_entity_id = f"sensor.zakupy_{tag}_postep"
        self._attr_unique_id = f"{entry.entry_id}:sensor:all:percent"

    @property
    def available(self) -> bool:
        """Dostępna, gdy dane są wczytane."""
        return self._coordinator.last_update_success

    @property
    def native_value(self) -> float | None:
        """Postęp w procentach."""
        _, _, _, percent = _overall_stats(self._coordinator.data or {})
        return percent
