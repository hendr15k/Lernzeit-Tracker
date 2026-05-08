# Testing Dokumentation

## Test Framework

Das Projekt verwendet [Playwright](https://playwright.dev/) als Test-Framework. Playwright ermöglicht zuverlässige End-to-End-Tests für moderne Web-Anwendungen mit Unterstützung für:

- Automatisiertes Browsing (Chromium, Firefox, WebKit)
- Mobile Geräte-Emulation
- Headless und Headed-Modus
- Intelligentes Warten auf DOM-Änderungen

## Projektstruktur

```
tests/
├── mobile/
│   ├── 00-viewports.spec.js      # Viewport-Tests
│   ├── 01-dashboard.spec.js      # Dashboard-Tests
│   ├── 02-timer.spec.js          # Timer-Tests
│   ├── 03-navigation.spec.js     # Navigation-Tests
│   ├── 04-themes.spec.js        # Theme-Tests
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
# Viewport-Tests
npm run test:viewport

# Dashboard-Tests
npm run test:dashboard

# Timer-Tests
npm run test:timer

# Navigations-Tests
npm run test:nav

# Theme-Tests
npm run test:themes

# Heatmap-Tests
npm run test:heatmap
```

### Mobile-spezifische Tests

```bash
npm run test:mobile
npm run test:android
```

### Headed-Modus (mit Browser-GUI)

```bash
npm run test:headed
```

### UI-Modus (interaktive Test-Entwicklung)

```bash
npm run test:ui
```

## Playwright-Konfiguration

Die Konfiguration befindet sich in `playwright.config.js`:

```javascript
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

| Option | Beschreibung |
|--------|--------------|
| `testDir` | Verzeichnis mit Test-Dateien |
| `fullyParallel` | Parallele Test-Ausführung |
| `forbidOnly` | Verbot von `test.only` (aktiv im CI) |
| `retries` | Wiederholungen bei Fehlern (CI: 2, lokal: 0) |
| `workers` | Parallel-Worker (CI: 1, lokal: automatisch) |
| `reporter` | Test-Reporter ('list') |
| `baseURL` | Basis-URL für Tests |
| `trace` | Trace-Aufzeichnung bei erstem Retry |
| `screenshot` | Screenshots nur bei Fehlern |

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

Die Datei `tests/helpers.js` stellt nützliche Funktionen bereit:

```javascript
const { getFileUrl } = require('../helpers');

// Beispiel: URL für index.html erstellen
const url = getFileUrl(); // file:///path/to/index.html
const url = getFileUrl('subpage.html'); // file:///path/to/subpage.html
```

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

test('Beschreibung des Tests', async ({ page }) => {
  await page.goto(getFileUrl());
  await expect(page.locator('#element')).toBeVisible();
});
```

### Viewport-Tests

```javascript
const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
];

test.describe('Beispiel-Tests', () => {
  for (const vp of viewports) {
    test(`${vp.name} - Testname`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(getFileUrl());
      // Test-Logik
    });
  }
});
```

### Erwartungen (Expectations)

```javascript
// Sichtbarkeit
await expect(locator).toBeVisible();
await expect(locator).toBeHidden();

// Klassen
await expect(locator).toHaveClass(/active/);

// Inhalt
await expect(locator).toContainText('Text');

// Anzahl
const count = await locator.count();
expect(count).toBe(5);
```

## Troubleshooting

### Playwright installieren

```bash
npx playwright install
```

### Browser aktualisieren

```bash
npx playwright install chromium
```

### Debug-Modus

```bash
npm run test:headed
```

### Trace ansehen

Traces werden automatisch im `test-results` Verzeichnis gespeichert:

```bash
npx playwright show-trace test-results/trace.zip
```

## Best Practices

1. **Viewport-Tests**: Teste immer mehrere Viewports für responsive Designs
2. **Screenhots**: Werden automatisch bei Fehlern erstellt
3. **Traces**: Nützlich für das Debugging von Fehlschlägen
4. **Parallelisierung**: Lokal voll parallel, CI mit einzelnem Worker
5. **Naming**: Beschreibende Testnamen mit Viewport-Angabe
