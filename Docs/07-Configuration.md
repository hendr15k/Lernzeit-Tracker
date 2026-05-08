# Konfigurationsdateien

> **Hinweis:** Diese Dokumentation ist Teil der [Projektdokumentation](./README.md).
> Siehe auch: [09-Deployment.md](./09-Deployment.md) für Deployment-Informationen.

---

## Inhaltsverzeichnis

1. [package.json](#1-packagejson)
2. [manifest.json](#2-manifestjson)
3. [playwright.config.js](#3-playwrightconfigjs)
4. [sw.js Service Worker](#4-swjs-service-worker)
5. [style.css](#5-stylecss)
6. [css/toast.css](#6-csstoastcss)
7. [GitHub Actions Workflow](#7-github-actions-workflow)

---

## 1. package.json

Die zentrale Konfigurationsdatei für Node.js-Projekte.

```json
{
  "name": "lernzeit-tracker",
  "version": "1.0.0",
  "description": "Ein moderner Lernzeit-Tracker als Progressive Web App (PWA).",
  "main": "sw.js",
  "devDependencies": {
    "@playwright/test": "^1.59.1",
    "serve": "^14.2.6"
  },
  "scripts": {
    "test": "playwright test",
    "test:mobile": "playwright test --project=iPhone",
    "test:android": "playwright test --project=Android",
    "test:viewport": "playwright test tests/mobile/00-viewports.spec.js",
    "test:dashboard": "playwright test tests/mobile/01-dashboard.spec.js",
    "test:timer": "playwright test tests/mobile/02-timer.spec.js",
    "test:nav": "playwright test tests/mobile/03-navigation.spec.js",
    "test:themes": "playwright test tests/mobile/04-themes.spec.js",
    "test:heatmap": "playwright test tests/mobile/05-heatmap.spec.js",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui"
  }
}
```

### Verfügbare NPM-Skripte

| Skript | Beschreibung |
|--------|--------------|
| `test` | Alle Playwright-Tests |
| `test:mobile` | Tests nur für iPhone-Emulation |
| `test:android` | Tests nur für Android-Emulation |
| `test:viewport` | Tests für verschiedene Viewport-Größen |
| `test:dashboard` | Tests für die Dashboard-Komponente |
| `test:timer` | Tests für die Timer-Funktionalität |
| `test:nav` | Tests für die Navigation |
| `test:themes` | Tests für Light/Dark-Mode |
| `test:heatmap` | Tests für die Heatmap-Komponente |
| `test:headed` | Tests mit sichtbarem Browser |
| `test:ui` | Playwright UI-Modus starten |

Siehe auch: [08-Testing.md](./08-Testing.md) für vollständige Test-Dokumentation.

---

## 2. manifest.json

Die Manifest-Datei definiert die Progressive Web App (PWA).

```json
{
    "name": "Lernzeit Tracker",
    "short_name": "LernTracker",
    "version": "2.0.0",
    "start_url": "./index.html",
    "display": "standalone",
    "background_color": "#0f172a",
    "theme_color": "#3b82f6",
    "icons": [
        {
            "src": "icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
```

### Eigenschaften

| Eigenschaft | Beschreibung |
|------------|--------------|
| `name` | Vollständiger App-Name |
| `short_name` | Kurzname (max. 12 Zeichen) |
| `version` | Manifest-Version für Update-Erkennung |
| `start_url` | URL beim Start der App |
| `display` | Anzeigemodus |
| `background_color` | Hintergrundfarbe beim Laden |
| `theme_color` | Farbe der Statusleiste |
| `icons` | App-Symbole |

### Display-Modi

| Modus | Beschreibung |
|-------|--------------|
| `standalone` | Eigenes Fenster ohne Browser-UI |
| `fullscreen` | Vollbild ohne Browser-Elemente |
| `minimal-ui` | Minimale Browser-UI |
| `browser` | Normale Browser-Ansicht |

---

## 3. playwright.config.js

Playwright-Testkonfiguration für End-to-End-Tests.

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
    { name: 'chromium-mobile', use: { ...devices['Pixel 5'] } },
    { name: 'chromium-mobile-small', use: { viewport: { width: 360, height: 640 }, ... } },
    { name: 'chromium-mobile-large', use: { viewport: { width: 414, height: 896 }, ... } },
  ],
});
```

### Globale Konfigurationsoptionen

| Option | Standardwert | Beschreibung |
|--------|--------------|--------------|
| `testDir` | `./tests` | Verzeichnis mit Testdateien |
| `fullyParallel` | `true` | Alle Tests parallel ausführen |
| `forbidOnly` | `false` (lokal) | Verhindert `test.only()` in CI |
| `retries` | `0` (lokal) / `2` (CI) | Wiederholungen bei Fehlschlägen |
| `workers` | `undefined` | Anzahl paralleler Worker |
| `reporter` | `list` | Testergebnis-Format |
| `baseURL` | `file://...` | Basis-URL für Tests |
| `trace` | `on-first-retry` | Trace-Sammlung |
| `screenshot` | `only-on-failure` | Screenshots nur bei Fehlern |

### Definierte Testprojekte

| Projekt | Viewport | Beschreibung |
|---------|----------|--------------|
| `chromium-mobile` | 393×851 | Pixel 5 (Standard) |
| `chromium-mobile-small` | 360×640 | Kleine Geräte |
| `chromium-mobile-large` | 414×896 | iPhone (Large-Viewport) |

---

## 4. sw.js (Service Worker)

Der Service Worker ermöglicht Offline-Funktionalität.

```javascript
const CACHE_NAME = 'lernzeit-tracker-v6';
const ASSETS = [
    './', './index.html', './style.css', './css/toast.css',
    './js/app.js', './js/store.js', './sw.js', './manifest.json',
    './icon-192.png', './icon-512.png',
    'https://cdn.tailwindcss.com', 'https://unpkg.com/lucide@0.473.0'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.map(key =>
            key !== CACHE_NAME && key.startsWith('lernzeit-tracker-')
                ? caches.delete(key)
                : null
        ))
    ));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(caches.match(e.request).then(response => response || fetch(e.request)));
});
```

### Lebenszyklus-Events

| Event | Beschreibung |
|-------|--------------|
| `install` | Cacht alle definierten Assets vor |
| `activate` | Bereinigt alte Cache-Versionen |
| `fetch` | Cache-First-Strategie |

### Cache-Versionierung

Der `CACHE_NAME` dient der Versionierung. Bei Änderungen muss die Version aktualisiert werden (`v6` → `v7`).

---

## 5. style.css

Hauptstylesheet mit CSS Custom Properties für Theming.

```css
:root {
    --color-bg: #f3f4f6;
    --color-surface: #ffffff;
    --color-text: #111827;
    --color-text-muted: #6b7280;
    --color-primary: #3b82f6;
    --timer-overlay-bg: radial-gradient(circle at top, #bfdbfe 0%, #f3f4f6 60%);
}

.dark {
    --color-bg: #0f0f11;
    --color-surface: #1c1c1e;
    --color-text: #ffffff;
    --color-text-muted: #a1a1aa;
    --timer-overlay-bg: radial-gradient(circle at top, #1e3a8a 0%, #0f0f11 60%);
}
```

### Theming-Variablen

| Variable | Light Mode | Dark Mode | Verwendung |
|----------|------------|-----------|------------|
| `--color-bg` | `#f3f4f6` | `#0f0f11` | Seitenhintergrund |
| `--color-surface` | `#ffffff` | `#1c1c1e` | Karten/Oberflächen |
| `--color-text` | `#111827` | `#ffffff` | Haupttextfarbe |
| `--color-text-muted` | `#6b7280` | `#a1a1aa` | Gedämpfter Text |
| `--color-primary` | `#3b82f6` | `#3b82f6` | Akzentfarbe |

### Heatmap-Level

| Level | Dark Mode | Light Mode | Bedeutung |
|-------|-----------|------------|-----------|
| 0 | Surface | `#e5e7eb` | Keine Aktivität |
| 1 | `#064e3b` | `#a7f3d0` | Geringe Aktivität |
| 2 | `#047857` | `#6ee7b7` | Leichte Aktivität |
| 3 | `#059669` | `#34d399` | Mittlere Aktivität |
| 4 | `#34d399` | `#10b981` | Hohe Aktivität |

---

## 6. css/toast.css

Toast-Benachrichtigungsstile.

```css
#toast-container {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
}

.toast {
    background-color: var(--color-surface);
    color: var(--color-text);
    padding: 12px 24px;
    border-radius: 99px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.toast-success { border-left: 4px solid #22c55e; }
.toast-error { border-left: 4px solid #ef4444; }
```

### Toast-Varianten

| Variante | CSS-Klasse | Akzentfarbe |
|----------|------------|-------------|
| Standard | `.toast` | — |
| Erfolg | `.toast-success` | `#22c55e` (Grün) |
| Fehler | `.toast-error` | `#ef4444` (Rot) |

---

## 7. GitHub Actions Workflow

CI-Workflow für automatisierte Validierung.

### Datei: `.github/workflows/validate.yml`

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
          for f in *.js; do node --check "$f" 2>/dev/null && echo "$f OK"; done
```

### Validierungsschritte

1. **HTML-Prüfung**: Verifiziert, dass `index.html` existiert
2. **JavaScript-Syntax**: Prüft alle `.js`-Dateien mit `node --check`

---

## Zusammenfassung

| Datei | Zweck | Schlüsselfunktion |
|-------|-------|-------------------|
| `package.json` | Projektmetriken und npm-Skripte | Testautomatisierung |
| `manifest.json` | PWA-Konfiguration | Installation auf Home-Bildschirm |
| `playwright.config.js` | E2E-Test-Setup | Responsive Testing |
| `sw.js` | Offline-Unterstützung | Funktionalität ohne Internet |
| `style.css` | Dynamisches Theming | Light/Dark Mode |
| `css/toast.css` | Toast-Benachrichtigungen | Benutzerfeedback |
| `.github/workflows/validate.yml` | CI-Validierung | Code-Qualitätssicherung |

---

*Siehe auch: [08-Testing.md](./08-Testing.md) | [09-Deployment.md](./09-Deployment.md)*
