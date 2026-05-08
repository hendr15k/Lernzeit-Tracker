# Testing Dokumentation

> **Voraussetzungen**: Node.js und npm müssen installiert sein. Führe `npm install` aus, bevor du Tests ausführst.

## Test Framework

Das Projekt verwendet [Playwright](https://playwright.dev/) als End-to-End-Test-Framework. Playwright ermöglicht zuverlässige Tests für moderne Web-Anwendungen mit Unterstützung für:

- **Browser-Automatisierung**: Chromium, Firefox, WebKit
- **Mobile Emulation**: Gerätespezifische Viewports und Touch-Events
- **Modi**: Headless (Standard) und Headed (mit Browser-GUI)
- **Smart Waiting**: Automatisches Warten auf DOM-Änderungen
- **Debugging**: Trace-Aufzeichnungen und interaktive Test-Entwicklung

## Projektstruktur

```
tests/
├── mobile/
│   ├── 00-viewports.spec.js     # Viewport-Tests
│   ├── 01-dashboard.spec.js      # Dashboard-Tests
│   ├── 02-timer.spec.js          # Timer-Tests
│   ├── 03-navigation.spec.js     # Navigation-Tests
│   ├── 04-themes.spec.js         # Theme-Tests
│   └── 05-heatmap.spec.js        # Heatmap-Tests
├── helpers.js                    # Hilfsfunktionen
├── index.js                      # Test-Index
└── setup.js                      # Test-Setup/Konfiguration
```

### Test-Kategorien

#### 00-viewports.spec.js
Tests für responsive Layouts auf verschiedenen Bildschirmgrößen:
- iPhone SE (375x667)
- iPhone 12 (390x844)
- iPhone 11 Pro Max (414x896)
- Samsung Galaxy S10+ (412x869)

Geprüft werden:
- Grundlegendes Layout ohne horizontalen Overflow
- Sichtbarkeit der Bottom Navigation
- Korrekte FAB-Position
- Safe Area Padding

#### 01-dashboard.spec.js
Tests für Dashboard-Widgets:
- Tagesziel-Ring (`#daily-goal-ring`)
- Wochengraph (`#dashboard-graph`)
- Heatmap-Container (`#heatmap-container`)
- Erfolgsliste (`#achievements-list`)
- Streak-Widget (`#dashboard-streak`)
- Prüfungs-Countdown (`#exam-countdown-list`)
- Wochenstatistiken (`#weekly-bar-chart`)
- Lern-Trends (`#trend-best-time`)
- Keine Widget-Überlappungen

#### 02-timer.spec.js
Tests für den Timer-Overlay:
- Öffnen/Schließen des Timers
- Timer-Anzeige und Steuerelemente
- Fächerauswahl und Themen-Input
- Pomodoro-Umschaltung
- Notizen-Toggle
- FAB-Interaktion

#### 03-navigation.spec.js
Tests für Navigation und Overlays:
- Bottom Navigation (5 Buttons)
- Navigation zwischen Views (Dashboard, Einheiten, Fächer, Kalender, Semester)
- Header-Buttons (Hinzufügen, Timer, Theme, Menü)
- Settings-Overlay
- Eintrag hinzufügen Overlay
- Schließen-Buttons

#### 04-themes.spec.js
Tests für Dark/Light Mode:
- Theme-Umschaltung (Light/Dark)
- Lesbarkeit in beiden Themes
- Theme-Persistenz bei Navigation
- Input-Feld-Styling
- Heatmap-Legendenfarben

#### 05-heatmap.spec.js
Tests für die Heatmap-Komponente:
- Container und Zellen-Sichtbarkeit
- Scroll-Verhalten bei breiten Heatmaps
- Legende (5 Farbstufen)
- Zusammenfassung-Label
- Tag-Labels
- Tooltip-Interaktionen
- Theme-abhängige Farben

## Test ausführen

### Alle Tests ausführen

```bash
npm test
```

### Spezifische Kategorie testen

```bash
# Viewport-Tests (responsive Layouts)
npm run test:viewport

# Dashboard-Tests (Widgets und Charts)
npm run test:dashboard

# Timer-Tests (Timer-Overlay und Pomodoro)
npm run test:timer

# Navigations-Tests (Navigation und Overlays)
npm run test:nav

# Theme-Tests (Dark/Light Mode)
npm run test:themes

# Heatmap-Tests (Lernstatistik-Visualisierung)
npm run test:heatmap
```

### Mobile-spezifische Tests

```bash
# Mobile-Tests (alle Viewports)
npm run test:mobile

# Android-spezifische Tests
npm run test:android
```

### Spezielle Modi

```bash
# Headed-Modus: Browser-GUI wird angezeigt (empfohlen für Debugging)
npm run test:headed

# UI-Modus: Interaktive Test-Entwicklung mit Playwright UI
npm run test:ui
```

## Playwright-Konfiguration

Die Konfiguration befindet sich in `playwright.config.js`:

```javascript
const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: `file://${path.resolve(__dirname)}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'chromium-mobile-small',
      use: {
        viewport: { width: 360, height: 640 },
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G960F)...',
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'chromium-mobile-large',
      use: {
        viewport: { width: 414, height: 896 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0...)',
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
});
```

### Konfigurationsoptionen

| Option | Beschreibung | Standard |
|--------|--------------|----------|
| `testDir` | Verzeichnis mit Test-Dateien | `./tests` |
| `fullyParallel` | Parallele Test-Ausführung | `true` |
| `forbidOnly` | Verbot von `test.only` (aktiv im CI) | `true` in CI |
| `retries` | Wiederholungen bei Fehlern | `0` lokal, `2` in CI |
| `workers` | Anzahl paralleler Worker | `undefined` (auto) |
| `reporter` | Test-Reporter Format | `list` |
| `baseURL` | Basis-URL für `page.goto()` | - |
| `trace` | Trace-Aufzeichnung | `on-first-retry` |
| `screenshot` | Screenshots bei Fehlern | `only-on-failure` |

**Trace-Aufzeichnungen** erfassen alle DOM-Interaktionen, Screenshots und Netzwerk-Anfragen. Siehe [Trace ansehen](#trace-ansehen).

### Projekt-Konfigurationen

Drei mobile Projekte sind konfiguriert:
1. **chromium-mobile**: Pixel 5 Standard-Emulation
2. **chromium-mobile-small**: 360x640 Viewport
3. **chromium-mobile-large**: 414x896 Viewport

## Test-Setup

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

Dies ermöglicht das Laden von gespeichertem State für authentifizierte Tests.

## Hilfsfunktionen

Die Datei `tests/helpers.js` (importiert aus `./helpers`) stellt nützliche Funktionen bereit:

```javascript
const { getFileUrl } = require('../helpers');

// URL für index.html erstellen
const url = getFileUrl();                       // file:///path/to/index.html
const url = getFileUrl('subpage.html');         // file:///path/to/subpage.html

// Weitere Hilfsfunktionen in helpers.js:
// - date utilities
// - DOM manipulation helpers
// - Data generation helpers
```

**Tipp**: `getFileUrl()` ist die empfohlene Methode, um URLs für Tests zu erstellen, da sie plattformunabhängig funktioniert.

## CI-Workflow

Das Projekt verwendet GitHub Actions für kontinuierliche Validierung:

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
          [ -f index.html ] && echo "HTML OK" || echo "No index.html"
          for f in *.js; do
            [ -f "$f" ] && node --check "$f" 2>/dev/null && echo "$f OK" || echo "$f syntax error"
          done
          echo "Done"
```

### CI-Optimierungen

- **Retries**: 2 Wiederholungen bei fehlgeschlagenen Tests
- **Single Worker**: Ein Worker für stabilere Tests
- **Forbid Only**: Verhindert versehentliche `test.only`

## Test-Schreibweise

### Grundlegendes Beispiel

```javascript
const { test, expect } = require('@playwright/test');
const { getFileUrl } = require('../helpers');

test('Timer-Overlay lässt sich öffnen und schließen', async ({ page }) => {
  await page.goto(getFileUrl());
  
  // Auf FAB klicken
  const fab = page.locator('#timer-fab');
  await fab.click();
  
  // Timer-Overlay prüfen
  await expect(page.locator('#timer-overlay')).toBeVisible();
});
```

### Viewport-Tests

```javascript
const { test, expect } = require('@playwright/test');
const { getFileUrl } = require('../helpers');

const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
];

test.describe('Responsive Layout Tests', () => {
  for (const vp of viewports) {
    test(`${vp.name} - Layout ohne horizontalen Overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());
      
      // Kein horizontaler Scroll nötig
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

// Interaktionen
await expect(locator).toBeChecked();
await expect(locator).toBeEnabled();
```

### Test überspringen

```javascript
test.skip('Wird übersprungen', async ({ page }) => {
  // ...
});

test.fixme('Muss noch implementiert werden', async ({ page }) => {
  // ...
});
```

## Troubleshooting

### Erste Einrichtung

```bash
# Playwright und Browser installieren
npx playwright install

# Browser aktualisieren
npx playwright install chromium
```

### Debugging

```bash
# Headed-Modus: Browser-GUI anzeigen
npm run test:headed

# Interaktiver UI-Modus
npm run test:ui

# Bestimmten Test debuggen
npx playwright test tests/mobile/02-timer.spec.js --headed
```

### Trace ansehen

Traces werden automatisch bei Retry-Versuchen im `test-results/` Verzeichnis gespeichert:

```bash
# Trace öffnen
npx playwright show-trace test-results/trace.zip

# Trace in HTML exportieren
npx playwright show-trace --open test-results/trace.zip
```

### Häufige Probleme

| Problem | Lösung |
|---------|--------|
| `getFileUrl is not defined` | Importiere `getFileUrl` aus `../helpers` |
| Browser startet nicht | Führe `npx playwright install` aus |
| Tests schlagen zufällig fehl | Erhöhe `retries` in der Konfiguration |
| Timeout-Fehler | Prüfe ob das Element auf `.toBeVisible()` wartet |

## Best Practices

### Test-Organisation
- **Viewport-Tests**: Teste immer mehrere Viewports für responsive Designs
- **Beschreibende Namen**: Testnamen sollten das erwartete Verhalten beschreiben (z.B. `"Timer-Overlay lässt sich schließen"`)

### Debugging
- **Screenshots**: Werden automatisch bei Fehlern erstellt (`test-results/`)
- **Traces**: Nützlich für das Debugging von Fehlschlägen
- **Headed-Modus**: Nutze `npm run test:headed` für visuelles Debugging

### Performance
- **Parallelisierung**: Lokal voll parallel, CI mit einzelnem Worker für Stabilität
- **CI-Optimierungen**: 2 Retries, 1 Worker, `forbidOnly` aktiviert

### Wartbarkeit
- Nutze `helpers.js` für wiederverwendbare Funktionen
- Verwende `test.skip()` für temporär deaktivierte Tests
- Führe regelmäßig `npm run test` aus, um sicherzustellen dass alle Tests bestehen
