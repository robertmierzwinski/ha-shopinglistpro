"""Przechowywanie danych listy zakupów w Home Assistant.

Dane leżą w pliku `.storage/moje_zakupy_<entry_id>` w formacie zgodnym
ze starym `data.json` (sklep -> categories -> products -> bought), więc
jednorazowy import istniejącej listy jest banalnie prosty.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Callable

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


class ZakupyDataError(Exception):
    """Błąd operacji na danych (komunikat trafia do użytkownika)."""


class ZakupyStore:
    """Magazyn danych: odczyt / zapis / operacje CRUD pod blokadą."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self._store = Store(
            hass, 1, f"{DOMAIN}_{entry.entry_id}", atomic_writes=True
        )
        self._lock = asyncio.Lock()

    async def load(self) -> dict[str, Any]:
        """Pobierz surowe dane ({} gdy plik nie istnieje)."""
        data = await self._store.async_load()
        return data if isinstance(data, dict) else {}

    async def save(self, data: dict[str, Any]) -> None:
        """Zapisz dane (atomowo)."""
        await self._store.async_save(data)

    async def remove(self) -> None:
        """Usuń dane."""
        await self._store.async_remove()

    async def mutate(self, op: Callable[[dict[str, Any]], None]) -> dict[str, Any]:
        """Odczyt -> operacja -> zapis, całość pod blokadą."""
        async with self._lock:
            data = await self.load()
            op(data)
            await self.save(data)
            return data

    # ---------------- pomocnicze (synchroniczne, na słowniku) ----------------

    @staticmethod
    def _shop(data: dict[str, Any], shop: str) -> dict[str, Any]:
        node = data.get(shop)
        if not isinstance(node, dict):
            raise ZakupyDataError(f"Brak sklepu „{shop}”")
        return node

    @staticmethod
    def _category(data: dict[str, Any], shop: str, category: str) -> dict[str, Any]:
        node = ZakupyStore._shop(data, shop)
        cats = node.get("categories")
        if not isinstance(cats, dict):
            node["categories"] = cats = {}
        cat_node = cats.get(category)
        if not isinstance(cat_node, dict):
            raise ZakupyDataError(f"Brak kategorii „{category}” w sklepie „{shop}”")
        return cat_node

    @staticmethod
    def _product(data: dict[str, Any], shop: str, category: str, product: str) -> dict[str, Any]:
        node = ZakupyStore._category(data, shop, category)
        prods = node.get("products")
        if not isinstance(prods, dict):
            node["products"] = prods = {}
        prod_node = prods.get(product)
        if not isinstance(prod_node, dict):
            raise ZakupyDataError(f"Brak produktu „{product}”")
        return prod_node

    @staticmethod
    def _is_empty_shop(shop_node: dict[str, Any]) -> bool:
        for cat in (shop_node.get("categories") or {}).values():
            if (cat or {}).get("products"):
                return False
        return True

    @staticmethod
    def _is_empty_category(cat_node: dict[str, Any]) -> bool:
        return not (cat_node or {}).get("products")

    # ---------------- operacje (zwracają closure dla mutate()) ----------------

    def op_toggle_product(self, shop: str, category: str, product: str):
        def _op(data: dict[str, Any]) -> None:
            node = self._product(data, shop, category, product)
            node["bought"] = not bool(node.get("bought", False))

        return _op

    def op_add_shop(self, name: str):
        def _op(data: dict[str, Any]) -> None:
            if name in data:
                raise ZakupyDataError(f"Sklep „{name}” już istnieje")
            data[name] = {"categories": {}}

        return _op

    def op_delete_shop(self, name: str, confirm: bool):
        def _op(data: dict[str, Any]) -> None:
            if not confirm:
                raise ZakupyDataError("Brak potwierdzenia usunięcia")
            if name not in data:
                raise ZakupyDataError(f"Brak sklepu „{name}”")
            if not self._is_empty_shop(data[name]):
                raise ZakupyDataError("Sklep nie jest pusty — najpierw usuń produkty")
            del data[name]

        return _op

    def op_add_category(self, shop: str, name: str):
        def _op(data: dict[str, Any]) -> None:
            node = self._shop(data, shop)
            cats = node.get("categories")
            if not isinstance(cats, dict):
                node["categories"] = cats = {}
            if name in cats:
                raise ZakupyDataError(f"Kategoria „{name}” już istnieje")
            cats[name] = {"products": {}}

        return _op

    def op_delete_category(self, shop: str, category: str, confirm: bool):
        def _op(data: dict[str, Any]) -> None:
            if not confirm:
                raise ZakupyDataError("Brak potwierdzenia usunięcia")
            node = self._shop(data, shop)
            cats = node.get("categories") or {}
            if category not in cats:
                raise ZakupyDataError(f"Brak kategorii „{category}”")
            if not self._is_empty_category(cats[category]):
                raise ZakupyDataError("Kategoria nie jest pusta — najpierw usuń produkty")
            del cats[category]

        return _op

    def op_add_product(self, shop: str, category: str, name: str):
        def _op(data: dict[str, Any]) -> None:
            node = self._category(data, shop, category)
            prods = node.get("products")
            if not isinstance(prods, dict):
                node["products"] = prods = {}
            if name in prods:
                raise ZakupyDataError(f"Produkt „{name}” już istnieje")
            prods[name] = {"bought": False}

        return _op

    def op_delete_product(self, shop: str, category: str, product: str, confirm: bool):
        def _op(data: dict[str, Any]) -> None:
            if not confirm:
                raise ZakupyDataError("Brak potwierdzenia usunięcia")
            node = self._category(data, shop, category)
            prods = node.get("products") or {}
            if product not in prods:
                raise ZakupyDataError(f"Brak produktu „{product}”")
            del prods[product]

        return _op

    def op_mark_all_bought(self, shop: str | None = None, category: str | None = None):
        def _op(data: dict[str, Any]) -> None:
            targets = [shop] if shop else list(data.keys())
            for s in targets:
                for c, cnode in (self._shop(data, s).get("categories") or {}).items():
                    if category is not None and c != category:
                        continue
                    for p in (cnode.get("products") or {}).values():
                        if isinstance(p, dict):
                            p["bought"] = True

        return _op

    def op_reset_all(self, shop: str | None = None, category: str | None = None):
        def _op(data: dict[str, Any]) -> None:
            targets = [shop] if shop else list(data.keys())
            for s in targets:
                for c, cnode in (self._shop(data, s).get("categories") or {}).items():
                    if category is not None and c != category:
                        continue
                    for p in (cnode.get("products") or {}).values():
                        if isinstance(p, dict):
                            p["bought"] = False

        return _op

    def op_reorder(self, shop: str, category: str, order: list[str]):
        def _op(data: dict[str, Any]) -> None:
            node = self._category(data, shop, category)
            prods = node.get("products") or {}
            new_prods: dict[str, Any] = {}
            for p in order:
                if p in prods:
                    new_prods[p] = prods[p]
            node["products"] = new_prods

        return _op

    def op_import(self, raw: dict[str, Any]):
        def _op(data: dict[str, Any]) -> None:
            data.clear()
            data.update(raw)

        return _op

    async def get_product_state(self, shop: str, category: str, product: str) -> bool:
        """Stan produktu (do akcji toggle z jawną wartością)."""
        data = await self.load()
        node = self._product(data, shop, category, product)
        return bool(node.get("bought", False))
