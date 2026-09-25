"""Przepływ konfiguracji integracji ShopingListPro."""
from __future__ import annotations

import json
import logging
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigFlow
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import selector

from .const import DEFAULT_NAME, DOMAIN

_LOGGER = logging.getLogger(__name__)


def _schema(defaults: dict[str, Any]) -> vol.Schema:
    """Schemat kroku user."""
    return vol.Schema(
        {
            vol.Required("name", default=defaults.get("name", DEFAULT_NAME)): str,
            vol.Optional("initial"): selector.TextSelector(
                selector.TextSelectorConfig(
                    multiline=True,
                )
            ),
        }
    )


def _validate_initial(raw: str) -> dict[str, Any]:
    """Sprawdź wklejone dane. Rzuci ValueError przy błędzie."""
    parsed = json.loads(raw)
    if not isinstance(parsed, dict):
        raise ValueError("Dane muszą być obiektem JSON")
    for shop, node in parsed.items():
        if not isinstance(node, dict):
            raise ValueError(f"Nieprawidłowy format sklepu „{shop}”")
    return parsed


class MojeZakupyConfigFlow(ConfigFlow, domain=DOMAIN):
    """Konfiguracja listy zakupów w Home Assistant."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Jedyny krok: nazwa + opcjonalny import starej listy."""
        errors: dict[str, str] = {}
        defaults: dict[str, Any] = {}
        if user_input is not None:
            name = (user_input.get("name") or "").strip() or DEFAULT_NAME
            initial_raw = (user_input.get("initial") or "").strip()
            data: dict[str, Any] = {"name": name}
            if initial_raw:
                try:
                    data["initial"] = _validate_initial(initial_raw)
                except (ValueError, json.JSONDecodeError):
                    errors["initial"] = "invalid_json"
            if not errors:
                return self.async_create_entry(title=name, data=data)
            defaults = user_input

        return self.async_show_form(
            step_id="user",
            data_schema=_schema(defaults),
            errors=errors,
        )
