"""Koordynator danych listy zakupów (bez odpytywania — dane lokalne w HA)."""
from __future__ import annotations

import logging
from typing import Any, Callable

from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import slugify

from .const import DOMAIN
from .storage import ZakupyStore

_LOGGER = logging.getLogger(__name__)

# Znormalizowany kształt danych: sklep -> kategoria -> produkt -> bool(bought)
DataShape = dict[str, dict[str, dict[str, bool]]]


def normalize(raw: Any) -> DataShape:
    """Surowy JSON (sklep->categories->products) -> znormalizowana struktura."""
    if raw is None:
        raw = {}
    if not isinstance(raw, dict):
        raise ValueError("Nieoczekiwany format danych")

    shops: DataShape = {}
    for shop, shop_node in raw.items():
        if not isinstance(shop_node, dict):
            continue
        cats: dict[str, dict[str, bool]] = {}
        cats_raw = shop_node.get("categories")
        if isinstance(cats_raw, dict):
            for cat, cat_node in cats_raw.items():
                if not isinstance(cat_node, dict):
                    continue
                prods: dict[str, bool] = {}
                prods_raw = cat_node.get("products")
                if isinstance(prods_raw, dict):
                    for prod, prod_node in prods_raw.items():
                        if isinstance(prod_node, dict):
                            prods[str(prod)] = bool(prod_node.get("bought", False))
                        else:
                            prods[str(prod)] = bool(prod_node)
                cats[str(cat)] = prods
        shops[str(shop)] = cats
    return shops


class ZakupyCoordinator(DataUpdateCoordinator[DataShape]):
    """Utrzymuje dane w pamięci (źródłem jest store); aktualizuje je po mutacjach."""

    config_entry: ConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
        store: ZakupyStore,
    ) -> None:
        super().__init__(
            hass,
            name=entry.title or DOMAIN,
            update_interval=None,  # dane są lokalne — odświeżamy po mutacjach
            config_entry=entry,
            logger=_LOGGER,
        )
        self.store = store
        self.id_tag = entry.entry_id.replace("-", "")[:8]
        self.entity_ids: dict[str, str] = {}
        self.shop_slugs: dict[str, str] = {}
        self.shop_indices: dict[str, int] = {}
        self.indices: dict[str, tuple[int, int, int]] = {}
        self._expected_ids: set[str] = set()
        self._last_ids: set[str] | None = None
        self._reload_pending = False

    async def _async_update_data(self) -> DataShape:
        try:
            raw = await self.store.load()
        except Exception as err:  # noqa: BLE001
            raise UpdateFailed(f"Nie udało się odczytać danych: {err}") from err
        try:
            data = normalize(raw)
        except ValueError as err:
            raise UpdateFailed(str(err)) from err

        self._build_maps(data)
        self._maybe_reload()
        return data

    # ---------------- mapy encji ----------------

    @staticmethod
    def _unique(base: str, seen: set[str]) -> str:
        candidate = base
        suffix = 1
        while candidate in seen:
            candidate = f"{base}_{suffix}"
            suffix += 1
        seen.add(candidate)
        return candidate

    def _build_maps(self, data: DataShape) -> None:
        """Wygeneruj identyfikatory encji dla bieżących danych."""
        self.entity_ids = {}
        self.shop_slugs = {}
        self.shop_indices = {}
        self.indices = {}
        seen: set[str] = set()
        tag = self.id_tag

        for si, (shop, cats) in enumerate(data.items()):
            self.shop_indices[shop] = si
            self.shop_slugs[shop] = self._unique(slugify(shop) or "sklep", seen)
            for ci, (cat, prods) in enumerate(cats.items()):
                for pi, prod in enumerate(prods):
                    key = f"{shop}|{cat}|{prod}"
                    self.indices[key] = (si, ci, pi)
                    base = slugify(f"{shop} {cat} {prod}") or "produkt"
                    self.entity_ids[key] = f"select.{self._unique(base, seen)}_{tag}"

        expected = set(self.entity_ids.values())
        for shop, s in self.shop_slugs.items():
            expected.add(f"button.{s}_{tag}_mark_all")
            expected.add(f"button.{s}_{tag}_reset")
            expected.add(f"sensor.{s}_{tag}_do_kupienia")
        expected.add(f"sensor.zakupy_{tag}_do_kupienia")
        expected.add(f"sensor.zakupy_{tag}_postep")
        self._expected_ids = expected

    def _maybe_reload(self) -> None:
        """Przeładuj wpis konfiguracji, gdy zbiór encji się zmienił.

        Pełne przeładowanie (unload + setup) to najprostszy i pewny sposób
        na dodanie/usunięcie encji — zdarza się rzadko (dopiero przy zmianie
        listy produktów), a przełączanie stanów niczego nie przeładowuje.
        """
        if self._reload_pending:
            return
        if self.config_entry is None:
            return
        new_ids = self._expected_ids
        if self._last_ids is None:
            self._last_ids = new_ids
            return
        if new_ids == self._last_ids:
            return
        self._last_ids = new_ids
        entry = self.config_entry
        if entry.state is not ConfigEntryState.LOADED:
            # Podczas pierwszego setupu encje dostroją się przy forwardingu.
            return
        _LOGGER.info("Zmieniono listę produktów — przeładowuję wpisy „%s”", entry.title)
        self._reload_pending = True

        async def _reload() -> None:
            try:
                await self.hass.config_entries.async_reload(entry.entry_id)
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Błąd podczas przeładowania wpisów konfiguracji")
            finally:
                self._reload_pending = False

        self.hass.async_create_task(_reload(), f"{DOMAIN} reload {entry.title}")

    # ---------------- mutacje ----------------

    async def apply(self, op: Callable[[dict[str, Any]], None]) -> None:
        """Wykonaj operację na danych w store i odśwież encje."""
        await self.store.mutate(op)
        await self.async_refresh()
