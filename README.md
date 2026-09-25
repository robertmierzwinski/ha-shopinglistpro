# ShopingListPro for Home Assistant

[English](#english) | [Polski](#polski)

---

## English

ShopingListPro is a standalone shopping-list app **inside Home Assistant** — no external backend, no PHP, no files on a server.
Your list lives in HA's local storage, gets you a full web app, a dashboard card, entities and services.

- **Full web app** at `http://<your-ha>/moje-zakupy` (registered automatically — looks like the classic 3-tab shopping list: *Zakupy / Koszyk / Ustawienia*)
- **Dashboard card** `custom:moje-zakupy-card` with search, progress bar and full management
- **Entities**: a `select` per product (Do kupienia / Kupione), progress sensors, action buttons per shop
- **13 services** for automation (toggle, mark all, reset, import/export, …)
- Data stored locally in `.storage/moje_zakupy_<entry>` — export/import in `data.json` format

### Install (HACS)

1. In HACS: **Integrations** → top-right `⋮` → **Custom repositories** → add `https://github.com/robertmierzwinski/ha-shopinglistpro` (type: **Integration**).
2. Search **ShopingListPro** and **Download**.
3. Restart Home Assistant (when prompted).

### Manual install

Copy the `custom_components/moje_zakupy/` folder from this repo to `config/custom_components/` and restart HA.

Then: **Settings → Devices & Services → ShopingListPro → Add integration**.
Tip: paste your existing `data.json` into the *Existing list* field to import your old list in one step.

> Tested against the APIs used by Home Assistant **2026.9.x**.

---

## Polski

ShopingListPro to samodzielna lista zakupów **w Home Assistant** — bez zewnętrznego backendu, bez PHP.
Dane żyją w lokalnym przechowywaniu HA; instalacja daje Ci pełną aplikację, kartę w dashboardzie, encje i serwisy.

### Co dostajesz

| Element | Gdzie | Opis |
|---|---|---|
| 🖥️ **Panel web** | `http://<Twój-HA>/moje-zakupy` | Pełna aplikacja: 3 zakładki — **Zakupy** (tylko do kupienia, kliknij = kupione), **Koszyk** (zarządzanie: sklepy, kategorie, produkty, drag&drop, etykiety), **Ustawienia** (czcionka, motyw, eksport/import, czyszczenie). Rejestruje się automatycznie po instalacji — wciśnij w sidebarnie w panelu HA. |
| 🃏 **Karta dashboardu** | `custom:moje-zakupy-card` | Ta sama lista jako karta: pasek postępu, wyszukiwarka, filtrowanie sklepów, pełne zarządzanie. |
| 📦 **Encje** | urządzenia = sklepy | `select.*` — każdy produkt (stan: *Do kupienia / Kupione*), sensory postępu per sklep i ogólnego, przyciski zbiorcze (oznacz wszystko / resetuj). |
| 🛠️ **Serwisy** | `moje_zakupy.*` | 13 serwisów do automatyzacji — patrz tabela niżej. |

### Wymagania

- Home Assistant **2026.9.x**
- (do automatycznej instalacji) [HACS](https://hacs.xyz)

### Instalacja przez HACS (zalecane)

1. W HACS: **Integracje** → przycisk `⋮` (prawy górny róg) → **Custom repositories** (Własne repozytoria).
2. Wklej `https://github.com/robertmierzwinski/ha-shopinglistpro`, typ: **Integration** (Integracja) → **Add repository** (Dodaj).
3. Wróć do **Integracje** → wyszukaj **ShopingListPro** → **Download**.
4. Zrestartuj Home Assistant (HACS o to poprosi).

> 💡 Gdy pojawi się nowsza wersja, pobierz aktualizację w HACS i zrestartuj Home Assistant.

### Instalacja manualna (bez HACS)

1. Pobierz repo (zip lub `git clone`).
2. Skopiuj folder `custom_components/moje_zakupy/` do `config/custom_components/`.
3. Zrestartuj Home Assistant.

### Konfiguracja

1. **Ustawienia → Urządzenia i usługi → ShopingListPro → Dodaj integrację** (Add integration).
2. Podaj nazwę (dowolna, np. *Lista na wtorek* — możesz dodać kilka niezależnych list).
3. **Opcjonalnie** — w polu *Istniejąca lista* wklej zawartość Twojego starego pliku `data.json` (cały plik, od `{` do `}`), aby zaimportować dotychczasową listę w jednym kroku.
4. **Zapisz**. Po restarcie panel jest pod `http://<Twój-HA>/moje-zakupy`.

> W polu *Istniejąca lista* może być wiele list — po prostu wklej całość `data.json` (sklepy → kategorie → produkty).

### Karta w dashboardzie

1. W dashboardzie: **Edytuj dashboard** → **+ Dodaj kartę** → **ShopingListPro Card**. Integracja rejestruje zasób automatycznie w trybie `resource_mode: storage`. Po aktualizacji uruchom HA ponownie i odśwież stronę przeglądarki. W trybie `resource_mode: yaml` dodaj do `lovelace.resources` moduł o adresie `/moje_zakupy/moje_zakupy.js`.
2. W opcjach karty: tytuł, filtrowanie sklepów, pasek postępu, wyszukiwarka, maks. wysokość.

Konfiguracja w YAML:

```yaml
type: custom:moje-zakupy-card
title: ShopingListPro
shops: [Lidl, DINO]   # opcjonalnie — puste = wszystkie sklepy
show_progress: true
show_search: true
max_height: 640
```

### Zakładki aplikacji (panel)

- **Zakupy** — wyłącznie produkty *do kupienia*; kliknięcie produktu/kolorowej etykiety oznacza go jako kupiony (stan zapada się w HA).
- **Koszyk** — pełne zarządzanie: dodawanie/usuwanie sklepów, kategorii i produktów, etykiety *Kupione/Do kupienia*, przesuwanie produktów (drag&drop), „Oznacz wszystko", „Resetuj", pasek postępu.
- **Ustawienia** — wielkość czcionki, motyw (auto/światły/ciemny), **Eksportuj** do `data.json`, **Importuj** z pliku, **Wyczyść wszystkie dane**.

### Serwisy (`moje_zakupy.*`)

| Serwis | Parametry | Opis |
|---|---|---|
| `add_shop` | `name` | Dodaj sklep |
| `delete_shop` | `shop`, `confirm` (bool) | Usuń sklep (musi być pusty) |
| `add_category` | `shop`, `name` | Dodaj kategorię |
| `delete_category` | `shop`, `category`, `confirm` | Usuń kategorię (musi być pusta) |
| `add_product` | `shop`, `category`, `name` | Dodaj produkt |
| `delete_product` | `shop`, `category`, `product`, `confirm` | Usuń produkt |
| `toggle_product` | `shop`, `category`, `product`, `value?` (bool) | Przełącz produkt (bez `value` — inwersja) |
| `mark_all_bought` | `shop?`, `category?` | Oznacz wszystko jako kupione |
| `reset_all` | `shop?`, `category?` | Zresetuj (wszystko do kupienia) |
| `reorder` | `shop`, `category`, `order` (lista) | Zmień kolejność produktów w kategorii |
| `refresh` | — | Odśwież encje z magazynu |
| `import_data` | `data` (JSON tekst/obiekt) | Zastąp dane (format `data.json`) |
| `export_data` | — | Zwróć dane jako JSON (`data.json`) |

Wszystkie serwisy akceptują opcjonalny parametr `entry` (identyfikator wpisu konfiguracji lub unikatowa nazwa). Gdy masz kilka list, podaj identyfikator wpisu; panel i karta przekazują go automatycznie.

Przykład (automatyzacja — codzienny reset listy):

```yaml
alias: Reset listy na nowy dzień
trigger:
  - trigger: time
    at: "07:30:00"
action:
  - service: moje_zakupy.reset_all
    data:
      entry: Moja lista
```

### Dane i kopie

- Magazyn: `.storage/moje_zakupy_<id-wpisu>` (format zgodny ze starym `data.json`).
- Eksport/import z zakładki **Ustawienia** lub serwisem `export_data`/`import_data`.
- „Wyczyść wszystkie dane" — pusty start.

### Odinstalowanie

1. **Ustawienia → Urządzenia i usługi → ShopingListPro → ⋮ → Usuń** (usuwa dane listy i encje; przy usunięciu ostatniego wpisu panel znika).
2. W HACS usuń repozytorium: **Custom repositories** → **ShopingListPro** → 🗑 → **Restart**.

---

## Changelog / Licencja

- **1.0.6** — poprawione tworzenie sensorów i aktualizacja zasobu karty; błędy rejestracji karty nie blokują uruchomienia listy.
- **1.0.5** — obsługa wielu list o tej samej nazwie: panel i karta przekazują identyfikator wpisu przy każdej operacji; panel umożliwia wybór listy.
- **1.0.4** — automatyczna rejestracja zasobu karty w Lovelace oraz poprawiony edytor karty.
- **1.0.3** — poprawiono ładowanie sensora postępu i schemat pól usług wykryte w logu HA.
- **1.0.2** — poprawiono import odpowiedzi serwisów blokujący ładowanie formularza integracji.
- **1.0.1** — zgodność z API HA 2026.9: magazyn danych, panel, aktualizacja encji.
- **1.0.0** — pierwsza wersja samodzielna (dane w HA, panel + karta + encje + serwisy).
- Licencja: MIT (patrz `LICENSE`).
