"""Encje button — akcje zbiorcze per sklep."""
from __future__ import annotations

import logging

from homeassistant.components.button import ButtonEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .coordinator import ZakupyCoordinator
from .utils import shop_device_info

_LOGGER = logging.getLogger(__name__)

ACTIONS = {
    "mark_all": {
        "name": "Oznacz wszystko jako kupione",
        "icon": "mdi:check-all",
    },
    "reset": {
        "name": "Resetuj listę (wszystko do kupienia)",
        "icon": "mdi:restart",
    },
}


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Utwórz przyciski zbiorcze dla każdego sklepu."""
    coordinator: ZakupyCoordinator = hass.data[DOMAIN][entry.entry_id]
    data = coordinator.data or {}
    entities: list[ShopActionButton] = []
    for shop in data:
        for action in ACTIONS:
            entities.append(ShopActionButton(coordinator, entry, shop, action))
    async_add_entities(entities)


class ShopActionButton(CoordinatorEntity[ZakupyCoordinator], ButtonEntity):
    """Przycisk wykonujący akcję zbiorczą dla całego sklepu."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: ZakupyCoordinator,
        entry: ConfigEntry,
        shop: str,
        action: str,
    ) -> None:
        super().__init__(coordinator)
        meta = ACTIONS[action]
        self._coordinator = coordinator
        self._entry = entry
        self._shop = shop
        self._action = action
        slug = coordinator.shop_slugs.get(shop, shop.lower())
        tag = coordinator.id_tag
        self._attr_entity_id = f"button.{slug}_{tag}_{action}"
        self._attr_unique_id = f"{entry.entry_id}:btn:{shop}:{action}"
        self._attr_name = meta["name"]
        self._attr_icon = meta["icon"]

    @property
    def device_info(self) -> DeviceInfo:
        """Urządzenie = sklep."""
        return shop_device_info(self._entry, self._shop)

    @property
    def available(self) -> bool:
        """Dostępna, gdy dane są wczytane."""
        return self._coordinator.last_update_success

    async def async_press(self) -> None:
        """Wykonaj akcję zbiorczą."""
        shop = self._shop
        store = self._coordinator.store
        if self._action == "mark_all":
            await self._coordinator.apply(store.op_mark_all_bought(shop))
        else:
            await self._coordinator.apply(store.op_reset_all(shop))
