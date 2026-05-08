# Konfigurationsdateien

Dieses Dokument beschreibt alle Konfigurationsdateien des Lernzeit-Tracker Projekts.

---

## 1. package.json

Die zentrale Konfigurationsdatei für Node.js-Projekte. Enthält Metadaten, Abhängigkeiten und Skripte.

```json
{
  "name": "lernzeit-tracker",
  "version": "1.0.0",
  "description": "Ein moderner Lernzeit-Tracker, der als Progressive Web App (PWA) konzipiert ist. Er ermöglicht es Studierenden und Lernenden, ihre Lernzeiten zu erfassen, zu visualisieren und zu analysieren.",
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
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hendr15k/Lernzeit-Tracker.git"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/hendr15k/Lernzeit-Tracker/issues"
  },
  "homepage": "https://github.com/hendr15k/Lernzeit-Tracker#readme"
}
```

### Abschnitte

- **dependencies/devDependencies**: Definiert externe Pakete. `@playwright/test` für End-to-End-Tests, `serve` für lokale Entwicklung.
- **scripts**: NPM-Skripte für verschiedene Test-Szenarien (mobile, Android, spezifische Features).
- **main**: Gibt den Einstiegspunkt an (`sw.js` als Service Worker).

---

## 2. manifest.json

Konfigurationsdatei für die Progressive Web App (PWA).

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
| `short_name` | Kurzname für den Home-Bildschirm |
| `start_url` | URL beim Starten der App |
| `display` | Anzeigemodus (`standalone` = ohne Browser-Chrome) |
| `background_color` | Hintergrundfarbe beim Laden |
| `theme_color` | Farbe der Statusleiste |
| `icons` | App-Symbole in verschiedenen Größen |

---

## 3. playwright.config.js

Playwright-Testkonfiguration für End-to-End-Tests.

```javascript
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

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
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'chromium-mobile-small',
      use: {
        viewport: { width: 360, height: 640 },
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36',
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'chromium-mobile-large',
      use: {
        viewport: { width: 414, height: 896 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
});
```

### Konfigurationsoptionen

- **testDir**: Verzeichnis mit Testdateien
- **fullyParallel**: Parallele Testausführung
- **forbidOnly**: Verhindert `test.only()` in CI
- **retries**: Wiederholungen bei Fehlern (CI: 2, lokal: 0)
- **projects**: Definition verschiedener mobiler Viewports (Pixel 5, kleine und große Bildschirme)

---

## 4. sw.js (Service Worker)

Service Worker für Offline-Funktionalität und Caching-Strategien.

```javascript
const CACHE_NAME = 'lernzeit-tracker-v6';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './css/toast.css',
    './js/app.js',
    './js/store.js',
    './sw.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/lucide@0.473.0'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME && key.startsWith('lernzeit-tracker-')) {
                    return caches.delete(key);
                }
            }));
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});

self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
```

### Caching-Strategie

Der Service Worker implementiert eine **Cache-First**-Strategie:

1. **install**: Pre-Caching aller definierten Assets
2. **activate**: Bereinigung alter Cache-Versionen
3. **fetch**: Cache zuerst prüfen, dann Netzwerk
4. **message**: Steuerung für Update-Auslösung

---

## 5. style.css

Hauptstylesheet mit CSS Custom Properties für Theming.

```css
:root {
    /* Light Mode Default */
    --color-bg: #f3f4f6; /* gray-100 */
    --color-surface: #ffffff; /* white */
    --color-text: #111827; /* gray-900 */
    --color-text-muted: #6b7280; /* gray-500 */

    --color-primary: #3b82f6;
    --color-success: #22c55e;

    --timer-overlay-bg: radial-gradient(circle at top, #bfdbfe 0%, #f3f4f6 60%);
}

.dark {
    --color-bg: #0f0f11;
    --color-surface: #1c1c1e;
    --color-text: #ffffff;
    --color-text-muted: #a1a1aa;

    --timer-overlay-bg: radial-gradient(circle at top, #1e3a8a 0%, #0f0f11 60%);
}

body {
    background-color: var(--color-bg);
    color: var(--color-text);
    transition: background-color 0.3s, color 0.3s;
}

.surface-card {
    background-color: var(--color-surface);
    border-radius: 1rem;
    transition: background-color 0.3s;
}

/* Heatmap Styles */
.heatmap-cell {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    cursor: pointer;
    transition: transform 0.1s ease;
}

.heatmap-cell:hover {
    transform: scale(1.2);
}

.heatmap-level-0 { background: var(--color-surface); }
.heatmap-level-1 { background: #064e3b; }
.heatmap-level-2 { background: #047857; }
.heatmap-level-3 { background: #059669; }
.heatmap-level-4 { background: #34d399; }

/* Light mode heatmap levels */
.light .heatmap-level-0 { background: #e5e7eb; }
.light .heatmap-level-1 { background: #a7f3d0; }
.light .heatmap-level-2 { background: #6ee7b7; }
.light .heatmap-level-3 { background: #34d399; }
.light .heatmap-level-4 { background: #10b981; }
```

### Theming-Variablen

| Variable | Light Mode | Dark Mode | Verwendung |
|----------|------------|-----------|------------|
| `--color-bg` | `#f3f4f6` | `#0f0f11` | Seitenhintergrund |
| `--color-surface` | `#ffffff` | `#1c1c1e` | Karten/Oberflächen |
| `--color-text` | `#111827` | `#ffffff` | Haupttext |
| `--color-text-muted` | `#6b7280` | `#a1a1aa` | Gedämpfter Text |
| `--color-primary` | `#3b82f6` | `#3b82f6` | Akzentfarbe |
| `--color-success` | `#22c55e` | `#22c55e` | Erfolgsindikatoren |

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
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
    align-items: center;
}

.toast {
    position: static;
    background-color: var(--color-surface);
    color: var(--color-text);
    padding: 12px 24px;
    border-radius: 99px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    opacity: 0;
    transform: translateY(100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 0.875rem;
    font-weight: 500;
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 8px;
}

.toast.show {
    transform: translateY(0);
    opacity: 1;
}

.toast-success {
    border-left: 4px solid #22c55e;
}

.toast-error {
    border-left: 4px solid #ef4444;
}
```

### Toast-Varianten

- **Standard**: Pill-förmig, zentriert am unteren Bildschirmrand
- **toast-success**: Grüner linker Rand (`#22c55e`)
- **toast-error**: Roter linker Rand (`#ef4444`)

---

## 7. .github/workflows/validate.yml

CI-Workflow für GitHub Actions.

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
          for f in *.js; do [ -f "$f" ] && node --check "$f" 2>/dev/null && echo "$f OK" || echo "$f syntax error"; done
          echo "Done"
```

### Workflow-Details

- **Trigger**: Bei jedem Push und Pull Request
- **Runner**: Ubuntu Latest
- **Validierung**: 
  - Prüfung auf `index.html`
  - Syntax-Prüfung aller JavaScript-Dateien mit `node --check`

---

## Zusammenfassung

Die Konfigurationsdateien des Lernzeit-Trackers ermöglichen:

| Datei | Zweck |
|-------|-------|
| `package.json` | Projektmetriken und npm-Skripte |
| `manifest.json` | PWA-Konfiguration für Installation |
| `playwright.config.js` | E2E-Test-Setup mit mobilen Viewports |
| `sw.js` | Offline-Unterstützung via Service Worker |
| `style.css` | Dynamisches Theming mit CSS-Variablen |
| `css/toast.css` | Toast-Benachrichtigungskomponenten |
| `.github/workflows/validate.yml` | Automatisierte Validierung in CI |
