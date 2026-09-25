"""Encje select — każdy produkt jako „Do kupienia / Kupione”."""
from __future__ import annotations

import logging

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import slugify

from .const import DOMAIN, OPT_BOUGHT, OPT_TO_BUY
from .coordinator import ZakupyCoordinator
from .utils import product_display_name, shop_device_info

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Utwórz encje select dla wszystkich produktów."""
    coordinator: ZakupyCoordinator = hass.data[DOMAIN][entry.entry_id]
    data = coordinator.data or {}
    entities: list[ProductSelectEntity] = []
    for shop, cats in data.items():
        for category, prods in cats.items():
            for product in prods:
                entities.append(
                    ProductSelectEntity(coordinator, entry, shop, category, product)
                )
    async_add_entities(entities)


class ProductSelectEntity(CoordinatorEntity[ZakupyCoordinator], SelectEntity):
    """Produkt z listy — wybór opcji przełącza stan (zapis do HA)."""

    _attr_has_entity_name = True
    _attr_icon = "mdi:cart-check-outline"

    def __init__(
        self,
        coordinator: ZakupyCoordinator,
        entry: ConfigEntry,
        shop: str,
        category: str,
        product: str,
    ) -> None:
        super().__init__(coordinator)
        self._coordinator = coordinator
        self._entry = entry
        self._shop = shop
        self._category = category
        self._product = product
        self._key = f"{shop}|{category}|{product}"
        self._attr_entity_id = (
            coordinator.entity_ids.get(self._key)
            or f"select.{slugify(f'{shop} {category} {product}')}_{coordinator.id_tag}"
        )
        self._attr_unique_id = f"{entry.entry_id}:sel:{self._key}"
        self._attr_name = product_display_name(
            coordinator.data or {}, shop, category, product
        )

    @property
    def device_info(self) -> DeviceInfo:
        """Urządzenie = sklep."""
        return shop_device_info(self._entry, self._shop)

    def _bought(self) -> bool | None:
        data = self._coordinator.data
        if not data:
            return None
        return data.get(self._shop, {}).get(self._category, {}).get(self._product)

    @property
    def available(self) -> bool:
        """Dostępna tylko, gdy produkt istnieje w danych."""
        return self._coordinator.last_update_success and self._bought() is not None

    @property
    def options(self) -> list[str]:
        """Opcje select."""
        return [OPT_TO_BUY, OPT_BOUGHT]

    @property
    def state(self) -> str:
        """Stan: Do kupienia / Kupione."""
        return OPT_BOUGHT if self._bought() else OPT_TO_BUY

    @property
    def extra_state_attributes(self) -> dict:
        """Atrybuty wykorzystywane przez panel/kartę."""
        bought = bool(self._bought())
        shop_index, cat_index, prod_index = self._coordinator.indices.get(
            self._key, (-1, -1, -1)
        )
        return {
            "mz": "1",
            "mz_entry": self._entry.entry_id,
            "shop": self._shop,
            "category": self._category,
            "product": self._product,
            "bought": bought,
            "shop_index": shop_index,
            "cat_index": cat_index,
            "prod_index": prod_index,
        }

    async def async_select_option(self, option: str) -> None:
        """Przełącz produkt po wyborze opcji."""
        bought = self._bought()
        current = OPT_BOUGHT if bought else OPT_TO_BUY
        if option == current:
            return
        store = self._coordinator.store
        await self._coordinator.apply(
            store.op_toggle_product(self._shop, self._category, self._product)
        )
