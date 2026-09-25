"""Stałe integracji ShopingListPro."""
from homeassistant.const import Platform

DOMAIN = "moje_zakupy"

DEFAULT_NAME = "ShopingListPro"

# Opcje encji select (stan produktu)
OPT_TO_BUY = "Do kupienia"
OPT_BOUGHT = "Kupione"

PLATFORMS = [Platform.SELECT, Platform.BUTTON, Platform.SENSOR]

# Panel
PANEL_PATH = "moje-zakupy"
PANEL_WEBCOMPONENT = "moje-zakupy-panel"
PANEL_MODULE = "/moje_zakupy/moje_zakupy.js"
