"""Serwisy integracji ShopingListPro."""
from __future__ import annotations

import json
import logging

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN
from .coordinator import ZakupyCoordinator
from .storage import ZakupyDataError

_LOGGER = logging.getLogger(__name__)

CONF_ENTRY = "entry"


def _coordinator_for(
    hass: HomeAssistant, entry_name: str | None
) -> tuple[ConfigEntry, ZakupyCoordinator]:
    """Znajdź wpis konfiguracji po identyfikatorze lub starszej nazwie."""
    entries = [e for e in hass.config_entries.async_entries(DOMAIN)]
    if not entries:
        raise ServiceValidationError("Integracja ShopingListPro nie jest skonfigurowana")
    if entry_name:
        matches = [e for e in entries if e.entry_id == entry_name]
        if not matches:
            matches = [e for e in entries if e.title == entry_name]
        if not matches:
            names = ", ".join(e.title for e in entries)
            raise ServiceValidationError(
                f"Brak wpisów o nazwie „{entry_name}”. Dostępne: {names}"
            )
        if len(matches) > 1:
            raise ServiceValidationError(
                "Kilka list ma tę samą nazwę — podaj identyfikator wpisu w parametrze „entry”"
            )
        entry = matches[0]
    elif len(entries) == 1:
        entry = entries[0]
    else:
        names = ", ".join(e.title for e in entries)
        raise ServiceValidationError(
            f"Wymagany parametr „entry”. Dostępne wpisy: {names}"
        )
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)
    if coordinator is None:
        raise ServiceValidationError("Wpis konfiguracji nie jest załadowany")
    return entry, coordinator


async def _apply(
    hass: HomeAssistant, entry_name: str | None, build_op
) -> None:
    """Zbuduj operację z koordynatora, wykonaj ją, błąd danych -> błąd serwisu."""
    _, coordinator = _coordinator_for(hass, entry_name)
    try:
        await coordinator.apply(build_op(coordinator))
    except ZakupyDataError as err:
        raise ServiceValidationError(str(err)) from err


_ENTRY_OPT = {vol.Optional(CONF_ENTRY): cv.string}
_SHOP_REQ = {vol.Required("shop"): cv.string}
_CATEGORY_REQ = {vol.Required("category"): cv.string}
_CONFIRM_OPT = {vol.Optional("confirm", default=False): cv.boolean}


async def async_setup_services(hass: HomeAssistant) -> None:
    """Zarejestruj serwisy integracji."""
    if hass.data[DOMAIN].get("services_registered"):
        return

    def register(name: str, schema: dict, handler) -> None:
        hass.services.async_register(
            DOMAIN,
            name,
            handler,
            schema=vol.Schema(schema),
            supports_response=SupportsResponse.OPTIONAL,
        )

    async def _add_shop(call: ServiceCall) -> ServiceResponse:
        await _apply(hass, call.data.get(CONF_ENTRY),
                      lambda coordinator: coordinator.store.op_add_shop(call.data["name"]))
        return {"status": "ok"}

    async def _delete_shop(call: ServiceCall) -> ServiceResponse:
        await _apply(hass, call.data.get(CONF_ENTRY),
                      lambda coordinator: coordinator.store.op_delete_shop(
                          call.data["shop"], call.data["confirm"]))
        return {"status": "ok"}

    async def _add_category(call: ServiceCall) -> ServiceResponse:
        await _apply(hass, call.data.get(CONF_ENTRY),
                      lambda coordinator: coordinator.store.op_add_category(
                          call.data["shop"], call.data["name"]))
        return {"status": "ok"}

    async def _delete_category(call: ServiceCall) -> ServiceResponse:
        await _apply(
            hass, call.data.get(CONF_ENTRY),
            lambda coordinator: coordinator.store.op_delete_category(
                call.data["shop"], call.data["category"], call.data["confirm"]
            ),
        )
        return {"status": "ok"}

    async def _add_product(call: ServiceCall) -> ServiceResponse:
        await _apply(
            hass, call.data.get(CONF_ENTRY),
            lambda coordinator: coordinator.store.op_add_product(
                call.data["shop"], call.data["category"], call.data["name"]
            ),
        )
        return {"status": "ok"}

    async def _delete_product(call: ServiceCall) -> ServiceResponse:
        await _apply(
            hass, call.data.get(CONF_ENTRY),
            lambda coordinator: coordinator.store.op_delete_product(
                call.data["shop"],
                call.data["category"],
                call.data["product"],
                call.data["confirm"],
            ),
        )
        return {"status": "ok"}

    async def _toggle_product(call: ServiceCall) -> ServiceResponse:
        value = call.data.get("value")
        shop = call.data["shop"]
        category = call.data["category"]
        product = call.data["product"]
        entry_name = call.data.get(CONF_ENTRY)

        async def _action() -> None:
            _, coordinator = _coordinator_for(hass, entry_name)
            if value is None:
                op = coordinator.store.op_toggle_product(shop, category, product)
            else:
                current = await coordinator.store.get_product_state(shop, category, product)
                if bool(current) == value:
                    return
                op = coordinator.store.op_toggle_product(shop, category, product)
            try:
                await coordinator.apply(op)
            except ZakupyDataError as err:
                raise ServiceValidationError(str(err)) from err

        await _action()
        return {"status": "ok"}

    async def _mark_all_bought(call: ServiceCall) -> ServiceResponse:
        await _apply(
            hass, call.data.get(CONF_ENTRY),
            lambda coordinator: coordinator.store.op_mark_all_bought(
                shop=call.data.get("shop"), category=call.data.get("category")
            ),
        )
        return {"status": "ok"}

    async def _reset_all(call: ServiceCall) -> ServiceResponse:
        await _apply(
            hass, call.data.get(CONF_ENTRY),
            lambda coordinator: coordinator.store.op_reset_all(
                shop=call.data.get("shop"), category=call.data.get("category")
            ),
        )
        return {"status": "ok"}

    async def _reorder(call: ServiceCall) -> ServiceResponse:
        await _apply(
            hass, call.data.get(CONF_ENTRY),
            lambda coordinator: coordinator.store.op_reorder(
                call.data["shop"], call.data["category"], list(call.data["order"])
            ),
        )
        return {"status": "ok"}

    async def _refresh(call: ServiceCall) -> ServiceResponse:
        _, coordinator = _coordinator_for(hass, call.data.get(CONF_ENTRY))
        await coordinator.async_refresh()
        return {"status": "ok"}

    async def _import_data(call: ServiceCall) -> ServiceResponse:
        """Import danych w formacie data.json (jednorazowa migracja / backup)."""
        raw = call.data["data"]
        if isinstance(raw, str):
            try:
                parsed = json.loads(raw)
            except ValueError as err:
                raise ServiceValidationError("Nieprawidłowy JSON") from err
        else:
            parsed = raw
        if not isinstance(parsed, dict):
            raise ServiceValidationError("Dane muszą być obiektem JSON")
        for shop, node in parsed.items():
            if not isinstance(node, dict):
                raise ServiceValidationError(f"Nieprawidłowy format sklepu „{shop}”")
        await _apply(hass, call.data.get(CONF_ENTRY),
                     lambda coordinator: coordinator.store.op_import(parsed))
        return {"status": "ok"}

    async def _export_data(call: ServiceCall) -> ServiceResponse:
        _, coordinator = _coordinator_for(hass, call.data.get(CONF_ENTRY))
        data = await coordinator.store.load()
        return {
            "data": json.dumps(data, indent=2, ensure_ascii=False),
            "filename": "data.json",
        }

    register("add_shop",
             {vol.Required("name"): cv.string, **_ENTRY_OPT}, _add_shop)
    register("delete_shop",
             {vol.Required("shop"): cv.string, **_CONFIRM_OPT, **_ENTRY_OPT},
             _delete_shop)
    register("add_category",
             {vol.Required("shop"): cv.string, vol.Required("name"): cv.string,
              **_ENTRY_OPT},
             _add_category)
    register("delete_category",
             {**_SHOP_REQ, **_CATEGORY_REQ, **_CONFIRM_OPT, **_ENTRY_OPT},
             _delete_category)
    register("add_product",
             {**_SHOP_REQ, **_CATEGORY_REQ, vol.Required("name"): cv.string,
              **_ENTRY_OPT},
             _add_product)
    register("delete_product",
             {**_SHOP_REQ, **_CATEGORY_REQ, vol.Required("product"): cv.string,
              **_CONFIRM_OPT, **_ENTRY_OPT},
             _delete_product)
    register("toggle_product",
             {**_SHOP_REQ, **_CATEGORY_REQ, vol.Required("product"): cv.string,
              vol.Optional("value"): cv.boolean, **_ENTRY_OPT},
             _toggle_product)
    register("mark_all_bought",
             {vol.Optional("shop"): cv.string, vol.Optional("category"): cv.string,
              **_ENTRY_OPT},
             _mark_all_bought)
    register("reset_all",
             {vol.Optional("shop"): cv.string, vol.Optional("category"): cv.string,
              **_ENTRY_OPT},
             _reset_all)
    register("reorder",
             {**_SHOP_REQ, **_CATEGORY_REQ,
              vol.Required("order"): vol.All([cv.string], vol.Length(min=1)),
              **_ENTRY_OPT},
             _reorder)
    register("refresh", dict(_ENTRY_OPT), _refresh)
    register("import_data",
             {vol.Required("data"): vol.Any(cv.string, dict), **_ENTRY_OPT},
             _import_data)
    register("export_data", dict(_ENTRY_OPT), _export_data)

    hass.data[DOMAIN]["services_registered"] = True
    _LOGGER.debug("Zarejestrowano serwisy %s", DOMAIN)
