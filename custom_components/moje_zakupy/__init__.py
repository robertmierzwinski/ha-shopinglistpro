"""Integracja ShopingListPro — samodzielna lista zakupów w Home Assistant.

Dane przechowywane są lokalnie w HA (`.storage/moje_zakupy_<entry_id>`);
żaden zewnętrzny backend (PHP) nie jest potrzebny. Aplikacja jest
dostępna jako:
  * panel web:   /moje-zakupy   (rejestrowany automatycznie)
  * karta:       custom:moje-zakupy-card (moduł serwowany z tej integracji)
  * encje/serwisy: select/button/sensor + 13 serwisów.
"""
from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN, PLATFORMS
from .coordinator import ZakupyCoordinator
from .panel import async_setup_panel, async_teardown_panel
from .services import async_setup_services
from .storage import ZakupyStore

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Ustawienie integracji (serwisy + panel, niezależnie od wpisów)."""
    hass.data[DOMAIN] = {}
    await async_setup_services(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Załaduj wpis konfiguracji."""
    store = ZakupyStore(hass, entry)

    # Jednorazowy import wstępnej listy (wklejony w kreatorze)
    initial = entry.data.get("initial")
    if initial is not None:
        try:
            existing = await store.load()
            if not existing:
                await store.save(initial)
            # usuń "initial" z danych wpisu po udanym imporcie
            hass.config_entries.async_update_entry(
                entry,
                data={k: v for k, v in entry.data.items() if k != "initial"},
            )
        except Exception:  # noqa: BLE001
            # zostawiamy "initial", aby powtórzyć import przy następnym starcie
            _LOGGER.exception("Import początkowy nie powiódł się")

    coordinator = ZakupyCoordinator(hass, entry, store)
    await coordinator.async_config_entry_first_refresh()
    hass.data[DOMAIN][entry.entry_id] = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    await async_setup_panel(hass)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Wyładuj wpis konfiguracji."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unloaded


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Usuń wpis konfiguracji (z danymi) i — przy ostatnim — panel."""
    hass.data[DOMAIN].pop(entry.entry_id, None)
    store = ZakupyStore(hass, entry)
    try:
        await store.remove()
    except Exception:  # noqa: BLE001
        _LOGGER.debug("Nie usunięto pliku danych (nieistniejący)")
    if not hass.config_entries.async_entries(DOMAIN):
        async_teardown_panel(hass)


async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Migracja wersji wpisu konfiguracji."""
    if entry.version > 1:
        return False
    if entry.version < 1:
        hass.config_entries.async_update_entry(entry, version=1)
    return True
