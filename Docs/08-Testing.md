# Testing-Dokumentation

> **Hinweis:** Diese Dokumentation ist Teil der [Projektdokumentation](./README.md).
> **Voraussetzungen:** Node.js und npm installiert. Führe `npm install` vor dem ersten Testdurchlauf aus.

---

## Inhaltsverzeichnis

1. [Test Framework](#1-test-framework)
2. [Projektstruktur](#2-projektstruktur)
3. [Test-Kategorien](#3-test-kategorien)
4. [Tests ausführen](#4-tests-ausführen)
5. [Playwright-Konfiguration](#5-playwright-konfiguration)
6. [Test-Setup](#6-test-setup)
7. [Hilfsfunktionen](#7-hilfsfunktionen)
8. [CI-Workflow](#8-ci-workflow)
9. [Test-Schreibweise](#9-test-schreibweise)
10. [Troubleshooting](#10-troubleshooting)
11. [Best Practices](#11-best-practices)

---

## 1. Test Framework

Das Projekt verwendet [Playwright](https://playwright.dev/) als End-to-End-Test-Framework.

### Features

| Feature | Beschreibung |
|---------|--------------|
| **Browser-Automatisierung** | Chromium, Firefox, WebKit |
| **Mobile Emulation** | Gerätespezifische Viewports und Touch-Events |
| **Modi** | Headless (Standard) und Headed (mit Browser-GUI) |
| **Smart Waiting** | Automatisches Warten auf DOM-Änderungen |
| **Debugging** | Trace-Aufzeichnungen und interaktive Test-Entwicklung |

---

## 2. Projektstruktur

```
tests/
├── mobile/
│   ├── 00-viewports.spec.js    # Viewport-Tests
│   ├── 01-dashboard.spec.js    # Dashboard-Tests
│   ├── 02-timer.spec.js        # Timer-Tests
│   ├── 03-navigation.spec.js   # Navigation-Tests
│   ├── 04-themes.spec.js       # Theme-Tests
│   └── 05-heatmap.spec.js      # Heatmap-Tests
├── helpers.js                   # Hilfsfunktionen
├── index.js                     # Test-Index
└── setup.js                     # Test-Setup
```

---

## 3. Test-Kategorien

### 3.1 00-viewports.spec.js — Responsive Layouts

Tests für verschiedene Bildschirmgrößen:

| Gerät | Viewport |
|-------|----------|
| iPhone SE | 375 × 667 |
| iPhone 12 | 390 × 844 |
| iPhone 11 Pro Max | 414 × 896 |
| Samsung Galaxy S10+ | 412 × 869 |

Geprüft werden:
- Grundlegendes Layout ohne horizontalen Overflow
- Sichtbarkeit der Bottom Navigation
- Korrekte FAB-Position
- Safe Area Padding

---

### 3.2 01-dashboard.spec.js — Dashboard-Widgets

Tests für alle Dashboard-Komponenten:

- Tagesziel-Ring (`#daily-goal-ring`)
- Wochengraph (`#dashboard-graph`)
- Heatmap-Container (`#heatmap-container`)
- Erfolgsliste (`#achievements-list`)
- Streak-Widget (`#dashboard-streak`)
- Prüfungs-Countdown (`#exam-countdown-list`)
- Wochenstatistiken (`#weekly-bar-chart`)

---

### 3.3 02-timer.spec.js — Timer-Overlay

Tests für den Timer-Overlay:

- Öffnen und Schließen des Timers
- Timer-Anzeige und Steuerelemente
- Fächerauswahl und Themen-Input
- Pomodoro-Umschaltung
- Notizen-Toggle
- FAB-Interaktion

Siehe auch: [02-Timer.md](./02-Timer.md) für Timer-Dokumentation.

---

### 3.4 03-navigation.spec.js — Navigation und Overlays

Tests für Navigation und Overlays:

- Bottom Navigation (5 Buttons)
- Header-Buttons: Hinzufügen, Timer, Theme, Menü
- Settings-Overlay
- Eintrag hinzufügen Overlay

---

### 3.5 04-themes.spec.js — Dark/Light Mode

Tests für Theme-Umschaltung:

- Theme-Umschaltung (Light/Dark)
- Lesbarkeit in beiden Themes
- Theme-Persistenz bei Navigation
- Input-Feld-Styling
- Heatmap-Legendenfarben

---

### 3.6 05-heatmap.spec.js — Heatmap-Komponente

Tests für die Heatmap-Visualisierung:

- Container und Zellen-Sichtbarkeit
- Scroll-Verhalten
- Legende mit 5 Farbstufen
- Tooltip-Interaktionen
- Theme-abhängige Farben

---

## 4. Tests ausführen

### Alle Tests

```bash
npm test
```

### Spezifische Kategorie

| Skript | Beschreibung |
|--------|--------------|
| `npm run test:viewport` | Responsive Layouts |
| `npm run test:dashboard` | Widgets und Charts |
| `npm run test:timer` | Timer-Overlay |
| `npm run test:nav` | Navigation |
| `npm run test:themes` | Dark/Light Mode |
| `npm run test:heatmap` | Heatmap |

### Mobile-spezifisch

| Skript | Beschreibung |
|--------|--------------|
| `npm run test:mobile` | Alle Viewports |
| `npm run test:android` | Android-Emulation |

### Spezielle Modi

| Skript | Beschreibung |
|--------|--------------|
| `npm run test:headed` | Browser-GUI wird angezeigt |
| `npm run test:ui` | Interaktiver Playwright UI-Modus |

---

## 5. Playwright-Konfiguration

Siehe [07-Configuration.md](./07-Configuration.md) für vollständige Konfigurationsdetails.

### Konfigurationsoptionen

| Option | Standard | Beschreibung |
|--------|----------|--------------|
| `testDir` | `./tests` | Verzeichnis mit Test-Dateien |
| `fullyParallel` | `true` | Parallele Test-Ausführung |
| `forbidOnly` | `true` in CI | Verbot von `test.only` |
| `retries` | `0` (lokal) / `2` (CI) | Wiederholungen bei Fehlschlägen |
| `reporter` | `list` | Test-Reporter Format |

### Projekt-Konfigurationen

| Projekt | Viewport |
|---------|----------|
| `chromium-mobile` | Pixel 5 |
| `chromium-mobile-small` | 360 × 640 |
| `chromium-mobile-large` | 414 × 896 |

---

## 6. Test-Setup

Die Datei `tests/setup.js` definiert ein erweitertes Test-Objekt:

```javascript
const { test as base } = require('@playwright/test');

const test = base.extend({
  storageState: async ({}, use) => {
    await use({});
  },
});

module.exports = { test };
```

---

## 7. Hilfsfunktionen

Die Datei `tests/helpers.js` stellt nützliche Funktionen bereit:

```javascript
const { getFileUrl } = require('../helpers');

// URL für index.html erstellen
const url = getFileUrl();                 // → file:///path/to/index.html
const url = getFileUrl('subpage.html');   // → file:///path/to/subpage.html
```

> **Empfehlung:** `getFileUrl()` ist die bevorzugte Methode zum Erstellen von URLs, da sie plattformunabhängig funktioniert.

---

## 8. CI-Workflow

```yaml
name: Validate
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check files
        run: |
          [ -f index.html ] && echo "HTML OK"
          for f in *.js; do node --check "$f"; done
```

### CI-Optimierungen

| Optimierung | Beschreibung |
|-------------|--------------|
| **Retries** | 2 Wiederholungen bei fehlgeschlagenen Tests |
| **Single Worker** | Ein Worker für stabilere Tests |
| **Forbid Only** | Verhindert versehentliche `test.only` |

---

## 9. Test-Schreibweise

### Grundlegendes Beispiel

```javascript
const { test, expect } = require('@playwright/test');
const { getFileUrl } = require('../helpers');

test('Timer-Overlay lässt sich öffnen und schließen', async ({ page }) => {
  await page.goto(getFileUrl());

  const fab = page.locator('#timer-fab');
  await fab.click();

  await expect(page.locator('#timer-overlay')).toBeVisible();
});
```

### Viewport-Tests

```javascript
const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
];

test.describe('Responsive Layout Tests', () => {
  for (const vp of viewports) {
    test(`${vp.name} - Layout ohne horizontalen Overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());

      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(vp.width);
    });
  }
});
```

### Erwartungen (Expectations)

```javascript
// Sichtbarkeit
await expect(locator).toBeVisible();
await expect(locator).toBeHidden();
await expect(locator).toHaveCount(5);

// Klassen und Attribute
await expect(locator).toHaveClass(/active/);
await expect(locator).toHaveAttribute('data-theme', 'dark');

// Inhalt
await expect(locator).toContainText('Lernzeit');
await expect(locator).toHaveText('2 Stunden');
```

### Tests überspringen

```javascript
test.skip('Wird übersprungen', async ({ page }) => { ... });
test.fixme('Muss noch implementiert werden', async ({ page }) => { ... });
```

---

## 10. Troubleshooting

### Erste Einrichtung

```bash
# Playwright und Browser installieren
npx playwright install

# Browser aktualisieren
npx playwright install chromium
```

### Debugging

```bash
# Headed-Modus
npm run test:headed

# Interaktiver UI-Modus
npm run test:ui

# Bestimmten Test debuggen
npx playwright test tests/mobile/02-timer.spec.js --headed
```

### Trace ansehen

```bash
# Trace öffnen
npx playwright show-trace test-results/trace.zip
```

### Häufige Probleme

| Problem | Lösung |
|---------|--------|
| `getFileUrl is not defined` | Importiere `getFileUrl` aus `../helpers` |
| Browser startet nicht | Führe `npx playwright install` aus |
| Tests schlagen zufällig fehl | Erhöhe `retries` in der Konfiguration |
| Timeout-Fehler | Prüfe, ob das Element auf `.toBeVisible()` wartet |

---

## 11. Best Practices

### Test-Organisation

- **Viewport-Tests**: Teste immer mehrere Viewports für responsive Designs
- **Beschreibende Namen**: Testnamen sollten das erwartete Verhalten beschreiben

### Debugging

- **Screenshots**: Werden automatisch bei Fehlern erstellt
- **Traces**: Nützlich für das Debugging von Fehlschlägen
- **Headed-Modus**: Nutze `npm run test:headed` für visuelles Debugging

### Performance

- **Parallelisierung**: Lokal voll parallel, CI mit einzelnem Worker
- **CI-Optimierungen**: 2 Retries, 1 Worker, `forbidOnly` aktiviert

### Wartbarkeit

- Nutze `helpers.js` für wiederverwendbare Funktionen
- Verwende `test.skip()` für temporär deaktivierte Tests
- Führe regelmäßig `npm run test` aus

---

*Siehe auch: [01-Architecture.md](./01-Architecture.md) | [07-Configuration.md](./07-Configuration.md) | [09-Deployment.md](./09-Deployment.md)*
