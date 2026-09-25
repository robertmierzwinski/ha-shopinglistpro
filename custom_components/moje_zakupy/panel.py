"""Register the shopping list panel and serve its shared panel/card module."""
from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import panel_custom
from homeassistant.components.frontend import async_remove_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN, PANEL_MODULE, PANEL_PATH, PANEL_WEBCOMPONENT

_LOGGER = logging.getLogger(__name__)
CARD_VERSION = "1.0.6"


async def _async_register_card(hass: HomeAssistant) -> None:
    """Make the card available in the dashboard card picker (storage resources)."""
    lovelace = hass.data["lovelace"]
    if lovelace.resource_mode != "storage":
        _LOGGER.info("Lovelace YAML resources: add %s as a module manually", PANEL_MODULE)
        return

    resources = lovelace.resources
    # Read the existing collection before writing so no user's resources are lost.
    if not resources.loaded:
        await resources.async_load()

    url = f"{PANEL_MODULE}?v={CARD_VERSION}"
    matching = [
        item for item in resources.async_items()
        if item["url"].split("?", 1)[0] == PANEL_MODULE
    ]
    if matching:
        item = matching[0]
        if item["url"] != url or item.get("res_type", item.get("type")) != "module":
            await resources.async_update_item(item["id"], {"url": url, "res_type": "module"})
    else:
        await resources.async_create_item({"url": url, "res_type": "module"})


async def async_setup_panel(hass: HomeAssistant) -> None:
    """Register assets once and expose the panel after an entry loads."""
    if not hass.data[DOMAIN].get("assets_registered"):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(PANEL_MODULE, str(Path(__file__).parent / "static" / "moje_zakupy.js"), False)]
        )
        hass.data[DOMAIN]["assets_registered"] = True

    try:
        await _async_register_card(hass)
    except Exception:  # noqa: BLE001
        _LOGGER.exception("Nie udało się zarejestrować karty ShopingListPro w Lovelace")

    if hass.data[DOMAIN].get("panel_registered"):
        return
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name=PANEL_WEBCOMPONENT,
        frontend_url_path=PANEL_PATH,
        module_url=PANEL_MODULE,
        sidebar_title="ShopingListPro",
        sidebar_icon="mdi:cart-check",
        require_admin=False,
    )
    hass.data[DOMAIN]["panel_registered"] = True
    _LOGGER.info("Panel ShopingListPro: /%s", PANEL_PATH)


def async_teardown_panel(hass: HomeAssistant) -> None:
    """Remove the panel when the last config entry is deleted."""
    if hass.data.get(DOMAIN, {}).get("panel_registered"):
        async_remove_panel(hass, PANEL_PATH)
        hass.data[DOMAIN]["panel_registered"] = False
